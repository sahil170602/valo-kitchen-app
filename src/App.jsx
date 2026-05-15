import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';

// Pages & Components
import SplashScreen from './pages/SplashScreen';
import LoginScreen from './pages/LoginScreen';
import AdminLayout from './components/layout/AdminLayout'; 
import DashboardView from './pages/DashboardView';         
import SectionsView from './pages/SectionsView';
import CategoriesView from './pages/CategoriesView';
import DishesView from './pages/DishesView';
import ProfileView from './pages/ProfileView';
import OrdersPage from './pages/OrdersPage';               

// ------------------------------------------------------------------
// 1. MAIN CONSOLE: Your exact interior dashboard logic
// ------------------------------------------------------------------
function MainConsole() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
    
    // Listen to ALL events (*), not just INSERT. 
    // This ensures that when a Rider updates a status, the kitchen dashboard reflects it instantly.
    const channel = supabase
      .channel('kitchen-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, 
        payload => {
          if (payload.eventType === 'INSERT') {
            setOrders(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev => prev.map(order => order.id === payload.new.id ? payload.new : order));
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(order => order.id !== payload.old.id));
          }
        }
      )
      .subscribe();
      
    return () => supabase.removeChannel(channel);
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    setOrders(data || []);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    // Optimistic UI update for instant feedback
    setOrders(orders.map(order => order.id === orderId ? { ...order, status: newStatus } : order));
    // Database update
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
  };

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <DashboardView orders={orders} updateOrderStatus={updateOrderStatus} />}
      {activeTab === 'orders' && <OrdersPage />}
      {activeTab === 'sections' && <SectionsView />}
      {activeTab === 'categories' && <CategoriesView />}
      {activeTab === 'dishes' && <DishesView />}
      {activeTab === 'profile' && <ProfileView />}
    </AdminLayout>
  );
}

// ------------------------------------------------------------------
// 2. MASTER APP ROUTER: Handles Splash, Login, and Auth Guards
// ------------------------------------------------------------------
export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  
  // Direct state initialization prevents flashing/redirect loops
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('valo_kitchen');
  });

  // Splash Screen Timer
  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(splashTimer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Entry Gate: Redirect to Dashboard if already logged in */}
        <Route 
          path="/" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginScreen />} 
        />

        {/* Protected Dashboard Route */}
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <MainConsole /> : <Navigate to="/" replace />} 
        />

        {/* Wildcard Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}