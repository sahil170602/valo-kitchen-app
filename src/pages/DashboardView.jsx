import React, { useState, useRef } from 'react';
import { ShoppingBag, CheckCircle, Flame, Clock, XCircle, Check, Package, Bike, Phone, Printer, X } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import PrintableReceipt from '../components/PrintableReceipt';
import OrdersView from '../components/OrdersView';

// ==========================================
// 🖨️ INDIVIDUAL LIVE ORDER CARD
// ==========================================
const LiveOrderCard = ({ order, updateOrderStatus }) => {
  const [showPreview, setShowPreview] = useState(false);
  const receiptRef = useRef(null); // <-- 1. Add null here (best practice)
  const status = order.status?.toLowerCase() || 'pending';

  // 2. UPDATED FOR react-to-print v3+
  const handlePrint = useReactToPrint({
    contentRef: receiptRef, // <-- Changed from content: () => receiptRef.current
    pageStyle: "@page { size: 58mm auto; margin: 0mm; } body { margin: 0; }",
  });

  const handleConfirmAndPrint = () => {
    handlePrint();
    updateOrderStatus(order.id, 'confirmed');
    setShowPreview(false);
  };

  return (
    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden flex flex-col transition-all hover:border-[#6C2BFF]/30">
      
      {/* 🛑 HIDDEN RECEIPT NODE REQUIRED FOR react-to-print */}
      <div style={{ display: 'none' }}>
        <PrintableReceipt ref={receiptRef} order={order} />
      </div>

      {/* Ticket Header card mapping */}
      <div className={`p-5 border-b border-gray-100 flex justify-between items-start ${
        status === 'pending' ? 'bg-orange-50/40' : 
        ['confirmed', 'preparing', 'dispatched'].includes(status) ? 'bg-purple-50/30' : 'bg-blue-50/30'
      }`}>
        <div>
          <h3 className="text-2xl font-black text-gray-900">Room {order.room_number}</h3>
          <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mt-1">{order.customer_name}</p>
        </div>
        
        <div className="text-right flex flex-col items-end">
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
            status === 'pending' ? 'bg-orange-100 text-orange-600' : 
            ['confirmed', 'preparing'].includes(status) ? 'bg-purple-100 text-[#6C2BFF]' :
            status === 'dispatched' ? 'bg-blue-100 text-blue-600' :
            status === 'packed' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-600'
          }`}>
            {status}
          </span>
          <p className="text-xs text-gray-400 font-medium mt-2 flex items-center gap-1">
            <Clock size={12} />
            {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {/* Ticket Line Items array mapping loop list */}
      <div className="p-5 flex-1">
        <ul className="space-y-4">
          {order.items?.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-md bg-gray-50 border border-gray-100 text-gray-900 font-black text-xs flex items-center justify-center shrink-0">
                {item.quantity}x
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-gray-900 text-sm leading-tight truncate">{item.name}</p>
                {item.customization && (
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5 truncate">
                    {item.customization.pasta} {item.customization.extras?.length > 0 && `+ Extras`}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Dynamic Action Trigger Blocks Row */}
      <div className="p-5 bg-gray-50/50 border-t border-gray-100">
        
        {/* Rider Assigned Banner */}
        {order.rider_id && ['confirmed', 'preparing', 'dispatched'].includes(status) && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-100 px-3 py-2.5 rounded-xl mb-3">
            <div className="flex items-center gap-2">
              <Bike size={14} className="text-blue-600" />
              <span className="text-xs font-black text-blue-900">Rider: {order.rider_name}</span>
            </div>
            <a href={`tel:${order.rider_mobile}`} className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline">
              <Phone size={12} /> {order.rider_mobile}
            </a>
          </div>
        )}

        {/* PIPELINE PHASE 1: Pending Acceptance Verification Toggles */}
        {status === 'pending' && (
          <div className="flex gap-3">
            <button 
              onClick={() => updateOrderStatus(order.id, 'rejected')}
              className="flex-1 bg-red-50 border border-red-100 hover:bg-red-100 text-red-600 py-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-[0.97]"
            >
              <XCircle size={14} />
              Reject
            </button>
            <button 
              onClick={() => setShowPreview(true)}
              className="flex-1 bg-[#6C2BFF] hover:bg-[#5B21E6] text-white py-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-[0.97] shadow-md shadow-[#6C2BFF]/15"
            >
              <Check size={14} />
              Accept
            </button>
          </div>
        )}

        {/* PIPELINE PHASE 2: Confirmed, Preparing, OR Dispatched -> Kitchen can reprint bill or pack */}
        {['confirmed', 'preparing', 'dispatched'].includes(status) && (
          <div className="flex gap-3">
            <button 
              onClick={handlePrint}
              className="flex-[0.8] bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-3 rounded-xl text-xs font-black shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-[0.97]"
            >
              <Printer size={14} />
              Print Bill
            </button>
            <button 
              onClick={() => updateOrderStatus(order.id, 'packed')}
              className="flex-[1.2] bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl text-sm font-bold shadow-md shadow-amber-500/10 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Package size={16} />
              Mark as Packed
            </button>
          </div>
        )}

        {/* PIPELINE PHASE 3: Waiting for Rider */}
        {status === 'packed' && (
          <div className="text-center py-2.5 text-xs font-bold text-amber-600 flex items-center justify-center gap-1.5 bg-amber-50 rounded-xl border border-amber-100/50">
            <Clock size={14} className="animate-pulse" />
            <span>Food Packed • Waiting for Rider</span>
          </div>
        )}

        {status === 'out for delivery' && (
          <div className="text-center py-2.5 text-xs font-bold text-blue-600 flex items-center justify-center gap-1.5 bg-blue-50 rounded-xl border border-blue-100/50">
            <Bike size={14} className="animate-bounce" />
            <span>Out for Delivery</span>
          </div>
        )}

      </div>

      {/* ========================================================= */}
      {/* 👁️ PRINT PREVIEW MODAL OVERLAY (Triggers on initial Accept) */}
      {/* ========================================================= */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-sm w-full p-6 shadow-2xl flex flex-col items-center animate-in fade-in zoom-in duration-200">
            
            <div className="flex items-center justify-between w-full mb-4 pb-3 border-b border-gray-100">
              <h4 className="font-black text-gray-900 text-sm flex items-center gap-2">
                <Printer size={18} className="text-[#6C2BFF]" /> KOT Thermal Receipt Preview
              </h4>
              <button 
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-gray-100 p-4 rounded-2xl w-full flex justify-center max-h-[60vh] overflow-y-auto border border-gray-200 shadow-inner">
              <div className="bg-white shadow-md p-2 rounded border border-gray-200">
                <PrintableReceipt order={order} />
              </div>
            </div>

            <div className="flex gap-3 w-full mt-5">
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAndPrint}
                className="flex-1 py-2.5 bg-[#6C2BFF] hover:bg-[#5820db] text-white font-extrabold text-xs rounded-xl shadow-lg shadow-[#6C2BFF]/25 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Printer size={15} /> Confirm & Print
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};


// ==========================================
// 📂 MAIN DASHBOARD VIEW
// ==========================================
export default function DashboardView({ orders, updateOrderStatus, currentTab = 'live' }) {
  const today = new Date().toDateString();
  
  const liveOrders = orders.filter(o => {
    const status = o.status?.toLowerCase();
    return status !== 'delivered' && status !== 'rejected';
  });

  const completedToday = orders.filter(o => 
    o.status?.toLowerCase() === 'delivered' && 
    new Date(o.created_at).toDateString() === today
  );
  
  const totalOrdersAllTime = orders.length;

  const stats = [
    { label: 'Live Kitchen Board', value: liveOrders.length, icon: <Flame className="text-orange-500" />, bg: 'bg-orange-50' },
    { label: 'Completed Today', value: completedToday.length, icon: <CheckCircle className="text-green-500" />, bg: 'bg-green-50' },
    { label: 'Total Orders', value: totalOrdersAllTime, icon: <ShoppingBag className="text-[#6C2BFF]" />, bg: 'bg-[#F4F0FF]' },
  ];

  if (currentTab === 'history' || currentTab === 'orders') {
    return <OrdersView orders={orders} />;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10 px-4 pt-4">
      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-5">
            <div className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center shrink-0`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</p>
              <h4 className="text-3xl font-black text-gray-900 leading-none">{stat.value}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* Live Kitchen Tickets Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-black text-gray-900 text-xl flex items-center gap-2">
            <Flame size={24} className="text-orange-500" />
            Active Kitchen Tickets
          </h3>
        </div>

        {liveOrders.length === 0 ? (
          <div className="bg-white rounded-[32px] border border-gray-100 p-12 text-center shadow-sm">
            <CheckCircle size={48} className="mx-auto text-green-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Kitchen is clear!</h3>
            <p className="text-gray-400">No active culinary request tokens pending fulfillment logs.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {liveOrders.map(order => (
              <LiveOrderCard 
                key={order.id} 
                order={order} 
                updateOrderStatus={updateOrderStatus} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
