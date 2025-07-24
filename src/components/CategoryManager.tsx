import React, { useState } from 'react';
import { Plus, Tag, Trash2, RotateCcw, AlertTriangle, Edit, X, Save } from 'lucide-react';
import { Category } from '../types';

interface CategoryManagerProps {
  categories: Category[];
  onAddCategory: (category: Omit<Category, 'id' | 'user_id' | 'created_at' | 'is_default'>) => void;
  onSelectCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onClearCategory: (categoryId: string) => void;
  onUpdateCategory: (categoryId: string, updates: { name?: string; color?: string }) => void;
  selectedCategory: Category | null;
}

const CATEGORY_COLORS = [
  // Reds
  '#EF4444', '#DC2626', '#B91C1C', '#991B1B',
  // Oranges
  '#F97316', '#EA580C', '#C2410C', '#9A3412',
  // Yellows
  '#F59E0B', '#D97706', '#B45309', '#92400E',
  // Greens
  '#22C55E', '#16A34A', '#15803D', '#166534',
  '#84CC16', '#65A30D', '#4D7C0F', '#365314',
  // Teals
  '#14B8A6', '#0D9488', '#0F766E', '#134E4A',
  '#10B981', '#059669', '#047857', '#064E3B',
  // Blues
  '#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF',
  '#06B6D4', '#0891B2', '#0E7490', '#155E75',
  '#0EA5E9', '#0284C7', '#0369A1', '#075985',
  // Purples
  '#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6',
  '#A855F7', '#9333EA', '#7E22CE', '#6B21A8',
  // Pinks
  '#EC4899', '#DB2777', '#BE185D', '#9D174D',
  '#C026D3', '#A21CAF', '#86198F', '#701A75',
  // Grays
  '#6B7280', '#4B5563', '#374151', '#1F2937'
];

const CATEGORY_ICONS = [
  'shopping-bag', 'car', 'home', 'utensils', 'plane',
  'gamepad-2', 'heart', 'book', 'music', 'camera',
  'coffee', 'shirt', 'fuel', 'stethoscope', 'graduation-cap', 'briefcase'
];

export default function CategoryManager({ 
  categories, 
  onAddCategory, 
  onSelectCategory, 
  onDeleteCategory,
  onClearCategory,
  onUpdateCategory,
  selectedCategory 
}: CategoryManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    color: '',
    icon: CATEGORY_ICONS[0]
  });
  const [editForm, setEditForm] = useState({
    name: '',
    color: ''
  });

  // Get colors that are already used by existing categories (excluding the one being edited)
  const usedColors = categories
    .filter(cat => cat.id !== editingCategory?.id)
    .map(cat => cat.color);
  
  // Get available colors (not used by existing categories, or currently selected in edit)
  const availableColors = CATEGORY_COLORS.filter(color => 
    !usedColors.includes(color) || (editingCategory && editForm.color === color)
  );
  
  // Set default color to first available color when form is shown
  React.useEffect(() => {
    if (showForm && !newCategory.color && availableColors.length > 0) {
      setNewCategory(prev => ({ ...prev, color: availableColors[0] }));
    }
  }, [showForm, availableColors]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.name.trim() && newCategory.color) {
      // Double-check that the selected color is not already used
      if (usedColors.includes(newCategory.color)) {
        alert('This color is already used by another category. Please select a different color.');
        return;
      }
      
      onAddCategory(newCategory);
      setNewCategory({ name: '', color: '', icon: CATEGORY_ICONS[0] });
      setShowForm(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await onDeleteCategory(categoryId);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Cannot delete this category. It might be a default category or there was an error.');
    }
  };

  const handleClearCategory = async (categoryId: string) => {
    try {
      await onClearCategory(categoryId);
      setShowClearConfirm(null);
    } catch (error) {
      console.error('Error clearing category:', error);
      alert('Error clearing category expenses.');
    }
  };

  const handleFormToggle = () => {
    if (!showForm && availableColors.length === 0) {
      alert('All available colors are already in use. Please delete a category first to free up a color.');
      return;
    }
    setShowForm(!showForm);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setEditForm({
      name: category.name,
      color: category.color
    });
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    if (editForm.name.trim() && editForm.color) {
      // Check if color is already used by another category
      const otherCategoriesColors = categories
        .filter(cat => cat.id !== editingCategory.id)
        .map(cat => cat.color);
      
      if (otherCategoriesColors.includes(editForm.color)) {
        alert('This color is already used by another category. Please select a different color.');
        return;
      }

      try {
        await onUpdateCategory(editingCategory.id, {
          name: editForm.name.trim(),
          color: editForm.color
        });
        setEditingCategory(null);
        setEditForm({ name: '', color: '' });
      } catch (error) {
        console.error('Error updating category:', error);
        alert('Error updating category.');
      }
    }
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setEditForm({ name: '', color: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Categories</h2>
        <button
          onClick={handleFormToggle}
          disabled={availableColors.length === 0}
          className={`flex items-center gap-2 py-2 px-4 rounded-xl font-semibold transition-all duration-200 ${
            availableColors.length === 0 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
          }`}
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Add Category</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {availableColors.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <p className="text-yellow-800 text-sm">
              All available colors are in use. Delete a category to free up colors for new ones.
            </p>
          </div>
        </div>
      )}

      {showForm && (
        <div className="card p-6 animate-in slide-in-from-top duration-300">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                className="input-field focus-ring"
                placeholder="Enter category name"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color 
                <span className="text-sm text-gray-500 ml-2">
                  ({availableColors.length} available)
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_COLORS.map((color) => {
                  const isUsed = usedColors.includes(color);
                  const isSelected = newCategory.color === color;
                  
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => !isUsed && setNewCategory({ ...newCategory, color })}
                      disabled={isUsed}
                      className={`relative w-8 h-8 rounded-full border-4 transition-all duration-200 ${
                        isUsed 
                          ? 'border-gray-300 opacity-40 cursor-not-allowed' 
                          : isSelected 
                            ? 'border-gray-800 scale-110 hover-scale' 
                            : 'border-gray-300 hover:border-gray-500 hover-scale'
                      }`}
                      style={{ backgroundColor: color }}
                      title={isUsed ? 'Color already in use' : 'Select this color'}
                    >
                      {isUsed && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-3 h-0.5 bg-white transform rotate-45"></div>
                          <div className="w-3 h-0.5 bg-white transform -rotate-45 absolute"></div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {newCategory.color && (
                <p className="text-xs text-green-600 mt-2">
                  ✓ Selected color: {newCategory.color}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={!newCategory.color}
                className={`${
                  newCategory.color ? 'btn-success' : 'bg-gray-300 text-gray-500 cursor-not-allowed py-3 px-6 rounded-xl'
                }`}
              >
                Create Category
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {categories.map((category) => (
          <div
            key={category.id}
            className={`relative group card card-hover p-4 border-2 transition-all duration-200 ${
              selectedCategory?.id === category.id
                ? 'border-blue-500 bg-blue-50 shadow-medium'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <button
              onClick={() => onSelectCategory(category)}
              className="w-full"
            >
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg"
                  style={{ backgroundColor: category.color }}
                >
                  <Tag size={24} />
                </div>
                <span className="text-sm font-medium text-gray-700 text-center">
                  {category.name}
                  {category.is_default && (
                    <span className="block text-xs text-gray-500 font-normal">(Default)</span>
                  )}
                </span>
              </div>
            </button>

            <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={() => handleEditCategory(category)}
                className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 shadow-md hover-scale"
                title="Edit category"
              >
                <Edit size={12} />
              </button>
            </div>

            {!category.is_default && (
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                <button
                  onClick={() => setShowClearConfirm(category.id)}
                  className="p-1.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200 shadow-md hover-scale"
                  title="Clear all expenses"
                >
                  <RotateCcw size={12} />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(category.id)}
                  className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 shadow-md hover-scale"
                  title="Delete category"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8 animate-in scale-in duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg"
                    style={{ backgroundColor: editForm.color || editingCategory.color }}
                  >
                    <Edit size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Edit Category</h3>
                    <p className="text-sm text-gray-600">Update name and color</p>
                  </div>
                </div>
                <button
                  onClick={cancelEdit}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all duration-200"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleUpdateCategory} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="input-field focus-ring"
                    placeholder="Enter category name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Choose Color
                  </label>
                  <div className="grid grid-cols-8 gap-3 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                    {CATEGORY_COLORS.map((color) => {
                      const isUsed = usedColors.includes(color);
                      const isSelected = editForm.color === color;
                      const isCurrentColor = editingCategory.color === color;
                      
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => (!isUsed || isCurrentColor) && setEditForm({ ...editForm, color })}
                          disabled={isUsed && !isCurrentColor}
                          className={`relative w-10 h-10 rounded-xl border-4 transition-all duration-200 ${
                            isUsed && !isCurrentColor
                              ? 'border-gray-300 opacity-40 cursor-not-allowed' 
                              : isSelected 
                                ? 'border-gray-800 scale-110 shadow-lg' 
                                : 'border-gray-300 hover:border-gray-500 hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                          title={
                            isUsed && !isCurrentColor 
                              ? 'Color already in use' 
                              : isCurrentColor 
                                ? 'Current color' 
                                : 'Select this color'
                          }
                        >
                          {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-3 h-3 bg-white rounded-full shadow-md"></div>
                            </div>
                          )}
                          {isUsed && !isCurrentColor && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-4 h-0.5 bg-white transform rotate-45"></div>
                              <div className="w-4 h-0.5 bg-white transform -rotate-45 absolute"></div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {editForm.color && (
                    <div className="mt-3 flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border-2 border-gray-300"
                        style={{ backgroundColor: editForm.color }}
                      ></div>
                      <p className="text-sm text-green-600">
                        Selected: {editForm.color}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={!editForm.name.trim() || !editForm.color}
                    className="btn-success flex-1 flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="btn-secondary px-6"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Delete Category</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this category? All expenses in this category will be moved to the default "General" category.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDeleteCategory(showDeleteConfirm)}
                  className="btn-danger flex-1"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <RotateCcw className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Clear Category</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to clear all expenses from this category? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleClearCategory(showClearConfirm)}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowClearConfirm(null)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}