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
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form State
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // 1. Initialize session and fetch isolated kitchen data
  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('valo_kitchen'));
    if (session && session.id) {
      setKitchenId(session.id);
      fetchCategories(session.id);
    }
  }, []);

  // 2. Fetch ONLY categories assigned to this specific kitchen
  const fetchCategories = async (kId = kitchenId) => {
    if (!kId) return;
    setLoading(true);
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('kitchen_id', kId) // <-- Multi-vendor isolation filter
      .order('created_at', { ascending: false });
      
    setCategories(data || []);
    setLoading(false);
  };

  const openModal = (category = null) => {
    if (category) {
      setEditingId(category.id);
      setName(category.name);
      setImageUrl(category.image_url || '');
    } else {
      setEditingId(null);
      setName('');
      setImageUrl('');
    }
    setIsModalOpen(true);
  };

  // 3. Local File Upload Handler for Supabase Storage (category-images bucket)
  const handleImageUpload = async (event) => {
    try {
      setIsUploadingImage(true);
      const file = event.target.files[0];
      if (!file) return;

      // Create a unique file name organized by kitchen ID
      const fileExt = file.name.split('.').pop();
      const fileName = `category_${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${kitchenId}/${fileName}`;

      // Upload the file to the 'category-images' bucket
      const { error: uploadError } = await supabase.storage
        .from('category-images')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      // Get the live public URL from the 'category-images' bucket
      const { data: { publicUrl } } = supabase.storage
        .from('category-images')
        .getPublicUrl(filePath);

      // Save to form state instantly
      setImageUrl(publicUrl);

    } catch (error) {
      console.error('Error uploading image:', error.message);
      alert('Failed to upload image. Please check storage permissions.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // 4. Save category and attach the kitchen ID
  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || !kitchenId) return;

    const payload = { 
      name, 
      image_url: imageUrl,
      kitchen_id: kitchenId // <-- Ensure the item belongs to this kitchen
    };

    if (editingId) {
      await supabase.from('categories').update(payload).eq('id', editingId);
    } else {
      await supabase.from('categories').insert([payload]);
    }
    
    setIsModalOpen(false);
    fetchCategories();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this category? Dishes inside it will lose their category label.')) {
      await supabase.from('categories').delete().eq('id', id);
      fetchCategories();
    }
  };

  // Filter categories based on search query
  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto pb-10">
      
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Grid className="text-[#6C2BFF]" /> Menu Categories
          </h2>
          <p className="text-gray-500 text-sm mt-1">Manage food categories like Burgers, Pizza, etc.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Real-time Search Input */}
          <div className="relative flex-1 md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search categories..." 
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

      {/* Main Data Table */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-[11px] uppercase tracking-widest text-gray-400">
              <th className="px-8 py-5 font-bold">Category</th>
              <th className="px-8 py-5 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredCategories.length === 0 && !loading && (
              <tr>
                <td colSpan="2" className="px-8 py-10 text-center text-sm font-bold text-gray-400">
                  {searchQuery 
                    ? `No categories found matching "${searchQuery}".` 
                    : 'No categories found. Create one to get started.'}
                </td>
              </tr>
            )}
            {filteredCategories.map((cat) => (
              <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-8 py-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                    {cat.image_url ? <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-gray-400" />}
                  </div>
                  <span className="font-bold text-gray-900 text-base">{cat.name}</span>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openModal(cat)} className="p-2 text-blue-600 bg-blue-50 rounded-lg active:scale-95"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(cat.id)} className="p-2 text-red-600 bg-red-50 rounded-lg active:scale-95"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#150734]/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-black">{editingId ? 'Edit Category' : 'New Category'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-gray-400 hover:text-gray-600 transition-colors" /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              
              {/* IMAGE UPLOADER SECTION */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-2">Category Image</label>
                <div className="flex items-center gap-4">
                  {imageUrl && (
                    <img 
                      src={imageUrl} 
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

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-2">Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-[#6C2BFF]/50 outline-none transition-all" />
              </div>
              
              <button 
                type="submit" 
                disabled={isUploadingImage}
                className="w-full bg-[#6C2BFF] text-white py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-[#6C2BFF]/20 mt-4 active:scale-[0.98] transition-transform disabled:bg-gray-300 disabled:shadow-none"
              >
                Save Category
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}