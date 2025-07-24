import React, { useState } from 'react';
import { Expense, Category } from '../types';

interface LineChartProps {
  expenses: Expense[];
  categories: Category[];
  currencySymbol: string;
}

interface MonthlyData {
  month: string;
  amount: number;
  displayMonth: string;
}

export default function LineChart({ expenses, currencySymbol }: LineChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);

  // Group expenses by month
  const monthlyExpenses = expenses.reduce((acc, expense) => {
    const month = expense.date.substring(0, 7); // YYYY-MM format
    if (!acc[month]) {
      acc[month] = 0;
    }
    acc[month] += expense.amount;
    return acc;
  }, {} as Record<string, number>);

  // Convert to array and sort by month
  const monthlyData: MonthlyData[] = Object.entries(monthlyExpenses)
    .map(([month, amount]) => ({
      month,
      amount,
      displayMonth: new Date(month + '-01').toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric'
      })
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  if (monthlyData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Monthly Expense Trend</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>No expense data to display</p>
        </div>
      </div>
    );
  }

  // Calculate chart scaling
  const maxAmount = Math.max(...monthlyData.map(d => d.amount));
  const minAmount = 0;
  const amountRange = maxAmount - minAmount;
  const chartWidth = 600;
  const chartHeight = 300;
  const padding = 60;

  // Generate Y-axis grid lines
  const yAxisSteps = 5;
  const stepValue = maxAmount / yAxisSteps;
  const yAxisLines = Array.from({ length: yAxisSteps + 1 }, (_, i) => {
    const amount = i * stepValue;
    const y = chartHeight - padding - (amount / maxAmount) * (chartHeight - 2 * padding);
    return { y, amount };
  });

  // Generate SVG path for the line
  const generatePath = () => {
    if (monthlyData.length === 1) {
      const x = chartWidth / 2;
      const y = chartHeight - padding - ((monthlyData[0].amount - minAmount) / amountRange) * (chartHeight - 2 * padding);
      return `M ${x},${y}`;
    }
    
    return monthlyData
      .map((data, index) => {
        const x = padding + (index / (monthlyData.length - 1)) * (chartWidth - 2 * padding);
        const y = chartHeight - padding - ((data.amount - minAmount) / amountRange) * (chartHeight - 2 * padding);
        return `${index === 0 ? 'M' : 'L'} ${x},${y}`;
      })
      .join(' ');
  };

  // Generate area path for gradient fill
  const generateAreaPath = () => {
    if (monthlyData.length === 1) {
      const x = chartWidth / 2;
      const y = chartHeight - padding - ((monthlyData[0].amount - minAmount) / amountRange) * (chartHeight - 2 * padding);
      const bottomY = chartHeight - padding;
      return `M ${x},${bottomY} L ${x},${y} L ${x},${bottomY} Z`;
    }
    
    const linePath = generatePath();
    const firstX = padding;
    const lastX = padding + ((monthlyData.length - 1) / (monthlyData.length - 1)) * (chartWidth - 2 * padding);
    const bottomY = chartHeight - padding;
    
    return `${linePath} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Monthly Expense Trend</h3>
      
      <div className="flex justify-center">
        <svg width={chartWidth} height={chartHeight} className="overflow-visible">
          {/* Gradient definition */}
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          {yAxisLines.map((line, index) => (
            <g key={index}>
              <line
                x1={padding}
                y1={line.y}
                x2={chartWidth - padding}
                y2={line.y}
                stroke="#E5E7EB"
                strokeWidth="1"
                strokeDasharray={index === 0 ? "none" : "2,2"}
              />
              <text
                x={padding - 15}
                y={line.y + 4}
                textAnchor="end"
                className="text-xs fill-gray-500 font-medium"
              >
                {currencySymbol}{line.amount.toFixed(0)}
              </text>
            </g>
          ))}
          
          {/* X-axis labels */}
          {monthlyData.map((data, index) => {
            const x = monthlyData.length === 1 
              ? chartWidth / 2 
              : padding + (index / (monthlyData.length - 1)) * (chartWidth - 2 * padding);
            return (
              <text
                key={data.month}
                x={x}
                y={chartHeight - padding + 20}
                textAnchor="middle"
                className="text-xs fill-gray-500 font-medium"
              >
                {data.displayMonth}
              </text>
            );
          })}
          
          {/* Area fill */}
          <path
            d={generateAreaPath()}
            fill="url(#areaGradient)"
          />
          
          {/* Line */}
          <path
            d={generatePath()}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {monthlyData.map((data, index) => {
            const x = monthlyData.length === 1 
              ? chartWidth / 2 
              : padding + (index / (monthlyData.length - 1)) * (chartWidth - 2 * padding);
            const y = chartHeight - padding - ((data.amount - minAmount) / amountRange) * (chartHeight - 2 * padding);
            
            return (
              <g key={data.month}>
                <circle
                  cx={x}
                  cy={y}
                  r={hoveredPoint === data.month ? 6 : 4}
                  fill="#3B82F6"
                  stroke="white"
                  strokeWidth="2"
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredPoint(data.month)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                
                {/* Tooltip */}
                {hoveredPoint === data.month && (
                  <g>
                    <rect
                      x={x - 40}
                      y={y - 45}
                      width="80"
                      height="35"
                      fill="rgba(0, 0, 0, 0.8)"
                      rx="6"
                    />
                    <text
                      x={x}
                      y={y - 30}
                      textAnchor="middle"
                      className="text-xs fill-white font-medium"
                    >
                      {data.displayMonth}
                    </text>
                    <text
                      x={x}
                      y={y - 18}
                      textAnchor="middle"
                      className="text-xs fill-white font-bold"
                    >
                      {currencySymbol}{data.amount.toFixed(0)}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}