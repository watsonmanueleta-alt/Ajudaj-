import React, { useEffect, useState } from 'react';
import { 
  X, 
  Star, 
  ShieldCheck, 
  MapPin, 
  Briefcase, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  MessageSquare,
  Clock,
  Award,
  ChevronRight
} from 'lucide-react';
import { Professional, Review } from '../types/index.ts';
import { formatDistance } from '../utils/geo.ts';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase.ts';

interface ProfessionalProfileModalProps {
  professional: Professional | null;
  onClose: () => void;
  onRequestService: (professional: Professional) => void;
}

export const ProfessionalProfileModal: React.FC<ProfessionalProfileModalProps> = ({
  professional,
  onClose,
  onRequestService,
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  useEffect(() => {
    if (!professional) return;
    const fetchReviews = async () => {
      setIsLoadingReviews(true);
      try {
        const q = query(
          collection(db, 'reviews'),
          where('professionalId', '==', professional.userId || professional.id)
        );
        const snap = await getDocs(q);
        const revs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Review));
        setReviews(revs);
      } catch (err) {
        console.error('Erro ao buscar avaliações do profissional:', err);
      } finally {
        setIsLoadingReviews(false);
      }
    };
    fetchReviews();
  }, [professional]);

  if (!professional) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header / Banner */}
        <div className="relative bg-linear-to-r from-slate-900 to-amber-950 p-6 text-white shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative">
              <img
                src={professional.avatarUrl || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&auto=format&fit=crop&q=80'}
                alt={professional.fullName}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-400 shadow-md"
              />
              <span 
                className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-900 ${
                  professional.availability === 'disponivel' 
                    ? 'bg-emerald-500' 
                    : professional.availability === 'ocupado' 
                    ? 'bg-amber-500' 
                    : 'bg-slate-400'
                }`}
              />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  {professional.businessName || professional.fullName}
                </h2>
                <span className="inline-flex items-center text-[10px] font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/40">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                  Verificado pela Plataforma
                </span>
              </div>

              <p className="text-amber-300 text-sm font-semibold mt-0.5">
                {professional.categoryName} {professional.subcategory ? `· ${professional.subcategory}` : ''}
              </p>

              <div className="flex items-center gap-4 mt-2 text-xs text-slate-300">
                <span className="flex items-center font-bold text-white">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400 mr-1" />
                  {professional.rating.toFixed(1)} ({professional.reviewCount || reviews.length} avaliações)
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Award className="w-4 h-4 text-amber-400" />
                  {professional.completedJobsCount} serviços feitos
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Preço Base</span>
              <span className="text-sm sm:text-base font-extrabold text-slate-900">
                {professional.basePrice.toLocaleString('pt-AO')} Kz
              </span>
            </div>
            <div className="border-x border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Experiência</span>
              <span className="text-sm sm:text-base font-extrabold text-slate-900">
                {professional.experienceYears} Anos
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Disponibilidade</span>
              <span className={`text-xs sm:text-sm font-extrabold capitalize ${
                professional.availability === 'disponivel' ? 'text-emerald-600' : 'text-amber-600'
              }`}>
                {professional.availability}
              </span>
            </div>
          </div>

          {/* Description & Bio */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Sobre o Profissional
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {professional.description || 'Profissional qualificado com foco em resolução rápida e garantia de serviço.'}
            </p>
          </div>

          {/* Service Area & Location */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Área de Atendimento & Localização
            </h3>
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700">
              <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900">Base em {professional.city}, {professional.province}</span>
                <p className="text-slate-500 mt-0.5">
                  Atende em: <span className="font-medium text-slate-700">{professional.serviceArea}</span>
                </p>
                {professional.distanceKm !== undefined && (
                  <p className="text-amber-700 font-semibold mt-1">
                    {formatDistance(professional.distanceKm)} da sua posição atual
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Client Reviews Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Avaliações de Clientes Reais
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {reviews.length} comentários
              </span>
            </div>

            {isLoadingReviews ? (
              <p className="text-xs text-slate-400 py-3 text-center">A carregar avaliações...</p>
            ) : reviews.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-500">
                Ainda não há avaliações escritas para este profissional. Seja o primeiro a avaliar após o serviço!
              </div>
            ) : (
              <div className="space-y-2.5">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{rev.customerName}</span>
                      <div className="flex items-center text-amber-500">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 italic">
                      "{rev.comment}"
                    </p>
                    <span className="text-[10px] text-slate-400 block">
                      {new Date(rev.createdAt).toLocaleDateString('pt-AO')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer CTA */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div>
            <span className="text-[10px] text-slate-500 block">Diagnóstico / Visita</span>
            <span className="text-base font-extrabold text-slate-900">
              {professional.basePrice.toLocaleString('pt-AO')} Kz
            </span>
          </div>

          <button
            onClick={() => onRequestService(professional)}
            className="px-6 py-3 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Solicitar Serviço</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
