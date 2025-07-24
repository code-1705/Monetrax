/*
  # Complete Fresh Database Schema - Safe Migration
  
  This migration safely handles existing database objects by dropping them first
  before recreating them, ensuring a clean state.

  1. New Tables
    - `user_profiles` - User settings and currency preferences
    - `categories` - Expense categories with colors, icons, and default system
    - `expenses` - Individual expense records with proper validation

  2. Security
    - Enable RLS on all tables
    - Comprehensive policies for authenticated users
    - Proper foreign key constraints and validation

  3. Performance
    - Strategic indexes for optimal query performance
    - Composite indexes for complex queries

  4. Automation
    - Automatic user onboarding with default data
    - Category deletion protection and expense migration
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing triggers and functions first (if they exist)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS category_deletion_trigger ON categories;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS handle_category_deletion();
DROP FUNCTION IF EXISTS create_default_user_profile(uuid, text, text);
DROP FUNCTION IF EXISTS create_default_categories_for_user(uuid);

-- Drop existing policies (if they exist)
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own categories" ON categories;
DROP POLICY IF EXISTS "Users can create their own categories" ON categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON categories;
DROP POLICY IF EXISTS "Users can view their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can create their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON expenses;

-- Drop existing tables (if they exist) - in correct order due to foreign keys
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS user_profiles;

-- Create user_profiles table
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  currency_code text NOT NULL DEFAULT 'USD',
  currency text NOT NULL DEFAULT '$',
  created_at timestamptz DEFAULT now()
);

-- Create categories table
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text NOT NULL,
  icon text NOT NULL DEFAULT 'folder',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create expenses table
CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  amount decimal(12,2) NOT NULL CHECK (amount > 0),
  description text NOT NULL,
  date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
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

-- Categories Policies
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

-- Expenses Policies
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

-- Constraints
-- Ensure only one default category per user
ALTER TABLE categories ADD CONSTRAINT categories_user_default_unique 
  EXCLUDE (user_id WITH =) WHERE (is_default = true);

-- Indexes for performance
CREATE INDEX user_profiles_user_id_idx ON user_profiles(user_id);
CREATE INDEX categories_user_id_idx ON categories(user_id);
CREATE INDEX categories_is_default_idx ON categories(is_default) WHERE is_default = true;
CREATE INDEX expenses_user_id_idx ON expenses(user_id);
CREATE INDEX expenses_category_id_idx ON expenses(category_id);
CREATE INDEX expenses_date_idx ON expenses(date);
CREATE INDEX expenses_user_date_idx ON expenses(user_id, date);

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
$$ LANGUAGE plpgsql;

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
END;
$$ LANGUAGE plpgsql;

-- Function to create default user profile
CREATE OR REPLACE FUNCTION create_default_user_profile(user_uuid uuid, currency_code text DEFAULT 'USD', currency_symbol text DEFAULT '$')
RETURNS void AS $$
BEGIN
  INSERT INTO user_profiles (user_id, currency_code, currency)
  VALUES (user_uuid, currency_code, currency_symbol)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default user profile
  PERFORM create_default_user_profile(NEW.id);
  
  -- Create default categories
  PERFORM create_default_categories_for_user(NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set up new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();