export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  is_default?: boolean | null;
  created_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  description: string;
  date: string;
  created_at: string;
}

export interface UserProfile {
  id?: string;
  user_id: string;
  currency_code: string;
  currency: string;
  created_at?: string;
}

export interface MonthlyExpense {
  month: string;
  total: number;
  expenses: Expense[];
}