import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Layers, Plus, Edit2, Trash2, X } from 'lucide-react';

export default function SectionsView() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [sectionName, setSectionName] = useState('');

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sections')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Fetch Error:", error);
      alert("Could not load sections. Check console.");
    } else {
      setSections(data || []);
    }
    setLoading(false);
  };

  const openAddModal = () => {
    setEditingId(null);
    setSectionName('');
    setIsModalOpen(true);
  };

  const openEditModal = (section) => {
    setEditingId(section.id);
    setSectionName(section.name);
    setIsModalOpen(true);
  };

  // UPDATED: Strict saving to database with error handling
  const handleSave = async (e) => {
    e.preventDefault();
    if (!sectionName.trim()) return;

    try {
      if (editingId) {
        // Update existing row in Supabase
        const { error } = await supabase
          .from('sections')
          .update({ name: sectionName })
          .eq('id', editingId);
          
        if (error) throw error;
      } else {
        // Insert new row into Supabase
        const { error } = await supabase
          .from('sections')
          .insert([{ name: sectionName }]);
          
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      fetchSections(); // Refresh the list from the database
      
    } catch (error) {
      console.error("Save Error:", error);
      alert(`Failed to save to database: ${error.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this section?')) {
      const { error } = await supabase.from('sections').delete().eq('id', id);
      if (error) {
        alert("Delete failed: " + error.message);
      } else {
        fetchSections();
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Layers className="text-[#6C2BFF]" /> Menu Sections
          </h2>
          <p className="text-gray-500 text-sm mt-1">Manage the horizontal scrolling sections on the user app.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-[#6C2BFF] hover:bg-[#5A24D6] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center gap-2 active:scale-95"
        >
          <Plus size={18} /> Add New Section
        </button>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-[11px] uppercase tracking-widest text-gray-400">
              <th className="px-8 py-5 font-bold">Section Name</th>
              <th className="px-8 py-5 font-bold">Date Created</th>
              <th className="px-8 py-5 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan="3" className="px-8 py-10 text-center text-gray-400">Loading sections from database...</td></tr>
            ) : sections.length === 0 ? (
              <tr><td colSpan="3" className="px-8 py-10 text-center text-gray-400">No sections in database. Add one above!</td></tr>
            ) : (
              sections.map((section) => (
                <tr key={section.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <p className="font-bold text-gray-900 text-base">{section.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono mt-1">ID: {section.id.split('-')[0]}</p>
                  </td>
                  <td className="px-8 py-5 text-gray-500 text-sm font-medium">
                    {new Date(section.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-1 opacity-100 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(section)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(section.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#150734]/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-black text-gray-900 text-lg">{editingId ? 'Edit Section' : 'Create New Section'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6">
              <div className="mb-6">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Section Name</label>
                <input 
                  type="text" 
                  value={sectionName}
                  onChange={(e) => setSectionName(e.target.value)}
                  placeholder="e.g., Popular Dishes"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm font-bold rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-[#6C2BFF]/50"
                  autoFocus
                  required
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100">Cancel</button>
                <button type="submit" className="flex-1 bg-[#6C2BFF] text-white py-3.5 rounded-xl text-sm font-bold shadow-lg active:scale-95">Save to Database</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}