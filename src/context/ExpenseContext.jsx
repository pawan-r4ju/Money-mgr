import React, { createContext, useContext, useEffect, useState } from 'react';
import { getFromStorage, saveToStorage } from '../utils/storage';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { v4 as uuidv4 } from 'uuid';
import { CATEGORIES as DEFAULT_CATEGORIES } from '../constants';
import { 
  calculateForecast, 
  calculateVelocity, 
  calculateRiskScore, 
  calculateStreak,
  generateSmartRecovery,
  calculateRunRateIndex,
  generateInsight
} from '../utils/analyticsEngine';

dayjs.extend(isBetween);

const ExpenseContext = createContext();

export const useExpense = () => useContext(ExpenseContext);

export const ExpenseProvider = ({ children }) => {
  const [expenses, setExpenses] = useState(() => getFromStorage('expenses', []));
  const [monthlyBudget, setMonthlyBudget] = useState(() => getFromStorage('monthlyBudget', 0));
  const [categoryBudgets, setCategoryBudgets] = useState(() => getFromStorage('categoryBudgets', {}));
  const [categories, setCategories] = useState(() => getFromStorage('categories', DEFAULT_CATEGORIES));
  const [startDate, setStartDate] = useState(() => {
    const storedStart = getFromStorage('startDate', null);
    const storedEnd = getFromStorage('endDate', null);
    
    // If we have stored dates, check if the period has ended
    if (storedEnd && dayjs(storedEnd).isBefore(dayjs(), 'day')) {
       // Period ended, reset to current month
       return dayjs().startOf('month').toISOString();
    }
    return storedStart || dayjs().startOf('month').toISOString();
  });

  const [endDate, setEndDate] = useState(() => {
    const storedEnd = getFromStorage('endDate', null);
    
    // If we have stored dates, check if the period has ended
    if (storedEnd && dayjs(storedEnd).isBefore(dayjs(), 'day')) {
       // Period ended, reset to current month
       return dayjs().endOf('month').toISOString();
    }
    return storedEnd || dayjs().endOf('month').toISOString();
  });
  const [theme, setTheme] = useState(() => getFromStorage('theme', 'light'));
  const [strictMode, setStrictMode] = useState(() => getFromStorage('strictMode', false));

  // Schema Migration
  useEffect(() => {
    const currentVersion = getFromStorage('schemaVersion', 1);
    if (currentVersion < 2) {
      console.log('Migrating schema to version 2...');
      const migratedExpenses = expenses.map(exp => ({
        ...exp,
        tags: exp.tags || []
      }));
      setExpenses(migratedExpenses);
      saveToStorage('schemaVersion', 2);
    }
  }, []);

  // Theme effect
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveToStorage('theme', theme);
  }, [theme]);

  // Persist data
  useEffect(() => { saveToStorage('expenses', expenses); }, [expenses]);
  useEffect(() => { saveToStorage('monthlyBudget', monthlyBudget); }, [monthlyBudget]);
  useEffect(() => { saveToStorage('categoryBudgets', categoryBudgets); }, [categoryBudgets]);
  useEffect(() => { saveToStorage('categories', categories); }, [categories]);
  useEffect(() => { saveToStorage('startDate', startDate); }, [startDate]);
  useEffect(() => { saveToStorage('endDate', endDate); }, [endDate]);
  useEffect(() => { saveToStorage('strictMode', strictMode); }, [strictMode]);

  const addExpense = (expenseData) => {
    const newExpense = {
      id: uuidv4(),
      ...expenseData,
      amount: parseFloat(expenseData.amount),
      date: expenseData.date, // ISO string expected
      tags: expenseData.tags || []
    };
    setExpenses(prev => [newExpense, ...prev]);
  };

  const deleteExpense = (id) => {
    setExpenses(prev => prev.filter(exp => exp.id !== id));
  };

  const updateExpense = (id, updatedData) => {
    setExpenses(prev => prev.map(exp => 
      exp.id === id ? { ...exp, ...updatedData, amount: parseFloat(updatedData.amount) } : exp
    ));
  };

  const addCategory = (category) => {
    if (!categories.includes(category)) {
      setCategories(prev => [...prev, category]);
    }
  };

  const deleteCategory = (category) => {
    setCategories(prev => prev.filter(c => c !== category));
    // Also remove from categoryBudgets if exists
    setCategoryBudgets(prev => {
      const newBudgets = { ...prev };
      delete newBudgets[category];
      return newBudgets;
    });
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Advanced Filtering
  const filteredExpenses = expenses.filter(exp => {
    const expDate = dayjs(exp.date);
    return expDate.isBetween(startDate, endDate, 'day', '[]');
  });

  const totalSpent = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const remainingBudget = monthlyBudget - totalSpent;

  // Analytics Calculations
  const forecast = calculateForecast(filteredExpenses, startDate, endDate, monthlyBudget);
  const velocity = calculateVelocity(filteredExpenses, startDate, endDate);
  const riskScore = calculateRiskScore(filteredExpenses, monthlyBudget, startDate, endDate);
  const streak = calculateStreak(filteredExpenses, monthlyBudget / 30); // Approx daily limit
  const runRateIndex = calculateRunRateIndex(filteredExpenses, startDate, endDate, monthlyBudget);
  const insight = generateInsight(filteredExpenses, monthlyBudget, categoryBudgets, startDate, endDate);
  
  const today = dayjs();
  const end = dayjs(endDate);
  const daysRemaining = Math.max(0, end.diff(today, 'day') + 1);
  const smartDailyLimit = generateSmartRecovery(remainingBudget, daysRemaining);

  return (
    <ExpenseContext.Provider value={{
      expenses,
      addExpense,
      deleteExpense,
      updateExpense,
      monthlyBudget,
      setMonthlyBudget,
      categoryBudgets,
      setCategoryBudgets,
      categories,
      addCategory,
      deleteCategory,
      totalSpent,
      remainingBudget,
      filteredExpenses,
      startDate, 
      setStartDate,
      endDate, 
      setEndDate,
      theme,
      toggleTheme,
      strictMode,
      setStrictMode,
      // Analytics
      forecast,
      velocity,
      riskScore,
      streak,
      runRateIndex,
      smartDailyLimit,
      daysRemaining,
      insight
    }}>
      {children}
    </ExpenseContext.Provider>
  );
};
