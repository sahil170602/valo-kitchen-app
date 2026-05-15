import { useState, useEffect } from 'react';
import { User, Store, Clock, Phone, MapPin, Edit2, Check, X } from 'lucide-react';

export default function ProfileView() {
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [locationAddress, setLocationAddress] = useState('');

  // Load contextual default operational zone or saved configuration
  useEffect(() => {
    const savedLocation = localStorage.getItem('valo_kitchen_location');
    setLocationAddress(savedLocation || 'Kudwa, Maharashtra, India');
  }, []);

  const handleSaveLocation = () => {
    localStorage.setItem('valo_kitchen_location', locationAddress);
    setIsEditingLocation(false);
  };

  return (
    <div className="max-w-3xl mx-auto pb-10">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <User className="text-[#6C2BFF]" /> Kitchen Profile
        </h2>
        <p className="text-gray-500 text-sm mt-1">Manage your hotel kitchen details and settings.</p>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden p-8">
        
        {/* Header Profile Badge */}
        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-100">
          <div className="w-24 h-24 bg-[#F4F0FF] text-[#6C2BFF] rounded-3xl flex items-center justify-center font-black text-3xl shadow-sm">
            VK
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-900">Valo Hotel Kitchen</h3>
            <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-600 rounded-full text-[10px] font-black uppercase tracking-wider">
              Active & Accepting Orders
            </span>
          </div>
        </div>

        {/* Dynamic Details Configuration Stack */}
        <div className="space-y-6">
          
          {/* Identity */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 shrink-0">
              <Store size={18} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Hotel Name</p>
              <p className="font-bold text-gray-900">The Valo Grand Hotel</p>
            </div>
          </div>
          
          {/* Operational Hours */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Operating Hours</p>
              <p className="font-bold text-gray-900">24/7 Room Service</p>
            </div>
          </div>

          {/* Contact Node */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 shrink-0">
              <Phone size={18} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Front Desk Ext.</p>
              <p className="font-bold text-gray-900">Dial 9 or +91 98765 43210</p>
            </div>
          </div>

          <div className="w-full h-px bg-gray-50 my-2"></div>

          {/* INTERACTIVE COMPONENT: Kitchen Location Editor */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-[#F4F0FF] rounded-full flex items-center justify-center text-[#6C2BFF] shrink-0">
              <MapPin size={18} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-[#6C2BFF] uppercase tracking-wider">Kitchen Location Target</p>
                
                {!isEditingLocation && (
                  <button 
                    onClick={() => setIsEditingLocation(true)}
                    className="text-[10px] font-black text-gray-400 hover:text-[#6C2BFF] uppercase flex items-center gap-1 transition-colors"
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                )}
              </div>

              {isEditingLocation ? (
                <div className="mt-2 space-y-3 animate-in fade-in duration-200">
                  <textarea 
                    value={locationAddress}
                    onChange={(e) => setLocationAddress(e.target.value)}
                    placeholder="Enter full operational address..."
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm font-bold text-gray-800 outline-none focus:border-[#6C2BFF]/40 focus:bg-white shadow-sm transition-all resize-none h-20"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={handleSaveLocation}
                      className="flex-1 bg-[#6C2BFF] text-white py-2 rounded-lg text-xs font-black shadow-md shadow-[#6C2BFF]/20 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      <Check size={14} /> Save Location
                    </button>
                    <button 
                      onClick={() => {
                        // Revert to saved config if cancelled
                        setLocationAddress(localStorage.getItem('valo_kitchen_location') || 'Kudwa, Maharashtra, India');
                        setIsEditingLocation(false);
                      }}
                      className="w-12 bg-gray-100 text-gray-400 py-2 rounded-lg text-xs font-black flex items-center justify-center active:scale-95 transition-all hover:bg-gray-200 hover:text-gray-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <p className="font-bold text-gray-900 mt-0.5 leading-snug pr-4">
                  {locationAddress}
                </p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}