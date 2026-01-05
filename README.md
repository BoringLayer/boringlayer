# Boring Layer - Monorepo

Sistema di pagamento peer-to-peer su Twitter utilizzando token virtuali (BP - Boring Points).

## 📁 Struttura del Progetto

```
boringlayer/
├── backend/          # Bot Twitter Python
├── frontend/         # Dashboard Next.js
└── README.md         # Questo file
```

## 🚀 Quick Start

### Backend Setup

```bash
cd backend
chmod +x setup.sh start.sh
./setup.sh
```

Configura le credenziali in `data/config.json` (usa `config.json.sample` come template).

```bash
./start.sh
```

### Frontend Setup

```bash
cd frontend
npm install
```

Crea un file `.env.local` con:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

```bash
npm run dev
```

## 📖 Documentazione

### Backend

Il bot Twitter monitora le menzioni a `@boringlayer_` e processa transazioni con il formato:

```
@boringlayer_ send [amount] BP to @[username] via @boringlayer_
```

**Funzionalità:**
- Monitoraggio menzioni in tempo reale
- Processamento transazioni automatico
- Gestione rate limits API Twitter
- Aggiornamento bilanci su Supabase
- Sistema di commissioni (10% riserva, 0.5% fees, 0.5% burned)

**Tecnologie:**
- Python 3.x
- Tweepy (Twitter API v2)
- Supabase (PostgreSQL)
- Rich (logging avanzato)

### Frontend

Dashboard web per visualizzare:
- **Ranking**: Top 100 utenti per saldo
- **Transactions**: Storico transazioni
- **Overview**: Statistiche generali

**Tecnologie:**
- Next.js 14 (App Router)
- TypeScript
- React 18
- Supabase Client
- Styled Components
- Tailwind CSS

## 🗄️ Database Schema

### Tabelle Supabase

**user_balance**
- `username` (string, primary key)
- `balance` (numeric)
- `updated_at` (timestamp)

**transactions**
- `Date` (timestamp)
- `Sender` (string)
- `Recipient` (string)
- `Amount` (numeric)
- `Net_sent` (numeric)
- `Fees` (numeric)
- `Burned` (numeric)
- `Twitt ID` (string)

**treasury**
- `total_fees` (numeric)
- `total_fees_usd` (numeric)
- `created_at` (timestamp)

## 🔧 Configurazione

### Backend

Copia `backend/data/config.json.sample` in `backend/data/config.json` e compila:

```json
{
  "TWITTER_API_KEY": "",
  "TWITTER_API_SECRET": "",
  "BEARER_TOKEN": "",
  "ACCESS_TOKEN": "",
  "ACCESS_TOKEN_SECRET": "",
  "SUPABASE_URL": "",
  "SUPABASE_API_KEY": "",
  "GMAIL_APP_PASSWORD": ""
}
```

### Frontend

Crea `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret
```

## 📊 Rate Limits

Il sistema gestisce automaticamente i rate limits di Twitter:

- **MENTION_SEARCH**: 60 richieste/15min
- **TWEET_REPLY**: 15 risposte/15min
- **USER_LOOKUP**: 100 lookup/24h

## 🔐 Sicurezza

- Validazione input rigorosa
- Verifica saldi prima delle transazioni
- Sistema di blacklist utenti
- Gestione errori robusta

## 📝 License

[Specifica la licenza]

## 🤝 Contributing

[Istruzioni per contribuire]

## 📧 Support

Per supporto, contatta [informazioni di contatto]




