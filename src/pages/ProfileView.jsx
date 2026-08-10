import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { supabase } from '../lib/supabase';
import { User, Store, Clock, Phone, MapPin, Edit2, Check, X, Map, Search, Navigation } from 'lucide-react';
import L from 'leaflet';

// Fix for default Leaflet marker icon asset paths breaking in Vite/React builds
import 'leaflet/dist/leaflet.css';
const customMarkerIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function ProfileView() {
  const [kitchenId, setKitchenId] = useState(null);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [locationAddress, setLocationAddress] = useState('');
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Default coordinates centered around Kudwa, Maharashtra area
  const [markerPosition, setMarkerPosition] = useState([21.4624, 80.2201]);

  // --- Map Search & Auto-Detect States ---
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [mapSuggestions, setMapSuggestions] = useState([]);
  const [isSearchingMap, setIsSearchingMap] = useState(false);
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);

  // 1. Fetch initial records straight from Supabase Database on mount
  useEffect(() => {
    async function loadKitchenData() {
      try {
        setIsProfileLoading(true);
        const session = JSON.parse(localStorage.getItem('valo_kitchen'));
        if (!session || !session.id) return;
        
        setKitchenId(session.id);

        // Fetch live profile parameters from kitchens table column fields
        const { data, error } = await supabase
          .from('kitchens')
          .select('location_address, latitude, longitude')
          .eq('id', session.id)
          .single();

        if (error) throw error;

        if (data) {
          setLocationAddress(data.location_address || 'Kudwa, Maharashtra, India');
          if (data.latitude && data.longitude) {
            setMarkerPosition([data.latitude, data.longitude]);
          }
        }
      } catch (err) {
        console.error('Error fetching live kitchen location profiles:', err.message);
        // Fallback parameter assignment sequence if network breaks down
        setLocationAddress(localStorage.getItem('valo_kitchen_location') || 'Kudwa, Maharashtra, India');
        const savedCoords = localStorage.getItem('valo_kitchen_coords');
        if (savedCoords) setMarkerPosition(JSON.parse(savedCoords));
      } finally {
        setIsProfileLoading(false);
      }
    }

    loadKitchenData();
  }, []);

  // --- REVERSE GEOCODING (Convert Coordinates to Place Names) ---
  const fetchAddressFromCoords = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      if (data && data.display_name) {
        setLocationAddress(data.display_name);
      } else {
        setLocationAddress(`Zone coordinates: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`);
      }
    } catch (err) {
      console.error('Error reverse geocoding coordinates:', err);
      setLocationAddress(`Zone coordinates: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`);
    }
  };

  // --- AUTO DETECT GPS LOCATION ---
  const handleAutoDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser layout.');
      return;
    }

    setIsDetectingGPS(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setMarkerPosition([latitude, longitude]);
        await fetchAddressFromCoords(latitude, longitude);
        setIsDetectingGPS(false);
      },
      (error) => {
        console.error('GPS Detection error:', error);
        alert('Unable to retrieve your current location. Please check device permissions.');
        setIsDetectingGPS(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Automatically trigger GPS detection if map picker tab is opened
  useEffect(() => {
    if (showMapPicker) {
      handleAutoDetectLocation();
    }
  }, [showMapPicker]);

  // --- DATABASE & CLIENT CACHE SYNC SEQUENCE ---
  const handleSaveLocation = async () => {
    if (!kitchenId) {
      alert('Kitchen session parameters not detected. Please sign in again.');
      return;
    }

    try {
      setIsSaving(true);

      // Perform a direct update query targeting your Supabase kitchen columns
      const { error } = await supabase
        .from('kitchens')
        .update({
          location_address: locationAddress,
          latitude: markerPosition[0],
          longitude: markerPosition[1]
        })
        .eq('id', kitchenId);

      if (error) throw error;

      // Sync backups down into local cache memory parameters cleanly
      localStorage.setItem('valo_kitchen_location', locationAddress);
      localStorage.setItem('valo_kitchen_coords', JSON.stringify(markerPosition));
      
      setIsEditingLocation(false);
      setShowMapPicker(false);
    } catch (err) {
      console.error('Failed to update kitchen location index parameters:', err.message);
      alert('Database connection mapping error. Failed to save location fields.');
    } finally {
      setIsSaving(false);
    }
  };

  // --- SEARCH QUERY FOR PLACES (WITH AUTO-PIN JUMP SEARCH LOGIC) ---
  const handleMapSearchSubmit = async (e) => {
    e.preventDefault();
    if (!mapSearchQuery.trim()) return;

    try {
      setIsSearchingMap(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchQuery)}&limit=5`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const topMatch = data[0];
        const lat = parseFloat(topMatch.lat);
        const lon = parseFloat(topMatch.lon);
        
        setMarkerPosition([lat, lon]);
        setLocationAddress(topMatch.display_name);
        setMapSuggestions([]); 
        setMapSearchQuery('');
      } else {
        alert('No nearby location metrics found for that query parameter.');
      }
    } catch (err) {
      console.error('Error fetching map location suggestions:', err);
    } finally {
      setIsSearchingMap(false);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lon = parseFloat(suggestion.lon);
    
    setMarkerPosition([lat, lon]);
    setLocationAddress(suggestion.display_name);
    setMapSuggestions([]);
    setMapSearchQuery('');
  };

  // Internal component to smoothly pan the map viewport to a new center position
  function ChangeMapView({ center }) {
    const map = useMap();
    useEffect(() => {
      if (center) {
        map.setView(center, 16); 
      }
    }, [center, map]);
    return null;
  }

  // Internal Map Click/Drop-Pin Listener Event Component
  function MapClickHandler() {
    useMapEvents({
      async click(e) {
        const { lat, lng } = e.latlng;
        setMarkerPosition([lat, lng]);
        setLocationAddress('Fetching nearby reference position details...');
        await fetchAddressFromCoords(lat, lng);
      },
    });
    return null;
  }

  if (isProfileLoading) {
    return (
      <div className="h-[50dvh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-4 border-[#F4F0FF] border-t-[#6C2BFF] rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Loading Profile Metrics...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-10 font-sans">
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

        {/* Configuration Stack */}
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

          {/* Kitchen Location Editor */}
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
                  
                  {/* Selector Tabs Matrix */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowMapPicker(false)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${!showMapPicker ? 'bg-[#6C2BFF] text-white border-[#6C2BFF]' : 'bg-white text-gray-500 border-gray-200'}`}
                      >
                        Text Address
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowMapPicker(true)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all flex items-center gap-1 ${showMapPicker ? 'bg-[#6C2BFF] text-white border-[#6C2BFF]' : 'bg-white text-gray-500 border-gray-200'}`}
                      >
                        <Map size={12} /> Map View
                      </button>
                    </div>

                    {showMapPicker && (
                      <button
                        type="button"
                        onClick={handleAutoDetectLocation}
                        disabled={isDetectingGPS}
                        className="text-[10px] font-black text-[#6C2BFF] bg-[#F4F0FF] px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-[#EBE4FF] disabled:bg-gray-50 disabled:text-gray-400 transition-all active:scale-95"
                      >
                        <Navigation size={12} className={isDetectingGPS ? 'animate-spin' : ''} />
                        {isDetectingGPS ? 'Detecting...' : 'Auto Detect'}
                      </button>
                    )}
                  </div>

                  {showMapPicker ? (
                    /* LEAFLET CONTAINER WITH AUTO-PIN JUMP SEARCH OVERLAY */
                    <div className="w-full h-80 rounded-2xl overflow-hidden border border-gray-200 relative shadow-inner flex flex-col">
                      
                      {/* Floating Search overlay box */}
                      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-col gap-1.5 max-w-md">
                        <form onSubmit={handleMapSearchSubmit} className="relative flex items-center shadow-md rounded-xl overflow-hidden">
                          <input 
                            type="text"
                            placeholder="Type location & hit enter to move pin..."
                            value={mapSearchQuery}
                            onChange={(e) => setMapSearchQuery(e.target.value)}
                            className="w-full bg-white border-0 pl-4 pr-10 py-2.5 text-xs font-bold text-gray-800 outline-none placeholder:text-gray-400"
                          />
                          <button type="submit" className="absolute right-0 top-0 bottom-0 px-3 bg-white border-l border-gray-50 text-gray-400 hover:text-[#6C2BFF] transition-colors">
                            {isSearchingMap ? (
                              <div className="w-4 h-4 border-2 border-gray-300 border-t-[#6C2BFF] rounded-full animate-spin"></div>
                            ) : (
                              <Search size={14} />
                            )}
                          </button>
                        </form>

                        {/* Dropdown Suggestions List */}
                        {mapSuggestions.length > 0 && (
                          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xl max-h-40 overflow-y-auto divide-y divide-gray-50">
                            {mapSuggestions.map((item, idx) => (
                              <div 
                                key={idx}
                                onClick={() => handleSelectSuggestion(item)}
                                className="p-3 text-[11px] font-semibold text-gray-600 hover:bg-[#F4F0FF]/40 hover:text-gray-900 cursor-pointer transition-colors truncate"
                              >
                                {item.display_name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Leaflet Core Render Canvas */}
                      <div className="flex-1 w-full h-full">
                        <MapContainer 
                          center={markerPosition} 
                          zoom={15} 
                          style={{ height: '100%', width: '100%', zIndex: 10 }}
                          zoomControl={false}
                        >
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <Marker position={markerPosition} icon={customMarkerIcon} />
                          <MapClickHandler />
                          <ChangeMapView center={markerPosition} />
                        </MapContainer>
                      </div>
                      
                      <div className="absolute bottom-2 left-2 bg-gray-900/80 backdrop-blur-md text-white text-[9px] font-black px-2 py-1 rounded-md z-[500] tracking-wide uppercase pointer-events-none">
                        Tap map anywhere to drop pin & fetch address
                      </div>
                    </div>
                  ) : (
                    /* ADDRESS TEXTAREA INTERFACE */
                    <textarea 
                      value={locationAddress}
                      onChange={(e) => setLocationAddress(e.target.value)}
                      placeholder="Enter full operational address..."
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm font-bold text-gray-800 outline-none focus:border-[#6C2BFF]/40 focus:bg-white shadow-sm transition-all resize-none h-20"
                    />
                  )}

                  {/* Detected Address Summary Field */}
                  {showMapPicker && (
                    <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-left animate-in fade-in duration-200">
                      <span className="text-[9px] font-black text-[#6C2BFF] uppercase tracking-wider block mb-0.5">Detected Address:</span>
                      <p className="text-[11px] font-semibold text-gray-500 leading-normal">{locationAddress}</p>
                    </div>
                  )}

                  {/* Bottom Action Controllers */}
                  <div className="flex gap-2">
                    <button 
                      onClick={handleSaveLocation}
                      disabled={isSaving}
                      className="flex-1 bg-[#6C2BFF] text-white py-2 rounded-lg text-xs font-black shadow-md shadow-[#6C2BFF]/20 flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:bg-gray-300 disabled:shadow-none"
                    >
                      {isSaving ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Check size={14} /> Select & Save Location
                        </>
                      )}
                    </button>
                    <button 
                      onClick={() => {
                        setIsEditingLocation(false);
                        setShowMapPicker(false);
                        setMapSuggestions([]);
                        setMapSearchQuery('');
                      }}
                      disabled={isSaving}
                      className="w-12 bg-gray-100 text-gray-400 py-2 rounded-lg text-xs font-black flex items-center justify-center active:scale-95 transition-all hover:bg-gray-200 hover:text-gray-600 disabled:opacity-50"
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
