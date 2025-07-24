import React, { useState, useEffect } from 'react';
import { PlusCircle, TrendingUp, Calendar, Settings } from 'lucide-react';
import CategoryManager from './components/CategoryManager';
import ExpenseForm from './components/ExpenseForm';
import ExpenseSummary from './components/ExpenseSummary';
import PieChart from './components/PieChart';
import UserSettings from './components/UserSettings';
import { Category, Expense } from './types';
import { useAuth } from './hooks/useAuth';
import { useExpenses } from './hooks/useExpenses';
import { useCategories } from './hooks/useCategories';
import { useUserProfile } from './hooks/useUserProfile';

function App() {
  const { user } = useAuth();
  const { profile, updateProfile } = useUserProfile();
  const { categories, addCategory, updateCategory, deleteCategory, clearCategoryExpenses, loading: categoriesLoading } = useCategories();
  const { expenses, addExpense, updateExpense, deleteExpense, refetchExpenses, loading: expensesLoading } = useExpenses();
  
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showExpenseSummary, setShowExpenseSummary] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const currencySymbol = profile?.currency || '$';

  const handleAddCategory = async (categoryData: Omit<Category, 'id' | 'user_id' | 'created_at' | 'is_default'>) => {
    await addCategory(categoryData);
  };

  const handleUpdateCategory = async (categoryId: string, updates: { name?: string; color?: string }) => {
    await updateCategory(categoryId, updates);
    // Refetch expenses to reflect color changes in UI
    await refetchExpenses();
  };

  const handleDeleteCategory = async (categoryId: string) => {
    await deleteCategory(categoryId);
    // Refetch expenses to reflect changes
    await refetchExpenses();
  };

  const handleClearCategory = async (categoryId: string) => {
    await clearCategoryExpenses(categoryId);
    // Refetch expenses to reflect changes
    await refetchExpenses();
  };

  const handleAddExpense = async (expenseData: Omit<Expense, 'id' | 'user_id' | 'created_at'>) => {
    await addExpense(expenseData);
    setShowExpenseForm(false);
  };

  const handleUpdateExpense = async (updatedExpense: Expense) => {
    await updateExpense(updatedExpense);
    setEditingExpense(null);
    setShowExpenseForm(false);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    await deleteExpense(expenseId);
  };

  const handleEditExpense = (expense: Expense) => {
    const category = categories.find(cat => cat.id === expense.category_id);
    if (category) {
      setSelectedCategory(category);
      setEditingExpense(expense);
      setShowExpenseForm(true);
      setShowExpenseSummary(false);
    }
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setShowExpenseForm(true);
    setEditingExpense(null);
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const thisMonthExpenses = expenses.filter(expense => 
    expense.date.startsWith(new Date().toISOString().substring(0, 7))
  ).reduce((sum, expense) => sum + expense.amount, 0);

  const recentExpenses = expenses
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  if (categoriesLoading || expensesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="relative mb-8">
          {/* Settings Button - Desktop (top right) */}
          <button
            onClick={() => setShowSettings(true)}
            className="hidden sm:block absolute top-0 right-0 p-3 text-gray-600 hover:text-gray-800 hover:bg-white rounded-xl transition-all duration-200 shadow-soft hover:shadow-medium hover-lift z-10"
            title="Settings"
          >
            <Settings size={24} />
          </button>
          
          {/* Centered Header Content */}
          <div className="text-center sm:pr-16">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
              <span className="text-gradient">Expense Manager</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600">Track your expenses with ease and insights</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card card-hover p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900">{currencySymbol}{totalExpenses.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="card card-hover p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">{currencySymbol}{thisMonthExpenses.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="card card-hover p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <PlusCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Categories and Actions */}
          <div className="xl:col-span-2 space-y-8">
            {/* Category Manager */}
            <div className="card p-6">
              <CategoryManager
                categories={categories}
                onAddCategory={handleAddCategory}
                onSelectCategory={handleCategorySelect}
                onDeleteCategory={handleDeleteCategory}
                onClearCategory={handleClearCategory}
                onUpdateCategory={handleUpdateCategory}
                selectedCategory={selectedCategory}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setShowExpenseSummary(true)}
                className="btn-primary flex-1 flex items-center justify-center gap-3"
              >
                <TrendingUp size={24} />
                <span className="text-lg font-semibold">View Expense Summary</span>
              </button>
            </div>

            {/* Recent Expenses */}
            {recentExpenses.length > 0 && (
              <div className="card p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Expenses</h3>
                <div className="space-y-3">
                  {recentExpenses.map(expense => {
                    const category = categories.find(cat => cat.id === expense.category_id);
                    return (
                      <div key={expense.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-gray-100 hover:to-gray-200 transition-all duration-200">
                        <div className="flex items-center gap-3">
                          {category && (
                            <div
                              className="w-4 h-4 rounded-full shadow-sm"
                              style={{ backgroundColor: category.color }}
                            />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{expense.description}</p>
                            <p className="text-sm text-gray-500">
                              {category?.name} • {new Date(expense.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className="font-semibold text-gray-900 bg-white px-3 py-1 rounded-lg shadow-sm">
                          {currencySymbol}{expense.amount.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Charts */}
          <div className="xl:col-span-1">
            <PieChart expenses={expenses} categories={categories} currencySymbol={currencySymbol} />
          </div>
        </div>

        {/* Modals */}
        {showExpenseForm && selectedCategory && (
          <ExpenseForm
            category={selectedCategory}
            onAddExpense={handleAddExpense}
            onUpdateExpense={handleUpdateExpense}
            onClose={() => {
              setShowExpenseForm(false);
              setEditingExpense(null);
            }}
            editingExpense={editingExpense}
            currencySymbol={currencySymbol}
          />
        )}

        {showExpenseSummary && (
          <ExpenseSummary
            expenses={expenses}
            categories={categories}
            onClose={() => setShowExpenseSummary(false)}
            onEditExpense={handleEditExpense}
            onDeleteExpense={handleDeleteExpense}
            currencySymbol={currencySymbol}
          />
        )}

        {showSettings && (
          <UserSettings
            profile={profile}
            onUpdateProfile={updateProfile}
            onClose={() => setShowSettings(false)}
          />
        )}
      </div>

      {/* Mobile Settings Button - Fixed bottom right */}
      <button
        onClick={() => setShowSettings(true)}
        className="sm:hidden fixed bottom-6 right-6 p-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50 hover-lift"
        title="Settings"
      >
        <Settings size={24} />
      </button>
    </div>
  );
}

export default App;