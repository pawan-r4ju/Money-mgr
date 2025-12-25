import React, { useState } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { formatCurrency } from '../utils/formatCurrency';
import { TrendingUp, TrendingDown, AlertTriangle, CreditCard, Plus, Activity, Zap, ShieldAlert, Target, Lightbulb, Settings, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Dashboard = () => {
  const { 
    monthlyBudget, 
    totalSpent, 
    remainingBudget, 
    filteredExpenses, 
    startDate, 
    endDate,
    forecast,
    velocity,
    riskScore,
    streak,
    smartDailyLimit,
    runRateIndex,
    daysRemaining,
    insight,
    expenses,
    categories,
    categoryBudgets,
    addCategory,
    deleteCategory,
    setCategoryBudgets
  } = useExpense();

  const [newCategory, setNewCategory] = useState('');
  const [newCategoryLimit, setNewCategoryLimit] = useState('');

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      addCategory(newCategory.trim());
      if (newCategoryLimit) {
        setCategoryBudgets(prev => ({
          ...prev,
          [newCategory.trim()]: parseFloat(newCategoryLimit)
        }));
      }
      setNewCategory('');
      setNewCategoryLimit('');
    }
  };

  const handleDeleteCategory = (cat) => {
    if (window.confirm(`Delete category "${cat}"?`)) {
      deleteCategory(cat);
    }
  };

  const handleUpdateBudget = (cat, value) => {
    setCategoryBudgets(prev => ({
      ...prev,
      [cat]: value ? parseFloat(value) : 0
    }));
  };

  const percentageSpent = monthlyBudget > 0 ? (totalSpent / monthlyBudget) * 100 : 0;
  const isOverBudget = totalSpent > monthlyBudget;
  const isNearLimit = percentageSpent >= 85 && percentageSpent < 100;

  // Get recent 5 expenses (use all expenses to ensure data shows up)
  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);
  
  // Calculate Category Spend Analysis
  const categorySpend = categories.map(cat => {
    const spent = filteredExpenses
      .filter(e => e.category === cat)
      .reduce((sum, e) => sum + e.amount, 0);
    
    const budget = categoryBudgets[cat] || 0;
    const percentage = budget > 0 ? (spent / budget) * 100 : 0;
    
    return {
      name: cat,
      spent,
      budget,
      percentage
    };
  }).sort((a, b) => b.spent - a.spent);

  const getRiskColor = (score) => {
    if (score < 30) return 'text-green-500';
    if (score < 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Overview for {dayjs(startDate).format('MMM D')} - {dayjs(endDate).format('MMM D, YYYY')}
          </p>
        </div>
        <Button asChild>
          <Link to="/add">
            <Plus className="mr-2 h-4 w-4" /> Add Expense
          </Link>
        </Button>
      </div>

      {/* Daily Insight Nudge */}
      {insight && (
        <Alert className={`border-l-4 ${
          insight.type === 'danger' ? 'border-l-red-500 bg-red-50 dark:bg-red-900/10' :
          insight.type === 'warning' ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10' :
          insight.type === 'positive' ? 'border-l-green-500 bg-green-50 dark:bg-green-900/10' :
          'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10'
        }`}>
          <Lightbulb className={`h-4 w-4 ${
             insight.type === 'danger' ? 'text-red-600' :
             insight.type === 'warning' ? 'text-yellow-600' :
             insight.type === 'positive' ? 'text-green-600' :
             'text-blue-600'
          }`} />
          <AlertTitle className="font-semibold">Daily Insight</AlertTitle>
          <AlertDescription className="mt-1">
            {insight.message}
          </AlertDescription>
        </Alert>
      )}

      {/* No Budget Warning */}
      {monthlyBudget === 0 && (
        <Alert variant="default" className="border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
          <AlertTriangle className="h-4 w-4 text-blue-500" />
          <AlertTitle>No Budget Set</AlertTitle>
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
            <span>Please configure your monthly budget to track your expenses effectively.</span>
            <Button variant="outline" size="sm" className="border-blue-200 hover:bg-blue-100 dark:border-blue-800 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300" asChild>
              <Link to="/setup">Setup Budget</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Advanced Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Forecast */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projected Spend</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(forecast)}</div>
            <p className="text-xs text-muted-foreground">
              {forecast > monthlyBudget ? (
                <span className="text-red-500">Exceeds budget by {formatCurrency(forecast - monthlyBudget)}</span>
              ) : (
                <span className="text-green-500">On track to save {formatCurrency(monthlyBudget - forecast)}</span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Risk Score */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
            <ShieldAlert className={`h-4 w-4 ${getRiskColor(riskScore)}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRiskColor(riskScore)}`}>{Math.round(riskScore)}/100</div>
            <p className="text-xs text-muted-foreground">
              Probability of budget overflow
            </p>
          </CardContent>
        </Card>

        {/* Velocity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spending Velocity</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{velocity.toFixed(2)}x</div>
            <p className="text-xs text-muted-foreground">
              vs. your average daily spend
            </p>
          </CardContent>
        </Card>

        {/* Streak */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Streak</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{streak} Days</div>
            <p className="text-xs text-muted-foreground">
              Consecutive days under limit
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Smart Recovery Alert */}
      {(isOverBudget || isNearLimit) && (
        <Alert variant={isOverBudget ? "destructive" : "default"} className={!isOverBudget ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20" : ""}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Smart Recovery Mode Active</AlertTitle>
          <AlertDescription className="mt-2">
             To get back on track, limit your daily spending to <strong>{formatCurrency(smartDailyLimit)}</strong> for the remaining {daysRemaining} days.
          </AlertDescription>
        </Alert>
      )}

      {/* Core Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthlyBudget)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
            <p className="text-xs text-muted-foreground">Run Rate Index: {runRateIndex.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${remainingBudget < 0 ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
              {formatCurrency(remainingBudget)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress 
            value={Math.min(percentageSpent, 100)} 
            className="h-4"
            indicatorClassName={
              isOverBudget ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-blue-500'
            }
          />
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>0%</span>
            <span>{percentageSpent.toFixed(1)}% Used</span>
            <span>100%</span>
          </div>
        </CardContent>
      </Card>

      {/* Category Spend Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Category Spending Analysis</CardTitle>
          <CardDescription>
            Spending breakdown for {dayjs(startDate).format('MMM D')} - {dayjs(endDate).format('MMM D')}
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="space-y-4">
            {categorySpend.map(cat => (
              <div key={cat.name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{cat.name}</span>
                  <span className="text-muted-foreground">
                    {formatCurrency(cat.spent)}
                    {cat.budget > 0 && ` / ${formatCurrency(cat.budget)}`}
                  </span>
                </div>
                <Progress 
                  value={Math.min(cat.percentage, 100)} 
                  className={`h-2 ${cat.percentage > 100 ? 'bg-destructive/20' : ''}`}
                  indicatorClassName={cat.percentage > 100 ? 'bg-destructive' : cat.percentage > 85 ? 'bg-yellow-500' : 'bg-primary'}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" /> Category Budgets
          </CardTitle>
          <CardDescription>Manage your expense categories and spending limits.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-secondary/50 rounded-md space-y-3">
            <Label className="text-sm font-medium">Add New Category</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input 
                placeholder="Category Name" 
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="h-9 flex-1"
              />
              <Input 
                type="number"
                min="0"
                placeholder="Limit (Optional)" 
                value={newCategoryLimit}
                onChange={(e) => setNewCategoryLimit(e.target.value)}
                className="h-9 w-full sm:w-32"
              />
              <Button 
                size="sm" 
                onClick={handleAddCategory}
                disabled={!newCategory.trim()}
              >
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => (
              <div key={cat} className="space-y-1 p-3 border rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor={`cat-${cat}`} className="font-medium">{cat}</Label>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteCategory(cat)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-xs text-muted-foreground w-12">Limit:</span>
                   <Input
                    id={`cat-${cat}`}
                    type="number"
                    min="0"
                    placeholder="No Limit"
                    value={categoryBudgets[cat] || ''}
                    onChange={(e) => handleUpdateBudget(cat, e.target.value)}
                    className="h-8"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/history">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentExpenses.length > 0 ? (
              recentExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground">
                      {expense.category.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{expense.category}</p>
                      <p className="text-sm text-muted-foreground">
                        {expense.description} • {dayjs(expense.date).format('MMM D')}
                        {expense.tags && expense.tags.length > 0 && (
                          <span className="ml-2 text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">
                            {expense.tags[0]}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <p className="font-bold">
                    -{formatCurrency(expense.amount)}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-4">
                No expenses recorded this period.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
