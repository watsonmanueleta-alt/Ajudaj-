import React, { useState } from 'react';
import { 
  Wrench, 
  MapPin, 
  Bell, 
  User, 
  ShieldCheck, 
  Briefcase, 
  LogOut, 
  LogIn, 
  ChevronDown,
  Sparkles,
  Smartphone,
  CheckCircle2,
  Navigation
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';

interface HeaderProps {
  onOpenNotifications: () => void;
  unreadNotificationsCount: number;
  userCity: string;
  onRefreshLocation: () => void;
  isLocating: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  unreadNotificationsCount,
  userCity,
  onRefreshLocation,
  isLocating,
  activeTab,
  setActiveTab,
}) => {
  const { 
    userProfile, 
    role, 
    isAdmin, 
    isProfessional, 
    isClient, 
    switchDemoUser, 
    signInWithGoogle, 
    signOut 
  } = useAuth();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-2.5 text-left group focus:outline-hidden"
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <Wrench className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 font-sans">
                    Ajuda<span className="text-amber-500">Já</span>
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-900 text-amber-400 tracking-wider uppercase">
                    AO 🇦🇴
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium hidden sm:block">
                  Encontre quem pode ajudar
                </p>
              </div>
            </button>

            {/* Location Indicator */}
            <div className="hidden md:flex items-center ml-4 pl-4 border-l border-slate-200">
              <button
                onClick={onRefreshLocation}
                disabled={isLocating}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200/60"
                title="Clique para atualizar sua localização GPS"
              >
                <MapPin className={`w-3.5 h-3.5 text-amber-600 ${isLocating ? 'animate-bounce' : ''}`} />
                <span>{isLocating ? 'A localizar...' : userCity || 'Luanda, Angola'}</span>
                <Navigation className="w-3 h-3 text-slate-400 ml-0.5" />
              </button>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {isClient && (
              <>
                <button
                  onClick={() => setActiveTab('home')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'home'
                      ? 'bg-amber-50 text-amber-600'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Início
                </button>
                <button
                  onClick={() => setActiveTab('explore')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'explore'
                      ? 'bg-amber-50 text-amber-600'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Explorar Profissionais
                </button>
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'requests'
                      ? 'bg-amber-50 text-amber-600'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Meus Pedidos
                </button>
              </>
            )}

            {isProfessional && (
              <>
                <button
                  onClick={() => setActiveTab('pro_dashboard')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'pro_dashboard'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Painel do Profissional
                </button>
                <button
                  onClick={() => setActiveTab('pro_requests')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'pro_requests'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Pedidos Recebidos
                </button>
                <button
                  onClick={() => setActiveTab('pro_earnings')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'pro_earnings'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Ganhos & Extrato
                </button>
              </>
            )}

            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'admin'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-purple-600 hover:bg-purple-50'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Painel Administrativo
              </button>
            )}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Quick Persona / Role Switcher for Test and RBAC */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
                title="Mudar papel para testes de fluxo"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="capitalize hidden sm:inline">{role}:</span>
                <span className="font-bold text-slate-900 truncate max-w-[90px] sm:max-w-[120px]">
                  {role === 'administrador' ? 'Admin' : role === 'profissional' ? 'Profissional' : 'Cliente'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showRoleMenu && (
                <div 
                  className="absolute right-0 mt-2 w-64 rounded-xl bg-white shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onClick={() => setShowRoleMenu(false)}
                >
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Alternar Modo de Utilização (RBAC)
                  </div>
                  
                  <button
                    onClick={() => {
                      switchDemoUser('cliente');
                      setActiveTab('home');
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs hover:bg-slate-50 ${
                      isClient ? 'bg-amber-50/70 font-bold text-amber-700' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-[10px]">
                        CL
                      </div>
                      <div>
                        <div>Cliente (Ana Paula)</div>
                        <div className="text-[10px] text-slate-400 font-normal">Solicita serviços e avalia</div>
                      </div>
                    </div>
                    {isClient && <CheckCircle2 className="w-4 h-4 text-amber-500" />}
                  </button>

                  <button
                    onClick={() => {
                      switchDemoUser('profissional');
                      setActiveTab('pro_dashboard');
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs hover:bg-slate-50 ${
                      isProfessional ? 'bg-blue-50/70 font-bold text-blue-700' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[10px]">
                        PR
                      </div>
                      <div>
                        <div>Profissional (António - Canalizador)</div>
                        <div className="text-[10px] text-slate-400 font-normal">Aceita pedidos e atualiza status</div>
                      </div>
                    </div>
                    {isProfessional && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                  </button>

                  <button
                    onClick={() => {
                      switchDemoUser('administrador');
                      setActiveTab('admin');
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs hover:bg-slate-50 ${
                      isAdmin ? 'bg-purple-50/70 font-bold text-purple-700' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-[10px]">
                        AD
                      </div>
                      <div>
                        <div>Administrador (Watson Manuel)</div>
                        <div className="text-[10px] text-slate-400 font-normal">Aprova profissionais, gerencia categorias</div>
                      </div>
                    </div>
                    {isAdmin && <CheckCircle2 className="w-4 h-4 text-purple-500" />}
                  </button>

                  <div className="mt-1 pt-1 border-t border-slate-100 px-3 py-1">
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Ative qualquer perfil para testar todo o fluxo do AjudaJá em Angola.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Notifications Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Notificações"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-[10px] font-bold text-white flex items-center justify-center shadow-xs">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Profile Avatar / User Options */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-amber-500/30 transition-all focus:outline-hidden"
              >
                {userProfile?.avatarUrl ? (
                  <img
                    src={userProfile.avatarUrl}
                    alt={userProfile.name}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </button>

              {showUserMenu && (
                <div 
                  className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onClick={() => setShowUserMenu(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {userProfile?.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {userProfile?.email}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        {userProfile?.role}
                      </span>
                      {userProfile?.city && (
                        <span className="text-[10px] text-slate-400">
                          {userProfile.city}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('profile')}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    Meu Perfil
                  </button>

                  <button
                    onClick={() => signInWithGoogle()}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <LogIn className="w-4 h-4 text-amber-500" />
                    Entrar com Conta Google Real
                  </button>

                  <div className="border-t border-slate-100 my-1"></div>

                  <button
                    onClick={() => signOut()}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    Terminar Sessão
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
