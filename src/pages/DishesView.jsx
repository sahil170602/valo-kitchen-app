import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Utensils, Plus, Trash2, Edit2, X, Power, Image as ImageIcon, Search } from 'lucide-react';

export default function DishesView() {
  const [dishes, setDishes] = useState([]);
  const [sections, setSections] = useState([]);
  const [categories, setCategories] = useState([]);
  const [kitchenId, setKitchenId] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({ 
    name: '', 
    price: '', 
    description: '', 
    image_url: '', 
    is_veg: true, 
    is_available: true, 
    section_id: '', 
    category_id: '' 
  });

  // 1. Initialize session and fetch isolated kitchen data
  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('valo_kitchen'));
    if (session && session.id) {
      setKitchenId(session.id);
      fetchData(session.id);
    }
  }, []);

  // 2. Fetch ONLY dishes and categories assigned to this specific kitchen
  const fetchData = async (kId = kitchenId) => {
    if (!kId) return;

    const [dishRes, secRes, catRes] = await Promise.all([
      supabase.from('dishes').select('*').eq('kitchen_id', kId).order('created_at', { ascending: false }),
      supabase.from('sections').select('*'), // Global or kitchen-specific sections
      supabase.from('categories').select('*').eq('kitchen_id', kId)
    ]);
    
    setDishes(dishRes.data || []);
    setSections(secRes.data || []);
    setCategories(catRes.data || []);
  };

  const toggleAvailability = async (id, currentStatus) => {
    await supabase.from('dishes').update({ is_available: !currentStatus }).eq('id', id);
    setDishes(dishes.map(d => d.id === id ? { ...d, is_available: !currentStatus } : d));
  };

  const openModal = (dish = null) => {
    if (dish) {
      setEditingId(dish.id);
      setFormData(dish);
    } else {
      setEditingId(null);
      setFormData({ name: '', price: '', description: '', image_url: '', is_veg: true, is_available: true, section_id: '', category_id: '' });
    }
    setIsModalOpen(true);
  };

  // 3. Local File Upload Handler for Supabase Storage
  const handleImageUpload = async (event) => {
    try {
      setIsUploadingImage(true);
      const file = event.target.files[0];
      if (!file) return;

      // Create a unique file name organized by kitchen ID
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${kitchenId}/${fileName}`;

      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      // Get the live public URL
      const { data: { publicUrl } } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath);

      // Save to form state instantly
      setFormData({ ...formData, image_url: publicUrl });

    } catch (error) {
      console.error('Error uploading image:', error.message);
      alert('Failed to upload image. Please check storage permissions.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // 4. Save dish and securely attach the kitchen ID payload
  const handleSave = async (e) => {
    e.preventDefault();
    if (!kitchenId) return;

    const payload = { 
      ...formData, 
      kitchen_id: kitchenId 
    };

    if (editingId) {
      await supabase.from('dishes').update(payload).eq('id', editingId);
    } else {
      await supabase.from('dishes').insert([payload]);
    }
    
    setIsModalOpen(false);
    fetchData();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this dish entirely?')) {
      await supabase.from('dishes').delete().eq('id', id);
      fetchData();
    }
  };

  // Filter dishes based on search query
  const filteredDishes = dishes.filter(dish => 
    dish.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto pb-10">
      
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2"><Utensils className="text-[#6C2BFF]" /> Master Menu</h2>
          <p className="text-gray-500 text-sm mt-1">Manage all dishes, prices, and stock availability.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Real-time Search Input */}
          <div className="relative flex-1 md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search dishes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-[#6C2BFF]/30 focus:border-[#6C2BFF]/30 outline-none transition-all shadow-sm"
            />
          </div>

          <button onClick={() => openModal()} className="bg-[#6C2BFF] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-[#6C2BFF]/20 flex items-center gap-2 active:scale-95 transition-all shrink-0">
            <Plus size={18} /> Add
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDishes.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400 font-bold bg-white rounded-[24px] border border-gray-100">
            {searchQuery 
              ? `No dishes found matching "${searchQuery}".` 
              : 'No dishes found for this kitchen. Add a dish to get started!'}
          </div>
        )}
        
        {filteredDishes.map((dish) => (
          <div key={dish.id} className={`bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden flex flex-col transition-all ${!dish.is_available && 'opacity-60 grayscale-[0.5]'}`}>
            <div className="relative h-40 w-full bg-gray-100">
              {dish.image_url ? (
                <img src={dish.image_url} alt={dish.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={32} /></div>
              )}
              <div className={`absolute top-3 left-3 w-4 h-4 rounded-full border-2 border-white ${dish.is_veg ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>
            
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-gray-900 text-lg leading-tight">{dish.name}</h4>
                <span className="font-black text-[#6C2BFF]">₹{dish.price}</span>
              </div>
              <p className="text-[11px] text-gray-400 line-clamp-2 mb-4">{dish.description || 'No description provided.'}</p>
              
              <div className="mt-auto flex gap-2">
                <button 
                  onClick={() => toggleAvailability(dish.id, dish.is_available)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${dish.is_available ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                >
                  <Power size={14} /> {dish.is_available ? 'In Stock' : 'Out of Stock'}
                </button>
                <button onClick={() => openModal(dish)} className="p-2.5 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 active:scale-95 transition-transform"><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(dish.id)} className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 active:scale-95 transition-transform"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#150734]/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h3 className="font-black text-gray-900">{editingId ? 'Edit Dish' : 'New Dish'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-gray-400 hover:text-gray-600 transition-colors" /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4">
              
              {/* IMAGE UPLOADER SECTION */}
              <div className="col-span-2 mb-2">
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-2">
                  Upload Image
                </label>
                <div className="flex items-center gap-4">
                  {formData.image_url && (
                    <img 
                      src={formData.image_url} 
                      alt="Preview" 
                      className="w-14 h-14 rounded-xl object-cover border border-gray-200 shrink-0"
                    />
                  )}
                  <div className="flex-1 relative">
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#F4F0FF] file:text-[#6C2BFF] hover:file:bg-[#EBE4FF] transition-all cursor-pointer" 
                    />
                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-xl border border-gray-200">
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-[#6C2BFF] rounded-full animate-spin"></div>
                        <span className="ml-2 text-xs font-bold text-[#6C2BFF]">Uploading...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-2">Dish Name</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-[#6C2BFF]/50 outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-2">Price (₹)</label>
                  <input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-[#6C2BFF]/50 outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-2">Type</label>
                  <select value={formData.is_veg} onChange={e => setFormData({...formData, is_veg: e.target.value === 'true'})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-[#6C2BFF]/50 outline-none transition-colors">
                    <option value="true">Vegetarian 🟢</option>
                    <option value="false">Non-Veg 🔴</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-2">Assign Category</label>
                  <select value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#6C2BFF]/50 outline-none transition-colors">
                    <option value="">Select Category...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-2">Assign Section</label>
                  <select value={formData.section_id} onChange={e => setFormData({...formData, section_id: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#6C2BFF]/50 outline-none transition-colors">
                    <option value="">Select Section...</option>
                    {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" disabled={isUploadingImage} className="w-full bg-[#6C2BFF] text-white py-4 rounded-xl text-sm font-bold shadow-lg shadow-[#6C2BFF]/20 mt-6 active:scale-[0.98] transition-all disabled:bg-gray-300 disabled:shadow-none">
                Save Dish
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}