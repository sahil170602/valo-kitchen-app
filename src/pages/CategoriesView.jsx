import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Grid, Plus, Edit2, Trash2, X, Image as ImageIcon, Search } from 'lucide-react';

export default function CategoriesView() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [kitchenId, setKitchenId] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 🌟 NEW: View state for organizing the table
  const [activeTab, setActiveTab] = useState('food');
  
  // Form State
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [appMode, setAppMode] = useState('food'); // 🌟 NEW: Form state for category type

  // 1. Initialize session and fetch isolated kitchen/merchant node parameters
  useEffect(() => {
    const sessionStr = localStorage.getItem('valo_hotel_session') || localStorage.getItem('valo_kitchen');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      if (session && session.id) {
        setKitchenId(session.id);
        fetchCategories(session.id);
      }
    }
  }, []);

  // 2. Fetch ALL categories for this kitchen (We filter locally via tabs)
  const fetchCategories = async (kId = kitchenId) => {
    if (!kId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('kitchen_id', kId) 
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Failed to query categories registry data context:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (category = null) => {
    if (category) {
      setEditingId(category.id);
      setName(category.name);
      setImageUrl(category.image_url || '');
      setAppMode(category.app_mode || 'food'); // Load existing mode
    } else {
      setEditingId(null);
      setName('');
      setImageUrl('');
      setAppMode(activeTab); // Default new category to currently viewed tab
    }
    setIsModalOpen(true);
  };

  // 3. File Upload Handler for Supabase Storage (category-images bucket)
  const handleImageUpload = async (event) => {
    try {
      setIsUploadingImage(true);
      const file = event.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `cat_${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${kitchenId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('category-images')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('category-images')
        .getPublicUrl(filePath);

      setImageUrl(publicUrl);
    } catch (error) {
      console.error('Error uploading item thumbnail asset:', error.message);
      alert(`Upload operation failed: ${error.message}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // 4. 🌟 UPDATED: Save/Commit includes the app_mode
  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || !kitchenId) return;

    try {
      setIsActionLoading(true);
      const payload = { 
        name: name.trim(), 
        image_url: imageUrl,
        kitchen_id: kitchenId,
        app_mode: appMode // 🌟 Maps category to Food or Grocery
      };

      if (editingId) {
        const { error } = await supabase.from('categories').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('categories').insert([payload]);
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      alert(`Failed to save configuration metrics: ${err.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to drop this menu category? Dishes mapped inside this row will lose their categorical sorting reference parameters.')) return;
    
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      fetchCategories();
    } catch (err) {
      alert(`Deletion aborted by database constraint rules: ${err.message}`);
    }
  };

  // 🌟 ENGINE: Filter based on BOTH Search Query and Active Super App Tab
  const filteredCategories = categories.filter(cat => 
    (cat.app_mode || 'food') === activeTab &&
    (cat.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && categories.length === 0) {
    return (
      <div className="h-full min-h-[50dvh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-4 border-[#F4F0FF] border-t-[#6C2BFF] rounded-full animate-spin"></div>
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Resolving Menu Layout Fields...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* Header Panel Controls Toolbar row section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Grid className="text-[#6C2BFF]" size={24} /> Ecosystem Categories
          </h2>
          <p className="text-gray-500 text-sm mt-1">Manage categorical tracking slots for both Food and Grocery modes.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search categorizations..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold text-gray-800 focus:ring-2 focus:ring-[#6C2BFF]/20 focus:border-[#6C2BFF]/30 outline-none transition-all shadow-sm"
            />
          </div>

          <button 
            onClick={() => openModal()} 
            className="bg-[#6C2BFF] hover:bg-black text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-[#6C2BFF]/10 flex items-center gap-2 active:scale-95 transition-all shrink-0"
          >
            <Plus size={16} /> Add Category
          </button>
        </div>
      </div>

      {/* 🌟 NEW: Super App Tab Toggles */}
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

      {/* Main Struct Datatable Layout */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
                <th className="px-8 py-5">Category Parameter Layout</th>
                <th className="px-8 py-5 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs font-bold text-gray-600">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="2" className="px-8 py-14 text-center text-sm font-bold text-gray-400">
                    {searchQuery 
                      ? `No category listings match query text matrix line "${searchQuery}".` 
                      : `No custom ${activeTab} categories registered to this kitchen slot node yet.`}
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50/40 transition-colors group">
                    <td className="px-8 py-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                        {cat.image_url ? (
                          <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon size={18} className="text-gray-300" />
                        )}
                      </div>
                      <span className="font-black text-gray-900 text-base tracking-tight">{cat.name}</span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openModal(cat)} 
                          className="p-2.5 text-blue-600 bg-blue-50 border border-blue-100 rounded-xl active:scale-95 transition-transform"
                          title="Modify Entry"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(cat.id)} 
                          className="p-2.5 text-red-600 bg-red-50 border border-red-100 rounded-xl active:scale-95 transition-transform"
                          title="Drop Matrix Node Row"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modern Dialog Form View Sheet Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden transform animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-black text-sm text-gray-900 uppercase tracking-wider">
                {editingId ? 'Modify Category Unit' : 'Initialize New Category'}
              </h3>
              <button type="button" onClick={() => { if(!isActionLoading) setIsModalOpen(false); }}>
                <X size={18} className="text-gray-400 hover:text-gray-600 transition-colors" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5">
              
              {/* 🌟 NEW: App Mode Selector (Food vs Grocery) */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 ml-0.5">Application Placement</label>
                <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-100 shadow-inner">
                  <button 
                    type="button" 
                    onClick={() => setAppMode('food')} 
                    className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                      appMode === 'food' ? 'bg-white shadow-sm text-[#6C2BFF]' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    🍔 Food
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setAppMode('grocery')} 
                    className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                      appMode === 'grocery' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    🛒 Grocery
                  </button>
                </div>
              </div>

              {/* IMAGE UPLOADER SECTION */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 ml-0.5">Categorization Thumbnail Badge</label>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                    {imageUrl ? (
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
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
                        <span className="ml-2 text-[10px] font-black uppercase tracking-wider text-[#6C2BFF]">Compiling binary...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Text Param Input string entry */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 ml-0.5">Category Identification Label</label>
                <input 
                  type="text" 
                  value={name} 
                  placeholder={appMode === 'food' ? "e.g., Chinese, Burgers" : "e.g., Fresh Fruits, Snacks"}
                  onChange={e => setName(e.target.value)} 
                  required 
                  disabled={isActionLoading}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5 text-xs font-bold text-gray-800 focus:border-[#6C2BFF]/40 outline-none transition-all disabled:bg-gray-100" 
                />
              </div>
              
              <button 
                type="submit" 
                disabled={isUploadingImage || isActionLoading || !name.trim()}
                className="w-full bg-[#6C2BFF] hover:bg-black text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-[#6C2BFF]/10 mt-2 active:scale-[0.98] transition-all disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed"
              >
                {isActionLoading ? 'Saving Schema...' : 'Commit Category Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
