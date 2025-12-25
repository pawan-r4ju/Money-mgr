import React from 'react';
import { render, screen } from '@testing-library/react';
import { ExpenseProvider, useExpense } from '../context/ExpenseContext';
import Analytics from '../pages/Analytics';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import dayjs from 'dayjs';

// Mock Recharts
vi.mock('recharts', () => {
  const OriginalModule = vi.importActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }) => <div className="recharts-responsive-container">{children}</div>,
    PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
    Pie: ({ children }) => <div data-testid="pie">{children}</div>,
    Cell: () => <div data-testid="cell" />,
    Tooltip: () => <div data-testid="tooltip" />,
    Legend: () => <div data-testid="legend" />,
    LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
    Line: () => <div data-testid="line" />,
    XAxis: () => <div data-testid="xaxis" />,
    YAxis: () => <div data-testid="yaxis" />,
    CartesianGrid: () => <div data-testid="grid" />,
    ReferenceLine: () => <div data-testid="ref-line" />,
    BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
    Bar: () => <div data-testid="bar" />,
  };
});

// Mock Context
const mockExpenses = [
  { id: '1', amount: 100, category: 'Food', date: '2023-10-15', tags: [] }, // Inside range
  { id: '2', amount: 50, category: 'Food', date: '2023-10-16', tags: [] },  // Inside range
  { id: '3', amount: 200, category: 'Food', date: '2023-09-01', tags: [] }, // Outside range
  { id: '4', amount: 75, category: 'Travel', date: '2023-10-20', tags: [] }, // Inside range
];

// We need to manually filter because the component uses filteredExpenses from context
// In a real app, the provider does this. Here we mock the hook return value.
const filteredMockExpenses = mockExpenses.filter(e => e.date.startsWith('2023-10'));

vi.mock('../context/ExpenseContext', () => ({
  useExpense: vi.fn(),
  ExpenseProvider: ({ children }) => <div>{children}</div> // Dummy provider
}));

describe('Analytics Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useExpense.mockReturnValue({
      expenses: mockExpenses,
      filteredExpenses: filteredMockExpenses,
      categoryBudgets: { 'Food': 200, 'Travel': 100 },
      monthlyBudget: 1000,
      startDate: '2023-10-01',
      endDate: '2023-10-31',
      categories: ['Food', 'Travel', 'Utilities']
    });
  });

  it('renders Category Spending Analysis section', () => {
    render(<Analytics />);
    expect(screen.getByText('Category Spending Analysis')).toBeInTheDocument();
  });

  it('calculates category spend based on filtered expenses only', () => {
    render(<Analytics />);
    
    // Food spend should be 100 + 50 = 150. (200 is outside range)
    // Travel spend should be 75.
    
    // We can look for the text "150" or "75" (assuming formatCurrency adds symbol, we look for partial)
    // formatCurrency usually outputs ₹150.00 or similar.
    
    // Let's search for "150" and ensure "200" or "350" (total) is NOT present in the Food section.
    // The component renders: 
    // <span className="text-muted-foreground">{formatCurrency(cat.spent)} ...</span>
    
    // Check for Food
    const foodLabel = screen.getByText('Food');
    expect(foodLabel).toBeInTheDocument();
    
    // Check for 150 (We use regex to be flexible with currency symbol)
    expect(screen.getAllByText(/150/).length).toBeGreaterThan(0);
    
    // Check for Travel 75
    expect(screen.getAllByText(/75/).length).toBeGreaterThan(0);
    
    // Ensure the outside range amount (200) is NOT summed up
    // Total food is 350 if we included outside range.
    // So we check that 350 is NOT present.
    const element350 = screen.queryByText(/350/);
    expect(element350).not.toBeInTheDocument();
  });
});
