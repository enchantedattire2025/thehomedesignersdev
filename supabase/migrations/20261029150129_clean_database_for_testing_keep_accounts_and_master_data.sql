/*
# Clean database for testing: keep accounts and master data only

Removes all projects, quotations, and other transactional records so the app
starts from a clean slate for testing, while keeping:

1. Customer and designer sign-in accounts (auth users are not touched).
2. Designer profile rows (name, contact, specialization, services, verification).
3. The admin account row.
4. Master data: material pricing master, 3D wallpaper catalog and its images,
   subscription plans, AI plan configuration, site settings, WhatsApp settings,
   and chatbot knowledge.

## Removed (transactional data)
- Customer project records (the `customers` table holds one row per project).
- Quotations, quote items, quote messages, change requests, advance payments,
  acceptance history.
- Project assignments, shares, team members, updates, activities, versions,
  images, designs, bills and bill items, bill versions.
- Design projects with rooms, walls, and furniture.
- Reviews, review responses, and review votes.
- Designer deals, deal redemptions, and designer earnings.
- Designer subscription records, subscription payments, and usage tracking.
- AI quotation jobs, rooms, items, credit periods, credit ledger, and designer AI subscriptions.
- Chat conversations and messages, Vastu analyses and recommendations.
- Community projects, join requests, participants, and referral rewards.
- Notifications, email notification logs, WhatsApp notification logs, and notification preferences.
- Wallpaper orders.
- Audit log entries.
- AI floor plan files in the private `ai-floor-plans` storage bucket.

## Modified
- `designers`: rating, total reviews, and total projects reset to zero, since
  the reviews and projects they were computed from are removed.

## Security
- No policies, grants, or table structures are changed.
- Row-level security remains enabled on every table.

## Important notes
1. TRUNCATE is used instead of DELETE so that row-level triggers (such as
   notification triggers) do not fire during cleanup.
2. The table list is explicit (no CASCADE) so that a kept table can never be
   emptied by accident; if a new dependency appears, the migration fails and
   rolls back instead of removing extra data.
3. Storage objects are removed only from `ai-floor-plans`; `wallpaper-images`
   and `designer-profiles` are kept.
*/

TRUNCATE TABLE
  customers,
  customer_notification_preferences,
  designer_quotes,
  quote_items,
  quote_acceptance_history,
  quote_advance_payments,
  quote_change_requests,
  quote_messages,
  project_assignments,
  project_shares,
  project_team_members,
  project_updates,
  project_activities,
  project_versions,
  project_images,
  project_designs,
  project_bills,
  bill_items,
  bill_versions,
  design_projects,
  design_rooms,
  design_walls,
  design_furniture,
  reviews,
  review_responses,
  review_votes,
  designer_deals,
  deal_redemptions,
  designer_projects_earnings,
  designer_subscriptions,
  subscription_payments,
  subscription_usage_tracking,
  designer_ai_subscriptions,
  ai_credit_periods,
  ai_credit_ledger,
  ai_quotation_jobs,
  ai_quotation_rooms,
  ai_quotation_items,
  chat_conversations,
  chat_messages,
  vastu_analyses,
  vastu_recommendations,
  community_projects,
  community_join_requests,
  community_participants,
  community_referral_rewards,
  notifications,
  email_notifications,
  whatsapp_notification_logs,
  wallpaper_orders,
  audit_logs;

UPDATE designers
SET rating = 0,
    total_reviews = 0,
    total_projects = 0,
    updated_at = now();

SELECT set_config('storage.allow_delete_query', 'true', true);
DELETE FROM storage.objects WHERE bucket_id = 'ai-floor-plans';
