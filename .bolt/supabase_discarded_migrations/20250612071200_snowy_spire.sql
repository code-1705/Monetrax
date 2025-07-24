/*
  # Add Default Category Support

  1. Changes Made
    - Add `is_default` column to categories table to mark the default category
    - Add constraint to ensure only one default category per user
    - Create function to handle category deletion and move expenses to default category

  2. Security
    - Maintain existing RLS policies
    - Add check constraint for default category uniqueness per user
*/

-- Add is_default column to categories table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'is_default'
  ) THEN
    ALTER TABLE categories ADD COLUMN is_default boolean DEFAULT false;
  END IF;
END $$;

-- Create unique constraint for default category per user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'categories_user_default_unique'
  ) THEN
    ALTER TABLE categories ADD CONSTRAINT categories_user_default_unique 
    EXCLUDE (user_id WITH =) WHERE (is_default = true);
  END IF;
END $$;

-- Create function to handle category deletion
CREATE OR REPLACE FUNCTION handle_category_deletion()
RETURNS TRIGGER AS $$
DECLARE
  default_category_id uuid;
BEGIN
  -- Don't allow deletion of default category
  IF OLD.is_default = true THEN
    RAISE EXCEPTION 'Cannot delete default category';
  END IF;

  -- Find the default category for this user
  SELECT id INTO default_category_id
  FROM categories
  WHERE user_id = OLD.user_id AND is_default = true;

  -- Move all expenses from deleted category to default category
  IF default_category_id IS NOT NULL THEN
    UPDATE expenses
    SET category_id = default_category_id
    WHERE category_id = OLD.id;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for category deletion
DROP TRIGGER IF EXISTS category_deletion_trigger ON categories;
CREATE TRIGGER category_deletion_trigger
  BEFORE DELETE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION handle_category_deletion();