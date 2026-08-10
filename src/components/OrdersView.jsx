import React, { useState, useRef } from 'react';
import { Clock, Calendar, CheckCircle, XCircle, ShoppingBag, FileText, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import PrintableReceipt from './PrintableReceipt';

// ==========================================
// 🖨️ INDIVIDUAL ARCHIVED ORDER CARD
const OrderCard = ({ order, isDelivered, orderDate }) => {
  const receiptRef = useRef(null); // <-- 1. Add null here

  // 2. UPDATED FOR react-to-print v3+
  const handlePrint = useReactToPrint({
    contentRef: receiptRef, // <-- Changed from content: () => receiptRef.current
    pageStyle: "@page { size: 58mm auto; margin: 0mm; } body { margin: 0; }",
  });

  return (
    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between transition-all hover:border-gray-200/80">
      
      {/* 🛑 HIDDEN RECEIPT NODE REQUIRED FOR react-to-print */}
      <div style={{ display: 'none' }}>
        <PrintableReceipt ref={receiptRef} order={order} />
      </div>

      {/* Card Header segment */}
      <div className={`p-5 border-b border-gray-100 flex justify-between items-start ${
        isDelivered ? 'bg-green-50/10' : 'bg-red-50/10'
      }`}>
        <div>
          <h3 className="text-2xl font-black text-gray-900">Room {order.room_number}</h3>
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{order.customer_name}</p>
        </div>
        
        <div className="text-right flex flex-col items-end">
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border ${
            isDelivered 
              ? 'bg-green-50 text-green-600 border-green-100' 
              : 'bg-red-50 text-red-600 border-red-100'
          }`}>
            {isDelivered ? <CheckCircle size={10} /> : <XCircle size={10} />}
            {order.status}
          </span>
          
          <div className="text-[10px] text-gray-400 font-bold mt-2.5 flex items-center gap-2">
            <span className="flex items-center gap-0.5"><Calendar size={10} /> {orderDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
            <span className="flex items-center gap-0.5"><Clock size={10} /> {orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>

      {/* Card Main Body: Items Checklist Summary */}
      <div className="p-5 flex-1 bg-white">
        <ul className="space-y-3">
          {order.items?.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs font-bold text-gray-600">
              <li className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-gray-400 font-black shrink-0">{item.quantity}x</span>
                <span className="text-gray-700 truncate">{item.name}</span>
              </li>
              {item.itemTotal && <span className="text-gray-400 shrink-0 ml-2">₹{item.itemTotal}</span>}
            </div>
          ))}
        </ul>
      </div>

      {/* Card Footer segment: Financial Metrics & Print Action */}
      <div className="px-5 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Grand Total Collected</span>
          <span className="text-sm font-black text-gray-900">₹{order.grand_total}</span>
        </div>
        
        <button 
          onClick={handlePrint}
          className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm active:scale-95"
        >
          <Printer size={14} />
          Print Bill
        </button>
      </div>

    </div>
  );
};

// ==========================================
// 📂 MAIN ORDERS VIEW (ARCHIVE)
// ==========================================
export default function OrdersView({ orders }) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'delivered' | 'rejected'

  const pastOrders = orders.filter(order => {
    const status = order.status?.toLowerCase();
    return status === 'delivered' || status === 'rejected';
  });

  const deliveredOrders = pastOrders.filter(o => o.status?.toLowerCase() === 'delivered');
  const rejectedOrders = pastOrders.filter(o => o.status?.toLowerCase() === 'rejected');

  const getFilteredOrders = () => {
    switch (activeTab) {
      case 'delivered': return deliveredOrders;
      case 'rejected': return rejectedOrders;
      default: return pastOrders;
    }
  };

  const displayOrders = getFilteredOrders();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 px-4 pt-4 font-sans">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm">
        <div>
          <h3 className="font-black text-gray-900 text-xl flex items-center gap-2">
            <FileText size={22} className="text-[#6C2BFF]" />
            Order History Archives
          </h3>
          <p className="text-xs font-semibold text-gray-400 mt-0.5">Review and manage finalized delivery lifecycle resolutions.</p>
        </div>

        <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
              activeTab === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            All Past ({pastOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('delivered')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
              activeTab === 'delivered' ? 'bg-green-500 text-white shadow-sm' : 'text-gray-400 hover:text-green-600'
            }`}
          >
            Delivered ({deliveredOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
              activeTab === 'rejected' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-400 hover:text-red-600'
            }`}
          >
            Rejected ({rejectedOrders.length})
          </button>
        </div>
      </div>

      {displayOrders.length === 0 ? (
        <div className="bg-white rounded-[32px] border border-gray-100 p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag size={28} />
          </div>
          <h3 className="text-lg font-black text-gray-900 mb-1">No orders found</h3>
          <p className="text-xs font-medium text-gray-400 max-w-xs mx-auto">There are no archived files matching this status query filter marker.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {displayOrders.map(order => {
            const isDelivered = order.status?.toLowerCase() === 'delivered';
            const orderDate = new Date(order.created_at);

            return (
              <OrderCard 
                key={order.id} 
                order={order} 
                isDelivered={isDelivered} 
                orderDate={orderDate} 
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
