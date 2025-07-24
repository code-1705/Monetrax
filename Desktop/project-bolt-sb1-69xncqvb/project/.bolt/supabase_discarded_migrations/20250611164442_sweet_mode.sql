/*
  # Fix user_profiles RLS policy

  1. Security Policy Fix
    - Update RLS policies to use `auth.uid()` instead of `uid()`
    - This fixes the 401 error when creating user profiles
    
  2. Changes Made
    - Drop existing policies that use incorrect `uid()` function
    - Create new policies with correct `auth.uid()` function
    - Maintain same security model but with proper function reference
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;

-- Create new policies with correct auth.uid() function
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

CREATE POLICY "Users can view their own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);