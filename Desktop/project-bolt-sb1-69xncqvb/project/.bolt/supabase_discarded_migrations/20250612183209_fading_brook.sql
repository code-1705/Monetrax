/*
  # Fix Database Schema Issues

  1. Schema Updates
    - Ensure is_default column exists on categories table
    - Fix data consistency for default categories
    - Update constraints safely

  2. Security
    - Refresh all RLS policies with proper auth checks
    - Ensure proper permissions for all operations

  3. Data Integrity
    - Ensure each user has exactly one default category
    - Handle constraint conflicts gracefully
*/

-- First, let's ensure the is_default column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'is_default'
  ) THEN
    ALTER TABLE categories ADD COLUMN is_default boolean DEFAULT false;
  END IF;
END $$;

-- Clean up any data inconsistencies first
DO $$
DECLARE
  user_record RECORD;
  default_category_id uuid;
BEGIN
  -- For each user, ensure they have exactly one default category
  FOR user_record IN SELECT DISTINCT user_id FROM categories LOOP
    -- Count how many default categories this user has
    SELECT COUNT(*) INTO default_category_id
    FROM categories
    WHERE user_id = user_record.user_id AND is_default = true;
    
    -- If user has multiple defaults, keep only the oldest one
    IF default_category_id > 1 THEN
      WITH ranked_defaults AS (
        SELECT id, 
               ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
        FROM categories 
        WHERE user_id = user_record.user_id AND is_default = true
      )
      UPDATE categories 
      SET is_default = false 
      WHERE id IN (
        SELECT id FROM ranked_defaults WHERE rn > 1
      );
    END IF;
    
    -- If user has no default category, make the first one default
    IF default_category_id = 0 THEN
      UPDATE categories
      SET is_default = true
      WHERE id = (
        SELECT id FROM categories
        WHERE user_id = user_record.user_id
        ORDER BY created_at ASC
        LIMIT 1
      );
    END IF;
  END LOOP;
END $$;

-- Handle the unique constraint safely
DO $$
BEGIN
  -- Try to drop the constraint if it exists
  BEGIN
    ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_user_default_unique;
  EXCEPTION
    WHEN OTHERS THEN
      -- Ignore errors if constraint doesn't exist
      NULL;
  END;
  
  -- Now add the constraint
  BEGIN
    ALTER TABLE categories ADD CONSTRAINT categories_user_default_unique 
    EXCLUDE (user_id WITH =) WHERE (is_default = true);
  EXCEPTION
    WHEN duplicate_object THEN
      -- Constraint already exists, that's fine
      NULL;
    WHEN OTHERS THEN
      -- Some other error, re-raise it
      RAISE;
  END;
END $$;

-- Refresh RLS policies for categories
DROP POLICY IF EXISTS "Users can view their own categories" ON categories;
DROP POLICY IF EXISTS "Users can create their own categories" ON categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON categories;

CREATE POLICY "Users can view their own categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON categories
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND (is_default = false OR is_default IS NULL));

-- Refresh RLS policies for expenses
DROP POLICY IF EXISTS "Users can view their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can create their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON expenses;

CREATE POLICY "Users can view their own expenses"
  ON expenses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own expenses"
  ON expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
  ON expenses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
  ON expenses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Refresh RLS policies for user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;

CREATE POLICY "Users can view their own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS categories_user_id_idx ON categories(user_id);
CREATE INDEX IF NOT EXISTS categories_is_default_idx ON categories(is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS expenses_user_id_idx ON expenses(user_id);
CREATE INDEX IF NOT EXISTS expenses_category_id_idx ON expenses(category_id);
CREATE INDEX IF NOT EXISTS expenses_date_idx ON expenses(date);
CREATE INDEX IF NOT EXISTS user_profiles_user_id_idx ON user_profiles(user_id);

-- Update the category deletion function
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
  WHERE user_id = OLD.user_id AND is_default = true
  LIMIT 1;

  -- Move all expenses from deleted category to default category
  IF default_category_id IS NOT NULL THEN
    UPDATE expenses
    SET category_id = default_category_id
    WHERE category_id = OLD.id;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS category_deletion_trigger ON categories;
CREATE TRIGGER category_deletion_trigger
  BEFORE DELETE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION handle_category_deletion();