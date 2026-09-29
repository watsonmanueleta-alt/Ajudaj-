import React, { useState } from 'react';
import { 
  Briefcase, 
  DollarSign, 
  Star, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Truck, 
  Play, 
  XCircle, 
  MessageSquare, 
  User, 
  MapPin, 
  Calendar,
  ShieldCheck,
  TrendingUp,
  Receipt,
  ArrowUpRight
} from 'lucide-react';
import { 
  Professional, 
  ServiceRequest, 
  ServiceRequestStatus, 
  UserProfile, 
  AvailabilityStatus,
  Transaction
} from '../types/index.ts';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.ts';
import { PaymentService } from '../services/paymentService.ts';

interface ProfessionalDashboardProps {
  professional: Professional | null;
  requests: ServiceRequest[];
  currentUser: UserProfile;
  commissionRate: number; // e.g. 10
  onOpenChat: (request: ServiceRequest) => void;
  onRefresh: () => void;
}

export const ProfessionalDashboard: React.FC<ProfessionalDashboardProps> = ({
  professional,
  requests,
  currentUser,
  commissionRate = 10,
  onOpenChat,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'new_orders' | 'active_jobs' | 'completed' | 'earnings'>('overview');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const pendingRequests = requests.filter(r => r.status === 'pendente');
  const activeJobs = requests.filter(r => ['aceito', 'a_caminho', 'em_andamento'].includes(r.status));
  const completedJobs = requests.filter(r => r.status === 'concluido');

  // Calculate earnings
  const totalVolume = completedJobs.reduce((acc, r) => acc + (r.finalPrice || r.estimatedBudget || 0), 0);
  const totalCommission = Math.round((totalVolume * commissionRate) / 100);
  const netEarnings = totalVolume - totalCommission;

  // Handle Availability Toggle
  const handleToggleAvailability = async (newStatus: AvailabilityStatus) => {
    if (!professional) return;
    try {
      await updateDoc(doc(db, 'professionals', professional.id || `prof_${currentUser.uid}`), {
        availability: newStatus,
        updatedAt: new Date().toISOString(),
      });
      onRefresh();
    } catch (e) {
      console.error('Erro ao atualizar disponibilidade:', e);
    }
  };

  // Handle Request Status Changes
  const handleUpdateStatus = async (
    requestId: string, 
    newStatus: ServiceRequestStatus, 
    extraData?: Partial<ServiceRequest>
  ) => {
    setUpdatingId(requestId);
    try {
      const now = new Date().toISOString();
      const reqDocRef = doc(db, 'service_requests', requestId);
      
      const payload: any = {
        status: newStatus,
        updatedAt: now,
        ...extraData,
      };

      // If accepted, ensure professional ID and name are recorded
      if (newStatus === 'aceito') {
        payload.professionalId = currentUser.uid;
        payload.professionalName = professional?.businessName || professional?.fullName || currentUser.name;
      }

      await updateDoc(reqDocRef, payload);

      // If status completed, create transaction record in /transactions
      if (newStatus === 'concluido') {
        const targetReq = requests.find(r => r.id === requestId);
        const amount = targetReq?.finalPrice || targetReq?.estimatedBudget || 5000;
        const paymentService = PaymentService.getInstance();
        const txData = await paymentService.createTransaction({
          requestId,
          customerId: targetReq?.customerId || '',
          professionalId: currentUser.uid,
          amount,
          commissionRate,
        });

        const txId = `tx_${Date.now()}`;
        await setDoc(doc(db, 'transactions', txId), {
          id: txId,
          ...txData,
        });

        // Also increment completedJobsCount on professional
        if (professional) {
          await updateDoc(doc(db, 'professionals', professional.id || `prof_${currentUser.uid}`), {
            completedJobsCount: (professional.completedJobsCount || 0) + 1,
            updatedAt: now,
          });
        }
      }

      // Send in-app notification to customer
      const targetReq = requests.find(r => r.id === requestId);
      if (targetReq?.customerId) {
        let msg = '';
        if (newStatus === 'aceito') msg = 'O seu pedido de serviço foi aceito!';
        if (newStatus === 'a_caminho') msg = 'O profissional está a caminho do seu local.';
        if (newStatus === 'em_andamento') msg = 'O serviço foi iniciado no seu local.';
        if (newStatus === 'concluido') msg = 'O serviço foi concluído! Por favor avalie o profissional.';
        if (newStatus === 'cancelado') msg = 'O pedido foi recusado pelo profissional.';

        if (msg) {
          const notifId = `notif_${Date.now()}`;
          await setDoc(doc(db, 'notifications', notifId), {
            id: notifId,
            userId: targetReq.customerId,
            title: 'Atualização do Pedido',
            message: msg,
            type: 'status',
            requestId,
            read: false,
            createdAt: now,
          });
        }
      }

      onRefresh();
    } catch (err) {
      console.error('Falha ao atualizar estado do pedido:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Top Banner / Professional Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&auto=format&fit=crop&q=80'}
              alt={currentUser.name}
              className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-2xs"
            />
            <span
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                professional?.availability === 'disponivel'
                  ? 'bg-emerald-500'
                  : professional?.availability === 'ocupado'
                  ? 'bg-amber-500'
                  : 'bg-slate-400'
              }`}
            />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                {professional?.businessName || currentUser.name}
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {professional?.status === 'verificado' ? '✓ Profissional Verificado' : '⏳ Em Verificação'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {professional?.categoryName || 'Prestador de Serviços'} • {professional?.city || 'Luanda'}, {professional?.province || 'Angola'}
            </p>
          </div>
        </div>

        {/* Availability Switch */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold text-slate-600 pl-2">Estado:</span>
          {(['disponivel', 'ocupado', 'indisponivel'] as AvailabilityStatus[]).map((st) => (
            <button
              key={st}
              onClick={() => handleToggleAvailability(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                professional?.availability === st
                  ? st === 'disponivel'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : st === 'ocupado'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-slate-700 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-amber-500 mb-2">
            <span className="text-xs font-bold text-slate-500">Novos Pedidos</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{pendingRequests.length}</p>
          <span className="text-[10px] text-amber-600 font-semibold">Aguardam resposta</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-bold text-slate-500">Em Andamento</span>
            <Play className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{activeJobs.length}</p>
          <span className="text-[10px] text-blue-600 font-semibold">Serviços ativos</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-bold text-slate-500">Concluídos</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{completedJobs.length}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">Total finalizados</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-amber-500 mb-2">
            <span className="text-xs font-bold text-slate-500">Ganhos Líquidos</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 truncate">
            {netEarnings.toLocaleString('pt-AO')} <span className="text-xs font-bold text-slate-500">Kz</span>
          </p>
          <span className="text-[10px] text-slate-400 font-medium">Comissão retida: {commissionRate}%</span>
        </div>

      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Visão Geral
        </button>

        <button
          onClick={() => setActiveTab('new_orders')}
          className={`relative px-3.5 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all ${
            activeTab === 'new_orders'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>Novos Pedidos ({pendingRequests.length})</span>
          {pendingRequests.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[10px]">
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('active_jobs')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all ${
            activeTab === 'active_jobs'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Em Andamento ({activeJobs.length})
        </button>

        <button
          onClick={() => setActiveTab('earnings')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all ${
            activeTab === 'earnings'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Ganhos & Extrato
        </button>
      </div>

      {/* Tab Content: New Orders */}
      {(activeTab === 'overview' || activeTab === 'new_orders') && pendingRequests.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
              <span>Pedidos Aguardando Resposta ({pendingRequests.length})</span>
            </h2>
          </div>

          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-2xl border-2 border-amber-300 p-5 shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md">
                      {req.categoryName}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {req.title}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Cliente: <strong className="text-slate-800">{req.customerName}</strong> ({req.customerPhone || 'Telefone disponível no pedido'})
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Orçamento Previsto</span>
                    <span className="text-base font-extrabold text-slate-900">
                      {(req.estimatedBudget || 5000).toLocaleString('pt-AO')} Kz
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl">
                  {req.description}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {req.address || `${req.city}, ${req.province}`}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {req.scheduledDate} às {req.scheduledTime}
                    </span>
                  </div>

                  {/* Actions for New Order */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenChat(req)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                      <span>Conversar</span>
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(req.id, 'cancelado', { cancellationReason: 'Recusado pelo profissional' })}
                      disabled={updatingId === req.id}
                      className="px-3 py-1.5 rounded-xl border border-rose-200 text-xs font-bold text-rose-600 hover:bg-rose-50"
                    >
                      Recusar
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(req.id, 'aceito')}
                      disabled={updatingId === req.id}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Aceitar Pedido</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tab Content: Active Jobs */}
      {(activeTab === 'overview' || activeTab === 'active_jobs') && activeJobs.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Serviços em Execução ({activeJobs.length})
          </h2>

          <div className="space-y-3">
            {activeJobs.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md">
                        {req.categoryName}
                      </span>
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md capitalize">
                        Estado: {req.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {req.title}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Cliente: <strong>{req.customerName}</strong> ({req.customerPhone || '923 000 000'})
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-extrabold text-slate-900">
                      {(req.finalPrice || req.estimatedBudget || 0).toLocaleString('pt-AO')} Kz
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {req.address || `${req.city}, ${req.province}`}
                  </span>

                  {/* Flow Progression Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenChat(req)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat</span>
                    </button>

                    {req.status === 'aceito' && (
                      <button
                        onClick={() => handleUpdateStatus(req.id, 'a_caminho')}
                        disabled={updatingId === req.id}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 shadow-2xs"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Marcar "A Caminho"</span>
                      </button>
                    )}

                    {req.status === 'a_caminho' && (
                      <button
                        onClick={() => handleUpdateStatus(req.id, 'em_andamento')}
                        disabled={updatingId === req.id}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-2xs"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Iniciar "Em Andamento"</span>
                      </button>
                    )}

                    {req.status === 'em_andamento' && (
                      <button
                        onClick={() => {
                          const priceStr = prompt('Confirme o valor final do serviço em Kwanzas (Kz):', String(req.estimatedBudget || 5000));
                          const finalPrice = priceStr ? Number(priceStr) : req.estimatedBudget || 5000;
                          handleUpdateStatus(req.id, 'concluido', { finalPrice });
                        }}
                        disabled={updatingId === req.id}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-md"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Concluir Serviço</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tab Content: Earnings & Financial Breakdown */}
      {activeTab === 'earnings' && (
        <section className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Extrato Financeiro e Repasses
            </h2>
            <p className="text-xs text-slate-500">
              Cálculo automático de comissões conforme política da plataforma AjudaJá Angola
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Volume Total Faturado</span>
                <span className="text-lg font-extrabold text-slate-900">{totalVolume.toLocaleString('pt-AO')} Kz</span>
              </div>
              <div className="border-x border-slate-200 px-3">
                <span className="text-[10px] text-amber-700 font-bold uppercase block">Comissão Plataforma ({commissionRate}%)</span>
                <span className="text-lg font-extrabold text-amber-700">-{totalCommission.toLocaleString('pt-AO')} Kz</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-700 font-bold uppercase block">Seu Ganho Líquido</span>
                <span className="text-xl font-extrabold text-emerald-600">{netEarnings.toLocaleString('pt-AO')} Kz</span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Histórico de Serviços Faturados
              </h3>
              {completedJobs.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">Nenhum serviço finalizado até ao momento.</p>
              ) : (
                completedJobs.map((job) => {
                  const val = job.finalPrice || job.estimatedBudget || 0;
                  const comm = Math.round((val * commissionRate) / 100);
                  const net = val - comm;
                  return (
                    <div key={job.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{job.title}</span>
                        <span className="text-slate-400 block text-[10px]">Cliente: {job.customerName} · {job.scheduledDate}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-slate-900">{val.toLocaleString('pt-AO')} Kz</span>
                        <span className="text-[10px] text-emerald-600 font-bold block">Líquido: {net.toLocaleString('pt-AO')} Kz</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      )}

      {/* If no pending and no active jobs in overview */}
      {activeTab === 'overview' && pendingRequests.length === 0 && activeJobs.length === 0 && (
        <div className="p-10 rounded-3xl bg-white border border-slate-200 text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">Tudo em dia!</h3>
          <p className="text-xs text-slate-500">
            Você não possui pedidos pendentes no momento. Mantenha a sua disponibilidade ativa para receber solicitações de clientes em Angola.
          </p>
        </div>
      )}

    </div>
  );
};
