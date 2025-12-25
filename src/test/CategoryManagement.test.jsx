import { renderHook, act } from '@testing-library/react';
import { ExpenseProvider, useExpense } from '../context/ExpenseContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CATEGORIES as DEFAULT_CATEGORIES } from '../constants';

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

describe('Category Management', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it('initializes with default categories', () => {
    const { result } = renderHook(() => useExpense(), {
      wrapper: ExpenseProvider,
    });

    expect(result.current.categories).toEqual(DEFAULT_CATEGORIES);
  });

  it('adds a new category', () => {
    const { result } = renderHook(() => useExpense(), {
      wrapper: ExpenseProvider,
    });

    const newCategory = 'New Stuff';

    act(() => {
      result.current.addCategory(newCategory);
    });

    expect(result.current.categories).toContain(newCategory);
    expect(result.current.categories).toHaveLength(DEFAULT_CATEGORIES.length + 1);
    expect(window.localStorage.setItem).toHaveBeenCalledWith('categories', expect.stringContaining(newCategory));
  });

  it('does not add duplicate category', () => {
    const { result } = renderHook(() => useExpense(), {
      wrapper: ExpenseProvider,
    });

    const existingCategory = DEFAULT_CATEGORIES[0];

    act(() => {
      result.current.addCategory(existingCategory);
    });

    expect(result.current.categories).toHaveLength(DEFAULT_CATEGORIES.length);
  });

  it('deletes a category', () => {
    const { result } = renderHook(() => useExpense(), {
      wrapper: ExpenseProvider,
    });

    const categoryToDelete = DEFAULT_CATEGORIES[0];

    act(() => {
      result.current.deleteCategory(categoryToDelete);
    });

    expect(result.current.categories).not.toContain(categoryToDelete);
    expect(result.current.categories).toHaveLength(DEFAULT_CATEGORIES.length - 1);
  });

  it('deletes category from budgets when deleted', () => {
    const { result } = renderHook(() => useExpense(), {
      wrapper: ExpenseProvider,
    });

    const category = DEFAULT_CATEGORIES[0];

    act(() => {
      result.current.setCategoryBudgets({ [category]: 100 });
    });

    expect(result.current.categoryBudgets[category]).toBe(100);

    act(() => {
      result.current.deleteCategory(category);
    });

    expect(result.current.categoryBudgets[category]).toBeUndefined();
  });
});
