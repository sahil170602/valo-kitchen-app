import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Phone, ArrowRight, AlertCircle, Store, Mail, MapPin, Compass } from 'lucide-react';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // STEPPER STATE: 'mobile' or 'register'
  const [step, setStep] = useState('mobile');

  // Form State
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [isDetecting, setIsDetecting] = useState(false);

  // --- Phase 1: Verify Kitchen Mobile ---
  const handleCheckMobile = async (e) => {
    e.preventDefault();
    if (!mobile || mobile.length < 10) return setErrorMsg('Enter a valid 10-digit mobile number.');

    try {
      setLoading(true);
      setErrorMsg('');

      const { data: kitchen, error } = await supabase
        .from('kitchens')
        .select('*')
        .eq('mobile', mobile.trim())
        .maybeSingle();

      if (kitchen) {
        // EXISTING KITCHEN: Login instantly
        await supabase.from('kitchens').update({ status: 'online' }).eq('id', kitchen.id);
        
        localStorage.setItem('valo_kitchen', JSON.stringify({
          id: kitchen.id,
          name: kitchen.name,
          mobile: kitchen.mobile
        }));
        
        // Cache location for ProfileView
        localStorage.setItem('valo_kitchen_location', kitchen.location_address || 'Kudwa, Maharashtra, India');

        window.location.href = '/dashboard';
      } else {
        // NEW KITCHEN: Advance to registration
        setStep('register');
      }
    } catch (err) {
      setErrorMsg('Network error checking credentials.');
    } finally {
      setLoading(false);
    }
  };

  // --- HTML5 Geolocation Auto-Detect ---
  const detectLocation = () => {
    setIsDetecting(true);
    setErrorMsg('');

    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      setIsDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoords({ lat, lng });
        
        // Setting an approximate default string. In a production build, 
        // you would pass these coords to Google Maps Reverse Geocoding API here.
        setLocationAddress(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)} (GPS Acquired)`);
        setIsDetecting(false);
      },
      (error) => {
        setErrorMsg('Failed to detect location. Please type it manually.');
        setIsDetecting(false);
      }
    );
  };

  // --- Phase 2: Register New Kitchen Profile ---
  const handleRegisterProfile = async (e) => {
    e.preventDefault();
    if (!name || !email || !locationAddress) return setErrorMsg('Please complete all facility details.');

    try {
      setLoading(true);
      setErrorMsg('');

      const newKitchenPayload = {
        name: name.trim(),
        mobile: mobile.trim(),
        email: email.trim().toLowerCase(),
        location_address: locationAddress.trim(),
        latitude: coords.lat,
        longitude: coords.lng,
        status: 'online'
      };

      const { data: insertedKitchen, error } = await supabase
        .from('kitchens')
        .insert([newKitchenPayload])
        .select()
        .single();

      if (error) throw error;

      localStorage.setItem('valo_kitchen', JSON.stringify({
        id: insertedKitchen.id,
        name: insertedKitchen.name,
        mobile: insertedKitchen.mobile
      }));
      localStorage.setItem('valo_kitchen_location', insertedKitchen.location_address);

      window.location.href = '/dashboard';

    } catch (err) {
      setErrorMsg(err.message.includes('unique') ? 'Mobile already mapped.' : 'Failed to register kitchen facility.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] bg-[#F4F7FE] font-sans flex flex-col justify-between p-6 overflow-hidden relative">
      <div className="absolute top-[-20%] left-[-20%] w-[80%] aspect-square bg-[#6C2BFF]/5 rounded-full blur-3xl"></div>

      {/* Header */}
      <div className="pt-12 px-2 z-10">
        <h2 className="text-3xl font-black text-[#1E0B4B] tracking-tight leading-none">
          {step === 'mobile' ? 'Kitchen ' : 'Register Facility'}
        </h2>
        <p className="text-sm font-bold text-gray-500 mt-2.5 leading-snug">
          {step === 'mobile' 
            ? 'Enter your panel' 
            : 'Configure your kitchen identity and exact delivery pickup coordinates.'
          }
        </p>
      </div>

      {/* Forms Container */}
      <div className="w-full max-w-sm mx-auto my-auto space-y-4 z-10">
        {errorMsg && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-2.5 text-xs font-bold text-red-600 animate-in fade-in duration-200">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p className="leading-tight">{errorMsg}</p>
          </div>
        )}

        {step === 'mobile' ? (
          <form onSubmit={handleCheckMobile} className="space-y-4 animate-in fade-in duration-300">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm select-none flex items-center gap-1.5">
                <Phone size={16} />
                <span>+91</span>
                <span className="text-gray-200">|</span>
              </div>
              <input 
                type="tel"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter Mobile Number"
                className="w-full h-14 bg-white border border-gray-100 rounded-2xl pl-20 pr-4 text-sm font-bold text-[#1E0B4B] placeholder:text-gray-300 outline-none focus:border-[#6C2BFF]/40 shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
              />
            </div>

            <button
              type="submit"
              disabled={loading || mobile.length < 10}
              className="w-full h-14 bg-[#6C2BFF] text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(108,43,255,0.3)] active:scale-[0.99] transition-all disabled:bg-gray-300 disabled:shadow-none"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <><span>Login</span><ArrowRight size={16} /></>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterProfile} className="space-y-3.5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="relative">
              <Store size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Hotel / Kitchen Name"
                className="w-full h-13 bg-white border border-gray-100 rounded-2xl pl-12 pr-4 text-xs font-bold text-[#1E0B4B] placeholder:text-gray-300 outline-none focus:border-[#6C2BFF]/40 shadow-sm"
              />
            </div>

            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Business Email"
                className="w-full h-13 bg-white border border-gray-100 rounded-2xl pl-12 pr-4 text-xs font-bold text-[#1E0B4B] placeholder:text-gray-300 outline-none focus:border-[#6C2BFF]/40 shadow-sm"
              />
            </div>

            <div className="relative flex flex-col gap-2">
              <div className="relative">
                <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6C2BFF]" />
                <input 
                  type="text"
                  value={locationAddress}
                  onChange={(e) => setLocationAddress(e.target.value)}
                  placeholder="Physical Address"
                  className="w-full h-13 bg-white border border-[#6C2BFF]/30 rounded-2xl pl-12 pr-4 text-xs font-bold text-[#1E0B4B] placeholder:text-gray-300 outline-none focus:border-[#6C2BFF]/60 shadow-sm"
                />
              </div>
              <button 
                type="button" 
                onClick={detectLocation}
                className="self-end text-[10px] font-black text-[#6C2BFF] uppercase flex items-center gap-1 hover:text-[#5B21E6] transition-colors"
              >
                {isDetecting ? <Compass size={12} className="animate-spin" /> : <Compass size={12} />}
                Auto-Detect Coordinates
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 mt-4 bg-[#6C2BFF] text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(108,43,255,0.3)] active:scale-[0.99] transition-all disabled:bg-gray-300"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <><span>Save Kitchen Matrix</span><ArrowRight size={16} /></>
              )}
            </button>
          </form>
        )}
      </div>

      <div className="text-center pb-[calc(0.5rem+env(safe-area-inset-bottom))] z-10 shrink-0">
        <p className="text-[10px] font-bold text-gray-400 max-w-[240px] mx-auto leading-relaxed">
        </p>
      </div>
    </div>
  );
}
