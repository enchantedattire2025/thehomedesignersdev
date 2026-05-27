/*
  # Add Offline Bill Support

  ## Summary
  Extends the billing system to support standalone (offline) bills that designers can create
  for walk-in or offline customers without needing a registered project or accepted quotation.

  ## Changes

  ### Modified Tables
  - `project_bills`
    - Make `project_id` nullable (offline bills don't have a registered project)
    - Make `quote_id` nullable (offline bills don't come from accepted quotes)
    - Add `bill_type` column: 'project' (linked to project/quote) or 'offline' (standalone)
    - Add `customer_name` (text) - for offline customer name
    - Add `customer_email` (text) - for offline customer email
    - Add `customer_phone` (text) - for offline customer phone
    - Add `customer_address` (text) - for offline customer address
    - Add `project_description` (text) - description of work done

  ## Important Notes
  - Existing project bills (project_type = 'project') remain unaffected
  - The auto-billing trigger from quote acceptance continues to work
  - RLS policies already allow designers to manage their own bills
  - Offline bills are fully visible to the designer who created them
*/

-- Make project_id and quote_id nullable for offline bills
ALTER TABLE project_bills
  ALTER COLUMN project_id DROP NOT NULL,
  ALTER COLUMN quote_id DROP NOT NULL;

-- Add bill_type to distinguish project bills vs offline bills
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_bills' AND column_name = 'bill_type'
  ) THEN
    ALTER TABLE project_bills ADD COLUMN bill_type text DEFAULT 'project';
  END IF;
END $$;

-- Add offline customer fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_bills' AND column_name = 'customer_name'
  ) THEN
    ALTER TABLE project_bills ADD COLUMN customer_name text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_bills' AND column_name = 'customer_email'
  ) THEN
    ALTER TABLE project_bills ADD COLUMN customer_email text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_bills' AND column_name = 'customer_phone'
  ) THEN
    ALTER TABLE project_bills ADD COLUMN customer_phone text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_bills' AND column_name = 'customer_address'
  ) THEN
    ALTER TABLE project_bills ADD COLUMN customer_address text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_bills' AND column_name = 'project_description'
  ) THEN
    ALTER TABLE project_bills ADD COLUMN project_description text DEFAULT '';
  END IF;
END $$;

-- Add index for bill_type for fast filtering
CREATE INDEX IF NOT EXISTS idx_project_bills_bill_type ON project_bills(bill_type);

-- Update bill_type for existing bills (all existing ones are project-linked)
UPDATE project_bills SET bill_type = 'project' WHERE bill_type IS NULL OR bill_type = '';
