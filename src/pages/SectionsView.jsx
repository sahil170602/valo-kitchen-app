import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Layers, Plus, Edit2, Trash2, X, Search } from 'lucide-react';

export default function SectionsView() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kitchenId, setKitchenId] = useState(null); 
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 🌟 NEW: View state for organizing the table
  const [activeTab, setActiveTab] = useState('food');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [sectionName, setSectionName] = useState('');
  const [appMode, setAppMode] = useState('food'); // 🌟 NEW: Form state for section type

  // 1. Initialize session and extract isolated kitchen node parameters
  useEffect(() => {
    const sessionStr = localStorage.getItem('valo_hotel_session') || localStorage.getItem('valo_kitchen');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      if (session && session.id) {
        setKitchenId(session.id);
        fetchSections(session.id);
      }
    }
  }, []);

  // 2. Fetch ALL sections assigned to this specific merchant node
  const fetchSections = async (kId = kitchenId) => {
    if (!kId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sections')
        .select('*')
        .eq('kitchen_id', kId)
        .order('created_at', { ascending: true }); // Keep this standard
        
      if (error) throw error;

      // Physically reverse the array in React to handle identical SQL timestamps
      setSections(data ? data.reverse() : []);

    } catch (err) {
      console.error("Fetch Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (section = null) => {
    if (section) {
      setEditingId(section.id);
      setSectionName(section.name);
      setAppMode(section.app_mode || 'food');
    } else {
      setEditingId(null);
      setSectionName('');
      setAppMode(activeTab); // Default new section to currently viewed tab
    }
    setIsModalOpen(true);
  };

  // 3. Save section data locked to the current active tenant structure context
  const handleSave = async (e) => {
    e.preventDefault();
    if (!sectionName.trim() || !kitchenId) return;

    try {
      setIsActionLoading(true);
      
      // 🌟 NEW: Include app_mode in the payload
      const payload = { 
        name: sectionName.trim(), 
        kitchen_id: kitchenId,
        app_mode: appMode 
      };

      if (editingId) {
        const { error } = await supabase
          .from('sections')
          .update(payload)
          .eq('id', editingId);
          
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('sections')
          .insert([payload]);
          
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      fetchSections(); 
      
    } catch (error) {
      console.error("Save Error:", error.message);
      alert(`Failed to save data matrix parameters: ${error.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to drop this menu section layout parameter? Categories and dishes aligned below this schema tracking row will remain intact.')) return;
    
    try {
      const { error } = await supabase.from('sections').delete().eq('id', id);
      if (error) throw error;
      fetchSections();
    } catch (error) {
      alert("Delete operation rejected by database constraints: " + error.message);
    }
  };

  // 🌟 ENGINE: Filter based on BOTH Search Query and Active Super App Tab
  const filteredSections = sections.filter(sec => 
    (sec.app_mode || 'food') === activeTab &&
    (sec.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && sections.length === 0) {
    return (
      <div className="h-full min-h-[50dvh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-4 border-[#F4F0FF] border-t-[#6C2BFF] rounded-full animate-spin"></div>
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Querying Structural Layout Fields...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* Header Controls Banner block row section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Layers className="text-[#6C2BFF]" size={24} /> Ecosystem Sections
          </h2>
          <p className="text-gray-500 text-sm mt-1">Manage horizontal layout shelves for Food and Grocery platforms.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search sections..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold text-gray-800 focus:ring-2 focus:ring-[#6C2BFF]/20 focus:border-[#6C2BFF]/30 outline-none transition-all shadow-sm"
            />
          </div>

          <button 
            onClick={() => openModal()}
            className="bg-[#6C2BFF] hover:bg-black text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-[#6C2BFF]/10 flex items-center gap-2 active:scale-95 transition-all shrink-0"
          >
            <Plus size={16} /> Add Section
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

      {/* Main Structural Datatable Grid */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100 text-[10px] uppercase tracking-widest text-gray-400 font-black">
                <th className="px-8 py-5">Section Name Parameter</th>
                <th className="px-8 py-5">Timestamp Location</th>
                <th className="px-8 py-5 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs font-bold text-gray-600">
              {filteredSections.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-8 py-14 text-center text-sm font-bold text-gray-400">
                    {searchQuery 
                      ? `No section listings match query text matrix line "${searchQuery}".` 
                      : `No custom ${activeTab} sections registered to this kitchen node yet.`}
                  </td>
                </tr>
              ) : (
                filteredSections.map((section) => (
                  <tr key={section.id} className="hover:bg-gray-50/40 transition-colors group">
                    <td className="px-8 py-4">
                      <p className="font-black text-gray-900 text-base tracking-tight">{section.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono font-bold mt-1">UUID Key Token: {section.id}</p>
                    </td>
                    <td className="px-8 py-4 text-gray-400 font-bold font-sans">
                      {new Date(section.created_at).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })}
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openModal(section)} 
                          className="p-2.5 text-blue-600 bg-blue-50 border border-blue-100 rounded-xl active:scale-95 transition-transform"
                          title="Modify Text Data"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(section.id)} 
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

      {/* Modern Form Input Sheet Overlay Sheet Dialog Dialog Box */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden transform animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-black text-sm text-gray-900 uppercase tracking-wider">
                {editingId ? 'Modify Horizontal Section' : 'Initialize Layout Section'}
              </h3>
              <button onClick={() => { if(!isActionLoading) setIsModalOpen(false); }} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full">
                <X size={16} />
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

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 ml-0.5">Section Display Label Name</label>
                <input 
                  type="text" 
                  value={sectionName}
                  onChange={(e) => setSectionName(e.target.value)}
                  placeholder={appMode === 'food' ? "e.g., Best Sellers, Chinese Combos" : "e.g., Fresh Fruits, Snacks"}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5 text-xs font-bold text-gray-800 focus:border-[#6C2BFF]/40 outline-none transition-all disabled:bg-gray-100"
                  autoFocus
                  required
                  disabled={isActionLoading}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  disabled={isActionLoading}
                  className="flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isActionLoading || !sectionName.trim()}
                  className="flex-1 bg-[#6C2BFF] hover:bg-black text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-[#6C2BFF]/10 active:scale-[0.98] transition-all disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  {isActionLoading ? 'Saving Metrics...' : 'Commit Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
