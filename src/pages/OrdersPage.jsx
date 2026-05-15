import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import OrdersView from '../components/OrdersView';
import { AlertTriangle } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // --- Fetch and Synchronize Historical Records ---
  useEffect(() => {
    let isMounted = true; // Prevents state updates on unmounted components

    async function fetchAllOrders() {
      try {
        if (isMounted) setLoading(true);
        if (isMounted) setErrorMsg(null);
        
        // Fetch historical orders from the ledger
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        if (isMounted) {
          setOrders(data || []);
        }
      } catch (err) {
        console.error('Error compiling admin order log streams:', err.message);
        if (isMounted) setErrorMsg(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchAllOrders();

    // Listen for live updates safely wrapped in an arrow function
    const channel = supabase.channel('kitchen-history-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchAllOrders();
      })
      .subscribe();

    return () => {
      isMounted = false; // Clean up memory to prevent blank screen crashes
      supabase.removeChannel(channel);
    };
  }, []);

  // 1. Loading UI State
  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 w-full">
        <div className="w-9 h-9 border-4 border-gray-100 border-t-[#6C2BFF] rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Archives...</p>
      </div>
    );
  }

  // 2. Fatal Error UI State (Prevents the white blank screen of death)
  if (errorMsg) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 w-full text-center">
        <AlertTriangle className="text-red-500 mb-2" size={40} />
        <h3 className="text-xl font-black text-gray-900 tracking-tight">Failed to load history</h3>
        <p className="text-sm font-medium text-gray-500 max-w-sm">{errorMsg}</p>
      </div>
    );
  }

  // 3. Render the view component natively
  return <OrdersView orders={orders} />;
}