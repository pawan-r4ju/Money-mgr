import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { formatCurrency } from './formatCurrency';
dayjs.extend(isBetween);

export const calculateForecast = (expenses, startDate, endDate, totalBudget) => {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const today = dayjs();
  
  // If we haven't started yet, forecast is just 0 or budget?
  if (today.isBefore(start)) return 0;

  const totalDays = end.diff(start, 'day') + 1;
  const daysPassed = Math.min(today.diff(start, 'day') + 1, totalDays);
  
  if (daysPassed <= 0) return 0;

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const dailyAverage = totalSpent / daysPassed;
  
  const projectedSpend = dailyAverage * totalDays;
  return projectedSpend;
};

export const calculateVelocity = (expenses, startDate, endDate) => {
  // Velocity = Average daily spend over the last 3 days vs Average daily spend overall
  const start = dayjs(startDate);
  const today = dayjs();
  const daysPassed = Math.max(1, today.diff(start, 'day') + 1);
  
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const overallDailyAvg = totalSpent / daysPassed;

  // Last 3 days
  const last3DaysStart = today.subtract(2, 'day');
  const recentExpenses = expenses.filter(exp => 
    dayjs(exp.date).isAfter(last3DaysStart.subtract(1, 'day'))
  );
  const recentSpent = recentExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const recentDailyAvg = recentSpent / 3;

  // Velocity factor (1.0 is normal, > 1.0 is accelerating)
  return overallDailyAvg > 0 ? recentDailyAvg / overallDailyAvg : 0;
};

export const calculateRiskScore = (expenses, totalBudget, startDate, endDate) => {
  const projected = calculateForecast(expenses, startDate, endDate, totalBudget);
  if (totalBudget === 0) return 100;
  
  const ratio = projected / totalBudget;
  
  // 0-100 score. 
  // < 85% projected = Low Risk (0-30)
  // 85-100% projected = Medium Risk (30-70)
  // > 100% projected = High Risk (70-100)
  
  if (ratio < 0.85) return Math.min(30, ratio * 35);
  if (ratio < 1.0) return 30 + ((ratio - 0.85) / 0.15) * 40;
  return Math.min(100, 70 + ((ratio - 1.0) * 100));
};

export const calculateRunRateIndex = (expenses, startDate, endDate, totalBudget) => {
  // How fast are we burning the budget relative to time passed?
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const today = dayjs();
  
  const totalDays = end.diff(start, 'day') + 1;
  const daysPassed = Math.max(1, today.diff(start, 'day') + 1);
  
  const timeProgress = daysPassed / totalDays;
  const spendProgress = totalBudget > 0 ? expenses.reduce((sum, e) => sum + e.amount, 0) / totalBudget : 0;

  if (timeProgress === 0) return 0;
  return spendProgress / timeProgress; // > 1.0 means burning too fast
};

export const calculateStreak = (allExpenses, dailyLimit) => {
    // Count consecutive days where daily spend < dailyLimit
    // This is tricky because "allExpenses" needs to be grouped by day
    if (!dailyLimit || dailyLimit <= 0) return 0;

    const expensesByDay = {};
    allExpenses.forEach(exp => {
        const dateStr = dayjs(exp.date).format('YYYY-MM-DD');
        expensesByDay[dateStr] = (expensesByDay[dateStr] || 0) + exp.amount;
    });

    let streak = 0;
    const today = dayjs();
    
    // Check backwards from yesterday (since today isn't over)
    for (let i = 1; i < 365; i++) {
        const checkDate = today.subtract(i, 'day').format('YYYY-MM-DD');
        const spent = expensesByDay[checkDate] || 0;
        if (spent <= dailyLimit) {
            streak++;
        } else {
            break;
        }
    }
    return streak;
};

export const generateSmartRecovery = (remainingBudget, daysRemaining) => {
    if (daysRemaining <= 0) return 0;
    return Math.max(0, remainingBudget / daysRemaining);
};

export const getBehaviorBreakdown = (expenses) => {
    const breakdown = {
        Necessity: 0,
        Impulse: 0,
        Emergency: 0,
        Uncategorized: 0
    };
    
    expenses.forEach(exp => {
        const tag = exp.tags && exp.tags[0] ? exp.tags[0] : 'Uncategorized';
        if (breakdown[tag] !== undefined) {
            breakdown[tag] += exp.amount;
        } else {
            breakdown.Uncategorized += exp.amount;
        }
    });
    
    return breakdown;
};

export const generateInsight = (expenses, monthlyBudget, categoryBudgets, startDate, endDate) => {
    const today = dayjs();
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    
    const daysTotal = end.diff(start, 'day') + 1;
    const daysPassed = Math.max(1, today.diff(start, 'day') + 1);
    const daysRemaining = Math.max(0, daysTotal - daysPassed);
    
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const progress = monthlyBudget > 0 ? totalSpent / monthlyBudget : 0;
    const timeProgress = daysPassed / daysTotal;
    
    // 1. Budget Pace Check
    if (monthlyBudget > 0 && progress > timeProgress + 0.15) {
        return {
            type: 'warning',
            message: `Pace Alert: You've spent ${(progress * 100).toFixed(0)}% of your budget in ${(timeProgress * 100).toFixed(0)}% of the time.`
        };
    }
    
    if (monthlyBudget > 0 && progress < timeProgress - 0.15) {
        return {
            type: 'positive',
            message: `Great job! You're under budget. Consider allocating surplus to savings.`
        };
    }

    // 2. Category Analysis
    const categorySpend = {};
    expenses.forEach(e => {
        categorySpend[e.category] = (categorySpend[e.category] || 0) + e.amount;
    });
    
    for (const [cat, budget] of Object.entries(categoryBudgets)) {
        if (budget > 0 && categorySpend[cat] > budget) {
            return {
                type: 'danger',
                message: `Alert: You've exceeded your ${cat} budget by ${formatCurrency(categorySpend[cat] - budget)}.`
            };
        }
        if (budget > 0 && categorySpend[cat] > budget * 0.9) {
            return {
                type: 'warning',
                message: `Warning: You are at 90% of your ${cat} budget.`
            };
        }
    }
    
    // 3. Behavior Analysis
    const behavior = getBehaviorBreakdown(expenses);
    const totalWithTags = Object.values(behavior).reduce((a, b) => a + b, 0);
    if (totalWithTags > 0) {
        const impulseShare = behavior.Impulse / totalWithTags;
        if (impulseShare > 0.25) {
             return {
                type: 'warning',
                message: `Mindful Spending: ${(impulseShare * 100).toFixed(0)}% of your spending is tagged as Impulse.`
            };
        }
    }
    
    // 4. Default Motivation
    const dailySafe = Math.max(0, (monthlyBudget - totalSpent) / Math.max(1, daysRemaining));
    return {
        type: 'info',
        message: `Stay on track! Your daily safe limit is ${formatCurrency(dailySafe)} for the next ${daysRemaining} days.`
    };
};
