export type UserRole = 'cliente' | 'profissional' | 'administrador';

export type ProfessionalStatus = 'pendente' | 'verificado' | 'rejeitado' | 'suspenso';
export type AvailabilityStatus = 'disponivel' | 'ocupado' | 'indisponivel';

export type ServiceRequestStatus = 
  | 'pendente' 
  | 'aceito' 
  | 'a_caminho' 
  | 'em_andamento' 
  | 'concluido' 
  | 'cancelado';

export type ComplaintStatus = 'aberta' | 'em_analise' | 'resolvida' | 'encerrada';

export type PaymentStatus = 
  | 'pendente' 
  | 'processando' 
  | 'pago' 
  | 'falhou' 
  | 'cancelado' 
  | 'reembolsado';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  province?: string;
  city?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Professional {
  id?: string;
  userId: string;
  fullName: string;
  businessName: string;
  phone: string;
  email: string;
  avatarUrl?: string;
  categoryId: string;
  categoryName: string;
  subcategory?: string;
  description: string;
  experienceYears: number;
  serviceArea: string;
  province: string;
  city: string;
  latitude: number;
  longitude: number;
  availability: AvailabilityStatus;
  basePrice: number; // In Kwanzas (Kz)
  status: ProfessionalStatus;
  rating: number; // 1.0 - 5.0
  reviewCount: number;
  completedJobsCount: number;
  documentsUrl?: string;
  createdAt: string;
  updatedAt?: string;
  // Dynamic distance calculation property for UI
  distanceKm?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  subcategories: string[];
  isActive: boolean;
  order: number;
}

export interface ServiceRequest {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  professionalId: string;
  professionalName: string;
  categoryId: string;
  categoryName: string;
  title: string;
  description: string;
  photos?: string[];
  province: string;
  city: string;
  address: string;
  latitude?: number;
  longitude?: number;
  scheduledDate: string;
  scheduledTime: string;
  estimatedBudget?: number;
  finalPrice?: number;
  notes?: string;
  status: ServiceRequestStatus;
  cancellationReason?: string;
  isRated?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id?: string;
  requestId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  recipientId: string;
  text: string;
  read: boolean;
  createdAt: string;
}

export interface Review {
  id?: string;
  requestId: string;
  customerId: string;
  customerName: string;
  professionalId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface Complaint {
  id?: string;
  requestId: string;
  userId: string;
  userName: string;
  userRole: 'cliente' | 'profissional';
  reason: string;
  description: string;
  status: ComplaintStatus;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id?: string;
  requestId: string;
  customerId: string;
  professionalId: string;
  amount: number;
  commissionRate: number; // e.g. 10 for 10%
  commissionAmount: number;
  professionalEarnings: number;
  paymentMethod: string; // 'PayPay' | 'Multicaixa Express' | 'AppyPay' | etc.
  providerCode?: string; // 'paypay' | 'mcx_express' | 'appypay' | 'mock_dev'
  status: PaymentStatus;
  referenceCode?: string;
  gatewayTransactionId?: string;
  gatewayStatus?: string;
  gatewayMessage?: string;
  customerPhone?: string;
  customerEmail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: 'pedido' | 'status' | 'chat' | 'alerta' | 'admin';
  requestId?: string;
  read: boolean;
  createdAt: string;
}

export interface PaymentMethodConfig {
  id: string; // 'paypay' | 'mcx_express' | 'appypay' | 'cash'
  name: string; // 'PayPay', 'Multicaixa Express', 'AppyPay', 'Dinheiro'
  provider: string; // 'PayPayProvider', 'MulticaixaProvider', 'AppyPayProvider', 'CashPaymentProvider'
  isActive: boolean;
  isConfigured: boolean;
  statusLabel?: string;
  feesDescription?: string;
  activatedAt?: string;
  description?: string;
  instructions?: string;
}

export interface AdminSettings {
  id?: string;
  commissionRate: number; // Percentage, e.g. 10
  currency: string; // Kz
  contactPhone: string;
  contactEmail: string;
  supportedProvinces: string[];
  autoVerifyProfessionals: boolean;
  paymentMethods?: PaymentMethodConfig[];
  paypayEnabled?: boolean;
  multicaixaEnabled?: boolean;
  appypayEnabled?: boolean;
  cashEnabled?: boolean;
}
