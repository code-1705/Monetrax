import React, { useState, useEffect } from 'react';
import { DollarSign, FileText, Calendar, Save, X } from 'lucide-react';
import { Category, Expense } from '../types';

interface ExpenseFormProps {
  category: Category;
  onAddExpense: (expense: Omit<Expense, 'id' | 'user_id' | 'created_at'>) => void;
  onUpdateExpense: (expense: Expense) => void;
  onClose: () => void;
  editingExpense?: Expense | null;
  currencySymbol: string;
}

export default function ExpenseForm({ 
  category, 
  onAddExpense, 
  onUpdateExpense, 
  onClose, 
  editingExpense,
  currencySymbol 
}: ExpenseFormProps) {
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (editingExpense) {
      setFormData({
        amount: editingExpense.amount.toString(),
        description: editingExpense.description,
        date: editingExpense.date
      });
    }
  }, [editingExpense]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    
    if (amount > 0) {
      // Use category name as description if no description is provided
      const description = formData.description.trim() || category.name;
      
      const expenseData = {
        category_id: category.id,
        amount,
        description,
        date: formData.date
      };

      if (editingExpense) {
        onUpdateExpense({ ...editingExpense, ...expenseData });
      } else {
        onAddExpense(expenseData);
      }

      if (!editingExpense) {
        setFormData({
          amount: '',
          description: '',
          date: new Date().toISOString().split('T')[0]
        });
      }
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg"
                style={{ backgroundColor: category.color }}
              >
                <DollarSign size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {editingExpense ? 'Edit' : 'Add'} Expense
                </h3>
                <p className="text-sm text-gray-600">{category.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all duration-200"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign size={16} className="inline mr-1" />
                Amount ({currencySymbol})
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="input-field focus-ring"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText size={16} className="inline mr-1" />
                Description <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field focus-ring"
                placeholder={`What did you spend on? (defaults to "${category.name}")`}
              />
              <p className="text-xs text-gray-500 mt-1">
                If left empty, "{category.name}" will be used as the description
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="inline mr-1" />
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="input-field focus-ring"
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="btn-success flex-1 flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {editingExpense ? 'Update' : 'Save'} Expense
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary px-6"
              >
                Close
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}