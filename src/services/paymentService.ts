import { PaymentStatus, Transaction } from '../types/index.ts';

/**
 * Interface comum para todos os fornecedores de pagamentos em Angola
 */
export interface PaymentProvider {
  name: string;
  code: string;
  isConfigured: boolean;
  supportedMethods: string[];
  mode?: string;
  createPayment(params: {
    requestId: string;
    amount: number;
    customerId?: string;
    professionalId?: string;
    customerPhone?: string;
    customerEmail?: string;
    reference?: string;
    commissionRate?: number;
  }): Promise<{
    transactionId: string;
    status: PaymentStatus;
    reference: string;
    mode?: string;
    message?: string;
    instructions?: string;
    gatewayResponse?: any;
  }>;
  checkPaymentStatus(transactionId: string): Promise<{
    status: PaymentStatus;
    message: string;
    isSimulated?: boolean;
  }>;
  handleWebhook(payload: any, signature?: string): Promise<{
    success: boolean;
    status?: PaymentStatus;
    message: string;
  }>;
  refundPayment(
    transactionId: string, 
    amount?: number, 
    reason?: string
  ): Promise<{
    success: boolean;
    message: string;
  }>;
}

/**
 * =========================================================================
 * 1. PayPayProvider (PayPay Angola)
 * =========================================================================
 * Integração modular preparada para o PayPay Angola.
 * Não inventa credenciais ou endpoints inexistentes.
 * Permanece em modo "Preparado — aguardando configuração" até que as
 * chaves oficiais (PAYPAY_API_KEY, PAYPAY_MERCHANT_ID) sejam fornecidas.
 * Toda a comunicação com a API do PayPay passa pelo backend/servidor.
 */
export class PayPayProvider implements PaymentProvider {
  name = 'PayPay';
  code = 'paypay';
  isConfigured = false; // Aguarda credenciais oficiais
  supportedMethods = ['PayPay', 'PayPay Carteira Digital', 'PayPay QR Code'];
  mode = 'Preparado — aguardando configuração';

  constructor() {
    this.checkConfigStatus();
  }

  /**
   * Verifica dinamicamente no backend se as credenciais do PayPay estão ativas
   */
  private async checkConfigStatus() {
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/payment/config');
        if (res.ok) {
          const data = await res.json();
          if (data?.providers?.paypay) {
            this.isConfigured = data.providers.paypay.isConfigured;
            this.mode = data.providers.paypay.modeLabel;
          }
        }
      }
    } catch {
      // Backend pode estar em inicialização
    }
  }

  /**
   * Inicia o fluxo de pagamento PayPay.
   * Cria transação em estado PENDENTE.
   * Não simula pagamento confirmado enquanto não houver credenciais reais.
   */
  async createPayment(params: {
    requestId: string;
    amount: number;
    customerId?: string;
    professionalId?: string;
    customerPhone?: string;
    customerEmail?: string;
    reference?: string;
    commissionRate?: number;
  }) {
    // Comunicação obrigatória via backend/servidor
    if (typeof window !== 'undefined') {
      try {
        const response = await fetch('/api/payment/paypay/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });

        if (response.ok) {
          const result = await response.json();
          return {
            transactionId: result.transactionId,
            status: result.status as PaymentStatus,
            reference: result.referenceCode,
            mode: result.mode,
            message: result.message,
            instructions: result.instructions || 'Aguardando validação do pagamento na carteira PayPay.',
            gatewayResponse: result,
          };
        }
      } catch (err) {
        console.warn('[PayPayProvider] Falha ao comunicar com backend, a utilizar fallback local seguro:', err);
      }
    }

    // Fallback local seguro (mantém estado PENDENTE e modo de teste seguro)
    const txId = `PP-LOCAL-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const ref = params.reference || `PP-${Math.floor(10000000 + Math.random() * 90000000)}`;

    return {
      transactionId: txId,
      status: 'pendente' as PaymentStatus,
      reference: ref,
      mode: 'Modo Seguro de Teste / Mock (PAYPAY_ENABLED=false)',
      message: 'Transação PayPay criada em modo seguro de teste/mock (PAYPAY_ENABLED=false). Nenhuma chamada externa nem cobrança real efetuada.',
      instructions: 'Ambiente de teste ativo. Para pagamentos reais no futuro, configure PAYPAY_ENABLED=true e credenciais oficiais no servidor.',
    };
  }

  /**
   * Consulta o estado da transação junto do backend PayPay
   */
  async checkPaymentStatus(transactionId: string): Promise<{
    status: PaymentStatus;
    message: string;
    isSimulated?: boolean;
  }> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch(`/api/payment/paypay/status/${transactionId}`);
        if (res.ok) {
          const data = await res.json();
          return {
            status: data.status as PaymentStatus,
            message: data.message,
            isSimulated: data.isSimulated || true,
          };
        }
      } catch (err) {
        console.warn('[PayPayProvider] Erro ao consultar estado:', err);
      }
    }

    return {
      status: 'pendente',
      message: 'Transação em estado PENDENTE no modo seguro de teste/mock (PAYPAY_ENABLED=false).',
      isSimulated: true,
    };
  }

  /**
   * Suporte para webhook/callback de confirmação de pagamento PayPay
   * A validação de assinatura e processamento é delegada ao backend
   */
  async handleWebhook(payload: any, signature?: string): Promise<{
    success: boolean;
    status?: PaymentStatus;
    message: string;
  }> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/payment/paypay/webhook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(signature ? { 'x-paypay-signature': signature } : {}),
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        return {
          success: res.ok,
          status: data.status,
          message: data.message || 'Webhook processado.',
        };
      } catch (err: any) {
        return {
          success: false,
          message: err?.message || 'Falha ao despachar webhook para o backend.',
        };
      }
    }

    return {
      success: true,
      status: 'pendente',
      message: 'Webhook registado em modo de preparação.',
    };
  }

  /**
   * Suporte a reembolso via PayPay
   */
  async refundPayment(transactionId: string, amount?: number, reason?: string): Promise<{
    success: boolean;
    message: string;
  }> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/payment/paypay/refund', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactionId, amount, reason }),
        });
        const data = await res.json();
        return {
          success: data.success,
          message: data.message || 'Solicitação de reembolso enviada.',
        };
      } catch (err: any) {
        return {
          success: false,
          message: err?.message || 'Erro ao solicitar reembolso.',
        };
      }
    }

    return {
      success: false,
      message: 'O gateway PayPay aguarda credenciais oficiais para processar reembolsos.',
    };
  }
}

/**
 * =========================================================================
 * 2. AppyPayProvider (AppyPay Angola)
 * =========================================================================
 */
export class AppyPayProvider implements PaymentProvider {
  name = 'AppyPay';
  code = 'appypay';
  isConfigured = false;
  supportedMethods = ['AppyPay Wallet', 'Cartão Multicaixa'];
  mode = 'Preparado — aguardando credenciais oficiais';

  async createPayment(params: {
    requestId: string;
    amount: number;
    reference?: string;
  }) {
    return {
      transactionId: `APPY-${Date.now()}`,
      status: 'pendente' as PaymentStatus,
      reference: params.reference || `AP-${Date.now()}`,
      instructions: 'Este método de pagamento ainda não está disponível. Aguardando credenciais de produção.',
      message: 'Este método de pagamento ainda não está disponível.',
      mode: 'Preparado — aguardando configuração',
    };
  }

  async checkPaymentStatus(_transactionId: string) {
    return {
      status: 'pendente' as PaymentStatus,
      message: 'Este método de pagamento ainda não está disponível.',
    };
  }

  async handleWebhook(payload: any) {
    return {
      success: true,
      status: 'pendente' as PaymentStatus,
      message: 'Webhook AppyPay registado.',
    };
  }

  async refundPayment(_transactionId: string) {
    return {
      success: false,
      message: 'Reembolso AppyPay aguarda credenciais oficiais.',
    };
  }
}

/**
 * =========================================================================
 * 3. MulticaixaProvider (Multicaixa Express EMIS)
 * =========================================================================
 */
export class MulticaixaProvider implements PaymentProvider {
  name = 'Multicaixa Express';
  code = 'mcx_express';
  isConfigured = false;
  supportedMethods = ['Multicaixa Express', 'GPO'];
  mode = 'Preparado — aguardando certificação EMIS';

  async createPayment(params: {
    requestId: string;
    amount: number;
    reference?: string;
  }) {
    return {
      transactionId: `MCX-${Date.now()}`,
      status: 'pendente' as PaymentStatus,
      reference: params.reference || `99${Math.floor(1000000 + Math.random() * 9000000)}`,
      instructions: 'Este método de pagamento ainda não está disponível. Aguardando certificação oficial com a rede EMIS.',
      message: 'Este método de pagamento ainda não está disponível.',
      mode: 'Preparado — aguardando certificação EMIS',
    };
  }

  async checkPaymentStatus(_transactionId: string) {
    return {
      status: 'pendente' as PaymentStatus,
      message: 'Este método de pagamento ainda não está disponível.',
    };
  }

  async handleWebhook(payload: any) {
    return {
      success: true,
      status: 'pendente' as PaymentStatus,
      message: 'Webhook Multicaixa registado.',
    };
  }

  async refundPayment(_transactionId: string) {
    return {
      success: false,
      message: 'Reembolso Multicaixa aguarda certificação bancária.',
    };
  }
}

/**
 * =========================================================================
 * 4. CashPaymentProvider (Pagamento Presencial em Dinheiro)
 * =========================================================================
 */
export class CashPaymentProvider implements PaymentProvider {
  name = 'Dinheiro';
  code = 'cash';
  isConfigured = true;
  supportedMethods = ['Dinheiro Presencial (Kz)'];
  mode = 'Ativo (Pagamento Presencial)';

  async createPayment(params: {
    requestId: string;
    amount: number;
    reference?: string;
  }) {
    const txId = `CASH-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const ref = `DINHEIRO-${Math.floor(100000 + Math.random() * 900000)}`;
    return {
      transactionId: txId,
      status: 'pendente' as PaymentStatus,
      reference: ref,
      mode: 'Pagamento Presencial em Dinheiro',
      message: 'Método selecionado: Dinheiro ao Profissional. O valor será pago diretamente ao profissional após a conclusão do serviço.',
      instructions: `Efetue o pagamento de ${params.amount.toLocaleString('pt-AO')} Kz diretamente ao profissional após a conclusão do serviço.`,
    };
  }

  async checkPaymentStatus(_transactionId: string) {
    return {
      status: 'pendente' as PaymentStatus,
      message: 'Aguardando pagamento presencial em dinheiro ao profissional.',
    };
  }

  async handleWebhook(_payload: any) {
    return {
      success: true,
      status: 'pago' as PaymentStatus,
      message: 'Pagamento presencial confirmado.',
    };
  }

  async refundPayment(_transactionId: string) {
    return {
      success: false,
      message: 'Reembolsos em dinheiro devem ser acordados diretamente entre cliente e profissional.',
    };
  }
}

/**
 * =========================================================================
 * 5. MockPaymentProvider (Ambiente de Teste Local)
 * =========================================================================
 */
export class MockPaymentProvider implements PaymentProvider {
  name = 'Modo Desenvolvimento (Ambiente de Teste Angolano)';
  code = 'mock_dev';
  isConfigured = true;
  supportedMethods = [
    'Referência Multicaixa Express (Simulada)',
    'Transferência Bancária (IBAN)',
    'Dinheiro ao Profissional',
  ];
  mode = 'Ambiente de Teste Seguro';

  async createPayment(params: {
    requestId: string;
    amount: number;
    reference?: string;
  }) {
    return {
      transactionId: `TX-DEV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'pendente' as PaymentStatus,
      reference: params.reference || `REF-${Math.floor(100000000 + Math.random() * 900000000)}`,
      instructions: `Efetue o pagamento de ${params.amount.toLocaleString('pt-AO')} Kz por Multicaixa Express ou transferência bancária para validação do serviço.`,
      message: 'Transação criada no ambiente de teste local.',
    };
  }

  async checkPaymentStatus(_transactionId: string) {
    return {
      status: 'pendente' as PaymentStatus,
      message: 'Transação de teste em verificação.',
      isSimulated: true,
    };
  }

  async handleWebhook(payload: any) {
    return {
      success: true,
      status: 'pago' as PaymentStatus,
      message: 'Webhook de teste processado.',
    };
  }

  async refundPayment(_transactionId: string) {
    return {
      success: true,
      message: 'Reembolso simulado no ambiente de teste.',
    };
  }
}

/**
 * =========================================================================
 * PaymentService Principal
 * =========================================================================
 * Gerencia os provedores, o cálculo dinâmico de comissões (DEFAULT_COMMISSION_RATE)
 * e o ciclo de vida das transações do AjudaJá.
 */
export class PaymentService {
  private static instance: PaymentService;
  private providers: Map<string, PaymentProvider> = new Map();
  private defaultProviderCode = 'paypay';

  private constructor() {
    // Registro dos provedores modulares na arquitetura
    this.registerProvider(new PayPayProvider());
    this.registerProvider(new MulticaixaProvider());
    this.registerProvider(new AppyPayProvider());
    this.registerProvider(new CashPaymentProvider());
    this.registerProvider(new MockPaymentProvider());
  }

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  public registerProvider(provider: PaymentProvider) {
    this.providers.set(provider.code, provider);
  }

  public getProvider(code: string): PaymentProvider | undefined {
    return this.providers.get(code);
  }

  public getPayPayProvider(): PayPayProvider {
    return (this.providers.get('paypay') as PayPayProvider) || new PayPayProvider();
  }

  public getAvailableProviders(): PaymentProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Calcula a comissão da plataforma e o valor a repassar ao profissional.
   * A taxa padrão de comissão é configurável via parâmetro ou variável de ambiente.
   */
  public calculateCommission(
    amount: number, 
    commissionRate: number = 10
  ): {
    commissionAmount: number;
    professionalEarnings: number;
  } {
    const rate = Math.max(0, Math.min(100, commissionRate));
    const commissionAmount = Math.round((amount * rate) / 100);
    const professionalEarnings = amount - commissionAmount;
    return { commissionAmount, professionalEarnings };
  }

  /**
   * Cria uma transação no sistema, disparando o provedor correspondente.
   * Fluxo:
   * Cliente escolhe PayPay -> Sistema cria transação -> Estado: PENDENTE
   * -> PaymentService chama PayPayProvider -> PayPay processa pagamento -> PAGO
   */
  public async createTransaction(params: {
    requestId: string;
    customerId: string;
    professionalId: string;
    amount: number;
    commissionRate?: number;
    paymentMethod?: string;
    providerCode?: string;
    customerPhone?: string;
    customerEmail?: string;
  }): Promise<Omit<Transaction, 'id'>> {
    const rate = params.commissionRate ?? 10;
    const { commissionAmount, professionalEarnings } = this.calculateCommission(params.amount, rate);

    // Determina o provedor
    let targetCode = params.providerCode;
    if (!targetCode) {
      if (params.paymentMethod?.toLowerCase().includes('paypay')) {
        targetCode = 'paypay';
      } else if (params.paymentMethod?.toLowerCase().includes('multicaixa')) {
        targetCode = 'mcx_express';
      } else if (params.paymentMethod?.toLowerCase().includes('appy')) {
        targetCode = 'appypay';
      } else if (params.paymentMethod?.toLowerCase().includes('dinheiro') || params.paymentMethod?.toLowerCase().includes('cash')) {
        targetCode = 'cash';
      } else {
        targetCode = this.defaultProviderCode;
      }
    }

    const provider = this.providers.get(targetCode) || this.providers.get('paypay')!;

    const paymentResult = await provider.createPayment({
      requestId: params.requestId,
      amount: params.amount,
      customerId: params.customerId,
      professionalId: params.professionalId,
      customerPhone: params.customerPhone,
      customerEmail: params.customerEmail,
      reference: `AJ-${Math.floor(100000 + Math.random() * 900000)}`,
      commissionRate: rate,
    });

    const now = new Date().toISOString();

    return {
      requestId: params.requestId,
      customerId: params.customerId,
      professionalId: params.professionalId,
      amount: params.amount,
      commissionRate: rate,
      commissionAmount,
      professionalEarnings,
      paymentMethod: params.paymentMethod || provider.supportedMethods[0] || 'PayPay',
      providerCode: provider.code,
      status: paymentResult.status,
      referenceCode: paymentResult.reference,
      gatewayTransactionId: paymentResult.transactionId,
      gatewayStatus: paymentResult.mode || 'preparado_aguardando_configuracao',
      gatewayMessage: paymentResult.message,
      customerPhone: params.customerPhone,
      customerEmail: params.customerEmail,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Consulta o estado do pagamento em um provedor
   */
  public async checkTransactionStatus(
    transactionId: string, 
    providerCode: string = 'paypay'
  ) {
    const provider = this.providers.get(providerCode) || this.providers.get('paypay')!;
    return provider.checkPaymentStatus(transactionId);
  }

  /**
   * Processa webhook recebido para determinado provedor
   */
  public async handleWebhook(
    providerCode: string, 
    payload: any, 
    signature?: string
  ) {
    const provider = this.providers.get(providerCode);
    if (!provider) {
      throw new Error(`Provedor ${providerCode} não encontrado no PaymentService.`);
    }
    return provider.handleWebhook(payload, signature);
  }

  /**
   * Solicita estorno/reembolso
   */
  public async refund(
    providerCode: string, 
    transactionId: string, 
    amount?: number, 
    reason?: string
  ) {
    const provider = this.providers.get(providerCode);
    if (!provider) {
      throw new Error(`Provedor ${providerCode} não encontrado no PaymentService.`);
    }
    return provider.refundPayment(transactionId, amount, reason);
  }
}
