import React, { useState } from 'react';
import { BarChart3, Calendar, Edit, Trash2, X } from 'lucide-react';
import { Category, Expense } from '../types';

interface ExpenseSummaryProps {
  expenses: Expense[];
  categories: Category[];
  onClose: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
  currencySymbol: string;
}

export default function ExpenseSummary({ 
  expenses, 
  categories, 
  onClose, 
  onEditExpense, 
  onDeleteExpense,
  currencySymbol 
}: ExpenseSummaryProps) {
  const [selectedMonth, setSelectedMonth] = useState('');

  // Get unique months from expenses
  const months = [...new Set(expenses.map(expense => expense.date.substring(0, 7)))].sort().reverse();

  // Filter expenses by selected month
  const filteredExpenses = selectedMonth 
    ? expenses.filter(expense => expense.date.startsWith(selectedMonth))
    : expenses;

  // Group expenses by category
  const expensesByCategory = filteredExpenses.reduce((acc, expense) => {
    const category = categories.find(cat => cat.id === expense.category_id);
    if (category) {
      if (!acc[category.id]) {
        acc[category.id] = { category, expenses: [], total: 0 };
      }
      acc[category.id].expenses.push(expense);
      acc[category.id].total += expense.amount;
    }
    return acc;
  }, {} as Record<string, { category: Category; expenses: Expense[]; total: number }>);

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatMonth = (monthString: string) => {
    return new Date(monthString + '-01').toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const handleDeleteExpense = (expenseId: string) => {
    onDeleteExpense(expenseId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white">
                <BarChart3 size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Expense Summary</h3>
                <p className="text-gray-600">Total: {currencySymbol}{totalAmount.toFixed(2)}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X size={24} />
            </button>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar size={16} className="inline mr-1" />
              Filter by Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Months</option>
              {months.map(month => (
                <option key={month} value={month}>{formatMonth(month)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {Object.values(expensesByCategory).length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
              <p>No expenses found for the selected period.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.values(expensesByCategory).map(({ category, expenses: categoryExpenses, total }) => (
                <div key={category.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <h4 className="font-semibold text-gray-800">{category.name}</h4>
                    </div>
                    <span className="font-bold text-lg text-gray-900">{currencySymbol}{total.toFixed(2)}</span>
                  </div>
                  
                  <div className="space-y-2 ml-9">
                    {categoryExpenses.map(expense => (
                      <div key={expense.id} className="bg-white p-3 rounded-lg shadow-sm">
                        {/* Desktop Layout */}
                        <div className="hidden sm:flex items-center justify-between hover:shadow-md transition-shadow duration-200">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900">{expense.description}</span>
                              <span className="font-semibold text-gray-900">{currencySymbol}{expense.amount.toFixed(2)}</span>
                            </div>
                            <p className="text-sm text-gray-500">{formatDate(expense.date)}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => onEditExpense(expense)}
                              className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                              title="Edit expense"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                              title="Delete expense"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Mobile Layout */}
                        <div className="sm:hidden">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">{expense.description}</span>
                            <span className="font-semibold text-gray-900">{currencySymbol}{expense.amount.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500">{formatDate(expense.date)}</p>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => onEditExpense(expense)}
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                title="Edit expense"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(expense.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                title="Delete expense"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}