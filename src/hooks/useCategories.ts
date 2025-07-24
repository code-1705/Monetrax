import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { Category } from '../types';

export function useCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user]);

  const fetchCategories = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data.length === 0) {
        // Create default categories for new users
        await createDefaultCategories();
      } else {
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultCategories = async () => {
    if (!user) return;

    const defaultCategories = [
      { name: 'General', color: '#6B7280', icon: 'folder', is_default: true },
      { name: 'Food & Dining', color: '#EF4444', icon: 'utensils', is_default: false },
      { name: 'Transportation', color: '#3B82F6', icon: 'car', is_default: false },
      { name: 'Shopping', color: '#8B5CF6', icon: 'shopping-bag', is_default: false },
      { name: 'Entertainment', color: '#10B981', icon: 'gamepad-2', is_default: false },
      { name: 'Bills & Utilities', color: '#F59E0B', icon: 'home', is_default: false },
    ];

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert(
          defaultCategories.map(cat => ({
            ...cat,
            user_id: user.id,
          }))
        )
        .select();

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error creating default categories:', error);
    }
  };

  const addCategory = async (categoryData: Omit<Category, 'id' | 'user_id' | 'created_at' | 'is_default'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          ...categoryData,
          user_id: user.id,
          is_default: false,
        })
        .select()
        .single();

      if (error) throw error;
      setCategories(prev => [...prev, data]);
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const updateCategory = async (categoryId: string, updates: { name?: string; color?: string }) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', categoryId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setCategories(prev => prev.map(cat => cat.id === categoryId ? data : cat));
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)
        .eq('user_id', user.id);

      if (error) throw error;
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  };

  const clearCategoryExpenses = async (categoryId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('category_id', categoryId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error clearing category expenses:', error);
      throw error;
    }
  };

  return {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    clearCategoryExpenses,
    loading,
  };
}