import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { Expense } from '../types';

export function useExpenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchExpenses();
    }
  }, [user]);

  const fetchExpenses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const refetchExpenses = async () => {
    await fetchExpenses();
  };

  const addExpense = async (expenseData: Omit<Expense, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          ...expenseData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      setExpenses(prev => [data, ...prev]);
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const updateExpense = async (expense: Expense) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          category_id: expense.category_id,
          amount: expense.amount,
          description: expense.description,
          date: expense.date,
        })
        .eq('id', expense.id);

      if (error) throw error;
      setExpenses(prev => prev.map(exp => exp.id === expense.id ? expense : exp));
    } catch (error) {
      console.error('Error updating expense:', error);
    }
  };

  const deleteExpense = async (expenseId: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;
      setExpenses(prev => prev.filter(exp => exp.id !== expenseId));
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  return {
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    refetchExpenses,
    loading,
  };
}