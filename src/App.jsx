import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ExpenseProvider } from './context/ExpenseContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Setup from './pages/Setup';
import AddExpense from './pages/AddExpense';
import Analytics from './pages/Analytics';
import History from './pages/History';

function App() {
  return (
    <ExpenseProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="setup" element={<Setup />} />
            <Route path="add" element={<AddExpense />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="history" element={<History />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ExpenseProvider>
  );
}

export default App;
