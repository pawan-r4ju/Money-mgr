import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExpenseProvider } from '../context/ExpenseContext';
import Dashboard from '../pages/Dashboard';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock ResizeObserver for Recharts or other UI components if needed
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock window.confirm
window.confirm = vi.fn(() => true);

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

describe('Dashboard Page', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders category management inputs', () => {
    renderWithProviders(<Dashboard />);
    expect(screen.getByPlaceholderText(/Category Name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Limit \(Optional\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Add/i, { selector: 'button' })).toBeInTheDocument();
  });

  it('allows adding a new category', () => {
    renderWithProviders(<Dashboard />);
    
    const nameInput = screen.getByPlaceholderText(/Category Name/i);
    const limitInput = screen.getByPlaceholderText(/Limit \(Optional\)/i);
    const addButton = screen.getByText(/Add/i, { selector: 'button' });

    fireEvent.change(nameInput, { target: { value: 'New Test Category' } });
    fireEvent.change(limitInput, { target: { value: '500' } });
    
    fireEvent.click(addButton);

    // Check if it appears in the list (might appear multiple times due to analysis view)
    const elements = screen.getAllByText('New Test Category');
    expect(elements.length).toBeGreaterThan(0);
  });

  it('renders Category Spending Analysis section', () => {
    renderWithProviders(<Dashboard />);
    expect(screen.getByText('Category Spending Analysis')).toBeInTheDocument();
  });

  it('renders Recent Transactions section', () => {
    renderWithProviders(<Dashboard />);
    expect(screen.getByText('Recent Transactions')).toBeInTheDocument();
  });
});
