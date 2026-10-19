import { createClient } from "npm:@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

if (import.meta.main) {
  Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceRoleKey);

      // Authenticate the caller
      const authHeader = req.headers.get("Authorization") || "";
      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: userError } = await supabase.auth.getUser(token);

      if (userError || !userData?.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const userId = userData.user.id;

      const body = await req.json();
      const quoteId: string | undefined = body?.quoteId;
      const feedback: string | undefined = body?.feedback;
      if (!quoteId) {
        return new Response(JSON.stringify({ error: "Missing quoteId" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 1) Server-enforced, atomic quotation acceptance. This locks the project,
      //    verifies ownership, refuses if another quote already won, rejects
      //    competing quotes (ANOTHER_DESIGNER_SELECTED), closes competing
      //    project_assignments, notifies designers, and computes the advance
      //    amount from the configured percentage.
      const { data: acceptResult, error: acceptError } = await supabase.rpc(
        "accept_quote",
        { p_quote_id: quoteId, p_feedback: feedback ?? null }
      );

      if (acceptError) {
        return new Response(
          JSON.stringify({ error: acceptError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // accept_quote returns a table; supabase-js returns an array
      const accepted = Array.isArray(acceptResult) ? acceptResult[0] : acceptResult;
      if (!accepted || accepted.success !== true) {
        return new Response(
          JSON.stringify({ error: "Failed to accept quotation." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const advanceAmountRupees = Number(accepted.advance_amount);
      const confirmationAmount = Math.round(advanceAmountRupees * 100); // paise

      // 2) Refuse to create a payment order if one is already paid (idempotency)
      const { data: existingPaid } = await supabase
        .from("quote_advance_payments")
        .select("id, status")
        .eq("quote_id", quoteId)
        .eq("status", "paid")
        .maybeSingle();

      if (existingPaid) {
        return new Response(
          JSON.stringify({
            error: "This quotation has already been confirmed and paid.",
            alreadyPaid: true,
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 3) Create the Razorpay order for the advance amount
      const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID") || "rzp_test_placeholder";
      const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET") || "placeholder_secret";

      const orderPayload = {
        amount: confirmationAmount,
        currency: "INR",
        receipt: `quote_${quoteId.slice(0, 30)}`,
        notes: {
          quote_id: quoteId,
          customer_user_id: userId,
          advance_amount_rupees: advanceAmountRupees,
        },
      };

      const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Basic " + btoa(`${razorpayKeyId}:${razorpayKeySecret}`),
        },
        body: JSON.stringify(orderPayload),
      });

      const orderJson = await orderRes.json();

      if (!orderRes.ok) {
        // Record the failure on the payment record (creates a failed row)
        await supabase.rpc("update_payment_failure", {
          p_quote_id: quoteId,
          p_razorpay_order_id: orderJson?.id ?? `failed_${Date.now()}`,
          p_status: "failed",
          p_failure_reason: "Razorpay order creation failed",
        });

        return new Response(
          JSON.stringify({
            error:
              "Razorpay order creation failed. If you are the app owner, set the RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET edge function secrets to your real Razorpay credentials.",
            details: orderJson,
            placeholderMode: razorpayKeyId === "rzp_test_placeholder",
          }),
          {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // 4) Persist the pending payment record linked to quote/project/designer.
      //    The unique(razorpay_order_id) constraint makes this idempotent per order.
      const { error: payInsertError } = await supabase
        .from("quote_advance_payments")
        .insert({
          quote_id: quoteId,
          project_id: accepted.project_id,
          designer_id: accepted.designer_id,
          customer_user_id: userId,
          razorpay_order_id: orderJson.id,
          amount: advanceAmountRupees,
          currency: "INR",
          status: "pending",
        });

      if (payInsertError) {
        // If it's a duplicate order id, treat as idempotent and continue
        if (!String(payInsertError.message).includes("duplicate")) {
          return new Response(
            JSON.stringify({ error: "Failed to record payment record: " + payInsertError.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      return new Response(
        JSON.stringify({
          orderId: orderJson.id,
          amount: confirmationAmount,
          currency: "INR",
          keyId: razorpayKeyId,
          advanceAmountRupees,
          acceptedQuoteId: quoteId,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (err) {
      return new Response(JSON.stringify({ error: (err as Error).message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  });
}
