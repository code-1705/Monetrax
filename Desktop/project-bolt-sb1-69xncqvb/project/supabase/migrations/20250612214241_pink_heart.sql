/*
  # Remove Default Categories

  This migration removes all default categories from the database.
  
  1. Changes Made
     - Temporarily disable the category deletion trigger
     - Remove all categories where is_default = true
     - Clean up any orphaned expenses
     - Re-enable the category deletion trigger
  
  2. Safety Measures
     - Only affects categories explicitly marked as default
     - Preserves all user-created categories
     - Handles trigger that prevents default category deletion
*/

-- Temporarily disable the trigger that prevents default category deletion
DROP TRIGGER IF EXISTS category_deletion_trigger ON categories;

-- Remove all default categories
DELETE FROM categories 
WHERE is_default = true;

-- Clean up any orphaned expenses (should be handled by CASCADE, but being extra safe)
DELETE FROM expenses 
WHERE category_id NOT IN (SELECT id FROM categories);

-- Re-enable the trigger for future category deletions
CREATE TRIGGER category_deletion_trigger 
  BEFORE DELETE ON categories 
  FOR EACH ROW 
  EXECUTE FUNCTION handle_category_deletion();