import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Search, X, BarChart3, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useCart } from '@/contexts/CartContext';

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user, logout } = useAuth();
  const { getItemCount } = useCart();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-black border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-red-600 dark:text-[#e50914]">
              TicketFlix
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className="text-gray-700 dark:text-white hover:text-red-600 dark:hover:text-[#e50914] transition-colors font-medium"
            >
              Accueil
            </Link>
            <Link 
              to="/events" 
              className="text-gray-700 dark:text-white hover:text-red-600 dark:hover:text-[#e50914] transition-colors font-medium"
            >
              Événements
            </Link>
            <Link 
              to="/cart" 
              className="text-gray-700 dark:text-white hover:text-red-600 dark:hover:text-[#e50914] transition-colors font-medium relative"
            >
              <ShoppingCart className="w-5 h-5" />
              {getItemCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getItemCount()}
                </span>
              )}
            </Link>
            {user && (
              <>
                <Link 
                  to="/tickets" 
                  className="text-gray-700 dark:text-white hover:text-red-600 dark:hover:text-[#e50914] transition-colors font-medium"
                >
                  Mes Billets
                </Link>
                {user.role === 'admin' && (
                  <Link 
                    to="/dashboard" 
                    className="text-gray-700 dark:text-white hover:text-red-600 dark:hover:text-[#e50914] transition-colors font-medium flex items-center space-x-1"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Search Bar */}
          <div className="hidden md:flex items-center space-x-4 flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Rechercher des événements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-50 dark:bg-[#181818] border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-red-500 dark:focus:border-[#e50914] focus:ring-red-500 dark:focus:ring-[#e50914]"
                />
              </div>
            </form>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-[#181818] hover:text-red-600 dark:hover:text-[#e50914]"
            >
              {theme === 'light' ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </Button>

            {/* Mobile Search Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-[#181818] hover:text-red-600 dark:hover:text-[#e50914]"
            >
              {isSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </Button>

            {user ? (
              <div className="flex items-center space-x-4">
                <Link to="/account">
                  <Avatar className="h-8 w-8 border-2 border-gray-200 dark:border-gray-700">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-gray-100 dark:bg-[#181818] text-gray-700 dark:text-white">
                      {user.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="hidden sm:inline-flex border-gray-300 dark:border-gray-700 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-[#181818] hover:border-red-500 dark:hover:border-[#e50914]"
                >
                  Déconnexion
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost" className="text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-[#181818] hover:text-red-600 dark:hover:text-[#e50914]">
                    Connexion
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="bg-red-600 hover:bg-red-700 dark:bg-[#e50914] dark:hover:bg-[#b0060f] text-white font-semibold">
                    Inscription
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-[#181818] hover:text-red-600 dark:hover:text-[#e50914]">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] bg-white dark:bg-black border-l border-gray-200 dark:border-gray-800">
                <div className="flex flex-col space-y-4 mt-8">
                  <Link 
                    to="/" 
                    className="text-gray-700 dark:text-white hover:text-red-600 dark:hover:text-[#e50914] transition-colors font-medium py-2"
                  >
                    Accueil
                  </Link>
                  <Link 
                    to="/events" 
                    className="text-gray-700 dark:text-white hover:text-red-600 dark:hover:text-[#e50914] transition-colors font-medium py-2"
                  >
                    Événements
                  </Link>
                  <Link 
                    to="/cart" 
                    className="text-gray-700 dark:text-white hover:text-red-600 dark:hover:text-[#e50914] transition-colors font-medium py-2 flex items-center space-x-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Panier</span>
                    {getItemCount() > 0 && (
                      <span className="bg-red-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {getItemCount()}
                      </span>
                    )}
                  </Link>
                  {user && (
                    <>
                      <Link 
                        to="/tickets" 
                        className="text-gray-700 dark:text-white hover:text-red-600 dark:hover:text-[#e50914] transition-colors font-medium py-2"
                      >
                        Mes Billets
                      </Link>
                      {user.role === 'admin' && (
                        <Link 
                          to="/dashboard" 
                          className="text-gray-700 dark:text-white hover:text-red-600 dark:hover:text-[#e50914] transition-colors font-medium py-2 flex items-center space-x-2"
                        >
                          <BarChart3 className="w-4 h-4" />
                          <span>Dashboard</span>
                        </Link>
                      )}
                      <Link 
                        to="/account" 
                        className="text-gray-700 dark:text-white hover:text-red-600 dark:hover:text-[#e50914] transition-colors font-medium py-2"
                      >
                        Mon Compte
                      </Link>
                      <Button
                        onClick={handleLogout}
                        variant="outline"
                        className="w-full border-gray-300 dark:border-gray-700 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-[#181818] hover:border-red-500 dark:hover:border-[#e50914]"
                      >
                        Déconnexion
                      </Button>
                    </>
                  )}
                  {!user && (
                    <div className="flex flex-col space-y-2">
                      <Link to="/login">
                        <Button variant="ghost" className="w-full text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-[#181818] hover:text-red-600 dark:hover:text-[#e50914]">
                          Connexion
                        </Button>
                      </Link>
                      <Link to="/signup">
                        <Button className="w-full bg-red-600 hover:bg-red-700 dark:bg-[#e50914] dark:hover:bg-[#b0060f] text-white font-semibold">
                          Inscription
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Mobile Search */}
        {isSearchOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-800">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Rechercher des événements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-50 dark:bg-[#181818] border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-red-500 dark:focus:border-[#e50914] focus:ring-red-500 dark:focus:ring-[#e50914]"
                />
              </div>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}