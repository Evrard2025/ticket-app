import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { OrderProvider } from '@/contexts/OrderContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Pages
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import SearchResultsPage from './pages/SearchResultsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CartPage from './pages/CartPage';
import PaymentPage from './pages/PaymentPage';
import PaymentConfirmationPage from './pages/PaymentConfirmationPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import AccountPage from './pages/AccountPage';
import TicketsPage from './pages/TicketsPage';
import NotFound from './pages/NotFound';

// Dashboard Pages
import DashboardPage from './pages/DashboardPage';
import DashboardEventsPage from './pages/DashboardEventsPage';
import DashboardOrdersPage from './pages/DashboardOrdersPage';
import DashboardUsersPage from './pages/DashboardUsersPage';
import DashboardAnalyticsPage from './pages/DashboardAnalyticsPage';
import DashboardNewEventPage from './pages/DashboardNewEventPage';
import DashboardNewUserPage from './pages/DashboardNewUserPage';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <OrderProvider>
            <TooltipProvider>
              <Toaster />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/events" element={<EventsPage />} />
                  <Route path="/event/:id" element={<EventDetailPage />} />
                  <Route path="/search" element={<SearchResultsPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/payment" element={<PaymentPage />} />
                  <Route path="/payment/confirmation" element={<PaymentConfirmationPage />} />
                  <Route path="/confirmation/:id" element={<OrderConfirmationPage />} />
                  <Route path="/account" element={<AccountPage />} />
                  <Route path="/tickets" element={<TicketsPage />} />
                  
                                  {/* Dashboard Routes */}
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/dashboard/events" element={<DashboardEventsPage />} />
                <Route path="/dashboard/events/new" element={<DashboardNewEventPage />} />
                <Route path="/dashboard/orders" element={<DashboardOrdersPage />} />
                <Route path="/dashboard/users" element={<DashboardUsersPage />} />
                <Route path="/dashboard/users/new" element={<DashboardNewUserPage />} />
                <Route path="/dashboard/analytics" element={<DashboardAnalyticsPage />} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </OrderProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;