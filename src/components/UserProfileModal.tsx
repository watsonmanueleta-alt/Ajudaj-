import React, { useState } from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  Briefcase, 
  Save, 
  CheckCircle2, 
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { Category, Professional } from '../types/index.ts';

interface UserProfileModalProps {
  categories: Category[];
  onProfileUpdated: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  categories,
  onProfileUpdated,
}) => {
  const { userProfile, role, registerProfile, refreshProfile } = useAuth();

  const [name, setName] = useState(userProfile?.name || '');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [province, setProvince] = useState(userProfile?.province || 'Luanda');
  const [city, setCity] = useState(userProfile?.city || 'Maianga');
  const [address, setAddress] = useState(userProfile?.address || '');

  // If user wants to register as professional
  const [isUpgradingToPro, setIsUpgradingToPro] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'canalizacao');
  const [subcategory, setSubcategory] = useState('');
  const [description, setDescription] = useState('');
  const [experienceYears, setExperienceYears] = useState(3);
  const [basePrice, setBasePrice] = useState(5000);
  const [serviceArea, setServiceArea] = useState('Luanda e arredores');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      if (isUpgradingToPro) {
        const cat = categories.find(c => c.id === categoryId);
        await registerProfile({
          name,
          email,
          phone,
          province,
          city,
          address,
          role: 'profissional',
        }, {
          businessName: businessName || name,
          categoryId,
          categoryName: cat?.name || 'Serviços',
          subcategory,
          description,
          experienceYears,
          basePrice,
          serviceArea,
        });
      } else {
        await registerProfile({
          name,
          email,
          phone,
          province,
          city,
          address,
        });
      }

      setSuccessMessage('Perfil atualizado com sucesso no AjudaJá!');
      await refreshProfile();
      onProfileUpdated();
    } catch (e) {
      console.error('Erro ao atualizar perfil:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 pb-20">
      <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
        <div className="relative">
          <img
            src={userProfile?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${userProfile?.name || 'User'}`}
            alt={userProfile?.name}
            className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-xs"
          />
        </div>

        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {userProfile?.name || 'Meu Perfil'}
          </h1>
          <p className="text-xs text-slate-500">{userProfile?.email}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase tracking-wider">
              {role}
            </span>
            <span className="text-[10px] text-slate-400">
              {userProfile?.city}, {userProfile?.province}
            </span>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Telefone (Angola) *
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+244 923 000 000"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Província *
            </label>
            <select
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 bg-white"
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
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Município / Bairro *
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ex: Maianga, Talatona, Kilamba"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
            Endereço Residencial ou Comercial
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Rua, número ou ponto de referência"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900"
          />
        </div>

        {/* Upgrade / Register as Professional if currently client */}
        {role === 'cliente' && (
          <div className="pt-2">
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-extrabold text-amber-900">
                    Deseja prestar serviços no AjudaJá?
                  </h3>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Cadastre o seu perfil profissional e comece a receber pedidos em Angola.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsUpgradingToPro(!isUpgradingToPro)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs"
                >
                  {isUpgradingToPro ? 'Voltar para Cliente' : 'Ativar Perfil Profissional'}
                </button>
              </div>

              {isUpgradingToPro && (
                <div className="space-y-3 pt-3 border-t border-amber-200/80">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Nome Comercial / Profissional</label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Ex: Kapango Canalizações Rápidas"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Categoria Principal</label>
                      <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Subcategoria / Especialidade</label>
                      <input
                        type="text"
                        value={subcategory}
                        onChange={(e) => setSubcategory(e.target.value)}
                        placeholder="Ex: Fugas, Bombas, Desentupimento"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Biografia e Serviços Oferecidos</label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Fale sobre a sua experiência, certificações e zonas que atende..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Preço Inicial / Visita (Kz)</label>
                      <input
                        type="number"
                        step="500"
                        value={basePrice}
                        onChange={(e) => setBasePrice(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Anos de Experiência</label>
                      <input
                        type="number"
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'A guardar perfil...' : 'Guardar Alterações do Perfil'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
