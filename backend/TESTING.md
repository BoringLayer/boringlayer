# 🧪 Guida ai Test - Boring Layer

Questa guida spiega come testare completamente il sistema Boring Layer senza chiamare le API Twitter reali.

## 📋 Tipi di Test Disponibili

### 1. Test Unitari (`test_all.py`)
Testa le funzionalità base del backend:
- ✅ Estrazione e validazione transazioni
- ✅ Connessione Supabase
- ✅ Verifica saldi utenti
- ✅ Processamento transazioni (mock)
- ✅ Gestione rate limits

**Esecuzione:**
```bash
cd backend
./run_tests.sh
# oppure
python3 test_all.py
```

### 2. Test End-to-End (`test_e2e.py`)
Testa il flusso completo di una transazione:
- ✅ Setup utenti di test
- ✅ Creazione menzione mock
- ✅ Estrazione transazione
- ✅ Verifica saldo
- ✅ Esecuzione transazione (REALE su Supabase)
- ✅ Verifica saldi finali
- ✅ Verifica registrazione transazione
- ✅ Simulazione risposta Twitter

**⚠️ ATTENZIONE:** Questo test esegue transazioni REALI su Supabase!

**Esecuzione:**
```bash
cd backend
python3 test_e2e.py
```

### 3. Test Integrazione Frontend-Backend (`test_frontend_integration.py`)
Verifica che i dati processati dal backend siano accessibili dal frontend:
- ✅ API Top 100 (simulazione)
- ✅ API Transactions (simulazione)
- ✅ API User Search (simulazione)

**Esecuzione:**
```bash
cd backend
python3 test_frontend_integration.py
```

### 4. Test Completo (`run_all_tests.sh`)
Esegue tutti i test in sequenza.

**Esecuzione:**
```bash
cd backend
./run_all_tests.sh
```

## 🚀 Procedura Completa di Test

### Step 1: Setup Ambiente
```bash
cd backend

# Se l'ambiente virtuale non esiste
./setup.sh

# Attiva l'ambiente virtuale
source .venv/bin/activate
```

### Step 2: Verifica Configurazione
Assicurati che `data/config.json` contenga:
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_API_KEY`
- ⚠️ Le credenziali Twitter non sono necessarie per i test (usa mock)

### Step 3: Esegui Test Unitari
```bash
python3 test_all.py
```

Questo testa tutto senza modificare il database.

### Step 4: Esegui Test E2E (Opzionale)
```bash
python3 test_e2e.py
```

**⚠️ Questo test modificherà il database Supabase!**
- Crea/aggiorna utenti di test
- Esegue transazioni reali
- Modifica i bilanci

### Step 5: Esegui Test Integrazione
```bash
python3 test_frontend_integration.py
```

Verifica che i dati siano accessibili come il frontend si aspetta.

### Step 6: Test Completo
```bash
./run_all_tests.sh
```

Esegue tutti i test in sequenza.

## 📊 Interpretazione Risultati

### ✅ Tutti i Test Passati
Il sistema è funzionante e pronto per:
- Test con API Twitter reali (quando disponibili)
- Deploy in produzione

### ❌ Alcuni Test Falliti
Controlla:
1. **Connessione Supabase**: Verifica credenziali in `data/config.json`
2. **Database**: Assicurati che le tabelle esistano:
   - `user_balance`
   - `transactions`
   - `treasury`
3. **Log**: Controlla i messaggi di errore nei log

## 🔍 Test Manuali

### Test Frontend
1. Avvia il frontend:
```bash
cd frontend
npm install
npm run dev
```

2. Visita `http://localhost:3000` e verifica:
   - ✅ Ranking utenti
   - ✅ Transazioni
   - ✅ Ricerca utenti

### Test Backend con Mock
Il backend può essere testato con il mock client senza chiamare Twitter:

```python
from src.mock_twitter_client import MockTwitterClient

# Crea mock client
mock = MockTwitterClient()

# Aggiungi menzione di test
mock.add_mock_mention(
    tweet_id="123456",
    text="@boringlayer_ send 100 BP to @testuser via @boringlayer_",
    author_username="sender"
)

# Simula ricerca
tweets = mock.search_recent_tweets(query="@boringlayer_")
```

## 🐛 Troubleshooting

### Errore: "ModuleNotFoundError: No module named 'tweepy'"
```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt
```

### Errore: "Errore connessione Supabase"
1. Verifica `data/config.json`
2. Controlla che Supabase sia accessibile
3. Verifica che le tabelle esistano

### Errore: "Ambiente virtuale non trovato"
```bash
cd backend
./setup.sh
```

## 📝 Note Importanti

1. **Mock Twitter**: Tutti i test usano un mock client, nessuna chiamata reale a Twitter
2. **Database Reale**: I test E2E modificano il database Supabase
3. **Utenti di Test**: I test creano utenti con suffisso `_test` (es: `alice_test`)
4. **Transazioni**: Le transazioni nei test E2E sono reali e modificano i bilanci

## 🎯 Prossimi Passi

Dopo che tutti i test passano:
1. ✅ Sistema testato e funzionante
2. 🔄 Pronto per integrazione con API Twitter reali
3. 🚀 Pronto per deploy in produzione




