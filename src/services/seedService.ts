import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase.ts';
import { Category, Professional, UserProfile, ServiceRequest, Review, AdminSettings } from '../types/index.ts';

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'canalizacao',
    name: 'Canalização',
    slug: 'canalizacao',
    icon: 'Wrench',
    description: 'Reparação de torneiras, fugas de água, esgotos e instalação de bombas',
    subcategories: ['Torneiras e Pias', 'Fugas de Água', 'Desentupimentos', 'Bombas d\'Água e Tanques', 'Autoclismos'],
    isActive: true,
    order: 1,
  },
  {
    id: 'eletricidade',
    name: 'Eletricidade',
    slug: 'eletricidade',
    icon: 'Zap',
    description: 'Instalação de tomadas, disjuntores, geradores, iluminação e inversores',
    subcategories: ['Quadros e Disjuntores', 'Tomadas e Iluminação', 'Geradores', 'Painéis Solares', 'Curto-Circuitos'],
    isActive: true,
    order: 2,
  },
  {
    id: 'mecanica',
    name: 'Mecânica',
    slug: 'mecanica',
    icon: 'Car',
    description: 'Diagnóstico automóvel, travões, troca de óleo, motor e socorro de emergência',
    subcategories: ['Socorro na Estrada', 'Diagnóstico Eletrónico', 'Travões e Pneus', 'Revisão e Óleo', 'Baterias'],
    isActive: true,
    order: 3,
  },
  {
    id: 'telemoveis',
    name: 'Telemóveis',
    slug: 'telemoveis',
    icon: 'Smartphone',
    description: 'Substituição de ecrãs partidos, baterias viciadas, software e conector de carga',
    subcategories: ['Ecrã Partido', 'Troca de Bateria', 'Conector de Carga', 'Desbloqueio e Software', 'Aparelho não Liga'],
    isActive: true,
    order: 4,
  },
  {
    id: 'informatica',
    name: 'Informática',
    slug: 'informatica',
    icon: 'Monitor',
    description: 'Formatação de computadores, remoção de vírus, redes Wi-Fi e ecrãs azuis',
    subcategories: ['Formatação e Windows', 'Limpeza e Lentidão', 'Redes e Wi-Fi', 'Troca de Ecrã Portátil', 'Impressoras'],
    isActive: true,
    order: 5,
  },
  {
    id: 'limpeza',
    name: 'Limpeza',
    slug: 'limpeza',
    icon: 'Sparkles',
    description: 'Limpeza residencial e comercial, sofás, pós-obra e higienização profunda',
    subcategories: ['Limpeza Residencial', 'Higienização de Sofás', 'Limpeza Pós-Obra', 'Vidros e Fachadas', 'Passar Roupa'],
    isActive: true,
    order: 6,
  },
  {
    id: 'climatizacao',
    name: 'Climatização',
    slug: 'climatizacao',
    icon: 'Wind',
    description: 'Instalação e manutenção de Ar Condicionado, carga de gás e limpeza split',
    subcategories: ['Limpeza de AC Split', 'Carga de Gás R410/R22', 'Instalação de Novo AC', 'Reparação de Compressor'],
    isActive: true,
    order: 7,
  },
  {
    id: 'pintura',
    name: 'Pintura',
    slug: 'pintura',
    icon: 'Paintbrush',
    description: 'Pintura interior e exterior, massas, vernizes e tratamento de humidade',
    subcategories: ['Pintura de Paredes', 'Fachadas', 'Tratamento de Humidade', 'Envernizamento de Portas'],
    isActive: true,
    order: 8,
  }
];

export const DEMO_PROFESSIONALS: (Professional & { id: string })[] = [
  {
    id: 'prof_antonio_canalizador',
    userId: 'user_prof_antonio',
    fullName: 'António Kapango',
    businessName: 'Kapango Canalizações Rápidas',
    phone: '+244 923 456 789',
    email: 'antonio.canalizador@ajudaja.ao',
    avatarUrl: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&auto=format&fit=crop&q=80',
    categoryId: 'canalizacao',
    categoryName: 'Canalização',
    subcategory: 'Torneiras, Fugas e Tanques',
    description: 'Mestre canalizador com 12 anos de experiência em Luanda. Especialista em desentupimentos rápidos, deteção e resolução de fugas, instalação de eletrobombas e autoclismos.',
    experienceYears: 12,
    serviceArea: 'Maianga, Ingombota, Talatona, Kilamba, Alvalade',
    province: 'Luanda',
    city: 'Maianga',
    latitude: -8.8271,
    longitude: 13.2343,
    availability: 'disponivel',
    basePrice: 5000,
    status: 'verificado',
    rating: 4.9,
    reviewCount: 47,
    completedJobsCount: 84,
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'prof_mateus_eletricista',
    userId: 'user_prof_mateus',
    fullName: 'Mateus Gaspar',
    businessName: 'Gaspar Eletro-Soluções',
    phone: '+244 931 112 233',
    email: 'mateus.eletricista@ajudaja.ao',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    categoryId: 'eletricidade',
    categoryName: 'Eletricidade',
    subcategory: 'Quadros, Geradores e Instalações',
    description: 'Técnico de eletricidade certificado. Manutenção de quadros elétricos, ligação de geradores a ATS, correção de curto-circuitos e iluminação LED moderna.',
    experienceYears: 8,
    serviceArea: 'Talatona, Belas, Morro Bento, Benfica',
    province: 'Luanda',
    city: 'Talatona',
    latitude: -8.9189,
    longitude: 13.1812,
    availability: 'disponivel',
    basePrice: 7500,
    status: 'verificado',
    rating: 4.8,
    reviewCount: 32,
    completedJobsCount: 56,
    createdAt: '2026-01-15T09:30:00.000Z',
  },
  {
    id: 'prof_sara_telemoveis',
    userId: 'user_prof_sara',
    fullName: 'Sara Kiaku',
    businessName: 'Kiaku Tech Reparações',
    phone: '+244 945 998 877',
    email: 'sara.kiaku@ajudaja.ao',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    categoryId: 'telemoveis',
    categoryName: 'Telemóveis',
    subcategory: 'Ecrãs, Baterias e Placas',
    description: 'Especialista em reparação rápida de iPhones, Samsung e Xiaomi. Troca de ecrã em 40 minutos com garantia de peças testadas. Atendimento na loja ou ao domicílio.',
    experienceYears: 6,
    serviceArea: 'Ingombota, Maculusso, Cruzeiro, Rangel',
    province: 'Luanda',
    city: 'Ingombota',
    latitude: -8.8147,
    longitude: 13.2302,
    availability: 'disponivel',
    basePrice: 4000,
    status: 'verificado',
    rating: 5.0,
    reviewCount: 29,
    completedJobsCount: 71,
    createdAt: '2026-02-01T11:00:00.000Z',
  },
  {
    id: 'prof_joao_mecanico',
    userId: 'user_prof_joao',
    fullName: 'João Afonso N\'Gola',
    businessName: 'N\'Gola Auto-Socorro 24H',
    phone: '+244 912 345 678',
    email: 'joao.mecanico@ajudaja.ao',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    categoryId: 'mecanica',
    categoryName: 'Mecânica',
    subcategory: 'Diagnóstico e Socorro Rápido',
    description: 'Mecânico com oficina móvel. Socorro de viaturas em Luanda com troca de bateria, arranques de emergência, travões e diagnóstico de motor computadorizado.',
    experienceYears: 15,
    serviceArea: 'Viana, Kilamba, Zango, Camama',
    province: 'Luanda',
    city: 'Viana',
    latitude: -8.9038,
    longitude: 13.3712,
    availability: 'disponivel',
    basePrice: 10000,
    status: 'verificado',
    rating: 4.7,
    reviewCount: 21,
    completedJobsCount: 43,
    createdAt: '2026-02-10T14:00:00.000Z',
  },
  {
    id: 'prof_clara_limpeza',
    userId: 'user_prof_clara',
    fullName: 'Clara Dinis',
    businessName: 'Brilho D\'Ouro Limpezas',
    phone: '+244 928 887 766',
    email: 'clara.limpeza@ajudaja.ao',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
    categoryId: 'limpeza',
    categoryName: 'Limpeza',
    subcategory: 'Limpeza Residencial e Sofás',
    description: 'Equipa profissional de higienização de vivendas, sofás com máquina a vapor e limpezas pós-reforma. Produtos certificados e pontualidade garantida.',
    experienceYears: 5,
    serviceArea: 'Kilamba, Talatona, Patriota, Camama',
    province: 'Luanda',
    city: 'Kilamba',
    latitude: -8.9953,
    longitude: 13.2574,
    availability: 'disponivel',
    basePrice: 8000,
    status: 'verificado',
    rating: 4.9,
    reviewCount: 38,
    completedJobsCount: 65,
    createdAt: '2026-02-15T10:00:00.000Z',
  },
  {
    id: 'prof_paulo_novo',
    userId: 'user_prof_paulo',
    fullName: 'Paulo Cassoma',
    businessName: 'Cassoma Pinturas & Obras',
    phone: '+244 933 222 111',
    email: 'paulo.cassoma@ajudaja.ao',
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80',
    categoryId: 'pintura',
    categoryName: 'Pintura',
    subcategory: 'Pintura Interior e Exterior',
    description: 'Pintor experiente com acabamento fino e massa corrida. Recém-cadastrado no AjudaJá com documentação enviada para análise.',
    experienceYears: 7,
    serviceArea: 'Benguela, Lobito, Catumbela',
    province: 'Benguela',
    city: 'Benguela',
    latitude: -12.5763,
    longitude: 13.4055,
    availability: 'disponivel',
    basePrice: 6000,
    status: 'pendente', // Test pending approval by admin
    rating: 5.0,
    reviewCount: 0,
    completedJobsCount: 0,
    createdAt: '2026-03-01T15:00:00.000Z',
  }
];

export const DEMO_CLIENTS: UserProfile[] = [
  {
    uid: 'user_cliente_ana',
    name: 'Ana Paula Kaluanda',
    email: 'ana.kaluanda@exemplo.ao',
    phone: '+244 923 111 222',
    role: 'cliente',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    province: 'Luanda',
    city: 'Maianga',
    address: 'Rua Rainha Ginga, Edifício Bengo nº 42',
    latitude: -8.8250,
    longitude: 13.2330,
    createdAt: '2026-01-05T10:00:00.000Z',
  },
  {
    uid: 'user_cliente_joao',
    name: 'João Baptista',
    email: 'joao.baptista@exemplo.ao',
    phone: '+244 912 777 888',
    role: 'cliente',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80',
    province: 'Luanda',
    city: 'Talatona',
    address: 'Condomínio Belas Business Park, Bloco C',
    latitude: -8.9150,
    longitude: 13.1850,
    createdAt: '2026-01-12T14:30:00.000Z',
  }
];

export const DEMO_SERVICE_REQUESTS: ServiceRequest[] = [
  {
    id: 'req_001_concluido',
    customerId: 'user_cliente_ana',
    customerName: 'Ana Paula Kaluanda',
    customerPhone: '+244 923 111 222',
    professionalId: 'user_prof_antonio',
    professionalName: 'Kapango Canalizações Rápidas',
    categoryId: 'canalizacao',
    categoryName: 'Canalização',
    title: 'Fuga de água sob o lava-loiça na cozinha',
    description: 'A torneira do lava-loiça está com fuga forte na junta de vedação e a água está acumulando no armário inferior.',
    province: 'Luanda',
    city: 'Maianga',
    address: 'Rua Rainha Ginga, Edifício Bengo nº 42',
    latitude: -8.8250,
    longitude: 13.2330,
    scheduledDate: '2026-03-20',
    scheduledTime: '10:00',
    estimatedBudget: 8000,
    finalPrice: 8500,
    notes: 'Traga junta de vedação padrão e chave inglesa.',
    status: 'concluido',
    isRated: true,
    createdAt: '2026-03-20T08:00:00.000Z',
    updatedAt: '2026-03-20T12:30:00.000Z',
  },
  {
    id: 'req_002_em_andamento',
    customerId: 'user_cliente_joao',
    customerName: 'João Baptista',
    customerPhone: '+244 912 777 888',
    professionalId: 'user_prof_mateus',
    professionalName: 'Gaspar Eletro-Soluções',
    categoryId: 'eletricidade',
    categoryName: 'Eletricidade',
    title: 'Disjuntor principal a disparar ao ligar AC',
    description: 'Sempre que ligamos o ar condicionado do quarto, o disjuntor de 20A desliga toda a fase da casa.',
    province: 'Luanda',
    city: 'Talatona',
    address: 'Condomínio Belas Business Park, Bloco C',
    latitude: -8.9150,
    longitude: 13.1850,
    scheduledDate: '2026-09-25',
    scheduledTime: '15:00',
    estimatedBudget: 15000,
    finalPrice: 15000,
    notes: 'Precisa verificar se é sobrecarga ou fiação desgastada.',
    status: 'em_andamento',
    isRated: false,
    createdAt: '2026-09-25T07:15:00.000Z',
    updatedAt: '2026-09-25T09:40:00.000Z',
  }
];

export const DEMO_REVIEWS: Review[] = [
  {
    id: 'rev_001',
    requestId: 'req_001_concluido',
    customerId: 'user_cliente_ana',
    customerName: 'Ana Paula Kaluanda',
    professionalId: 'user_prof_antonio',
    rating: 5,
    comment: 'O senhor António chegou no horário combinado, resolveu a fuga da torneira em menos de 45 minutos e deixou tudo limpo. Recomendo vivamente!',
    createdAt: '2026-03-20T13:00:00.000Z',
  }
];

export const DEFAULT_PAYMENT_METHODS = [
  {
    id: 'paypay',
    name: 'PayPay',
    provider: 'PayPayProvider',
    isActive: true,
    isConfigured: false,
    statusLabel: 'Preparado — aguardando configuração oficial',
    feesDescription: 'Taxa de comissão padrão AjudaJá',
    activatedAt: '2026-09-25',
    description: 'Carteira digital angolana PayPay (Pagamento Móvel / QR Code)',
    instructions: 'A transação será criada no sistema AjudaJá e enviada ao gateway PayPay.',
  },
  {
    id: 'mcx_express',
    name: 'Multicaixa Express',
    provider: 'MulticaixaProvider',
    isActive: true,
    isConfigured: false,
    statusLabel: 'Preparado — aguardando certificação EMIS',
    feesDescription: 'Taxa de comissão padrão AjudaJá',
    activatedAt: '2026-09-25',
    description: 'Rede interbancária Multicaixa Express EMIS / GPO',
    instructions: 'Confirme o pagamento com o número associado à sua conta Multicaixa Express.',
  },
  {
    id: 'appypay',
    name: 'AppyPay',
    provider: 'AppyPayProvider',
    isActive: true,
    isConfigured: false,
    statusLabel: 'Preparado — aguardando credenciais oficiais',
    feesDescription: 'Taxa de comissão padrão AjudaJá',
    activatedAt: '2026-09-25',
    description: 'Carteira digital e gateway AppyPay Angola',
    instructions: 'Pagamento através da sua conta e saldo AppyPay Angola.',
  },
  {
    id: 'cash',
    name: 'Dinheiro',
    provider: 'CashPaymentProvider',
    isActive: true,
    isConfigured: true,
    statusLabel: 'Ativo e Disponível',
    feesDescription: 'Sem taxas de gateway (comissão ajustada ao profissional)',
    activatedAt: '2026-09-25',
    description: 'Pagamento presencial em Kwanzas (Kz) diretamente ao profissional',
    instructions: 'Entregue o valor acordado em dinheiro vivo após o profissional concluir o serviço.',
  }
];

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  commissionRate: 10,
  currency: 'Kz',
  contactPhone: '+244 923 000 111',
  contactEmail: 'suporte@ajudaja.ao',
  supportedProvinces: [
    'Luanda', 'Benguela', 'Huíla', 'Huambo', 'Cabinda',
    'Cuanza Sul', 'Cunene', 'Namibe', 'Malanje', 'Uíge',
    'Zaire', 'Lunda Norte', 'Lunda Sul', 'Moxico', 'Bié',
    'Cuanza Norte', 'Bengo', 'Cuando Cubango'
  ],
  autoVerifyProfessionals: false,
  paymentMethods: DEFAULT_PAYMENT_METHODS,
  paypayEnabled: true,
  multicaixaEnabled: true,
  appypayEnabled: true,
  cashEnabled: true,
};

/**
 * Função idempotente para semear dados no Firestore
 */
export async function seedInitialDatabase(force: boolean = false) {
  try {
    // 1. Seed Categories
    const categoriesSnapshot = await getDocs(collection(db, 'categories'));
    if (categoriesSnapshot.empty || force) {
      for (const cat of INITIAL_CATEGORIES) {
        await setDoc(doc(db, 'categories', cat.id), cat);
      }
    }

    // 2. Seed Admin Settings
    const settingsDoc = await getDoc(doc(db, 'admin_settings', 'general'));
    if (!settingsDoc.exists() || force) {
      await setDoc(doc(db, 'admin_settings', 'general'), DEFAULT_ADMIN_SETTINGS);
    }

    // 3. Seed Professionals
    const profsSnapshot = await getDocs(collection(db, 'professionals'));
    if (profsSnapshot.empty || force) {
      for (const prof of DEMO_PROFESSIONALS) {
        await setDoc(doc(db, 'professionals', prof.id), prof);
        // Also register the professional user profile
        await setDoc(doc(db, 'users', prof.userId), {
          uid: prof.userId,
          name: prof.fullName,
          email: prof.email,
          phone: prof.phone,
          role: 'profissional',
          avatarUrl: prof.avatarUrl,
          province: prof.province,
          city: prof.city,
          createdAt: prof.createdAt,
        });
      }
    }

    // 4. Seed Demo Clients
    for (const client of DEMO_CLIENTS) {
      const clientDoc = await getDoc(doc(db, 'users', client.uid));
      if (!clientDoc.exists() || force) {
        await setDoc(doc(db, 'users', client.uid), client);
      }
    }

    // 5. Seed Demo Requests
    const reqsSnapshot = await getDocs(collection(db, 'service_requests'));
    if (reqsSnapshot.empty || force) {
      for (const req of DEMO_SERVICE_REQUESTS) {
        await setDoc(doc(db, 'service_requests', req.id), req);
      }
    }

    // 6. Seed Demo Reviews
    const reviewsSnapshot = await getDocs(collection(db, 'reviews'));
    if (reviewsSnapshot.empty || force) {
      for (const rev of DEMO_REVIEWS) {
        await setDoc(doc(db, 'reviews', rev.id!), rev);
      }
    }

    // 7. Configure Initial Administrator
    const initialAdminEmail = 'watson.manuel.eta@gmail.com';
    await setDoc(doc(db, 'admin_settings', 'admins'), {
      authorizedEmails: [initialAdminEmail, 'admin@ajudaja.ao'],
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    console.info('AjudaJá: Base de dados inicializada com sucesso.');
    return true;
  } catch (err) {
    console.error('Erro ao semear base de dados:', err);
    return false;
  }
}
