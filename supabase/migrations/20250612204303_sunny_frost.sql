/*
  # Clean Database Setup - Diagnostic and Fresh Start

  1. New Tables
    - `user_profiles` - User preferences and currency settings
    - `categories` - Expense categories with default system
    - `expenses` - Individual expense records

  2. Security
    - Enable RLS on all tables
    - Comprehensive policies for user data isolation
    - Prevent unauthorized access

  3. Features
    - Automatic user onboarding
    - Default category creation
    - Category deletion protection
    - Performance optimizations
*/

-- Clean slate: Remove everything first (if exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS category_deletion_trigger ON categories;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_category_deletion() CASCADE;
DROP FUNCTION IF EXISTS create_default_user_profile(uuid, text, text) CASCADE;
DROP FUNCTION IF EXISTS create_default_categories_for_user(uuid) CASCADE;

-- Drop tables in correct order (foreign key dependencies)
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  currency_code text NOT NULL DEFAULT 'USD',
  currency text NOT NULL DEFAULT '$',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT fk_user_profiles_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create categories table
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  color text NOT NULL,
  icon text NOT NULL DEFAULT 'folder',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT fk_categories_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create expenses table
CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category_id uuid NOT NULL,
  amount decimal(12,2) NOT NULL CHECK (amount > 0),
  description text NOT NULL,
  date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT fk_expenses_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_expenses_category_id FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "user_profiles_select_policy"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_profiles_insert_policy"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_profiles_update_policy"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Categories Policies
CREATE POLICY "categories_select_policy"
  ON categories
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "categories_insert_policy"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "categories_update_policy"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "categories_delete_policy"
  ON categories
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND (is_default = false OR is_default IS NULL));

-- Expenses Policies
CREATE POLICY "expenses_select_policy"
  ON expenses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "expenses_insert_policy"
  ON expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "expenses_update_policy"
  ON expenses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "expenses_delete_policy"
  ON expenses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add unique constraint for default categories
CREATE UNIQUE INDEX categories_user_default_unique_idx 
  ON categories (user_id) 
  WHERE is_default = true;

-- Performance Indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_is_default ON categories(is_default) WHERE is_default = true;
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_category_id ON expenses(category_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_user_date ON expenses(user_id, date);

-- Function to handle category deletion
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for category deletion
CREATE TRIGGER category_deletion_trigger
  BEFORE DELETE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION handle_category_deletion();

-- Function to create default categories for new users
CREATE OR REPLACE FUNCTION create_default_categories_for_user(user_uuid uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO categories (user_id, name, color, icon, is_default) VALUES
    (user_uuid, 'General', '#6B7280', 'folder', true),
    (user_uuid, 'Food & Dining', '#EF4444', 'utensils', false),
    (user_uuid, 'Transportation', '#3B82F6', 'car', false),
    (user_uuid, 'Shopping', '#8B5CF6', 'shopping-bag', false),
    (user_uuid, 'Entertainment', '#10B981', 'gamepad-2', false),
    (user_uuid, 'Bills & Utilities', '#F59E0B', 'home', false),
    (user_uuid, 'Healthcare', '#EC4899', 'heart', false),
    (user_uuid, 'Education', '#14B8A6', 'book', false);
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Failed to create default categories for user %: %', user_uuid, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create default user profile
CREATE OR REPLACE FUNCTION create_default_user_profile(user_uuid uuid, currency_code text DEFAULT 'USD', currency_symbol text DEFAULT '$')
RETURNS void AS $$
BEGIN
  INSERT INTO user_profiles (user_id, currency_code, currency)
  VALUES (user_uuid, currency_code, currency_symbol)
  ON CONFLICT (user_id) DO NOTHING;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Failed to create default profile for user %: %', user_uuid, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default user profile
  PERFORM create_default_user_profile(NEW.id);
  
  -- Create default categories
  PERFORM create_default_categories_for_user(NEW.id);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Failed to set up new user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically set up new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();