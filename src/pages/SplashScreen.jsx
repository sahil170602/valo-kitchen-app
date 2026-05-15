import { useEffect } from 'react';
import { ChefHat } from 'lucide-react';

export default function SplashScreen() {
  return (
    <div className="h-[100dvh] bg-[#F4F7FE] flex flex-col items-center justify-center font-sans p-6 relative overflow-hidden">
      
      {/* Decorative ambient background glows */}
      <div className="absolute top-[-20%] left-[-20%] w-[80%] aspect-square bg-[#6C2BFF]/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[80%] aspect-square bg-[#6C2BFF]/10 rounded-full blur-3xl"></div>

      {/* Central Branding Elements */}
      <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-700">
        <div className="w-28 h-28 bg-[#6C2BFF] rounded-[36px] flex items-center justify-center text-white shadow-[0_10px_40px_rgba(108,43,255,0.3)] animate-pulse mb-5">
          <ChefHat size={56} strokeWidth={1.5} />
        </div>
        
        <h1 className="text-4xl font-black text-[#1E0B4B] tracking-tight">
          VALO <span className="text-[#6C2BFF]">KITCHEN</span>
        </h1>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">
          Restaurant OS Console
        </p>
      </div>

      {/* System Status Indicators at bottom */}
      <div className="absolute bottom-12 flex flex-col items-center gap-2">
        <div className="w-5 h-5 border-2 border-gray-200 border-t-[#6C2BFF] rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Starting Kitchen Modules...</p>
      </div>

    </div>
  );
}