import React, { useState } from 'react';
import { 
  CreditCard, 
  X, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  RefreshCw, 
  Banknote,
  Smartphone,
  Building2,
  Info,
  Check
} from 'lucide-react';
import { ServiceRequest, UserProfile, Transaction, PaymentStatus, PaymentMethodConfig } from '../types/index.ts';
import { PaymentService } from '../services/paymentService.ts';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.ts';

interface PaymentModalProps {
  request: ServiceRequest;
  currentUser: UserProfile;
  commissionRate?: number;
  availableMethods?: PaymentMethodConfig[];
  onClose: () => void;
  onPaymentSuccess?: (transaction: Transaction) => void;
}

const DEFAULT_METHODS: PaymentMethodConfig[] = [
  {
    id: 'paypay',
    name: 'PayPay',
    provider: 'PayPayProvider',
    isActive: true,
    isConfigured: true, // Arquitetura preparada
    statusLabel: 'Preparado — aguardando configuração',
    description: 'Carteira digital PayPay Angola',
    instructions: 'A transação será registada no sistema em estado PENDENTE.',
  },
  {
    id: 'mcx_express',
    name: 'Multicaixa Express',
    provider: 'MulticaixaProvider',
    isActive: true,
    isConfigured: false,
    statusLabel: 'Não configurado',
    description: 'Rede interbancária EMIS',
    instructions: 'Este método de pagamento ainda não está disponível.',
  },
  {
    id: 'appypay',
    name: 'AppyPay',
    provider: 'AppyPayProvider',
    isActive: true,
    isConfigured: false,
    statusLabel: 'Não configurado',
    description: 'Carteira e gateway AppyPay Angola',
    instructions: 'Este método de pagamento ainda não está disponível.',
  },
  {
    id: 'cash',
    name: 'Dinheiro',
    provider: 'CashPaymentProvider',
    isActive: true,
    isConfigured: true,
    statusLabel: 'Disponível',
    description: 'Pagamento presencial em Kwanzas',
    instructions: 'Efetue o pagamento em numerário diretamente ao profissional.',
  },
];

export const PayPayPaymentModal: React.FC<PaymentModalProps> = ({
  request,
  currentUser,
  commissionRate = 10,
  availableMethods = DEFAULT_METHODS,
  onClose,
  onPaymentSuccess,
}) => {
  const [selectedMethodId, setSelectedMethodId] = useState<string>('paypay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdTransaction, setCreatedTransaction] = useState<Transaction | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pendente');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [checkingStatus, setCheckingStatus] = useState(false);

  const amount = request.finalPrice || request.estimatedBudget || 5000;
  const paymentService = PaymentService.getInstance();
  const { commissionAmount, professionalEarnings } = paymentService.calculateCommission(amount, commissionRate);

  // Filtra somente os métodos ativos configurados
  const activeMethods = availableMethods.filter(m => m.isActive);
  const currentSelectedMethod = activeMethods.find(m => m.id === selectedMethodId) || activeMethods[0];

  const handleInitiatePayment = async () => {
    if (!currentSelectedMethod) return;

    // Se o provedor não estiver configurado (ex: Multicaixa ou AppyPay sem credenciais)
    if (!currentSelectedMethod.isConfigured && currentSelectedMethod.id !== 'paypay') {
      setStatusMessage('Este método de pagamento ainda não está disponível.');
      return;
    }

    setIsProcessing(true);
    setStatusMessage('');

    try {
      // 1. Cliente escolhe método -> Sistema cria transação -> Estado: PENDENTE
      const txData = await paymentService.createTransaction({
        requestId: request.id!,
        customerId: currentUser.uid,
        professionalId: request.professionalId || '',
        amount,
        commissionRate,
        paymentMethod: currentSelectedMethod.name,
        providerCode: currentSelectedMethod.id,
        customerPhone: currentUser.phone,
        customerEmail: currentUser.email,
      });

      const txId = txData.gatewayTransactionId || `tx_${currentSelectedMethod.id}_${Date.now()}`;
      const fullTransaction: Transaction = {
        id: txId,
        ...txData,
      };

      // 2. Gravar transação no Firestore
      await setDoc(doc(db, 'transactions', txId), fullTransaction);

      // 3. Atualizar o pedido com o método escolhido
      await updateDoc(doc(db, 'service_requests', request.id!), {
        paymentMethod: currentSelectedMethod.name,
        updatedAt: new Date().toISOString(),
      });

      setCreatedTransaction(fullTransaction);
      setPaymentStatus(fullTransaction.status);
      setStatusMessage(
        fullTransaction.gatewayMessage || 
        `Transação com método "${currentSelectedMethod.name}" criada com sucesso em estado PENDENTE.`
      );
    } catch (err: any) {
      console.error('Erro ao iniciar pagamento:', err);
      setStatusMessage('Falha ao comunicar com o serviço de pagamentos.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!createdTransaction?.id || !createdTransaction.providerCode) return;
    setCheckingStatus(true);
    try {
      const res = await paymentService.checkTransactionStatus(
        createdTransaction.id, 
        createdTransaction.providerCode
      );
      setPaymentStatus(res.status);
      setStatusMessage(res.message);
    } catch (e: any) {
      console.error('Erro ao verificar estado:', e);
    } finally {
      setCheckingStatus(false);
    }
  };

  // Simulação controlada de desenvolvimento
  const handleDevConfirmPayment = async () => {
    if (!createdTransaction?.id || !request.id) return;
    setIsProcessing(true);
    try {
      const now = new Date().toISOString();
      const updatedStatus: PaymentStatus = 'pago';

      // Atualiza transação para PAGO
      await updateDoc(doc(db, 'transactions', createdTransaction.id), {
        status: updatedStatus,
        updatedAt: now,
      });

      // Atualiza estado do pedido para CONCLUÍDO
      await updateDoc(doc(db, 'service_requests', request.id), {
        status: 'concluido',
        finalPrice: amount,
        updatedAt: now,
      });

      setPaymentStatus(updatedStatus);
      setStatusMessage(`Pagamento confirmado com sucesso via ${createdTransaction.paymentMethod}. Pedido concluído.`);

      if (onPaymentSuccess) {
        onPaymentSuccess({
          ...createdTransaction,
          status: updatedStatus,
        });
      }
    } catch (err) {
      console.error('Erro ao validar pagamento:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const getMethodIcon = (id: string) => {
    switch (id) {
      case 'paypay':
        return <div className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black text-[11px]">PP</div>;
      case 'mcx_express':
        return <Building2 className="w-5 h-5 text-blue-600" />;
      case 'appypay':
        return <Smartphone className="w-5 h-5 text-emerald-600" />;
      case 'cash':
        return <Banknote className="w-5 h-5 text-amber-600" />;
      default:
        return <CreditCard className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="p-5 bg-linear-to-r from-slate-900 via-purple-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm shadow-md">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Pagamento do Serviço</h3>
              <p className="text-xs text-slate-300">Escolha a forma de pagamento desejada</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs text-slate-700 max-h-[80vh] overflow-y-auto">

          {/* Amount and Breakdown Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Serviço:</span>
              <span className="font-bold text-slate-900 truncate max-w-[240px]">
                {request.title || request.categoryName}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
              <span className="text-slate-500 font-medium">Valor Total:</span>
              <span className="text-xl font-black text-slate-950">{amount.toLocaleString('pt-AO')} Kz</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
              <div>
                <span className="text-slate-400 block">Comissão AjudaJá ({commissionRate}%):</span>
                <span className="font-bold text-purple-700">{commissionAmount.toLocaleString('pt-AO')} Kz</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block">Repasse ao Profissional:</span>
                <span className="font-bold text-emerald-700">{professionalEarnings.toLocaleString('pt-AO')} Kz</span>
              </div>
            </div>
          </div>

          {!createdTransaction ? (
            /* Step 1: Select Payment Method */
            <div className="space-y-4">
              <div>
                <label className="block font-extrabold text-slate-900 text-xs mb-2">
                  Escolha o método de pagamento:
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeMethods.map((method) => {
                    const isSelected = selectedMethodId === method.id;
                    const isMethodReady = method.isConfigured || method.id === 'paypay';

                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => {
                          setSelectedMethodId(method.id);
                          setStatusMessage('');
                        }}
                        className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50/60 shadow-xs ring-2 ring-purple-600/20'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            {getMethodIcon(method.id)}
                            <span className="font-bold text-slate-900 text-xs">
                              {method.name}
                            </span>
                          </div>
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-purple-700 text-white flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 stroke-3" />
                            </div>
                          )}
                        </div>

                        <span className="text-[10px] text-slate-500 leading-tight">
                          {method.description || method.instructions}
                        </span>

                        {!isMethodReady && (
                          <span className="mt-2 text-[9px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 inline-block">
                            Indisponível no momento
                          </span>
                        )}
                        {method.id === 'paypay' && (
                          <span className="mt-2 text-[9px] font-bold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded border border-purple-200 inline-block">
                            Modo Seguro (PayPay)
                          </span>
                        )}
                        {method.id === 'cash' && (
                          <span className="mt-2 text-[9px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                            Disponível presencialmente
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message if unconfigured method is selected */}
              {currentSelectedMethod && !currentSelectedMethod.isConfigured && currentSelectedMethod.id !== 'paypay' && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Este método de pagamento ainda não está disponível.</strong>
                    <span className="text-[11px] text-amber-800">
                      O método {currentSelectedMethod.name} aguarda credenciais ou certificação bancária oficial. Por favor escolha um método disponível (como <strong>PayPay</strong> ou <strong>Dinheiro</strong>) para prosseguir.
                    </span>
                  </div>
                </div>
              )}

              {/* Notice for PayPay */}
              {currentSelectedMethod?.id === 'paypay' && (
                <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">PayPay Angola — Modo Seguro de Teste / Mock</strong>
                    <span className="text-[11px] text-purple-800 leading-relaxed">
                      A transação será registada no sistema em estado <strong>PENDENTE</strong>. Com <code>PAYPAY_ENABLED=false</code>, o sistema opera em modo de teste seguro sem chamadas externas nem cobranças reais.
                    </span>
                  </div>
                </div>
              )}

              {/* Notice for Cash */}
              {currentSelectedMethod?.id === 'cash' && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2">
                  <Banknote className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Pagamento Presencial em Dinheiro</strong>
                    <span className="text-[11px] text-emerald-800 leading-relaxed">
                      Deverá efetuar o pagamento diretamente ao profissional no local do atendimento após a validação do serviço.
                    </span>
                  </div>
                </div>
              )}

              {statusMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                  {statusMessage}
                </div>
              )}

              <button
                onClick={handleInitiatePayment}
                disabled={isProcessing || (!currentSelectedMethod?.isConfigured && currentSelectedMethod?.id !== 'paypay')}
                className="w-full py-3.5 rounded-xl bg-linear-to-r from-slate-900 via-purple-900 to-slate-900 hover:from-slate-800 hover:to-purple-800 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4 text-amber-300" />
                )}
                <span>
                  {isProcessing 
                    ? 'A processar...' 
                    : `Confirmar e Pagar com ${currentSelectedMethod?.name || 'Método Selecionado'}`}
                </span>
              </button>
            </div>
          ) : (
            /* Step 2: Lifecycle after creation */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Método Escolhido:</span>
                  <span className="font-bold text-slate-900">{createdTransaction.paymentMethod}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">ID da Transação:</span>
                  <span className="font-mono font-bold text-slate-800">{createdTransaction.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Referência:</span>
                  <span className="font-mono font-bold text-purple-700">{createdTransaction.referenceCode}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-slate-500 text-[11px]">Estado do Pagamento:</span>
                  <div>
                    {paymentStatus === 'pendente' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        PENDENTE
                      </span>
                    )}
                    {paymentStatus === 'processando' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                        PROCESSANDO
                      </span>
                    )}
                    {paymentStatus === 'pago' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        PAGO
                      </span>
                    )}
                    {paymentStatus === 'falhou' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        FALHOU
                      </span>
                    )}
                    {paymentStatus === 'reembolsado' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                        REEMBOLSADO
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Message */}
              {statusMessage && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                  {statusMessage}
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={handleCheckStatus}
                  disabled={checkingStatus}
                  className="w-full py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${checkingStatus ? 'animate-spin' : ''}`} />
                  <span>Verificar Estado do Pagamento</span>
                </button>

                {paymentStatus !== 'pago' && (
                  <div className="pt-2 border-t border-dashed border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 block mb-1.5">
                      Ambiente de Desenvolvimento / Validação do Fluxo:
                    </span>
                    <button
                      onClick={handleDevConfirmPayment}
                      disabled={isProcessing}
                      className="px-3.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Validar Transição para PAGO (Modo Dev)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            Pagamentos AjudaJá Angola
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-slate-700 font-bold hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};

export const CheckoutPaymentModal = PayPayPaymentModal;
