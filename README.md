# AjudaJá - Plataforma de Serviços para Angola 🇦🇴

> *"Encontre quem pode ajudar."*

O **AjudaJá** é um marketplace completo de contratação e prestação de serviços locais projetado especificamente para o mercado angolano (Luanda, Benguela, Huíla, Huambo, Cabinda e demais províncias), conectando **Clientes** a **Profissionais** verificados em tempo real com cálculo geodésico por GPS.

---

## 🚀 Tecnologias Utilizadas

- **Frontend:** React 19 + TypeScript + Vite 8
- **Estilização:** Tailwind CSS v4 + Lucide Icons + Plus Jakarta Sans Typography
- **Backend & Base de Dados:** Firebase Firestore Enterprise + Firebase Authentication (Google OAuth)
- **Segurança & RBAC:** Regras robustas de Firestore (`firestore.rules`) com isolamento de funções (Cliente, Profissional, Administrador)
- **Processamento de Linguagem Natural (NLP):** Motor de interpretação de problemas em português de Angola (ex: *"minha torneira está a vazar"* ➔ sugere automaticamente **Canalização**)
- **Geolocalização:** Cálculo de distância em quilómetros pela fórmula de Haversine
- **Pagamentos:** Arquitetura desacoplada via `PaymentService` e `PaymentProvider`, preparada para **Multicaixa Express (EMIS)** e **AppyPay Angola**
- **Notificações & Chat em Tempo Real:** Subcoleções com ouvintes reativos `onSnapshot`

---

## 👥 Tipos de Utilizadores e Controlo de Acesso (RBAC)

1. **CLIENTE:**
   - Pesquisa por texto ou linguagem natural.
   - Filtro por categoria, província e proximidade GPS.
   - Visualização de perfil verificado, biografia, trabalhos realizados e avaliações.
   - Solicitação de serviço com data, hora, orçamento em Kwanzas (Kz) e coordenadas GPS.
   - Chat direto com o profissional associado ao pedido.
   - Avaliação com estrelas (1 a 5) e comentário após a conclusão.
   - Abertura de reclamações/disputas.

2. **PROFISSIONAL:**
   - Gestão de disponibilidade (*Disponível*, *Ocupado*, *Indisponível*).
   - Recebimento de pedidos de serviço com orçamento em Kz.
   - Aceitação ou recusa de pedidos.
   - Atualização de fluxo de trabalho: `Aceito` ➔ `A caminho` ➔ `Em andamento` ➔ `Concluído`.
   - Extrato de ganhos com retenção automática da taxa de comissão da plataforma.

3. **ADMINISTRADOR:**
   - Dashboard com KPIs em tempo real (pedidos, clientes, profissionais, disputas, receita).
   - Moderação e verificação de profissionais (*Aprovar*, *Suspender*, *Rejeitar*, *Reativar*).
   - Gestão do catálogo de categorias e subcategorias.
   - Mediação de reclamações (*Aberta*, *Em análise*, *Resolvida*, *Encerrada*).
   - Configuração dinâmica da taxa de comissão (`commission_rate`), contactos de suporte e províncias suportadas.

---

## 🛠️ Como Executar o Projeto Localmente

### 1. Pré-requisitos
- Node.js >= 20.x
- npm ou bun

### 2. Instalação de Dependências
```bash
npm install
```

### 3. Configuração de Variáveis de Ambiente
Copie o ficheiro `.env.example` para `.env`:
```bash
cp .env.example .env
```
O ficheiro contém as definições essenciais:
```ini
INITIAL_ADMIN_EMAIL="watson.manuel.eta@gmail.com"
DEFAULT_COMMISSION_RATE=10
DEFAULT_CURRENCY="Kz"
DEFAULT_COUNTRY="AO"
```

### 4. Executar Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse a aplicação no navegador em `http://localhost:3000`.

---

## 🗄️ Estrutura da Base de Dados (Firestore)

- `/users/{userId}`: Perfis dos utilizadores (papéis: cliente, profissional, administrador)
- `/professionals/{profId}`: Perfis de prestadores de serviço, especialidades, status de verificação, preços e métricas
- `/categories/{categoryId}`: Catálogo de especialidades (Canalização, Eletricidade, Mecânica, Telemóveis, etc.)
- `/service_requests/{requestId}`: Pedidos de serviço com máquina de estados de 6 fases
- `/service_requests/{requestId}/messages/{messageId}`: Conversação em tempo real do chat do serviço
- `/reviews/{reviewId}`: Avaliações com notas de 1 a 5 estrelas e comentários
- `/complaints/{complaintId}`: Reclamações de clientes ou profissionais com parecer da administração
- `/transactions/{transactionId}`: Histórico financeiro, taxas de comissão e repasses
- `/notifications/{notificationId}`: Notificações no app
- `/admin_settings/general`: Parâmetros operacionais da plataforma

---

## 💳 Arquitetura de Pagamentos Multiprovedor em Angola

A plataforma AjudaJá adota um modelo desacoplado através do serviço `PaymentService` e da interface comum `PaymentProvider`.

### Métodos de Pagamento Suportados:

1. **PayPay Angola (`PayPayProvider`):**
   - Carteira digital móvel.
   - Estado: *Modo Seguro de Teste / Mock* com `PAYPAY_ENABLED=false`.
   - Toda comunicação passa pelo backend (`/server.ts`), protegendo chaves de API e validando transações sem chamadas externas nem URLs inventadas.
   - Variáveis: `PAYPAY_ENABLED=false`, `PAYPAY_API_URL`, `PAYPAY_API_KEY`, `PAYPAY_MERCHANT_ID`, `PAYPAY_WEBHOOK_SECRET`.

2. **Multicaixa Express (`MulticaixaProvider`):**
   - Rede interbancária angolana EMIS / GPO.
   - Preparado para certificação bancária oficial.

3. **AppyPay Angola (`AppyPayProvider`):**
   - Gateway de pagamentos digitais e cartões Multicaixa.

4. **Dinheiro ao Profissional (`CashPaymentProvider`):**
   - Pagamento presencial em Kwanzas (Kz) direto ao profissional.
   - Totalmente funcional e disponível para clientes.

### ⚙️ Gestão de Métodos no Painel Administrativo:
- Localização: **Configurações → Pagamentos → Métodos de pagamento**.
- Cada método possui: `nome`, `status ATIVO/INATIVO`, `provedor`, `configuração`, `taxas` e `data de ativação`.
- A comissão do AjudaJá é **independente do método de pagamento** e configurável dinamicamente através de `DEFAULT_COMMISSION_RATE` ou no painel de administração.

---

## 🧪 Roteiro de Testes e Validação do MVP (20 Passos)

1. Abra a aplicação **AjudaJá** e observe o layout responsivo com moeda em **Kz** e províncias de Angola.
2. No canto superior direito, use o seletor de papéis para selecionar **Cliente (Ana Paula)**.
3. Teste a busca em linguagem natural digitando: *"minha torneira está a vazar"*.
4. Veja a recomendação imediata da categoria **Canalização** com botão de filtro direto.
5. Filtre os profissionais por proximidade GPS ou província (Luanda).
6. Abra o perfil do profissional **António Kapango (Kapango Canalizações)**.
7. Veja as avaliações reais de clientes e clique em **Solicitar Serviço**.
8. Preencha a data, hora, descrição e envie o pedido. O pedido entrará no estado `Pendente`.
9. No seletor de papéis no topo, alterne para **Profissional (António Kapango)**.
10. Veja o novo pedido na aba **Novos Pedidos** do painel do profissional.
11. Clique em **Aceitar Pedido**.
12. Avance o estado clicando em **Marcar "A Caminho"** e posteriormente em **Iniciar "Em Andamento"**.
13. Clique no botão de **Chat** para enviar e receber mensagens em tempo real entre cliente e profissional.
14. Conclua o serviço informando o valor final em Kz (ex: 8.500 Kz).
15. Retorne ao perfil de **Cliente (Ana Paula)** e visualize o botão **Avaliar Profissional**.
16. Submeta uma avaliação de 5 estrelas com comentário. A média do profissional será recalculada no banco de dados.
17. Alterne para o perfil de **Administrador (Watson Manuel)**.
18. Acesse a aba **Profissionais** para aprovar novos prestadores pendentes.
19. Acesse a aba **Categorias** para criar ou editar novas categorias de serviço.
20. Acesse **Finanças & Pagamentos** para conferir a comissão retida e o volume faturado.
