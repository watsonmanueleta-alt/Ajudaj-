import React from 'react';
import { 
  Home, 
  Search, 
  FileText, 
  MessageSquare, 
  User, 
  Briefcase, 
  DollarSign, 
  ShieldCheck 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingOrdersCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  pendingOrdersCount = 0,
}) => {
  const { isClient, isProfessional, isAdmin } = useAuth();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 safe-area-pb">
      <div className="flex items-center justify-around">

        {/* Client Navigation */}
        {isClient && (
          <>
            <button
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${
                activeTab === 'home' ? 'text-amber-500 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Início</span>
            </button>

            <button
              onClick={() => setActiveTab('explore')}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${
                activeTab === 'explore' ? 'text-amber-500 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Search className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Explorar</span>
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${
                activeTab === 'requests' ? 'text-amber-500 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Pedidos</span>
              {pendingOrdersCount > 0 && (
                <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-amber-500"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${
                activeTab === 'profile' ? 'text-amber-500 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Perfil</span>
            </button>
          </>
        )}

        {/* Professional Navigation */}
        {isProfessional && (
          <>
            <button
              onClick={() => setActiveTab('pro_dashboard')}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${
                activeTab === 'pro_dashboard' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Início</span>
            </button>

            <button
              onClick={() => setActiveTab('pro_requests')}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${
                activeTab === 'pro_requests' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Pedidos</span>
              {pendingOrdersCount > 0 && (
                <span className="absolute top-1 right-2.5 w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {pendingOrdersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('pro_earnings')}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${
                activeTab === 'pro_earnings' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <DollarSign className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Ganhos</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${
                activeTab === 'profile' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Perfil</span>
            </button>
          </>
        )}

        {/* Administrator Navigation */}
        {isAdmin && (
          <>
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${
                activeTab === 'admin' ? 'text-purple-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Admin</span>
            </button>

            <button
              onClick={() => setActiveTab('explore')}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${
                activeTab === 'explore' ? 'text-purple-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Search className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Explorar</span>
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${
                activeTab === 'requests' ? 'text-purple-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Pedidos</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${
                activeTab === 'profile' ? 'text-purple-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Perfil</span>
            </button>
          </>
        )}

      </div>
    </div>
  );
};
