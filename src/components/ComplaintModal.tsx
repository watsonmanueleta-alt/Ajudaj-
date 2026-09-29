import React, { useState } from 'react';
import { X, AlertTriangle, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ServiceRequest, UserProfile, Complaint } from '../types/index.ts';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.ts';

interface ComplaintModalProps {
  request: ServiceRequest;
  currentUser: UserProfile;
  onClose: () => void;
  onComplaintSubmitted: () => void;
}

export const ComplaintModal: React.FC<ComplaintModalProps> = ({
  request,
  currentUser,
  onClose,
  onComplaintSubmitted,
}) => {
  const [reason, setReason] = useState('Serviço não concluído ou com defeito');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMessage('Por favor descreva a situação que motivou esta reclamação.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const complaintId = `comp_${Date.now()}`;
      const now = new Date().toISOString();

      const complaintData: Complaint = {
        id: complaintId,
        requestId: request.id,
        userId: currentUser.uid,
        userName: currentUser.name,
        userRole: currentUser.role === 'profissional' ? 'profissional' : 'cliente',
        reason,
        description: description.trim(),
        status: 'aberta',
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, 'complaints', complaintId), complaintData);

      onComplaintSubmitted();
    } catch (err) {
      console.error('Falha ao abrir reclamação:', err);
      setErrorMessage('Não foi possível registrar a reclamação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl w-full max-w-md flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 bg-rose-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold">Abrir Reclamação / Suporte</h2>
              <p className="text-xs text-rose-200">
                Pedido #{request.id.slice(-6)} · {request.categoryName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-rose-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Motivo Principal *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            >
              <option value="Serviço não concluído ou com defeito">Serviço não concluído ou com defeito</option>
              <option value="Cobrança indevida ou desacordo de valor">Cobrança indevida ou desacordo de valor</option>
              <option value="Atraso excessivo / Não comparecimento">Atraso excessivo / Não comparecimento</option>
              <option value="Conduta inadequada ou desrespeitosa">Conduta inadequada ou desrespeitosa</option>
              <option value="Outro problema">Outro problema</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Explicação Detalhada do Sucedido *
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o que ocorreu com clareza para que a equipa de moderação do AjudaJá possa mediar..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
            A sua reclamação será enviada diretamente para a equipa administrativa do AjudaJá e analisada em até 24 horas úteis.
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'A registar disputa...' : 'Submeter Reclamação'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
