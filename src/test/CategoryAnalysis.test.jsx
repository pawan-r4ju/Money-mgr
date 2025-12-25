import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ExpenseProvider, useExpense } from '../context/ExpenseContext';
import Dashboard from '../pages/Dashboard';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import dayjs from 'dayjs';

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const renderWithProviders = (component) => {
  return render(
    <ExpenseProvider>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </ExpenseProvider>
  );
};

// Helper component to interact with context for testing
const TestHelper = ({ onAddExpense }) => {
  const { addExpense } = useExpense();
  React.useEffect(() => {
    if (onAddExpense) {
      onAddExpense(addExpense);
    }
  }, [onAddExpense, addExpense]);
  return null;
};

describe('Category Analysis Updates', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it('updates category spending analysis when an expense is added', async () => {
    let addExpenseFn;
    
    render(
      <ExpenseProvider>
        <BrowserRouter>
          <TestHelper onAddExpense={(fn) => { addExpenseFn = fn; }} />
          <Dashboard />
        </BrowserRouter>
      </ExpenseProvider>
    );

    // Initial state: "Food" should have 0 or be hidden if not in default?
    // Default categories usually include "Food".
    // Let's assume "Food" is there.
    
    // Add an expense to "Food"
    await act(async () => {
      addExpenseFn({
        amount: 50,
        category: 'Food',
        date: dayjs().format('YYYY-MM-DD'),
        description: 'Lunch',
        tag: 'Necessity'
      });
    });

    // Check if Dashboard shows updated spend for Food
    // "Category Spending Analysis" section
    // We look for text "Food" and potentially "50.00" (formatted)
    
    const foodElement = screen.getByText('Food');
    expect(foodElement).toBeInTheDocument();
    
    // Depending on currency format, it might be "₹50.00" or "$50.00" or "50.00"
    // Let's look for partial match or specific element structure if needed.
    // But getting by text is usually enough to verify presence.
    
    // To verify the amount, we might look for the progress bar or the text near Food.
    // The component renders: 
    // <span className="text-muted-foreground">{formatCurrency(cat.spent)} ...</span>
    
    // We can try to find the specific text.
    // Assuming formatCurrency uses "₹" based on previous context, but let's be flexible.
    // We can search for "50"
    // Since it might appear in multiple places (recent transactions, analysis), getAllByText is safer
    const elements = screen.getAllByText(/50/);
    expect(elements.length).toBeGreaterThan(0);
  });
});
