import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Utensils, Plus, Trash2, Edit2, X, Power, Image as ImageIcon, Search } from 'lucide-react';
import GroceryInventory from './GroceryInventory';

export default function DishesView() {
  const [dishes, setDishes] = useState([]);
  const [sections, setSections] = useState([]);
  const [categories, setCategories] = useState([]);
  const [kitchenId, setKitchenId] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [activeTab, setActiveTab] = useState('food');
  const [refreshKey, setRefreshKey] = useState(0); 
  
  // 🌟 NEW: Added sku and stock to the form state
  const [formData, setFormData] = useState({ 
    name: '', 
    cost_price: '',
    selling_price: '',
    description: '', 
    image_url: '', 
    is_veg: true, 
    is_available: true, 
    category_id: '',
    section_ids: [],
    app_mode: 'food',
    sku: '',
    stock: 0
  });

  useEffect(() => {
    const sessionStr = localStorage.getItem('valo_hotel_session') || localStorage.getItem('valo_kitchen');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      if (session && session.id) {
        setKitchenId(session.id);
        fetchData(session.id);
      }
    }
  }, []);

  const fetchData = async (kId = kitchenId) => {
    if (!kId) return;

    try {
      const [dishRes, secRes, catRes] = await Promise.all([
        supabase.from('dishes').select('*').eq('kitchen_id', kId).order('name', { ascending: true }),
        supabase.from('sections').select('*').eq('kitchen_id', kId).order('name', { ascending: true }), 
        supabase.from('categories').select('*').eq('kitchen_id', kId).order('name', { ascending: true })
      ]);
      
      setDishes(dishRes.data || []);
      setSections(secRes.data || []);
      setCategories(catRes.data || []);
      
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Failed to sync system database rows parameters:', err.message);
    }
  };

  const toggleAvailability = async (id, currentStatus) => {
    try {
      await supabase.from('dishes').update({ is_available: !currentStatus }).eq('id', id);
      setDishes(dishes.map(d => d.id === id ? { ...d, is_available: !currentStatus } : d));
    } catch (err) {
      console.error(err.message);
    }
  };

  const openModal = (dish = null) => {
    if (dish) {
      setEditingId(dish.id);
      setFormData({
        name: dish.name || '',
        cost_price: dish.cost_price || '',
        selling_price: dish.selling_price || '',
        description: dish.description || '',
        image_url: dish.image_url || '',
        is_veg: dish.is_veg ?? true,
        is_available: dish.is_available ?? true,
        category_id: dish.category_id || '',
        section_ids: Array.isArray(dish.section_ids) ? dish.section_ids : [],
        app_mode: dish.app_mode || 'food',
        sku: dish.sku || '',       // 🌟 Pre-fill Barcode
        stock: dish.stock || 0     // 🌟 Pre-fill Stock
      });
    } else {
      setEditingId(null);
      setFormData({ 
        name: '', cost_price: '', selling_price: '', description: '', image_url: '', 
        is_veg: true, is_available: true, category_id: '', section_ids: [],
        app_mode: activeTab,
        sku: '',
        stock: 0
      });
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = async (event) => {
    try {
      setIsUploadingImage(true);
      const file = event.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `item_${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${kitchenId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));

    } catch (error) {
      console.error('Error uploading image asset file structure:', error.message);
      alert('Failed to upload image. Please check storage permissions bucket settings.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSectionToggle = (id) => {
    setFormData(prev => {
      const currentIds = prev.section_ids || [];
      const isSelected = currentIds.includes(id);
      return {
        ...prev,
        section_ids: isSelected 
          ? currentIds.filter(item => item !== id)
          : [...currentIds, id]
      };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!kitchenId || !formData.name.trim()) return;

    try {
      setIsActionLoading(true);

      const sellingPriceNum = Number(formData.selling_price || 0);
      const costPriceNum = Number(formData.cost_price || 0);
      const calculatedHotelCommission = Number((sellingPriceNum * 0.10).toFixed(2));
      const stockNum = Number(formData.stock || 0);

      // 🌟 NEW: Added sku and stock to the database commit payload
      const payload = { 
        name: formData.name.trim(),
        cost_price: costPriceNum,
        selling_price: sellingPriceNum,
        hotel_commission: calculatedHotelCommission,
        description: formData.description.trim(),
        image_url: formData.image_url,
        is_veg: formData.is_veg,
        is_available: formData.is_available,
        category_id: formData.category_id || null,
        section_ids: formData.section_ids || [], 
        kitchen_id: kitchenId,
        app_mode: formData.app_mode,
        sku: formData.sku || null,
        stock: stockNum
      };

      if (editingId) {
        const { error } = await supabase.from('dishes').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('dishes').insert([payload]);
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(`Could not commit schema modifications: ${err.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you entirely sure you want to delete this dish record entry point?')) return;
    try {
      const { error } = await supabase.from('dishes').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      alert(`Delete operation terminated: ${err.message}`);
    }
  };

  const filteredDishes = dishes
    .filter(dish => 
      (dish.app_mode || 'food') === activeTab &&
      (dish.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  const availableCategories = categories.filter(c => (c.app_mode || 'food') === formData.app_mode);
  const availableSections = sections.filter(s => (s.app_mode || 'food') === formData.app_mode);

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-in fade-in duration-500 font-sans">
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Utensils className="text-[#6C2BFF]" size={24} /> Master Inventory
          </h2>
          <p className="text-gray-500 text-sm mt-1">Configure individual inventory stock across Food and Grocery ecosystems.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {activeTab === 'food' && (
            <div className="relative flex-1 md:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search inventory by title..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold text-gray-800 focus:ring-2 focus:ring-[#6C2BFF]/20 focus:border-[#6C2BFF]/30 outline-none transition-all shadow-sm"
              />
            </div>
          )}

          <button 
            onClick={() => openModal()} 
            className="bg-[#6C2BFF] hover:bg-black text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-[#6C2BFF]/10 flex items-center gap-2 active:scale-95 transition-all shrink-0"
          >
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm w-fit">
        <button 
          onClick={() => setActiveTab('food')}
          className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === 'food' 
              ? 'bg-[#F4F0FF] text-[#6C2BFF] shadow-sm' 
              : 'text-gray-400 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          🍔 Food Menu
        </button>
        <button 
          onClick={() => setActiveTab('grocery')}
          className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === 'grocery' 
              ? 'bg-emerald-50 text-emerald-600 shadow-sm' 
              : 'text-gray-400 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          🛒 Grocery Store
        </button>
      </div>

      {activeTab === 'food' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
          {filteredDishes.length === 0 ? (
            <div className="col-span-full py-16 text-center text-sm font-bold text-gray-400 bg-white rounded-[32px] border border-gray-100 shadow-sm">
              {searchQuery 
                ? `No inventory records match query pattern text lines "${searchQuery}".` 
                : `No items linked to the ${activeTab} database profile container yet.`}
            </div>
          ) : (
            filteredDishes.map((dish) => (
              <div key={dish.id} className={`bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden flex flex-col transition-all group ${!dish.is_available && 'opacity-60 grayscale-[0.4]'}`}>
                <div className="relative h-44 w-full bg-gray-50 border-b border-gray-50 shadow-inner">
                  {dish.image_url ? (
                    <img src={dish.image_url} alt={dish.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={32} /></div>
                  )}
                  <div className={`absolute top-4 left-4 w-4 h-4 rounded-full border-2 border-white shadow-md ${dish.is_veg ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
                
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start gap-3">
                      <h4 className="font-black text-gray-900 text-base leading-tight tracking-tight truncate flex-1">{dish.name}</h4>
                      <span className="font-black text-[#6C2BFF] text-base shrink-0">₹{dish.selling_price}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed font-medium">{dish.description || 'No descriptive structural layout added yet.'}</p>
                  </div>
                  
                  <div className="flex gap-2 pt-1">
                    <button 
                      type="button"
                      onClick={() => toggleAvailability(dish.id, dish.is_available)}
                      className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors border shadow-sm ${
                        dish.is_available 
                          ? 'bg-green-50 border-green-100 text-green-600 hover:bg-green-100' 
                          : 'bg-red-50 border-red-100 text-red-600 hover:bg-red-100'
                      }`}
                    >
                      <Power size={12} strokeWidth={3} /> {dish.is_available ? 'Active In Stock' : 'Out of Stock'}
                    </button>
                    <button onClick={() => openModal(dish)} className="p-2.5 bg-gray-50 text-gray-500 border border-gray-100 rounded-xl hover:bg-gray-100 active:scale-95 transition-transform shadow-sm"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(dish.id)} className="p-2.5 bg-red-50 text-red-500 border border-red-100 rounded-xl hover:bg-red-100 active:scale-95 transition-transform shadow-sm"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        // 🌟 NEW: Passed Edit and Delete handlers down to GroceryInventory
        <GroceryInventory 
          key={refreshKey} 
          onEdit={openModal} 
          onDelete={handleDelete} 
        />
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden max-h-[85vh] border border-gray-100 flex flex-col transform animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
              <h3 className="font-black text-sm text-gray-900 uppercase tracking-wider">{editingId ? 'Modify Product Metric' : 'Register New Item Asset'}</h3>
              <button onClick={() => { if(!isActionLoading) setIsModalOpen(false); }}><X size={18} className="text-gray-400 hover:text-gray-900 transition-colors" /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 no-scrollbar flex-1 bg-white">

              <div className="mb-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 ml-0.5">Product Thumbnail Photo</label>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                    {formData.image_url ? (
                      <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={20} className="text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 relative">
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage || isActionLoading}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-[#F4F0FF] file:text-[#6C2BFF] hover:file:bg-[#EBE4FF] transition-all cursor-pointer disabled:opacity-50" 
                    />
                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center rounded-xl border border-gray-100">
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-[#6C2BFF] rounded-full animate-spin"></div>
                        <span className="ml-2 text-[10px] font-black uppercase tracking-wider text-[#6C2BFF]">Uploading content...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-gray-50 pt-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5 ml-0.5">Item Title Name</label>
                  <input type="text" required disabled={isActionLoading} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5 text-xs font-bold text-gray-800 focus:border-[#6C2BFF]/40 outline-none transition-all disabled:bg-gray-100" />
                </div>

                {/* 🌟 NEW: Conditionally show Barcode & Stock inputs ONLY for grocery items */}
                {formData.app_mode === 'grocery' && (
                  <div className="col-span-2 grid grid-cols-2 gap-4 border-b border-gray-50 pb-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5 ml-0.5 text-blue-600">Barcode (SKU)</label>
                      <input type="text" disabled={isActionLoading} value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="Scan or type..." className="w-full bg-gray-50 border border-blue-100 rounded-xl px-4 py-3.5 text-xs font-bold text-gray-800 focus:border-blue-500/40 outline-none transition-all disabled:bg-gray-100" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5 ml-0.5 text-emerald-600">Initial Stock</label>
                      <input type="number" required disabled={isActionLoading} value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full bg-gray-50 border border-emerald-100 rounded-xl px-4 py-3.5 text-xs font-bold text-gray-800 focus:border-emerald-500/40 outline-none transition-all disabled:bg-gray-100" />
                    </div>
                  </div>
                )}

                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5 ml-0.5">Description Specifications</label>
                  <textarea 
                    value={formData.description} 
                    disabled={isActionLoading}
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    placeholder="Enter short description listing ingredients or details..."
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold text-gray-800 focus:border-[#6C2BFF]/40 outline-none transition-all h-16 resize-none placeholder:text-gray-400 placeholder:font-normal leading-relaxed disabled:bg-gray-100"
                  />
                </div>

                <div className="col-span-2 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5 ml-0.5 text-green-600">Cost Price (Kitchen)</label>
                    <input type="number" required disabled={isActionLoading} value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: e.target.value})} className="w-full bg-gray-50 border border-green-100 rounded-xl px-4 py-3.5 text-xs font-bold text-gray-800 focus:border-green-500/40 outline-none transition-all disabled:bg-gray-100" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5 ml-0.5 text-[#6C2BFF]">Selling Price (App)</label>
                    <input type="number" required disabled={isActionLoading} value={formData.selling_price} onChange={e => setFormData({...formData, selling_price: e.target.value})} className="w-full bg-gray-50 border border-[#6C2BFF]/20 rounded-xl px-4 py-3.5 text-xs font-bold text-gray-800 focus:border-[#6C2BFF]/60 outline-none transition-all disabled:bg-gray-100" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5 ml-0.5">Diet Type Classification</label>
                  <select disabled={isActionLoading} value={formData.is_veg} onChange={e => setFormData({...formData, is_veg: e.target.value === 'true'})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5 text-xs font-bold text-gray-800 focus:border-[#6C2BFF]/40 outline-none transition-all appearance-none disabled:bg-gray-100">
                    <option value="true">Vegetarian 🟢</option>
                    <option value="false">Non-Vegetarian 🔴</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5 ml-0.5">Assign Category Mapping</label>
                  <select disabled={isActionLoading} value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5 text-xs font-bold text-gray-800 focus:border-[#6C2BFF]/40 outline-none transition-all appearance-none disabled:bg-gray-100">
                    <option value="">Select Category...</option>
                    {availableCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 ml-0.5">
                    Assign Display Sections (Select Multiple)
                  </label>
                  {availableSections.length === 0 ? (
                    <p className="text-[10px] text-gray-400 font-bold bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
                      No structural display sections available for {formData.app_mode} mode.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto no-scrollbar border border-gray-100 p-2 rounded-xl bg-gray-50/50">
                      {availableSections.map(s => {
                        const isSelected = (formData.section_ids || []).includes(s.id);
                        return (
                          <button
                            type="button"
                            key={s.id}
                            disabled={isActionLoading}
                            onClick={() => handleSectionToggle(s.id)}
                            className={`px-3 py-2.5 rounded-xl text-left font-bold text-xs transition-all border flex items-center justify-between outline-none ${
                              isSelected 
                                ? 'bg-[#F4F0FF] border-[#6C2BFF]/30 text-[#6C2BFF] shadow-sm' 
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <span className="truncate pr-1">{s.name}</span>
                            {isSelected && <span className="w-1.5 h-1.5 bg-[#6C2BFF] rounded-full shrink-0 ml-1"></span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isUploadingImage || isActionLoading || !formData.name.trim()} 
                className="w-full bg-[#6C2BFF] hover:bg-black text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-[#6C2BFF]/10 mt-6 active:scale-[0.98] transition-all disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed"
              >
                {isActionLoading ? 'Saving Product...' : 'Commit Item Parameters'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
