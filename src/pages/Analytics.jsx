import React, { useMemo } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine,
  BarChart, Bar
} from 'recharts';
import { formatCurrency } from '../utils/formatCurrency';
import dayjs from 'dayjs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

const Analytics = () => {
  const { expenses, filteredExpenses, categoryBudgets, monthlyBudget, startDate, endDate, categories } = useExpense();

  // 1. Prepare Pie Chart Data (Expenses by Category) - Use filteredExpenses for current period
  const categoryData = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => {
      const existing = acc.find(item => item.name === curr.category);
      if (existing) {
        existing.value += curr.amount;
      } else {
        acc.push({ name: curr.category, value: curr.amount });
      }
      return acc;
    }, []);
  }, [filteredExpenses]);

  // Calculate Category Spend Analysis (Progress Bars)
  const categorySpend = useMemo(() => {
    return categories.map(cat => {
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
  }, [categories, filteredExpenses, categoryBudgets]);

  // 2. Prepare Line Chart Data (Spending Trends & Velocity)
  const trendData = useMemo(() => {
    const sortedExpenses = [...filteredExpenses].sort((a, b) => new Date(a.date) - new Date(b.date));
    const trendDataMap = {};
    
    // Initialize all days in range if needed, or just days with spend. 
    // For velocity, it's better to show all days.
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const daysDiff = end.diff(start, 'day') + 1;

    for (let i = 0; i < daysDiff; i++) {
        const date = start.add(i, 'day').format('YYYY-MM-DD');
        trendDataMap[date] = 0;
    }

    sortedExpenses.forEach(exp => {
        const dateKey = dayjs(exp.date).format('YYYY-MM-DD');
        if (trendDataMap[dateKey] !== undefined) {
            trendDataMap[dateKey] += exp.amount;
        }
    });
    
    return Object.keys(trendDataMap).map(key => ({
        date: dayjs(key).format('MMM D'),
        fullDate: key,
        amount: trendDataMap[key]
    }));
  }, [filteredExpenses, startDate, endDate]);

  // 3. Prepare Category Drift Data (Actual vs Planned)
  const driftData = useMemo(() => {
    const allCategories = new Set([
      ...Object.keys(categoryBudgets),
      ...categoryData.map(c => c.name)
    ]);

    return Array.from(allCategories).map(cat => {
      const actual = categoryData.find(c => c.name === cat)?.value || 0;
      const planned = categoryBudgets[cat] || 0;
      return {
        name: cat,
        Actual: actual,
        Planned: planned,
        Drift: actual - planned
      };
    }).sort((a, b) => b.Actual - a.Actual);
  }, [categoryBudgets, categoryData]);

  // 4. Heatmap Data
  const heatmapData = useMemo(() => {
    const maxSpend = Math.max(...trendData.map(d => d.amount), 1);
    return trendData.map(day => ({
      ...day,
      intensity: day.amount / maxSpend
    }));
  }, [trendData]);

  const dailyLimit = monthlyBudget / (dayjs(endDate).diff(dayjs(startDate), 'day') + 1);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Financial Analytics</h2>
        <p className="text-muted-foreground">Deep dive into your spending patterns and predictive metrics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Spending Velocity */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Spending Velocity</CardTitle>
            <CardDescription>Daily spending vs Safe Daily Limit (₹{dailyLimit.toFixed(0)})</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))" 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => `₹${value}`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--popover-foreground))', borderRadius: 'var(--radius)' }}
                  />
                  <ReferenceLine y={dailyLimit} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label={{ value: 'Limit', fill: 'hsl(var(--destructive))', position: 'insideTopRight' }} />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Distribution</CardTitle>
            <CardDescription>Spending by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--popover-foreground))', borderRadius: 'var(--radius)' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Category Spending Analysis (Progress Bars) */}
        <Card>
          <CardHeader>
            <CardTitle>Category Spending Analysis</CardTitle>
            <CardDescription>
              Spending breakdown for {dayjs(startDate).format('MMM D')} - {dayjs(endDate).format('MMM D')}
            </CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
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
              {categorySpend.length === 0 && (
                 <div className="h-full flex items-center justify-center text-muted-foreground py-10">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Category Drift */}
        <Card>
          <CardHeader>
            <CardTitle>Category Drift</CardTitle>
            <CardDescription>Actual vs Planned Budget</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={driftData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={80} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--popover-foreground))', borderRadius: 'var(--radius)' }}
                  />
                  <Legend />
                  <Bar dataKey="Planned" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} barSize={10} />
                  <Bar dataKey="Actual" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Expense Heatmap */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Expense Heatmap</CardTitle>
            <CardDescription>Daily spending intensity for the current period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs text-muted-foreground font-medium py-2">
                  {day}
                </div>
              ))}
              {/* Padding for start of month */}
              {Array.from({ length: dayjs(startDate).day() }).map((_, i) => (
                <div key={`pad-${i}`} />
              ))}
              {heatmapData.map((day) => (
                <div 
                  key={day.fullDate}
                  className="aspect-square rounded-md flex items-center justify-center text-xs relative group cursor-pointer transition-colors"
                  style={{
                    backgroundColor: day.amount > 0 
                      ? `rgba(239, 68, 68, ${Math.max(day.intensity, 0.1)})` // Red base with opacity
                      : 'hsl(var(--secondary))',
                    color: day.intensity > 0.5 ? 'white' : 'inherit'
                  }}
                  title={`${day.fullDate}: ${formatCurrency(day.amount)}`}
                >
                  {dayjs(day.fullDate).date()}
                  {day.amount > 0 && (
                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 bg-popover text-popover-foreground text-xs p-2 rounded shadow-lg whitespace-nowrap border">
                      <p className="font-semibold">{day.fullDate}</p>
                      <p>{formatCurrency(day.amount)}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
