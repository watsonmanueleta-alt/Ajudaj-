import React, { useState } from 'react';
import { 
  X, 
  Send, 
  MapPin, 
  Calendar, 
  Clock, 
  DollarSign, 
  AlertCircle,
  FileText,
  Navigation,
  CheckCircle2
} from 'lucide-react';
import { Category, Professional, ServiceRequest, UserProfile } from '../types/index.ts';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.ts';
import { requestDeviceLocation } from '../utils/geo.ts';

interface RequestServiceModalProps {
  categories: Category[];
  selectedProfessional: Professional | null;
  preselectedCategory: Category | null;
  currentUserProfile: UserProfile | null;
  onClose: () => void;
  onRequestCreated: (newRequest: ServiceRequest) => void;
}

export const RequestServiceModal: React.FC<RequestServiceModalProps> = ({
  categories,
  selectedProfessional,
  preselectedCategory,
  currentUserProfile,
  onClose,
  onRequestCreated,
}) => {
  const [categoryId, setCategoryId] = useState<string>(
    selectedProfessional?.categoryId || preselectedCategory?.id || 'canalizacao'
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [province, setProvince] = useState(currentUserProfile?.province || 'Luanda');
  const [city, setCity] = useState(currentUserProfile?.city || 'Maianga');
  const [address, setAddress] = useState(currentUserProfile?.address || '');
  const [scheduledDate, setScheduledDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [scheduledTime, setScheduledTime] = useState('10:00');
  const [estimatedBudget, setEstimatedBudget] = useState<number>(
    selectedProfessional?.basePrice || 5000
  );
  const [notes, setNotes] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(currentUserProfile?.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(currentUserProfile?.longitude);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const currentCategory = categories.find(c => c.id === categoryId);

  const handleGetLocation = async () => {
    setIsLocating(true);
    try {
      const coords = await requestDeviceLocation();
      setLatitude(coords.latitude);
      setLongitude(coords.longitude);
      if (!address) {
        setAddress('Localização obtida via GPS');
      }
    } catch (e) {
      console.warn('Erro ao obter localização:', e);
    } finally {
      setIsLocating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMessage('Por favor, descreva detalhadamente o problema ou serviço necessário.');
      return;
    }
    if (!currentUserProfile) {
      setErrorMessage('É necessário estar identificado para submeter um pedido.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const now = new Date().toISOString();
      const requestId = `req_${Date.now()}`;

      const requestData: ServiceRequest = {
        id: requestId,
        customerId: currentUserProfile.uid,
        customerName: currentUserProfile.name,
        customerPhone: currentUserProfile.phone || '+244 923 000 000',
        professionalId: selectedProfessional?.userId || '',
        professionalName: selectedProfessional ? (selectedProfessional.businessName || selectedProfessional.fullName) : 'Profissional a atribuir',
        categoryId,
        categoryName: currentCategory?.name || 'Serviço Geral',
        title: title.trim() || `${currentCategory?.name || 'Serviço'} - ${city}`,
        description: description.trim(),
        province,
        city,
        address: address.trim() || `${city}, ${province}`,
        latitude,
        longitude,
        scheduledDate,
        scheduledTime,
        estimatedBudget: Number(estimatedBudget) || 0,
        notes: notes.trim(),
        status: 'pendente',
        isRated: false,
        createdAt: now,
        updatedAt: now,
      };

      // Write to Firestore /service_requests/{id}
      await setDoc(doc(db, 'service_requests', requestId), requestData);

      // Create notification for professional if targeted
      if (selectedProfessional) {
        const notifId = `notif_${Date.now()}`;
        await setDoc(doc(db, 'notifications', notifId), {
          id: notifId,
          userId: selectedProfessional.userId,
          title: 'Novo pedido de serviço recebido!',
          message: `${currentUserProfile.name} solicitou um serviço de ${requestData.categoryName} em ${city}.`,
          type: 'pedido',
          requestId,
          read: false,
          createdAt: now,
        });
      }

      onRequestCreated(requestData);
    } catch (err) {
      console.error('Falha ao criar pedido no Firestore:', err);
      setErrorMessage('Não foi possível criar o pedido. Por favor tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Solicitar Pedido de Serviço
            </h2>
            <p className="text-xs text-slate-500">
              {selectedProfessional 
                ? `Para ${selectedProfessional.businessName || selectedProfessional.fullName}` 
                : 'Defina os detalhes da sua solicitação'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Category selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Categoria do Serviço *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={!!selectedProfessional}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 disabled:bg-slate-100"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title / Summary */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Resumo do Problema (Título)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Torneira da cozinha a deitar água sem parar"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Descrição Detalhada *
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explique o que aconteceu, marcas, modelos ou peças danificadas..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Location Fields with GPS */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>Localização do Serviço</span>
              </label>

              <button
                type="button"
                onClick={handleGetLocation}
                disabled={isLocating}
                className="text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200"
              >
                <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'A obter...' : 'Usar GPS Atual'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Província</label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs bg-white font-medium"
                >
                  <option value="Luanda">Luanda</option>
                  <option value="Benguela">Benguela</option>
                  <option value="Huíla">Huíla</option>
                  <option value="Huambo">Huambo</option>
                  <option value="Cabinda">Cabinda</option>
                  <option value="Cuanza Sul">Cuanza Sul</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Município / Bairro</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: Maianga, Talatona, Viana"
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Endereço / Ponto de Referência</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, número do prédio ou perto de quê"
                className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs bg-white"
              />
            </div>
          </div>

          {/* Date, Time & Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Data Prevista
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Hora Preferencial
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Orçamento (Kz)
              </label>
              <input
                type="number"
                step="500"
                value={estimatedBudget}
                onChange={(e) => setEstimatedBudget(Number(e.target.value))}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 font-bold"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Observações Adicionais (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Avisar na portaria; tenho cão pequeno; trazer escada."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
            />
          </div>

          {/* Submit CTA */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'A registar pedido no AjudaJá...' : 'Enviar Pedido de Serviço'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
