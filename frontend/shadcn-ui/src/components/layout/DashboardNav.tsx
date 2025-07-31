import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Calendar, 
  ShoppingCart, 
  Users, 
  TrendingUp,
  Home,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const DashboardNav = () => {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    {
      path: '/dashboard',
      label: 'Vue d\'ensemble',
      icon: Home
    },
    {
      path: '/dashboard/events',
      label: 'Événements',
      icon: Calendar
    },
    {
      path: '/dashboard/orders',
      label: 'Commandes',
      icon: ShoppingCart
    },
    {
      path: '/dashboard/users',
      label: 'Utilisateurs',
      icon: Users
    },
    {
      path: '/dashboard/analytics',
      label: 'Analytics',
      icon: TrendingUp
    }
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Navigation */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Retour au site</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant={isActive(item.path) ? "default" : "ghost"}
                      size="sm"
                      className={`flex items-center space-x-2 ${
                        isActive(item.path)
                          ? "bg-red-600 hover:bg-red-700 dark:bg-[#e50914] dark:hover:bg-[#b0060f] text-white"
                          : "text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-[#181818] hover:text-red-600 dark:hover:text-[#e50914]"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right side - User info */}
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-900 dark:text-white">{user?.name}</span>
              <span className="mx-2">•</span>
              <span>Administrateur</span>
            </div>
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-wrap gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive(item.path) ? "default" : "outline"}
                    size="sm"
                    className={`flex items-center space-x-2 ${
                      isActive(item.path)
                        ? "bg-red-600 hover:bg-red-700 dark:bg-[#e50914] dark:hover:bg-[#b0060f] text-white"
                        : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-[#181818]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardNav; 