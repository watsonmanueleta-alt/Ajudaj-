import React, { useState, useMemo } from 'react';
import { 
  Search, 
  MapPin, 
  Star, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Filter, 
  CheckCircle2, 
  Clock, 
  SlidersHorizontal,
  Navigation,
  Compass,
  AlertCircle
} from 'lucide-react';
import { Category, Professional } from '../types/index.ts';
import { CategoryIcon } from './CategoryIcon.tsx';
import { detectCategoryFromText, SuggestionResult } from '../services/nlpCategoryService.ts';
import { formatDistance } from '../utils/geo.ts';

interface ClientHomeProps {
  categories: Category[];
  professionals: Professional[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  onSelectProfessional: (professional: Professional) => void;
  onRequestServiceQuick: (category: Category) => void;
  userCoords: { latitude: number; longitude: number } | null;
  onRequestLocation: () => void;
  isLocating: boolean;
}

export const ClientHome: React.FC<ClientHomeProps> = ({
  categories,
  professionals,
  selectedCategory,
  onSelectCategory,
  onSelectProfessional,
  onRequestServiceQuick,
  userCoords,
  onRequestLocation,
  isLocating,
}) => {
  const [naturalQuery, setNaturalQuery] = useState('');
  const [nlpSuggestion, setNlpSuggestion] = useState<SuggestionResult | null>(null);
  const [filterAvailability, setFilterAvailability] = useState<string>('all');
  const [filterProvince, setFilterProvince] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'jobs'>('distance');

  // Handle natural language input
  const handleInputChange = (text: string) => {
    setNaturalQuery(text);
    if (text.trim().length > 3) {
      const suggestion = detectCategoryFromText(text);
      setNlpSuggestion(suggestion);
    } else {
      setNlpSuggestion(null);
    }
  };

  const applyNlpSuggestion = () => {
    if (nlpSuggestion) {
      onSelectCategory(nlpSuggestion.categoryId);
      setNaturalQuery('');
      setNlpSuggestion(null);
    }
  };

  // Filter and sort professionals
  const filteredProfessionals = useMemo(() => {
    return professionals
      .filter((prof) => {
        // Only verified professionals for clients
        if (prof.status !== 'verificado') return false;

        // Category filter
        if (selectedCategory && prof.categoryId !== selectedCategory) {
          return false;
        }

        // Availability filter
        if (filterAvailability === 'disponivel' && prof.availability !== 'disponivel') {
          return false;
        }

        // Province filter
        if (filterProvince !== 'all' && prof.province !== filterProvince) {
          return false;
        }

        // Text search across name, category, description
        if (naturalQuery.trim()) {
          const q = naturalQuery.toLowerCase();
          const matchName = prof.fullName.toLowerCase().includes(q) || prof.businessName.toLowerCase().includes(q);
          const matchCat = prof.categoryName.toLowerCase().includes(q) || (prof.subcategory || '').toLowerCase().includes(q);
          const matchDesc = prof.description.toLowerCase().includes(q);
          if (!matchName && !matchCat && !matchDesc) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'distance') {
          const distA = a.distanceKm ?? 9999;
          const distB = b.distanceKm ?? 9999;
          return distA - distB;
        } else if (sortBy === 'rating') {
          return b.rating - a.rating;
        } else {
          return b.completedJobsCount - a.completedJobsCount;
        }
      });
  }, [professionals, selectedCategory, filterAvailability, filterProvince, naturalQuery, sortBy]);

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-slate-800 to-amber-950 text-white p-6 sm:p-10 shadow-xl border border-slate-700/50">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-4 border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Serviços Verificados em Angola · Pagamento em Kz</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight sm:leading-snug text-balance">
            Que serviço você <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-400 to-yellow-200">precisa hoje?</span>
          </h1>

          <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-xl">
            Descreva o seu problema ou pesquise profissionais qualificados próximos de si em Luanda, Benguela, Huíla e em toda Angola.
          </p>

          {/* Natural Language Problem Input */}
          <div className="mt-5 relative">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={naturalQuery}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Ex: Minha torneira está a vazar, ou preciso instalar uma tomada..."
                className="w-full pl-11 pr-28 py-3.5 sm:py-4 rounded-2xl bg-white/10 text-white placeholder-slate-400 border border-white/20 focus:border-amber-400 focus:bg-white/15 focus:ring-2 focus:ring-amber-400/20 focus:outline-hidden text-sm sm:text-base backdrop-blur-md transition-all shadow-inner"
              />
              {naturalQuery && (
                <button
                  onClick={() => {
                    setNaturalQuery('');
                    setNlpSuggestion(null);
                  }}
                  className="absolute right-24 text-xs text-slate-400 hover:text-white px-2 py-1"
                >
                  Limpar
                </button>
              )}
              <button
                onClick={applyNlpSuggestion}
                className="absolute right-2 top-2 bottom-2 px-4 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1 shadow-md transition-all"
              >
                <span>Buscar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Smart NLP Suggestion Pill */}
            {nlpSuggestion && (
              <div className="mt-2.5 p-3 rounded-xl bg-amber-500/20 border border-amber-400/30 backdrop-blur-md animate-in fade-in slide-in-from-top-1 duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xs shadow-xs">
                    💡
                  </div>
                  <div>
                    <span className="text-xs text-slate-200">Sugerimos a categoria: </span>
                    <strong className="text-amber-300 font-bold text-sm">
                      {nlpSuggestion.categoryName}
                    </strong>
                    <span className="text-[11px] text-slate-300 ml-1.5 hidden sm:inline">
                      ({nlpSuggestion.reason})
                    </span>
                  </div>
                </div>

                <button
                  onClick={applyNlpSuggestion}
                  className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs transition-colors shadow-xs"
                >
                  Filtrar por {nlpSuggestion.categoryName}
                </button>
              </div>
            )}
          </div>

          {/* Quick Problem Chips */}
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 text-xs text-slate-300 scrollbar-none">
            <span className="font-semibold text-slate-400 shrink-0">Exemplos rápidos:</span>
            <button
              onClick={() => handleInputChange('A minha torneira está a vazar')}
              className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 shrink-0 text-slate-200 transition-colors"
            >
              "Torneira a vazar"
            </button>
            <button
              onClick={() => handleInputChange('Preciso instalar uma tomada nova')}
              className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 shrink-0 text-slate-200 transition-colors"
            >
              "Instalar tomada"
            </button>
            <button
              onClick={() => handleInputChange('Meu computador está muito lento')}
              className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 shrink-0 text-slate-200 transition-colors"
            >
              "Computador lento"
            </button>
            <button
              onClick={() => handleInputChange('Preciso lavar o meu sofá')}
              className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 shrink-0 text-slate-200 transition-colors"
            >
              "Lavar sofá"
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-amber-500/15 blur-3xl pointer-events-none"></div>
      </section>

      {/* Categories Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Categorias de Serviços
            </h2>
            <p className="text-xs text-slate-500">
              Escolha uma especialidade para encontrar profissionais qualificados
            </p>
          </div>

          {selectedCategory && (
            <button
              onClick={() => onSelectCategory(null)}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg"
            >
              Limpar seleção
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(isSelected ? null : cat.id)}
                className={`flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-2xl border transition-all text-center group cursor-pointer ${
                  isSelected
                    ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 shadow-md text-amber-900'
                    : 'bg-white border-slate-200/80 hover:border-amber-400 hover:shadow-md text-slate-700 hover:text-slate-900'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center mb-2 transition-transform group-hover:scale-110 ${
                    isSelected
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                      : 'bg-slate-100 text-slate-700 group-hover:bg-amber-100 group-hover:text-amber-700'
                  }`}
                >
                  <CategoryIcon iconName={cat.icon} className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-xs font-bold truncate max-w-full">
                  {cat.name}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 truncate max-w-full">
                  {cat.subcategories?.[0] || 'Serviços'}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* GPS Location Banner */}
      <section className="p-4 rounded-2xl bg-linear-to-r from-amber-50 via-yellow-50 to-orange-50 border border-amber-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0">
            <Navigation className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
              Profissionais ordenados por proximidade GPS
            </h4>
            <p className="text-xs text-slate-600">
              {userCoords 
                ? 'Localização ativa. Mostrando profissionais mais próximos da sua área primeiro.' 
                : 'Ative a localização do seu dispositivo para ver técnicos a poucos minutos de si.'}
            </p>
          </div>
        </div>

        <button
          onClick={onRequestLocation}
          disabled={isLocating}
          className="self-end sm:self-center px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-200 shadow-xs flex items-center gap-1.5 transition-all"
        >
          <MapPin className={`w-3.5 h-3.5 text-amber-500 ${isLocating ? 'animate-bounce' : ''}`} />
          <span>{isLocating ? 'A obter GPS...' : userCoords ? 'Atualizar Localização' : 'Ativar Localização'}</span>
        </button>
      </section>

      {/* Professionals Listing Header & Filters */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Profissionais Disponíveis</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {filteredProfessionals.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              {selectedCategory 
                ? `Mostrando especialistas na categoria selecionada` 
                : `Verificados e prontos para atender`}
            </p>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Availability Filter */}
            <select
              value={filterAvailability}
              onChange={(e) => setFilterAvailability(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">Todas Disponibilidades</option>
              <option value="disponivel">Apenas Disponíveis Agora</option>
            </select>

            {/* Province Filter */}
            <select
              value={filterProvince}
              onChange={(e) => setFilterProvince(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">Todas as Províncias</option>
              <option value="Luanda">Luanda</option>
              <option value="Benguela">Benguela</option>
              <option value="Huíla">Huíla</option>
              <option value="Huambo">Huambo</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            >
              <option value="distance">Mais Próximos (GPS)</option>
              <option value="rating">Melhor Avaliação (★)</option>
              <option value="jobs">Mais Trabalhos Feitos</option>
            </select>

          </div>
        </div>

        {/* Empty State */}
        {filteredProfessionals.length === 0 ? (
          <div className="p-10 rounded-2xl bg-white border border-slate-200 text-center space-y-3 shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Ainda não encontramos profissionais disponíveis nesta área.
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Tente alterar os filtros de província, categoria ou fazer uma busca por outro termo de serviço.
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  onSelectCategory(null);
                  setFilterAvailability('all');
                  setFilterProvince('all');
                  setNaturalQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
              >
                Limpar todos os filtros
              </button>
            </div>
          </div>
        ) : (
          /* Professionals Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProfessionals.map((prof) => (
              <div
                key={prof.id || prof.userId}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-amber-400/80 p-4 sm:p-5 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar of Card */}
                  <div className="flex items-start gap-3.5">
                    <div className="relative shrink-0">
                      <img
                        src={prof.avatarUrl || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&auto=format&fit=crop&q=80'}
                        alt={prof.fullName}
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-100 shadow-2xs group-hover:scale-105 transition-transform"
                      />
                      <span 
                        className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                          prof.availability === 'disponivel' 
                            ? 'bg-emerald-500' 
                            : prof.availability === 'ocupado' 
                            ? 'bg-amber-500' 
                            : 'bg-slate-400'
                        }`}
                        title={`Status: ${prof.availability}`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          {prof.businessName || prof.fullName}
                        </h3>
                        <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/60 shrink-0">
                          <ShieldCheck className="w-3 h-3 mr-0.5 text-emerald-600" />
                          Verificado
                        </span>
                      </div>

                      <p className="text-xs text-amber-700 font-semibold truncate mt-0.5">
                        {prof.categoryName} • {prof.subcategory || 'Especialista'}
                      </p>

                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <span className="flex items-center font-bold text-slate-800">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 mr-1" />
                          {prof.rating.toFixed(1)}
                        </span>
                        <span>•</span>
                        <span>{prof.completedJobsCount} trabalhos</span>
                      </div>
                    </div>
                  </div>

                  {/* Description snippet */}
                  <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {prof.description}
                  </p>

                  {/* Location & Distance Badge */}
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1 text-slate-600 font-medium truncate max-w-[170px]">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {prof.city}, {prof.province}
                    </span>

                    <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-[11px] shrink-0">
                      {formatDistance(prof.distanceKm)}
                    </span>
                  </div>
                </div>

                {/* Bottom Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      A partir de
                    </span>
                    <span className="text-sm font-extrabold text-slate-900">
                      {prof.basePrice.toLocaleString('pt-AO')} Kz
                    </span>
                  </div>

                  <button
                    onClick={() => onSelectProfessional(prof)}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white font-bold text-xs transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <span>Ver Perfil & Pedir</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
};
