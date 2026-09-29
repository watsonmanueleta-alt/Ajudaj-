import React, { useState } from 'react';
import { 
  Users, 
  Briefcase, 
  FileText, 
  Layers, 
  Star, 
  AlertTriangle, 
  DollarSign, 
  Settings, 
  Check, 
  X, 
  Search, 
  Filter, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  TrendingUp,
  Save,
  CheckCircle2,
  Clock,
  Ban,
  CreditCard,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Info,
  RefreshCw,
  AlertCircle,
  Banknote,
  Smartphone,
  Building2
} from 'lucide-react';
import { 
  Professional, 
  Category, 
  ServiceRequest, 
  Complaint, 
  Review, 
  AdminSettings, 
  UserProfile,
  ProfessionalStatus,
  ComplaintStatus,
  Transaction,
  PaymentStatus,
  PaymentMethodConfig
} from '../types/index.ts';
import { doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.ts';

interface AdminPanelProps {
  professionals: Professional[];
  categories: Category[];
  requests: ServiceRequest[];
  complaints: Complaint[];
  reviews: Review[];
  settings: AdminSettings;
  transactions?: Transaction[];
  onRefreshData: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  professionals,
  categories,
  requests,
  complaints,
  reviews,
  settings,
  transactions = [],
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'professionals' | 'requests' | 'categories' | 'complaints' | 'finance' | 'settings'
  >('dashboard');

  const [financeSubTab, setFinanceSubTab] = useState<'paypay' | 'mcx' | 'appy' | 'cash' | 'all'>('paypay');

  // Settings form states
  const [commissionRate, setCommissionRate] = useState<number>(settings.commissionRate || 10);
  const [contactPhone, setContactPhone] = useState(settings.contactPhone || '+244 923 000 111');
  const [contactEmail, setContactEmail] = useState(settings.contactEmail || 'suporte@ajudaja.ao');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Modular Payment Methods Configuration
  const initialMethods: PaymentMethodConfig[] = settings.paymentMethods && settings.paymentMethods.length > 0
    ? settings.paymentMethods
    : [
        {
          id: 'paypay',
          name: 'PayPay',
          provider: 'PayPayProvider',
          isActive: settings.paypayEnabled ?? true,
          isConfigured: false,
          statusLabel: 'Preparado — aguardando configuração oficial',
          feesDescription: `Comissão AjudaJá (${commissionRate}%)`,
          activatedAt: '25/09/2026',
          description: 'Carteira digital angolana PayPay (Pagamento Móvel / QR Code)',
          instructions: 'Transação criada no sistema AjudaJá e enviada ao backend PayPay.',
        },
        {
          id: 'mcx_express',
          name: 'Multicaixa Express',
          provider: 'MulticaixaProvider',
          isActive: settings.multicaixaEnabled ?? true,
          isConfigured: false,
          statusLabel: 'Não configurado (aguarda certificação EMIS)',
          feesDescription: `Comissão AjudaJá (${commissionRate}%)`,
          activatedAt: '25/09/2026',
          description: 'Rede interbancária Multicaixa Express EMIS / GPO',
          instructions: 'Confirmação via notificação no telemóvel associado ao MCX.',
        },
        {
          id: 'appypay',
          name: 'AppyPay',
          provider: 'AppyPayProvider',
          isActive: settings.appypayEnabled ?? true,
          isConfigured: false,
          statusLabel: 'Não configurado (aguarda credenciais)',
          feesDescription: `Comissão AjudaJá (${commissionRate}%)`,
          activatedAt: '25/09/2026',
          description: 'Gateway e carteira digital AppyPay Angola',
          instructions: 'Pagamento através da carteira AppyPay.',
        },
        {
          id: 'cash',
          name: 'Dinheiro ao Profissional',
          provider: 'CashPaymentProvider',
          isActive: settings.cashEnabled ?? true,
          isConfigured: true,
          statusLabel: 'Ativo e Disponível',
          feesDescription: 'Sem taxa de gateway (comissão ajustada com o profissional)',
          activatedAt: '25/09/2026',
          description: 'Pagamento presencial em Kwanzas (Kz)',
          instructions: 'Entregue o valor diretamente ao profissional após o serviço.',
        },
      ];

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>(initialMethods);

  React.useEffect(() => {
    if (settings.paymentMethods && settings.paymentMethods.length > 0) {
      setPaymentMethods(settings.paymentMethods);
    }
    if (settings.commissionRate !== undefined) {
      setCommissionRate(settings.commissionRate);
    }
  }, [settings.paymentMethods, settings.commissionRate]);

  const handleToggleMethod = (methodId: string) => {
    setPaymentMethods(prev =>
      prev.map(m => (m.id === methodId ? { ...m, isActive: !m.isActive } : m))
    );
  };

  const [profSearch, setProfSearch] = useState('');
  const [profStatusFilter, setProfStatusFilter] = useState<string>('all');
  const [updatingProfId, setUpdatingProfId] = useState<string | null>(null);

  // Category modal states
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);

  // Metrics
  const totalVerifiedProfs = professionals.filter(p => p.status === 'verificado').length;
  const pendingProfs = professionals.filter(p => p.status === 'pendente');
  const completedRequests = requests.filter(r => r.status === 'concluido');
  const openComplaints = complaints.filter(c => c.status === 'aberta' || c.status === 'em_analise');
  
  const totalGrossVolume = completedRequests.reduce((sum, r) => sum + (r.finalPrice || r.estimatedBudget || 0), 0);
  const platformRevenue = Math.round((totalGrossVolume * (commissionRate / 100)));

  // Filtered professionals
  const filteredProfessionals = professionals.filter((p) => {
    if (profStatusFilter !== 'all' && p.status !== profStatusFilter) return false;
    if (profSearch.trim()) {
      const q = profSearch.toLowerCase();
      return (
        p.fullName.toLowerCase().includes(q) ||
        p.businessName.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        p.phone.includes(q)
      );
    }
    return true;
  });

  // Action: update professional status (verify, reject, suspend)
  const handleUpdateProfStatus = async (profId: string, newStatus: ProfessionalStatus) => {
    setUpdatingProfId(profId);
    try {
      await updateDoc(doc(db, 'professionals', profId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      onRefreshData();
    } catch (err) {
      console.error('Falha ao atualizar estado do profissional:', err);
    } finally {
      setUpdatingProfId(null);
    }
  };

  // Action: save category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.name) return;

    try {
      const id = editingCategory.id || editingCategory.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_');
      const catData: Category = {
        id,
        name: editingCategory.name,
        slug: editingCategory.slug || id,
        icon: editingCategory.icon || 'Wrench',
        description: editingCategory.description || '',
        subcategories: Array.isArray(editingCategory.subcategories) 
          ? editingCategory.subcategories 
          : typeof (editingCategory.subcategories as any) === 'string'
          ? (editingCategory.subcategories as any).split(',').map((s: string) => s.trim())
          : [],
        isActive: editingCategory.isActive ?? true,
        order: editingCategory.order || categories.length + 1,
      };

      await setDoc(doc(db, 'categories', id), catData);
      setIsEditingCategory(false);
      setEditingCategory(null);
      onRefreshData();
    } catch (err) {
      console.error('Erro ao guardar categoria:', err);
    }
  };

  // Action: update complaint status
  const handleUpdateComplaintStatus = async (complaintId: string, newStatus: ComplaintStatus, notes?: string) => {
    try {
      await updateDoc(doc(db, 'complaints', complaintId), {
        status: newStatus,
        adminNotes: notes || 'Atualizado pela moderação administrativa',
        updatedAt: new Date().toISOString(),
      });
      onRefreshData();
    } catch (err) {
      console.error('Erro ao atualizar reclamação:', err);
    }
  };

  // Action: save platform settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsSuccess(false);
    try {
      await setDoc(doc(db, 'admin_settings', 'general'), {
        commissionRate: Number(commissionRate),
        contactPhone,
        contactEmail,
        currency: 'Kz',
        paymentMethods,
        paypayEnabled: paymentMethods.find(m => m.id === 'paypay')?.isActive ?? true,
        multicaixaEnabled: paymentMethods.find(m => m.id === 'mcx_express')?.isActive ?? true,
        appypayEnabled: paymentMethods.find(m => m.id === 'appypay')?.isActive ?? true,
        cashEnabled: paymentMethods.find(m => m.id === 'cash')?.isActive ?? true,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
      onRefreshData();
    } catch (err) {
      console.error('Erro ao guardar configurações:', err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Helper for Payment Status Badge
  const renderPaymentStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'pendente':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" />
            PENDENTE
          </span>
        );
      case 'processando':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 inline-flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
            PROCESSANDO
          </span>
        );
      case 'pago':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            PAGO
          </span>
        );
      case 'falhou':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            FALHOU
          </span>
        );
      case 'cancelado':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            CANCELADO
          </span>
        );
      case 'reembolsado':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
            REEMBOLSADO
          </span>
        );
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  const paypayTransactions = transactions.filter(
    (t) => t.paymentMethod?.toLowerCase().includes('paypay') || t.providerCode === 'paypay'
  );
  const mcxTransactions = transactions.filter(
    (t) => t.paymentMethod?.toLowerCase().includes('multicaixa') || t.providerCode === 'mcx_express'
  );
  const appyTransactions = transactions.filter(
    (t) => t.paymentMethod?.toLowerCase().includes('appy') || t.providerCode === 'appypay'
  );
  const cashTransactions = transactions.filter(
    (t) => t.paymentMethod?.toLowerCase().includes('dinheiro') || t.providerCode === 'cash'
  );

  const displayedTransactions = 
    financeSubTab === 'paypay' ? paypayTransactions :
    financeSubTab === 'mcx' ? mcxTransactions :
    financeSubTab === 'appy' ? appyTransactions :
    financeSubTab === 'cash' ? cashTransactions :
    transactions;

  const paypayTotalVolume = paypayTransactions.reduce((acc, t) => acc + (t.amount || 0), 0);
  const paypayTotalCommission = paypayTransactions.reduce((acc, t) => acc + (t.commissionAmount || 0), 0);

  return (
    <div className="space-y-6 pb-20">
      
      {/* Admin Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold mb-2 border border-purple-500/30">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Painel de Controlo Global · AjudaJá Angola</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Administração Central do Sistema
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Gestão de utilizadores, moderação de profissionais, fluxo de pedidos e configurações financeiras.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/10 text-slate-200">
            Comissão Atual: <strong className="text-amber-400">{commissionRate}%</strong>
          </span>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        {[
          { key: 'dashboard', label: 'Dashboard', icon: TrendingUp },
          { key: 'professionals', label: `Profissionais (${professionals.length})`, icon: Briefcase },
          { key: 'requests', label: `Pedidos (${requests.length})`, icon: FileText },
          { key: 'categories', label: `Categorias (${categories.length})`, icon: Layers },
          { key: 'complaints', label: `Reclamações (${complaints.length})`, icon: AlertTriangle },
          { key: 'finance', label: 'Finanças & Pagamentos', icon: DollarSign },
          { key: 'settings', label: 'Configurações', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                isActive
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* VIEW: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-400 block mb-1">Profissionais Verificados</span>
              <p className="text-2xl font-extrabold text-slate-900">{totalVerifiedProfs}</p>
              <span className="text-[10px] text-emerald-600 font-semibold">{pendingProfs.length} pendentes de aprovação</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-400 block mb-1">Total de Pedidos</span>
              <p className="text-2xl font-extrabold text-slate-900">{requests.length}</p>
              <span className="text-[10px] text-blue-600 font-semibold">{completedRequests.length} concluídos com sucesso</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-400 block mb-1">Disputas Abertas</span>
              <p className="text-2xl font-extrabold text-slate-900">{openComplaints.length}</p>
              <span className="text-[10px] text-rose-600 font-semibold">{complaints.length} reclamações totais</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-400 block mb-1">Receita da Plataforma</span>
              <p className="text-xl sm:text-2xl font-extrabold text-purple-700 truncate">
                {platformRevenue.toLocaleString('pt-AO')} <span className="text-xs font-bold text-slate-500">Kz</span>
              </p>
              <span className="text-[10px] text-slate-400 font-medium">Com base em {commissionRate}% de comissão</span>
            </div>
          </div>

          {/* Pending Professionals Alert */}
          {pendingProfs.length > 0 && (
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <h3 className="text-sm font-bold text-amber-900">
                    Existem {pendingProfs.length} profissionais aguardando aprovação documental!
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('professionals');
                    setProfStatusFilter('pendente');
                  }}
                  className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  Moderar agora
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {pendingProfs.map(p => (
                  <div key={p.id} className="p-3 bg-white rounded-xl border border-amber-200 flex items-center justify-between">
                    <div>
                      <strong className="text-slate-900">{p.fullName}</strong>
                      <span className="text-slate-500 block text-[11px]">{p.categoryName} • {p.city}, {p.province}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleUpdateProfStatus(p.id!, 'verificado')}
                        className="px-2.5 py-1 rounded-md bg-emerald-600 text-white font-bold text-[10px]"
                      >
                        Aprovar
                      </button>
                      <button
                        onClick={() => handleUpdateProfStatus(p.id!, 'rejeitado')}
                        className="px-2 py-1 rounded-md bg-rose-600 text-white font-bold text-[10px]"
                      >
                        Rejeitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Orders Overview */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Últimos Pedidos na Plataforma</h3>
            <div className="divide-y divide-slate-100 text-xs">
              {requests.slice(0, 5).map(r => (
                <div key={r.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{r.title}</span>
                    <span className="text-slate-400 block text-[10px]">Cliente: {r.customerName} → {r.professionalName} ({r.city})</span>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 capitalize">
                      {r.status.replace('_', ' ')}
                    </span>
                    <span className="font-bold text-slate-900 block mt-0.5">
                      {(r.finalPrice || r.estimatedBudget || 0).toLocaleString('pt-AO')} Kz
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: PROFESSIONALS MANAGEMENT */}
      {activeTab === 'professionals' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={profSearch}
                onChange={(e) => setProfSearch(e.target.value)}
                placeholder="Pesquisar por nome, categoria, telefone..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={profStatusFilter}
                onChange={(e) => setProfStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
              >
                <option value="all">Todos os Estados</option>
                <option value="verificado">Verificados</option>
                <option value="pendente">Pendentes</option>
                <option value="suspenso">Suspensos</option>
                <option value="rejeitado">Rejeitados</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Profissional</th>
                    <th className="p-3.5">Categoria / Local</th>
                    <th className="p-3.5">Telefone</th>
                    <th className="p-3.5">Estado</th>
                    <th className="p-3.5">Avaliação</th>
                    <th className="p-3.5 text-right">Ações de Moderação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProfessionals.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60">
                      <td className="p-3.5 flex items-center gap-2.5">
                        <img
                          src={p.avatarUrl || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&auto=format&fit=crop&q=80'}
                          alt={p.fullName}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <strong className="text-slate-900 block">{p.businessName || p.fullName}</strong>
                          <span className="text-[10px] text-slate-400">{p.fullName}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-semibold text-slate-800">{p.categoryName}</span>
                        <span className="text-[10px] text-slate-400 block">{p.city}, {p.province}</span>
                      </td>
                      <td className="p-3.5 font-medium text-slate-600">{p.phone}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          p.status === 'verificado' ? 'bg-emerald-100 text-emerald-800' :
                          p.status === 'pendente' ? 'bg-amber-100 text-amber-800' :
                          p.status === 'suspenso' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-800'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">
                        ★ {p.rating.toFixed(1)} ({p.completedJobsCount} trab.)
                      </td>
                      <td className="p-3.5 text-right space-x-1">
                        {p.status !== 'verificado' && (
                          <button
                            onClick={() => handleUpdateProfStatus(p.id!, 'verificado')}
                            disabled={updatingProfId === p.id}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px]"
                          >
                            Aprovar
                          </button>
                        )}
                        {p.status !== 'suspenso' && (
                          <button
                            onClick={() => handleUpdateProfStatus(p.id!, 'suspenso')}
                            disabled={updatingProfId === p.id}
                            className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[10px]"
                          >
                            Suspender
                          </button>
                        )}
                        {p.status === 'suspenso' && (
                          <button
                            onClick={() => handleUpdateProfStatus(p.id!, 'verificado')}
                            disabled={updatingProfId === p.id}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-[10px]"
                          >
                            Reativar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: CATEGORIES MANAGEMENT */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Gerencie as especialidades e subcategorias disponíveis para contratação em Angola.
            </p>

            <button
              onClick={() => {
                setEditingCategory({
                  name: '',
                  icon: 'Wrench',
                  description: '',
                  subcategories: [],
                  isActive: true,
                });
                setIsEditingCategory(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-purple-900 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Categoria</span>
            </button>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((c) => (
              <div key={c.id} className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">{c.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      c.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {c.isActive ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setEditingCategory(c);
                      setIsEditingCategory(true);
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-slate-600">{c.description}</p>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Subcategorias:</span>
                  <div className="flex flex-wrap gap-1">
                    {c.subcategories?.map((sc, i) => (
                      <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                        {sc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Edit / Create Category Modal */}
          {isEditingCategory && editingCategory && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
              <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl border border-slate-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900">
                    {editingCategory.id ? 'Editar Categoria' : 'Adicionar Nova Categoria'}
                  </h3>
                  <button onClick={() => setIsEditingCategory(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nome da Categoria</label>
                    <input
                      type="text"
                      value={editingCategory.name || ''}
                      onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                      required
                      placeholder="Ex: Marcenaria, Pintura, Segurança"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Ícone</label>
                    <input
                      type="text"
                      value={editingCategory.icon || ''}
                      onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                      placeholder="Wrench, Zap, Car, Sparkles, Monitor, Paintbrush"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Descrição</label>
                    <textarea
                      rows={2}
                      value={editingCategory.description || ''}
                      onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                      placeholder="Breve descrição dos serviços cobertos"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Subcategorias (separadas por vírgula)</label>
                    <input
                      type="text"
                      value={Array.isArray(editingCategory.subcategories) ? editingCategory.subcategories.join(', ') : ''}
                      onChange={(e) => setEditingCategory({ 
                        ...editingCategory, 
                        subcategories: e.target.value.split(',').map(s => s.trim()) 
                      })}
                      placeholder="Portas e Janelas, Móveis por Medida, Reparação"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={editingCategory.isActive ?? true}
                      onChange={(e) => setEditingCategory({ ...editingCategory, isActive: e.target.checked })}
                    />
                    <label htmlFor="isActive" className="font-semibold text-slate-700">Categoria Ativa no Catálogo</label>
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingCategory(false)}
                      className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-purple-900 hover:bg-purple-800 text-white font-bold shadow-xs"
                    >
                      Guardar Categoria
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: COMPLAINTS */}
      {activeTab === 'complaints' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900">
            Reclamações & Disputas Registradas ({complaints.length})
          </h3>

          {complaints.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-500">
              Nenhuma reclamação ou disputa ativa.
            </div>
          ) : (
            <div className="space-y-3">
              {complaints.map((c) => (
                <div key={c.id} className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md">
                        {c.reason}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">
                        Reclamação #{c.id?.slice(-6)} · Pedido: {c.requestId}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Aberta por: <strong>{c.userName}</strong> ({c.userRole}) em {new Date(c.createdAt).toLocaleDateString('pt-AO')}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        c.status === 'aberta' ? 'bg-amber-100 text-amber-800' :
                        c.status === 'em_analise' ? 'bg-blue-100 text-blue-800' :
                        c.status === 'resolvida' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {c.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl">
                    {c.description}
                  </p>

                  {c.adminNotes && (
                    <div className="p-2.5 rounded-lg bg-purple-50 text-[11px] text-purple-900 font-medium">
                      <strong>Nota de Resolução:</strong> {c.adminNotes}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleUpdateComplaintStatus(c.id!, 'em_analise', 'Em análise com cliente e profissional')}
                      className="px-3 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Marcar "Em Análise"
                    </button>
                    <button
                      onClick={() => handleUpdateComplaintStatus(c.id!, 'resolvida', 'Disputa mediada e resolvida com ambas as partes')}
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                    >
                      Marcar "Resolvida"
                    </button>
                    <button
                      onClick={() => handleUpdateComplaintStatus(c.id!, 'encerrada', 'Encerrada pela moderação')}
                      className="px-3 py-1 rounded-lg bg-slate-700 text-white text-xs font-bold"
                    >
                      Encerrar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: FINANCE & PAYMENTS */}
      {activeTab === 'finance' && (
        <div className="space-y-6">
          {/* Header KPI cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Volume Geral Transacionado</span>
              <span className="text-xl font-extrabold text-slate-900">{totalGrossVolume.toLocaleString('pt-AO')} Kz</span>
              <span className="text-[10px] text-slate-500 block mt-1">Todos os pedidos concluídos</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-purple-600 font-bold uppercase block mb-1">Volume PayPay Angola</span>
              <span className="text-xl font-extrabold text-purple-900">{paypayTotalVolume.toLocaleString('pt-AO')} Kz</span>
              <span className="text-[10px] text-purple-600 font-semibold block mt-1">{paypayTransactions.length} transação(ões) registadas</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-amber-600 font-bold uppercase block mb-1">Comissões AjudaJá ({commissionRate}%)</span>
              <span className="text-xl font-extrabold text-amber-600">{platformRevenue.toLocaleString('pt-AO')} Kz</span>
              <span className="text-[10px] text-slate-500 block mt-1">PayPay: {paypayTotalCommission.toLocaleString('pt-AO')} Kz</span>
            </div>

            <div className="p-4 rounded-2xl bg-linear-to-br from-purple-900 to-indigo-900 text-white shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-amber-300 font-bold uppercase block">Gateway PayPay</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${paymentMethods.find(m => m.id === 'paypay')?.isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
                  {paymentMethods.find(m => m.id === 'paypay')?.isActive ? 'ATIVO' : 'INATIVO'}
                </span>
              </div>
              <span className="text-xs font-bold block mt-2 text-white">Preparado — aguardando credenciais</span>
              <span className="text-[10px] text-purple-200 block mt-1">Arquitetura modular ativa</span>
            </div>
          </div>

          {/* Subtabs for Transactions */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-purple-700" />
                  <span>Transações & Pagamentos</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Histórico de transações registadas através dos fornecedores de pagamento
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start">
                <button
                  onClick={() => setFinanceSubTab('paypay')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    financeSubTab === 'paypay'
                      ? 'bg-purple-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  PayPay ({paypayTransactions.length})
                </button>
                <button
                  onClick={() => setFinanceSubTab('mcx')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    financeSubTab === 'mcx'
                      ? 'bg-blue-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Multicaixa ({mcxTransactions.length})
                </button>
                <button
                  onClick={() => setFinanceSubTab('appy')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    financeSubTab === 'appy'
                      ? 'bg-emerald-800 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  AppyPay ({appyTransactions.length})
                </button>
                <button
                  onClick={() => setFinanceSubTab('cash')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    financeSubTab === 'cash'
                      ? 'bg-amber-800 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Dinheiro ({cashTransactions.length})
                </button>
                <button
                  onClick={() => setFinanceSubTab('all')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    financeSubTab === 'all'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todas ({transactions.length})
                </button>
              </div>
            </div>

            {/* Transactions Table */}
            {(displayedTransactions.length === 0) ? (
              <div className="text-center py-12 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-2">
                <CreditCard className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="font-bold text-slate-700 text-sm">
                  Nenhuma transação encontrada para este filtro
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Quando os clientes efetuarem pagamentos (PayPay, Multicaixa, AppyPay ou Dinheiro) ou os serviços forem concluídos, as transações serão atualizadas em tempo real.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Estado</th>
                      <th className="py-2.5 px-3">Método</th>
                      <th className="py-2.5 px-3">Valor (Kz)</th>
                      <th className="py-2.5 px-3">Comissão AjudaJá</th>
                      <th className="py-2.5 px-3">Data</th>
                      <th className="py-2.5 px-3">ID da Transação</th>
                      <th className="py-2.5 px-3">Pedido Relacionado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedTransactions.map((tx) => {
                      const relatedReq = requests.find((r) => r.id === tx.requestId);
                      return (
                        <tr key={tx.id || tx.gatewayTransactionId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3">
                            {renderPaymentStatusBadge(tx.status)}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-800">
                            {tx.paymentMethod || 'PayPay'}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900 text-sm">
                              {tx.amount.toLocaleString('pt-AO')} Kz
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-purple-700">
                              {tx.commissionAmount.toLocaleString('pt-AO')} Kz
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              ({tx.commissionRate}% de comissão)
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {tx.createdAt ? new Date(tx.createdAt).toLocaleString('pt-AO') : 'Hoje'}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-mono text-[11px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                              {tx.id || tx.gatewayTransactionId || tx.referenceCode}
                            </span>
                            {tx.referenceCode && (
                              <span className="text-[10px] text-slate-400 block font-mono">
                                Ref: {tx.referenceCode}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {relatedReq ? (
                              <div>
                                <span className="font-bold text-slate-800 block truncate max-w-[180px]">
                                  {relatedReq.title || relatedReq.categoryName}
                                </span>
                                <span className="text-[10px] text-slate-400 block font-mono">
                                  ID: {tx.requestId}
                                </span>
                              </div>
                            ) : (
                              <span className="font-mono text-slate-500">{tx.requestId}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Architecture Status Information */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-700" />
              <h4 className="font-bold text-slate-900 text-sm">Arquitetura de Pagamentos Multiprovedor em Angola</h4>
            </div>
            <p className="leading-relaxed">
              O sistema AjudaJá opera com uma arquitetura modular baseada em adaptadores de pagamento (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono">PayPayProvider</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">MulticaixaProvider</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">AppyPayProvider</code> e <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">CashPaymentProvider</code>).
            </p>
            <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-[11px] space-y-1">
              <strong>Segurança e Isolamento:</strong> Todas as chaves e credenciais de API ficam exclusivamente no backend (variáveis de ambiente do servidor) e nunca no frontend. Se um método não estiver configurado, a interface informa claramente ao cliente sem gerar transações falsas.
            </div>
          </div>
        </div>
      )}

      {/* VIEW: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="max-w-3xl bg-white rounded-3xl p-6 border border-slate-200 space-y-6 shadow-xs">
          
          {/* Breadcrumb / Header */}
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-1.5 text-xs text-purple-700 font-bold mb-1">
              <span>Configurações</span>
              <span>→</span>
              <span>Pagamentos</span>
              <span>→</span>
              <span className="text-slate-900">Métodos de pagamento</span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">Gestão dos Métodos de Pagamento</h3>
            <p className="text-xs text-slate-500">
              Ative ou desative os métodos que aparecem para os clientes no momento da solicitação ou conclusão do serviço.
            </p>
          </div>

          {settingsSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Configurações atualizadas com sucesso na base de dados!</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
            
            {/* Payment Methods Grid */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-700" />
                <span>Métodos de Pagamento Configurados</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {paymentMethods.map((method) => {
                  return (
                    <div 
                      key={method.id} 
                      className={`p-4 rounded-2xl border transition-all ${
                        method.isActive 
                          ? 'border-purple-200 bg-purple-50/30 shadow-2xs' 
                          : 'border-slate-200 bg-slate-50 opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {method.name}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              method.isActive 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                : 'bg-slate-200 text-slate-600'
                            }`}>
                              {method.isActive ? 'ATIVO' : 'INATIVO'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                            Provedor: {method.provider}
                          </span>
                        </div>

                        {/* Toggle Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleMethod(method.id)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            method.isActive
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs'
                              : 'bg-slate-300 hover:bg-slate-400 text-slate-700'
                          }`}
                        >
                          {method.isActive ? 'ATIVO' : 'INATIVO'}
                        </button>
                      </div>

                      {/* Detail attributes required by prompt */}
                      <div className="space-y-1 text-[11px] text-slate-600 pt-2 border-t border-slate-200/60">
                        <div>
                          <strong className="text-slate-700">Configuração:</strong>{' '}
                          <span className="text-slate-500">{method.statusLabel || method.instructions}</span>
                        </div>
                        <div>
                          <strong className="text-slate-700">Taxas:</strong>{' '}
                          <span className="text-slate-500">{method.feesDescription || `Taxa da plataforma (${commissionRate}%)`}</span>
                        </div>
                        <div>
                          <strong className="text-slate-700">Data de ativação:</strong>{' '}
                          <span className="text-slate-500">{method.activatedAt || '25/09/2026'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PayPay Backend Environment Notice */}
            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-purple-900 text-xs">
                <Info className="w-4 h-4 text-purple-700" />
                <span>Configuração de Variáveis de Ambiente no Servidor (PayPay Angola)</span>
              </div>
              <p className="text-[11px] text-purple-800 leading-relaxed">
                As credenciais do PayPay ficam exclusivamente protegidas no ficheiro <code>.env</code> do servidor backend (porta 3000):
              </p>
              <div className="p-2.5 rounded-lg bg-white/90 border border-purple-200 font-mono text-[10px] text-slate-800 space-y-0.5">
                <div>PAYPAY_ENABLED={paymentMethods.find(m => m.id === 'paypay')?.isActive ? 'true' : 'false'}</div>
                <div>PAYPAY_API_URL="" # URL oficial da API fornecida pelo PayPay</div>
                <div>PAYPAY_API_KEY="" # Chave de API oficial fornecida pelo PayPay</div>
                <div>PAYPAY_MERCHANT_ID="" # Identificador de comerciante oficial</div>
                <div>PAYPAY_WEBHOOK_SECRET="" # Segredo para validação de assinatura de webhook</div>
              </div>
            </div>

            {/* Commission Rate - Configurable via DEFAULT_COMMISSION_RATE */}
            <div className="pt-2 border-t border-slate-200">
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Taxa de Comissão da Plataforma (%) *
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={commissionRate}
                onChange={(e) => setCommissionRate(Number(e.target.value))}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-extrabold text-slate-900"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Independente do método de pagamento escolhido. Configurável através de <code>DEFAULT_COMMISSION_RATE</code> e guardada em <code>admin_settings/general</code>. Atualmente: <strong>{commissionRate}%</strong>.
              </span>
            </div>

            {/* Support Phone */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Telefone de Suporte / WhatsApp Angola
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
              />
            </div>

            {/* Support Email */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email de Suporte Central
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingSettings}
                className="w-full py-3.5 rounded-xl bg-purple-900 hover:bg-purple-800 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingSettings ? 'A guardar configurações...' : 'Guardar Alterações'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
