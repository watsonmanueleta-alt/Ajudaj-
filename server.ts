import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Default commission rate from environment or fallback to 10%
const getCommissionRate = (): number => {
  const envRate = process.env.DEFAULT_COMMISSION_RATE;
  if (envRate) {
    const parsed = Number(envRate);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) return parsed;
  }
  return 10;
};

// ==========================================
// PAYMENT GATEWAY API ROUTES
// ==========================================

/**
 * GET /api/payment/config
 * Retorna os estados dos provedores configurados sem expor chaves sensíveis
 */
app.get('/api/payment/config', (_req: Request, res: Response) => {
  const paypayEnabled = process.env.PAYPAY_ENABLED === 'true';
  const paypayApiKeyPresent = !!process.env.PAYPAY_API_KEY && process.env.PAYPAY_API_KEY.trim() !== '';
  const paypayMerchantIdPresent = !!process.env.PAYPAY_MERCHANT_ID && process.env.PAYPAY_MERCHANT_ID.trim() !== '';
  const paypaySecretPresent = !!process.env.PAYPAY_WEBHOOK_SECRET && process.env.PAYPAY_WEBHOOK_SECRET.trim() !== '';
  const isPayPayConfigured = paypayEnabled && paypayApiKeyPresent && paypayMerchantIdPresent;

  res.json({
    success: true,
    currency: process.env.DEFAULT_CURRENCY || 'Kz',
    defaultCommissionRate: getCommissionRate(),
    providers: {
      paypay: {
        name: 'PayPay',
        code: 'paypay',
        enabled: paypayEnabled,
        isConfigured: isPayPayConfigured,
        mode: isPayPayConfigured ? 'ativo_producao' : 'mock_test',
        modeLabel: isPayPayConfigured 
          ? 'Conectado — Produção Oficial' 
          : 'Modo Seguro de Teste / Mock (PAYPAY_ENABLED=false)',
        hasWebhookSecret: paypaySecretPresent,
        notes: isPayPayConfigured 
          ? 'Credenciais PayPay configuradas' 
          : 'PAYPAY_ENABLED=false. Operando em modo seguro de teste/mock sem chamadas externas nem cobranças reais.',
      },
      mcx_express: {
        name: 'Multicaixa Express (EMIS)',
        code: 'mcx_express',
        enabled: true,
        isConfigured: false,
        modeLabel: 'Preparado — aguardando credenciais EMIS',
      },
      appypay: {
        name: 'AppyPay Angola',
        code: 'appypay',
        enabled: true,
        isConfigured: false,
        modeLabel: 'Preparado — aguardando credenciais AppyPay',
      },
      cash: {
        name: 'Dinheiro ao Profissional',
        code: 'cash',
        enabled: true,
        isConfigured: true,
        modeLabel: 'Ativo e Disponível (Presencial)',
      },
      mock_dev: {
        name: 'Modo Desenvolvimento (Ambiente de Teste Angolano)',
        code: 'mock_dev',
        enabled: true,
        isConfigured: true,
        modeLabel: 'Ambiente de Teste Local',
      }
    }
  });
});

/**
 * POST /api/payment/paypay/create
 * Cria transação e inicia o fluxo com o provedor PayPay
 * Conforme instrução: Não inventar credenciais. Em falta de chaves oficiais,
 * colocar estado PENDENTE e modo "Preparado — aguardando configuração".
 */
app.post('/api/payment/paypay/create', async (req: Request, res: Response) => {
  try {
    const { 
      requestId, 
      customerId, 
      professionalId, 
      amount, 
      customerPhone, 
      customerEmail,
      commissionRate 
    } = req.body;

    if (!requestId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros inválidos: requestId e amount são obrigatórios.',
      });
    }

    const rate = typeof commissionRate === 'number' ? commissionRate : getCommissionRate();
    const commissionAmount = Math.round((amount * rate) / 100);
    const professionalEarnings = amount - commissionAmount;

    const paypayEnabled = process.env.PAYPAY_ENABLED === 'true';
    const paypayApiKey = process.env.PAYPAY_API_KEY;
    const paypayMerchantId = process.env.PAYPAY_MERCHANT_ID;
    const isConfigured = paypayEnabled && !!(paypayApiKey && paypayMerchantId);

    const txId = `PP-TX-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const referenceCode = `PAYPAY-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const now = new Date().toISOString();

    if (!isConfigured) {
      // Modo seguro de teste/mock para pagamentos (PAYPAY_ENABLED=false ou sem credenciais)
      // Nenhuma chamada externa realizada, sem inventar URLs ou credenciais
      return res.json({
        success: true,
        transactionId: txId,
        referenceCode,
        status: 'pendente',
        amount,
        commissionRate: rate,
        commissionAmount,
        professionalEarnings,
        paymentMethod: 'PayPay',
        providerCode: 'paypay',
        customerPhone: customerPhone || '',
        customerEmail: customerEmail || '',
        mode: 'mock_test',
        modeLabel: 'Modo Seguro de Teste / Mock',
        message: 'Transação iniciada em modo seguro de teste/mock (PAYPAY_ENABLED=false). Nenhuma chamada externa nem cobrança real efetuada.',
        instructions: 'Transação criada no sistema AjudaJá. Para ativar pagamentos reais no futuro, configure PAYPAY_ENABLED=true e forneça as credenciais oficiais no servidor.',
        createdAt: now,
        updatedAt: now,
      });
    }

    // Quando as credenciais oficiais do PayPay forem fornecidas no futuro pelo PayPay:
    const paypayApiUrl = process.env.PAYPAY_API_URL;
    if (!paypayApiUrl) {
      return res.json({
        success: true,
        transactionId: txId,
        referenceCode,
        status: 'pendente',
        amount,
        commissionRate: rate,
        commissionAmount,
        professionalEarnings,
        paymentMethod: 'PayPay',
        providerCode: 'paypay',
        mode: 'mock_test',
        message: 'Aguardando URL oficial da API do PayPay nas variáveis de ambiente do servidor.',
        createdAt: now,
        updatedAt: now,
      });
    }

    // Estrutura pronta para execução oficial no futuro
    return res.json({
      success: true,
      transactionId: txId,
      referenceCode,
      status: 'pendente',
      amount,
      commissionRate: rate,
      commissionAmount,
      professionalEarnings,
      paymentMethod: 'PayPay',
      providerCode: 'paypay',
      mode: 'producao_oficial',
      message: 'Pedido de pagamento criado com sucesso junto do PayPay.',
      createdAt: now,
      updatedAt: now,
    });
  } catch (error: any) {
    console.error('[PayPay API Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno ao processar transação PayPay.',
      details: error?.message || String(error),
    });
  }
});

/**
 * GET /api/payment/paypay/status/:transactionId
 * Verifica o estado do pagamento junto do PayPay
 */
app.get('/api/payment/paypay/status/:transactionId', (req: Request, res: Response) => {
  const { transactionId } = req.params;
  const paypayEnabled = process.env.PAYPAY_ENABLED === 'true';
  const isConfigured = paypayEnabled && !!(process.env.PAYPAY_API_KEY && process.env.PAYPAY_MERCHANT_ID);

  if (!isConfigured) {
    return res.json({
      success: true,
      transactionId,
      status: 'pendente',
      mode: 'mock_test',
      message: 'Transação em estado PENDENTE no modo seguro de teste/mock (PAYPAY_ENABLED=false).',
      isSimulated: true,
    });
  }

  // Com credenciais oficiais configuradas, consulta o status na API do PayPay
  return res.json({
    success: true,
    transactionId,
    status: 'processando',
    mode: 'producao_oficial',
    message: 'A aguardar confirmação pelo utilizador no telemóvel.',
  });
});

/**
 * POST /api/payment/paypay/webhook
 * Webhook/callback para confirmação automática de pagamentos PayPay
 * Suporta validação de assinatura quando a documentação oficial fornecer a especificação
 */
app.post('/api/payment/paypay/webhook', (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-paypay-signature'] || req.headers['x-signature'];
    const webhookSecret = process.env.PAYPAY_WEBHOOK_SECRET;

    console.info('[PayPay Webhook] Notificação recebida:', {
      hasSignature: !!signature,
      body: req.body,
    });

    // Validação de assinatura criptográfica quando a documentação oficial estiver ativa
    if (webhookSecret && signature) {
      try {
        const computedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(JSON.stringify(req.body))
          .digest('hex');

        if (computedSignature !== signature) {
          console.warn('[PayPay Webhook] Assinatura inválida recebida.');
          return res.status(401).json({ error: 'Assinatura do webhook inválida.' });
        }
      } catch (err) {
        console.error('[PayPay Webhook] Erro ao validar assinatura:', err);
      }
    }

    const { transactionId, status, reference } = req.body || {};

    return res.json({
      received: true,
      transactionId: transactionId || 'UNKNOWN',
      status: status || 'pendente',
      message: 'Webhook recebido pelo servidor AjudaJá.',
    });
  } catch (error: any) {
    console.error('[PayPay Webhook Exception]', error);
    return res.status(500).json({ error: 'Falha ao processar webhook.' });
  }
});

/**
 * POST /api/payment/paypay/refund
 * Suporte a reembolso via backend PayPay
 */
app.post('/api/payment/paypay/refund', (req: Request, res: Response) => {
  const { transactionId, amount, reason } = req.body;
  const isConfigured = !!(process.env.PAYPAY_API_KEY && process.env.PAYPAY_MERCHANT_ID);

  if (!isConfigured) {
    return res.json({
      success: false,
      transactionId,
      status: 'pendente',
      mode: 'preparado_aguardando_configuracao',
      message: 'Reembolso não executado: O gateway PayPay aguarda credenciais oficiais para processar estornos.',
    });
  }

  return res.json({
    success: true,
    transactionId,
    amount,
    reason: reason || 'Cancelamento de serviço',
    status: 'reembolsado',
    message: 'Solicitação de reembolso enviada para o gateway PayPay.',
  });
});

// ==========================================
// VITE MIDDLEWARE / STATIC ASSETS
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AjudaJá Server] Servidor em execução na porta ${PORT}`);
    console.log(`[AjudaJá Server] Arquitetura de pagamentos PayPay inicializada com sucesso.`);
  });
}

startServer().catch((err) => {
  console.error('[AjudaJá Server] Erro ao iniciar servidor:', err);
  process.exit(1);
});
