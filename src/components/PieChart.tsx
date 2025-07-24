import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Category, Expense } from '../types';

interface PieChartProps {
  expenses: Expense[];
  categories: Category[];
  currencySymbol: string;
}

interface ChartData {
  category: Category;
  amount: number;
  percentage: number;
}

interface SinglePieChartProps {
  title: string;
  chartData: ChartData[];
  totalAmount: number;
  currencySymbol: string;
  isDropdown?: boolean;
  selectedMonth?: string;
  availableMonths?: string[];
  onMonthChange?: (month: string) => void;
  showDropdown?: boolean;
  onToggleDropdown?: () => void;
}

function SinglePieChart({ 
  title, 
  chartData, 
  totalAmount, 
  currencySymbol, 
  isDropdown = false,
  selectedMonth,
  availableMonths = [],
  onMonthChange,
  showDropdown = false,
  onToggleDropdown
}: SinglePieChartProps) {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col items-center gap-4">
          {/* Fixed height title area for consistent alignment */}
          <div className="h-12 flex items-center justify-center">
            {isDropdown ? (
              <div className="relative">
                <button
                  onClick={onToggleDropdown}
                  className="flex items-center gap-2 text-lg font-bold text-gray-800 hover:text-blue-600 transition-colors duration-200 px-4 py-2 rounded-lg hover:bg-blue-50"
                >
                  {title}
                  <ChevronDown 
                    size={20} 
                    className={`transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
                  />
                </button>
                
                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48 max-h-64 overflow-y-auto">
                    {availableMonths.length > 0 ? (
                      availableMonths.map(month => {
                        const monthName = new Date(month + '-01').toLocaleDateString('en-US', { 
                          month: 'long', 
                          year: 'numeric' 
                        });
                        return (
                          <button
                            key={month}
                            onClick={() => {
                              onMonthChange?.(month);
                            }}
                            className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors duration-200 ${
                              month === selectedMonth ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700'
                            }`}
                          >
                            {monthName}
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-4 py-3 text-gray-500 text-sm">
                        No expense data available
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <h3 className="text-lg font-bold text-gray-800 text-center">{title}</h3>
            )}
          </div>
          
          {/* Fixed height content area */}
          <div className="flex items-center justify-center h-48 text-gray-500">
            <p>No expenses to display</p>
          </div>
        </div>
      </div>
    );
  }

  // If there's only one data point, show a full circle
  if (chartData.length === 1) {
    const singleData = chartData[0];
    
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col items-center gap-4">
          {/* Fixed height title area for consistent alignment */}
          <div className="h-12 flex items-center justify-center">
            {isDropdown ? (
              <div className="relative">
                <button
                  onClick={onToggleDropdown}
                  className="flex items-center gap-2 text-lg font-bold text-gray-800 hover:text-blue-600 transition-colors duration-200 px-4 py-2 rounded-lg hover:bg-blue-50"
                >
                  {title}
                  <ChevronDown 
                    size={20} 
                    className={`transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
                  />
                </button>
                
                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48 max-h-64 overflow-y-auto">
                    {availableMonths.length > 0 ? (
                      availableMonths.map(month => {
                        const monthName = new Date(month + '-01').toLocaleDateString('en-US', { 
                          month: 'long', 
                          year: 'numeric' 
                        });
                        return (
                          <button
                            key={month}
                            onClick={() => {
                              onMonthChange?.(month);
                            }}
                            className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors duration-200 ${
                              month === selectedMonth ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700'
                            }`}
                          >
                            {monthName}
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-4 py-3 text-gray-500 text-sm">
                        No expense data available
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <h3 className="text-lg font-bold text-gray-800 text-center">{title}</h3>
            )}
          </div>
          
          {/* Fixed height pie chart area */}
          <div className="relative h-40 flex items-center justify-center">
            <svg width="160" height="160" className="transform rotate-0">
              <circle
                cx="80"
                cy="80"
                r="60"
                fill={singleData.category.color}
                className={`transition-all duration-200 cursor-pointer ${
                  hoveredSegment === singleData.category.id ? 'opacity-80 drop-shadow-lg' : 'opacity-100'
                }`}
                onMouseEnter={() => setHoveredSegment(singleData.category.id)}
                onMouseLeave={() => setHoveredSegment(null)}
              />
            </svg>
            
            {/* Tooltip */}
            {hoveredSegment && (
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-xs pointer-events-none whitespace-nowrap shadow-lg">
                {singleData.category.name}
                <br />
                {currencySymbol}{singleData.amount.toFixed(2)}
              </div>
            )}
          </div>

          {/* Legend for Single Item */}
          <div className="w-full">
            <div
              className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                hoveredSegment === singleData.category.id ? 'bg-gray-100 shadow-md' : 'bg-gray-50 hover:bg-gray-100'
              }`}
              onMouseEnter={() => setHoveredSegment(singleData.category.id)}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full shadow-sm"
                  style={{ backgroundColor: singleData.category.color }}
                />
                <span className="text-sm font-medium text-gray-800 truncate">
                  {singleData.category.name}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">{currencySymbol}{singleData.amount.toFixed(0)}</div>
                <div className="text-xs text-gray-500">100%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Generate SVG path for pie chart with multiple segments
  const generatePath = (percentage: number, startAngle: number) => {
    const angle = (percentage / 100) * 360;
    const endAngle = startAngle + angle;
    
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    const x1 = 80 + 60 * Math.cos(startAngleRad);
    const y1 = 80 + 60 * Math.sin(startAngleRad);
    const x2 = 80 + 60 * Math.cos(endAngleRad);
    const y2 = 80 + 60 * Math.sin(endAngleRad);
    
    return `M 80,80 L ${x1},${y1} A 60,60 0 ${largeArcFlag},1 ${x2},${y2} z`;
  };

  // Generate line path for segment separators (from center to edge)
  const generateSeparatorLine = (angle: number) => {
    const angleRad = (angle * Math.PI) / 180;
    const x1 = 80; // Center x
    const y1 = 80; // Center y
    const x2 = 80 + 60 * Math.cos(angleRad); // End at outer radius
    const y2 = 80 + 60 * Math.sin(angleRad);
    
    return `M ${x1},${y1} L ${x2},${y2}`;
  };

  let currentAngle = -90; // Start from top
  const separatorAngles: number[] = [];

  // Determine which categories to show in legend
  const displayedCategories = showAllCategories ? chartData : chartData.slice(0, 4);
  const hiddenCategoriesCount = chartData.length - 4;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex flex-col items-center gap-4">
        {/* Fixed height title area for consistent alignment */}
        <div className="h-12 flex items-center justify-center">
          {isDropdown ? (
            <div className="relative">
              <button
                onClick={onToggleDropdown}
                className="flex items-center gap-2 text-lg font-bold text-gray-800 hover:text-blue-600 transition-colors duration-200 px-4 py-2 rounded-lg hover:bg-blue-50"
              >
                {title}
                <ChevronDown 
                  size={20} 
                  className={`transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
                />
              </button>
              
              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48 max-h-64 overflow-y-auto">
                  {availableMonths.length > 0 ? (
                    availableMonths.map(month => {
                      const monthName = new Date(month + '-01').toLocaleDateString('en-US', { 
                        month: 'long', 
                        year: 'numeric' 
                      });
                      return (
                        <button
                          key={month}
                          onClick={() => {
                            onMonthChange?.(month);
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors duration-200 ${
                            month === selectedMonth ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700'
                          }`}
                        >
                          {monthName}
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-4 py-3 text-gray-500 text-sm">
                      No expense data available
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <h3 className="text-lg font-bold text-gray-800 text-center">{title}</h3>
          )}
        </div>
        
        {/* Fixed height pie chart area */}
        <div className="relative h-40 flex items-center justify-center">
          <svg width="160" height="160" className="transform rotate-0">
            {chartData.map((data, index) => {
              const path = generatePath(data.percentage, currentAngle);
              const segmentAngle = currentAngle;
              currentAngle += (data.percentage / 100) * 360;
              
              // Store separator angles for all segments (including the last one to close the circle)
              separatorAngles.push(segmentAngle);
              
              return (
                <path
                  key={data.category.id}
                  d={path}
                  fill={data.category.color}
                  className={`transition-all duration-200 cursor-pointer ${
                    hoveredSegment === data.category.id ? 'opacity-80 drop-shadow-lg' : 'opacity-100'
                  }`}
                  onMouseEnter={() => setHoveredSegment(data.category.id)}
                  onMouseLeave={() => setHoveredSegment(null)}
                />
              );
            })}
            
            {/* White separator lines between segments - from center to edge */}
            {separatorAngles.map((angle, index) => (
              <path
                key={`separator-${index}`}
                d={generateSeparatorLine(angle)}
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
              />
            ))}
          </svg>
          
          {/* Tooltip */}
          {hoveredSegment && (
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-xs pointer-events-none whitespace-nowrap shadow-lg">
              {chartData.find(d => d.category.id === hoveredSegment)?.category.name}
              <br />
              {currencySymbol}{chartData.find(d => d.category.id === hoveredSegment)?.amount.toFixed(2)}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="w-full space-y-2">
          {displayedCategories.map(data => (
            <div
              key={data.category.id}
              className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                hoveredSegment === data.category.id ? 'bg-gray-100 shadow-md' : 'bg-gray-50 hover:bg-gray-100'
              }`}
              onMouseEnter={() => setHoveredSegment(data.category.id)}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full shadow-sm"
                  style={{ backgroundColor: data.category.color }}
                />
                <span className="text-sm font-medium text-gray-800 truncate">
                  {data.category.name}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">{currencySymbol}{data.amount.toFixed(0)}</div>
                <div className="text-xs text-gray-500">{data.percentage.toFixed(1)}%</div>
              </div>
            </div>
          ))}
          
          {/* Show/Hide more categories button */}
          {chartData.length > 4 && (
            <button
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="w-full text-center py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
            >
              {showAllCategories 
                ? 'Show less' 
                : `+${hiddenCategoriesCount} more categories`
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PieChart({ expenses, categories, currencySymbol }: PieChartProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  
  // Get unique months from expenses for dropdown
  const availableMonths = [...new Set(expenses.map(expense => expense.date.substring(0, 7)))].sort().reverse();
  
  // Filter expenses for selected month
  const selectedMonthExpenses = expenses.filter(expense => 
    expense.date.startsWith(selectedMonth)
  );

  // Filter expenses for selected date
  const selectedDateExpenses = expenses.filter(expense => 
    expense.date === selectedDate
  );

  // Calculate data for selected month's pie chart
  const selectedMonthChartData: ChartData[] = categories
    .map(category => {
      const categoryExpenses = selectedMonthExpenses.filter(expense => expense.category_id === category.id);
      const amount = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      return { category, amount, percentage: 0 };
    })
    .filter(data => data.amount > 0);

  const selectedMonthTotal = selectedMonthChartData.reduce((sum, data) => sum + data.amount, 0);
  
  // Calculate percentages for selected month
  selectedMonthChartData.forEach(data => {
    data.percentage = (data.amount / selectedMonthTotal) * 100;
  });

  // Sort by amount (descending)
  selectedMonthChartData.sort((a, b) => b.amount - a.amount);

  // Calculate data for selected date pie chart
  const selectedDateChartData: ChartData[] = categories
    .map(category => {
      const categoryExpenses = selectedDateExpenses.filter(expense => expense.category_id === category.id);
      const amount = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      return { category, amount, percentage: 0 };
    })
    .filter(data => data.amount > 0);

  const selectedDateTotal = selectedDateChartData.reduce((sum, data) => sum + data.amount, 0);
  
  // Calculate percentages for selected date
  selectedDateChartData.forEach(data => {
    data.percentage = (data.amount / selectedDateTotal) * 100;
  });

  // Sort by amount (descending)
  selectedDateChartData.sort((a, b) => b.amount - a.amount);

  // Calculate data for overall pie chart
  const overallChartData: ChartData[] = categories
    .map(category => {
      const categoryExpenses = expenses.filter(expense => expense.category_id === category.id);
      const amount = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      return { category, amount, percentage: 0 };
    })
    .filter(data => data.amount > 0);

  const overallTotal = overallChartData.reduce((sum, data) => sum + data.amount, 0);
  
  // Calculate percentages for overall
  overallChartData.forEach(data => {
    data.percentage = (data.amount / overallTotal) * 100;
  });

  // Sort by amount (descending)
  overallChartData.sort((a, b) => b.amount - a.amount);

  const selectedMonthName = new Date(selectedMonth + '-01').toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  const selectedDateFormatted = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    setShowMonthDropdown(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Expense Analytics</h2>
        <p className="text-gray-600">Visual insights into your spending patterns</p>
      </div>
      
      {/* Responsive Grid: Vertical on large screens, horizontal on smaller screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-1 gap-6">
        {/* Monthly Chart with Dropdown */}
        <SinglePieChart
          title={selectedMonthName}
          chartData={selectedMonthChartData}
          totalAmount={selectedMonthTotal}
          currencySymbol={currencySymbol}
          isDropdown={true}
          selectedMonth={selectedMonth}
          availableMonths={availableMonths}
          onMonthChange={handleMonthChange}
          showDropdown={showMonthDropdown}
          onToggleDropdown={() => setShowMonthDropdown(!showMonthDropdown)}
        />
        
        {/* Overall Chart */}
        <SinglePieChart
          title="Overall Expenses"
          chartData={overallChartData}
          totalAmount={overallTotal}
          currencySymbol={currencySymbol}
        />

        {/* Date Specific Chart - Now at the end */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col items-center gap-4">
            {/* Fixed height title area for consistent alignment */}
            <div className="h-12 flex items-center justify-center">
              <h3 className="text-lg font-bold text-gray-800 text-center">Select Date</h3>
            </div>
            
            <div className="w-full max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose a specific date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <SinglePieChart
              title={selectedDateFormatted}
              chartData={selectedDateChartData}
              totalAmount={selectedDateTotal}
              currencySymbol={currencySymbol}
            />
          </div>
        </div>
      </div>
      
      {/* Click outside to close dropdown */}
      {showMonthDropdown && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setShowMonthDropdown(false)}
        />
      )}
    </div>
  );
}