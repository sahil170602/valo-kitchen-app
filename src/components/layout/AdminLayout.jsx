import { useState, useEffect } from 'react';
import { LayoutDashboard, History, Layers, Grid, Utensils, User, LogOut, Menu, X } from 'lucide-react';

export default function AdminLayout({ children, activeTab, setActiveTab }) {
  // State to control the mobile hamburger menu drawer
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close the mobile menu automatically whenever a tab is selected
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeTab]);

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'orders', name: 'Past Orders', icon: <History size={20} /> },
    { id: 'sections', name: 'Sections', icon: <Layers size={20} /> },
    { id: 'categories', name: 'Categories', icon: <Grid size={20} /> },
    { id: 'dishes', name: 'Dishes', icon: <Utensils size={20} /> },
    { id: 'profile', name: 'Profile', icon: <User size={20} /> },
  ];

  return (
    <div className="flex h-[100dvh] bg-[#F4F7FE] font-sans text-slate-900 overflow-hidden relative w-full">
      
      {/* 📱 MOBILE HEADER (Visible only on small screens) */}
      <div className="md:hidden absolute top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 px-4 flex items-center justify-between z-30 shadow-sm">
        
        {/* Left Side: Hamburger Menu */}
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 -ml-2 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors relative z-10"
        >
          <Menu size={24} />
        </button>

        {/* Center: Logo and Name */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="w-8 h-8 bg-[#6C2BFF] rounded-lg text-white flex items-center justify-center font-black text-xs shadow-sm shadow-[#6C2BFF]/20">
              VK
            </div>
            <h1 className="text-lg font-black tracking-tight text-[#1E0B4B]">VALO</h1>
          </div>
        </div>

        {/* Right Side: Spacer to keep flex layout balanced */}
        <div className="w-10"></div>
      </div>

      {/* 🌑 MOBILE OVERLAY BACKDROP */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-[#150734]/40 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 🚀 RESPONSIVE SIDEBAR NAVIGATION */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col shrink-0
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 md:p-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#6C2BFF] rounded-lg text-white flex items-center justify-center font-black text-xs">VK</div>
            <h1 className="text-xl font-black tracking-tight text-[#1E0B4B]">
              VALO <span className="text-[#6C2BFF] font-medium text-xs"></span>
            </h1>
          </div>
          
          {/* Mobile Close Button inside Sidebar */}
          <button 
            className="md:hidden p-2 text-gray-400 hover:bg-gray-50 rounded-xl transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto no-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-md transition-all ${
                activeTab === item.id 
                  ? 'bg-[#6C2BFF] text-white shadow-[0_4px_14px_rgba(108,43,255,0.3)]' 
                  : 'text-gray-800 hover:bg-gray-50'
              }`}
            >
              {item.icon}
              {item.name}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={() => {
              localStorage.removeItem('valo_kitchen');
              window.location.href = '/';
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 font-bold text-sm hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* 🖥️ MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 w-full h-full pt-16 md:pt-0">
        
        {/* Top Header (Desktop View) */}
        <header className="hidden md:flex h-20 bg-white border-b border-gray-200 px-8 items-center justify-between shrink-0">
          <h2 className="text-lg font-bold capitalize">{activeTab.replace('-', ' ')}</h2>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">Valo Hotel Kitchen</p>
              <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider flex items-center justify-end gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                Online & Accepting Orders
              </p>
            </div>
            <div className="w-10 h-10 bg-[#F4F0FF] text-[#6C2BFF] flex items-center justify-center rounded-full font-black shadow-sm shadow-[#6C2BFF]/10">
               VK
            </div>
          </div>
        </header>

        {/* Mobile-only page title indicator */}
        <div className="md:hidden px-4 pt-5 pb-2 shrink-0 bg-[#F4F7FE]">
           <h2 className="text-xl font-black capitalize text-[#1E0B4B]">{activeTab.replace('-', ' ')}</h2>
        </div>

        {/* Dynamic Content Rendering */}
        <div className="p-4 md:p-8 overflow-y-auto flex-1 w-full">
          {children}
        </div>
      </main>

    </div>
  );
}