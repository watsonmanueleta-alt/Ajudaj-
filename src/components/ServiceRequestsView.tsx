import React, { useState } from 'react';
import { 
  FileText, 
  Clock, 
  MapPin, 
  User, 
  Calendar, 
  MessageSquare, 
  Star, 
  AlertTriangle, 
  CheckCircle2, 
  Truck, 
  Play, 
  XCircle,
  ChevronRight,
  Receipt,
  DollarSign,
  CreditCard
} from 'lucide-react';
import { ServiceRequest, ServiceRequestStatus, UserProfile, PaymentMethodConfig } from '../types/index.ts';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.ts';
import { PayPayPaymentModal } from './PayPayPaymentModal.tsx';

interface ServiceRequestsViewProps {
  requests: ServiceRequest[];
  currentUser: UserProfile;
  commissionRate?: number;
  availableMethods?: PaymentMethodConfig[];
  onOpenChat: (request: ServiceRequest) => void;
  onOpenReview: (request: ServiceRequest) => void;
  onOpenComplaint: (request: ServiceRequest) => void;
  onRequestStatusUpdated: () => void;
}

const STATUS_STEPS: { key: ServiceRequestStatus; label: string; icon: any }[] = [
  { key: 'pendente', label: 'Pendente', icon: Clock },
  { key: 'aceito', label: 'Aceito', icon: CheckCircle2 },
  { key: 'a_caminho', label: 'A Caminho', icon: Truck },
  { key: 'em_andamento', label: 'Em Andamento', icon: Play },
  { key: 'concluido', label: 'Concluído', icon: CheckCircle2 },
];

export const ServiceRequestsView: React.FC<ServiceRequestsViewProps> = ({
  requests,
  currentUser,
  commissionRate = 10,
  availableMethods,
  onOpenChat,
  onOpenReview,
  onOpenComplaint,
  onRequestStatusUpdated,
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedPayPayRequest, setSelectedPayPayRequest] = useState<ServiceRequest | null>(null);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);

  const filteredRequests = requests.filter((r) => {
    if (filter === 'active') {
      return ['pendente', 'aceito', 'a_caminho', 'em_andamento'].includes(r.status);
    }
    if (filter === 'completed') {
      return r.status === 'concluido';
    }
    return true;
  });

  const getStatusBadge = (status: ServiceRequestStatus) => {
    switch (status) {
      case 'pendente':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">Pendente de Aceitação</span>;
      case 'aceito':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">Aceito pelo Profissional</span>;
      case 'a_caminho':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">Profissional a Caminho</span>;
      case 'em_andamento':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Serviço em Andamento</span>;
      case 'concluido':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-2xs">Serviço Concluído</span>;
      case 'cancelado':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">Cancelado</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    setUpdatingId(requestId);
    try {
      await updateDoc(doc(db, 'service_requests', requestId), {
        status: 'cancelado',
        cancellationReason: 'Cancelado pelo cliente',
        updatedAt: new Date().toISOString(),
      });
      setCancelConfirmId(null);
      onRequestStatusUpdated();
    } catch (e) {
      console.error('Erro ao cancelar pedido:', e);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Title & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Meus Pedidos de Serviço
          </h1>
          <p className="text-xs text-slate-500">
            Acompanhe o estado das suas solicitações em tempo real
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/80 self-start">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({requests.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === 'active' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ativos
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === 'completed' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Concluídos
          </button>
        </div>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-3 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Você ainda não fez nenhum pedido.
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Quando solicitar um canalizador, eletricista, mecânico ou outro serviço no AjudaJá, o progresso aparecerá aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const currentStepIdx = STATUS_STEPS.findIndex(s => s.key === req.status);
            const isCompleted = req.status === 'concluido';
            const isCancelled = req.status === 'cancelado';

            return (
              <div
                key={req.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-5 sm:p-6 space-y-4"
              >
                {/* Header of Request Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md">
                        {req.categoryName}
                      </span>
                      <h3 className="text-base font-bold text-slate-900">
                        {req.title}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Atribuído a: <strong className="text-slate-800">{req.professionalName}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(req.status)}
                  </div>
                </div>

                {/* Progress Steps Timeline (only if not cancelled) */}
                {!isCancelled && (
                  <div className="py-2 overflow-x-auto">
                    <div className="flex items-center justify-between min-w-[340px]">
                      {STATUS_STEPS.map((step, idx) => {
                        const isReached = currentStepIdx >= idx;
                        const isCurrent = currentStepIdx === idx;
                        return (
                          <div key={step.key} className="flex-1 flex flex-col items-center relative group">
                            {idx > 0 && (
                              <div 
                                className={`absolute top-3.5 right-1/2 left-[-50%] h-0.5 -z-0 transition-colors ${
                                  isReached ? 'bg-amber-500' : 'bg-slate-200'
                                }`}
                              />
                            )}
                            <div 
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all z-10 ${
                                isCurrent
                                  ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/20 shadow-md scale-110'
                                  : isReached
                                  ? 'bg-amber-500 text-slate-950'
                                  : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              {idx + 1}
                            </div>
                            <span 
                              className={`text-[10px] font-semibold mt-1 text-center truncate max-w-[70px] ${
                                isCurrent ? 'text-amber-700 font-bold' : isReached ? 'text-slate-800' : 'text-slate-400'
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Description & Details */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2">
                  <p className="text-slate-700 leading-relaxed">
                    {req.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-slate-600">
                    <span className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {req.address || `${req.city}, ${req.province}`}
                    </span>
                    <span className="flex items-center gap-1.5 truncate">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {req.scheduledDate} às {req.scheduledTime}
                    </span>
                    <span className="flex items-center gap-1.5 font-bold text-slate-900">
                      <Receipt className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      Orçamento: {(req.finalPrice || req.estimatedBudget || 0).toLocaleString('pt-AO')} Kz
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Chat Button */}
                    <button
                      onClick={() => onOpenChat(req)}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                      <span>Mensagens / Chat</span>
                    </button>

                    {/* Complaint button */}
                    <button
                      onClick={() => onOpenComplaint(req)}
                      className="px-3 py-2 rounded-xl bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-semibold text-xs border border-slate-200 hover:border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                      <span className="hidden sm:inline">Reportar Problema</span>
                    </button>

                    {/* Payment Button (Multiprovider: PayPay, Multicaixa, AppyPay, Dinheiro) */}
                    {['aceito', 'a_caminho', 'em_andamento', 'concluido'].includes(req.status) && (
                      <button
                        onClick={() => setSelectedPayPayRequest(req)}
                        className="px-3.5 py-2 rounded-xl bg-purple-900 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer group border border-purple-700 hover:border-purple-500"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-amber-300 group-hover:scale-110 transition-transform" />
                        <span>Efetuar Pagamento</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Review Button if completed and not rated */}
                    {isCompleted && !req.isRated && (
                      <button
                        onClick={() => onOpenReview(req)}
                        className="px-4 py-2 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs shadow-md flex items-center gap-1 cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5 fill-slate-950" />
                        <span>Avaliar Profissional</span>
                      </button>
                    )}

                    {isCompleted && req.isRated && (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Já avaliado
                      </span>
                    )}

                    {/* Cancel button if still pending */}
                    {req.status === 'pendente' && (
                      cancelConfirmId === req.id ? (
                        <div className="flex items-center gap-1.5 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200">
                          <span className="text-[11px] text-rose-800 font-semibold">Cancelar?</span>
                          <button
                            onClick={() => handleCancelRequest(req.id)}
                            disabled={updatingId === req.id}
                            className="text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 px-2 py-0.5 rounded cursor-pointer transition-colors"
                          >
                            Sim
                          </button>
                          <button
                            onClick={() => setCancelConfirmId(null)}
                            className="text-[11px] font-medium text-slate-600 hover:text-slate-800 px-1.5 py-0.5 rounded cursor-pointer"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setCancelConfirmId(req.id)}
                          disabled={updatingId === req.id}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline px-2 py-1 cursor-pointer"
                        >
                          Cancelar Pedido
                        </button>
                      )
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Payment Checkout */}
      {selectedPayPayRequest && (
        <PayPayPaymentModal
          request={selectedPayPayRequest}
          currentUser={currentUser}
          commissionRate={commissionRate}
          availableMethods={availableMethods}
          onClose={() => setSelectedPayPayRequest(null)}
          onPaymentSuccess={() => {
            setSelectedPayPayRequest(null);
            onRequestStatusUpdated();
          }}
        />
      )}

    </div>
  );
};
