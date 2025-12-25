import { renderHook, act } from '@testing-library/react';
import { ExpenseProvider, useExpense } from '../context/ExpenseContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';

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

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('ExpenseContext', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it('provides default values', () => {
    const { result } = renderHook(() => useExpense(), {
      wrapper: ExpenseProvider,
    });

    expect(result.current.expenses).toEqual([]);
    expect(result.current.monthlyBudget).toBe(0);
    expect(result.current.theme).toBe('light');
  });

  it('updates monthly budget', () => {
    const { result } = renderHook(() => useExpense(), {
      wrapper: ExpenseProvider,
    });

    act(() => {
      result.current.setMonthlyBudget(5000);
    });

    expect(result.current.monthlyBudget).toBe(5000);
    expect(window.localStorage.setItem).toHaveBeenCalledWith('monthlyBudget', '5000');
  });

  it('adds an expense', () => {
    const { result } = renderHook(() => useExpense(), {
      wrapper: ExpenseProvider,
    });

    const expenseData = {
      amount: 100,
      category: 'Food',
      date: new Date().toISOString(),
      description: 'Lunch',
    };

    act(() => {
      result.current.addExpense(expenseData);
    });

    expect(result.current.expenses).toHaveLength(1);
    expect(result.current.expenses[0]).toMatchObject({
      amount: 100,
      category: 'Food',
      description: 'Lunch',
    });
  });

  it('calculates remaining budget correctly', () => {
    const { result } = renderHook(() => useExpense(), {
      wrapper: ExpenseProvider,
    });

    act(() => {
      result.current.setMonthlyBudget(1000);
    });

    const expenseData = {
      amount: 200,
      category: 'Food',
      date: new Date().toISOString(),
      description: 'Lunch',
    };

    act(() => {
      result.current.addExpense(expenseData);
    });

    // Need to re-render or wait for state update in real app, but renderHook handles it.
    // However, currentMonthExpenses calculation depends on the date matching current start date.
    // Since we use new Date().toISOString(), it should match default startDate (today).
    
    expect(result.current.totalSpent).toBe(200);
    expect(result.current.remainingBudget).toBe(800);
  });
});
