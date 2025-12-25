import React, { useState, useEffect, useRef } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { formatCurrency } from '../utils/formatCurrency';
import { Save, Wallet, Calendar, Lock, Database, Upload, Trash, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const Setup = () => {
  const { 
    monthlyBudget, setMonthlyBudget, 
    startDate, setStartDate, 
    endDate, setEndDate,
    strictMode, setStrictMode
  } = useExpense();

  const [budgetInput, setBudgetInput] = useState(monthlyBudget);
  const [startDateInput, setStartDateInput] = useState(dayjs(startDate).format('YYYY-MM-DD'));
  const [endDateInput, setEndDateInput] = useState(dayjs(endDate).format('YYYY-MM-DD'));
  const [strictModeInput, setStrictModeInput] = useState(strictMode);
  const fileInputRef = useRef(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    setBudgetInput(monthlyBudget);
    setStartDateInput(dayjs(startDate).format('YYYY-MM-DD'));
    setEndDateInput(dayjs(endDate).format('YYYY-MM-DD'));
    setStrictModeInput(strictMode);
  }, [monthlyBudget, startDate, endDate, strictMode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setMonthlyBudget(parseFloat(budgetInput));
    setStartDate(dayjs(startDateInput).toISOString());
    setEndDate(dayjs(endDateInput).toISOString());
    setStrictMode(strictModeInput);
    navigate('/');
  };

  const handleExportBackup = () => {
    const data = {
        monthlyBudget,
        startDate,
        endDate,
        categoryBudgets,
        strictMode,
        expenses: JSON.parse(localStorage.getItem('expenses') || '[]'),
        theme: localStorage.getItem('theme'),
        schemaVersion: localStorage.getItem('schemaVersion')
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `budget_backup_${dayjs().format('YYYY-MM-DD')}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportBackup = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.expenses && Array.isArray(data.expenses)) {
                localStorage.setItem('expenses', JSON.stringify(data.expenses));
                if (data.monthlyBudget) localStorage.setItem('monthlyBudget', data.monthlyBudget);
                if (data.startDate) localStorage.setItem('startDate', data.startDate);
                if (data.endDate) localStorage.setItem('endDate', data.endDate);
                if (data.categoryBudgets) localStorage.setItem('categoryBudgets', JSON.stringify(data.categoryBudgets));
                if (data.strictMode !== undefined) localStorage.setItem('strictMode', JSON.stringify(data.strictMode));
                if (data.theme) localStorage.setItem('theme', data.theme);
                if (data.schemaVersion) localStorage.setItem('schemaVersion', data.schemaVersion);
                
                alert('Backup restored successfully! The page will reload.');
                window.location.reload();
            } else {
                alert('Invalid backup file format.');
            }
        } catch (error) {
            console.error(error);
            alert('Error parsing backup file.');
        }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to delete ALL data? This cannot be undone.')) {
        localStorage.clear();
        window.location.reload();
    }
  };

  const dailyLimit = budgetInput ? budgetInput / 30 : 0;
  const weeklyLimit = budgetInput ? budgetInput / 4 : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Budget Configuration</CardTitle>
          <CardDescription>Set your budget limit and date range to track your expenses.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="budget">Total Monthly Budget (₹)</Label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="number"
                  id="budget"
                  min="0"
                  step="100"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  className="pl-10"
                  placeholder="Enter your budget amount"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="date"
                    id="startDate"
                    value={startDateInput}
                    onChange={(e) => setStartDateInput(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="date"
                    id="endDate"
                    value={endDateInput}
                    onChange={(e) => setEndDateInput(e.target.value)}
                    className="pl-10"
                    min={startDateInput}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
              <Checkbox
                id="strictMode"
                checked={strictModeInput}
                onCheckedChange={setStrictModeInput}
              />
              <div className="space-y-1 leading-none">
                <Label htmlFor="strictMode" className="flex items-center gap-2 font-medium cursor-pointer">
                  <Lock className="h-3 w-3" /> Strict Budget Mode
                </Label>
                <p className="text-sm text-muted-foreground">
                  Prevent adding expenses if you have exceeded your monthly budget.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-primary mb-1 font-medium">Daily Limit (Approx)</p>
                <p className="text-xl font-bold text-primary">
                  {formatCurrency(dailyLimit)}
                </p>
              </div>
              <div className="p-4 bg-secondary rounded-lg border border-secondary-foreground/10">
                <p className="text-sm text-secondary-foreground mb-1 font-medium">Weekly Limit (Approx)</p>
                <p className="text-xl font-bold text-secondary-foreground">
                  {formatCurrency(weeklyLimit)}
                </p>
              </div>
            </div>

            <Button type="submit" className="w-full">
              <Save className="mr-2 h-4 w-4" /> Save Configuration
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
             <Database className="h-5 w-5" /> Data Management
          </CardTitle>
          <CardDescription>
            Manage your local data. You can backup your data or restore from a previous backup.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" onClick={handleExportBackup} className="flex-1">
                    <Download className="mr-2 h-4 w-4" /> Backup Data
                </Button>
                <Button variant="outline" onClick={() => fileInputRef.current.click()} className="flex-1">
                    <Upload className="mr-2 h-4 w-4" /> Restore Backup
                </Button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImportBackup} 
                    className="hidden" 
                    accept=".json"
                />
            </div>
            
            <div className="pt-4 border-t border-destructive/20">
                <Button variant="destructive" onClick={handleClearData} className="w-full">
                    <Trash className="mr-2 h-4 w-4" /> Reset All Data
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                    Warning: This will permanently delete all your expenses and settings.
                </p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Setup;
