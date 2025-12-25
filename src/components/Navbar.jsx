import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, PieChart, History, Settings, Sun, Moon, Tag } from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';

const Navbar = () => {
  const { theme, toggleTheme } = useExpense();

  const navItems = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/add', icon: <PlusCircle size={20} />, label: 'Add' },
    { to: '/analytics', icon: <PieChart size={20} />, label: 'Analytics' },
    { to: '/history', icon: <History size={20} />, label: 'History' },
    { to: '/setup', icon: <Settings size={20} />, label: 'Setup' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-card border-t border-border md:static md:w-64 md:h-screen md:border-t-0 md:border-r md:flex md:flex-col p-4 z-50">
      <div className="hidden md:flex items-center gap-2 mb-8 px-4">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xl">
          E
        </div>
        <h1 className="text-xl font-bold text-foreground">ExpenseMgr</h1>
      </div>

      <div className="flex md:flex-col justify-around md:justify-start gap-1 md:gap-2 w-full">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col md:flex-row items-center md:gap-3 p-2 md:px-4 md:py-3 rounded-lg transition-colors ${
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`
            }
          >
            {item.icon}
            <span className="text-xs md:text-sm font-medium mt-1 md:mt-0">{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="hidden md:flex mt-auto px-4">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full p-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          <span className="text-sm font-medium">
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </span>
        </button>
      </div>
      
      {/* Mobile Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="md:hidden absolute top-[-60px] right-4 bg-card p-3 rounded-full shadow-lg border border-border text-muted-foreground"
      >
        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </button>
    </nav>
  );
};

export default Navbar;
