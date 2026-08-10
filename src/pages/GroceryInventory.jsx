import React, { useState, useEffect, useRef } from 'react';
import { Search, Printer, Edit2, Trash2, PackageMinus, PackagePlus, ScanBarcode, Image as ImageIcon } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { supabase } from '../lib/supabase';
import PrintableBarcode from '../components/PrintableBarcode';

export default function GroceryInventory({ onEdit, onDelete }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [inventory, setInventory] = useState([]);
  const [kitchenId, setKitchenId] = useState(null);
  const barcodePrintRef = useRef();

  useEffect(() => {
    const sessionStr = localStorage.getItem('valo_hotel_session') || localStorage.getItem('valo_kitchen');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      if (session && session.id) {
        setKitchenId(session.id);
        fetchGroceryItems(session.id);
      }
    }
  }, []);

  const fetchGroceryItems = async (kId) => {
    try {
      const { data, error } = await supabase
        .from('dishes')
        .select('*')
        .eq('kitchen_id', kId)
        .eq('app_mode', 'grocery')
        .order('name', { ascending: true });
      
      if (error) throw error;
      setInventory(data || []);
    } catch (err) {
      console.error("Error fetching real grocery inventory:", err.message);
    }
  };

  // ==========================================
  // 📸 HS-22 BARCODE SCANNER LISTENER
  // ==========================================
  useEffect(() => {
    let barcodeBuffer = '';
    let scanTimeout;

    const handleKeyDown = (e) => {
      // Ignore rapid scanning if user is typing in a specific input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (scanTimeout) clearTimeout(scanTimeout);

      if (e.key === 'Enter') {
        if (barcodeBuffer.length > 3) {
          processScannedBarcode(barcodeBuffer);
        }
        barcodeBuffer = '';
        return;
      }

      // Add character to buffer
      if (e.key !== 'Shift') {
        barcodeBuffer += e.key;
      }

      // If more than 50ms passes between keystrokes, it's a human typing. Clear it.
      scanTimeout = setTimeout(() => {
        barcodeBuffer = '';
      }, 50);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inventory]);

  const processScannedBarcode = (barcode) => {
    const foundItem = inventory.find(item => item.sku === barcode);
    if (foundItem) {
      // 🌟 AUTO-DEDUCT STOCK LOGIC WHEN SCANNED
      if ((foundItem.stock || 0) > 0) {
        updateStock(foundItem.id, foundItem.stock || 0, -1);
      } else {
        alert(`${foundItem.name} is already Out of Stock!`);
      }
    } else {
      alert(`Barcode ${barcode} not found in inventory!`);
    }
  };

  const updateStock = async (id, currentStock, changeAmount) => {
    const newStock = Math.max(0, currentStock + changeAmount);
    const isAvailable = newStock > 0; 

    // Optimistic UI update
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, stock: newStock, is_available: isAvailable };
      }
      return item;
    }));

    // Database Update
    try {
      const { error } = await supabase
        .from('dishes')
        .update({ 
          stock: newStock, 
          is_available: isAvailable 
        })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error("Failed to sync stock to database:", err.message);
      fetchGroceryItems(kitchenId); // Revert on failure
    }
  };

  const [itemToPrint, setItemToPrint] = useState(null);
  
  const handlePrintTrigger = useReactToPrint({
    contentRef: barcodePrintRef, 
  });

  const printBarcode = (item) => {
    if (!item.sku) {
      alert("This item needs a SKU/Barcode number added to it before you can print a sticker!");
      return;
    }
    setItemToPrint(item);
    setTimeout(() => {
      handlePrintTrigger();
    }, 100); 
  };

  const filteredInventory = inventory.filter(item => 
    (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (item.sku || '').includes(searchTerm)
  );

  return (
    <div className="animate-in fade-in duration-300">
      
      {/* Hidden Printer Container for Posiflow */}
      <div style={{ display: 'none' }}>
        <PrintableBarcode ref={barcodePrintRef} item={itemToPrint} />
      </div>

      <div className="flex items-center justify-between mb-8">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search grocery or scan barcode..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-200 h-12 rounded-full pl-11 pr-4 text-sm font-semibold focus:outline-none focus:border-[#6C2BFF] shadow-sm"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-xs font-bold border border-blue-100 shadow-sm cursor-default">
            <ScanBarcode size={16} />
            Scanner Active
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInventory.length === 0 ? (
          <div className="col-span-full py-16 text-center text-sm font-bold text-gray-400 bg-white rounded-[32px] border border-gray-100 shadow-sm">
            {searchTerm ? `No grocery items match "${searchTerm}".` : "No grocery items in your inventory yet."}
          </div>
        ) : (
          filteredInventory.map(item => (
            <div key={item.id} className={`bg-white rounded-[24px] border ${item.is_available ? 'border-gray-100' : 'border-red-200 opacity-75'} shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md`}>
              
              <div className="h-40 bg-gray-50 relative flex items-center justify-center">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover mix-blend-multiply opacity-80" />
                ) : (
                  <ImageIcon size={40} className="text-gray-300" />
                )}
                
                <div className="absolute top-4 left-4">
                  {item.is_available ? (
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-green-200 shadow-sm">
                      In Stock: {item.stock || 0}
                    </span>
                  ) : (
                    <span className="bg-red-100 text-red-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-red-200 shadow-sm">
                      Out of Stock
                    </span>
                  )}
                </div>
                
                <button 
                  onClick={() => printBarcode(item)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white text-gray-700 rounded-full flex items-center justify-center shadow-md hover:text-[#6C2BFF] transition-colors border border-gray-100"
                  title="Print Barcode Sticker"
                >
                  <Printer size={16} />
                </button>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-black text-gray-900 text-lg leading-tight mb-1">{item.name}</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">
                  SKU: {item.sku || 'NO BARCODE LINKED'}
                </p>
                
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-xl font-black text-[#6C2BFF]">₹{item.selling_price || 0}</span>
                  
                  <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                    <button 
                      onClick={() => updateStock(item.id, item.stock || 0, -1)}
                      className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-gray-600 shadow-sm hover:bg-red-50 hover:text-red-500 transition-colors border border-gray-100"
                    >
                      <PackageMinus size={16} />
                    </button>
                    <span className="font-black w-6 text-center text-gray-900">{item.stock || 0}</span>
                    <button 
                      onClick={() => updateStock(item.id, item.stock || 0, 1)}
                      className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-gray-600 shadow-sm hover:bg-green-50 hover:text-green-500 transition-colors border border-gray-100"
                    >
                      <PackagePlus size={16} />
                    </button>
                  </div>
                </div>

                {/* EDIT & DELETE ROW */}
                <div className="flex gap-2 mt-5 pt-5 border-t border-gray-100">
                  <button onClick={() => onEdit(item)} className="flex-1 py-2 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider transition-colors border border-gray-100 shadow-sm">
                    <Edit2 size={14} /> Edit
                  </button>
                  <button onClick={() => onDelete(item.id)} className="flex-1 py-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider transition-colors border border-red-100 shadow-sm">
                    <Trash2 size={14} /> Delete
                  </button>
                </div>

              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
