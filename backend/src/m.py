import tweepy
import json
import re
from datetime import datetime, timedelta, timezone
import time
import logging
import os
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich import box
from rich.style import Style
from rich.theme import Theme
from collections import deque
from supabase import create_client, Client
import smtplib
from email.mime.text import MIMEText
import queue
import threading
import shutil
import traceback

# Configura il logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Crea un handler per scrivere i log su un file
file_handler = logging.FileHandler('app.log')  # Nome del file di log
file_handler.setLevel(logging.INFO)

# Crea un formatter e aggiungilo all'handler
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)

# Aggiungi l'handler al logger
logger.addHandler(file_handler)

# Crea un handler per scrivere i log sul terminale
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
console_handler.setFormatter(formatter)

# Aggiungi l'handler per il terminale
logger.addHandler(console_handler)

# Configura Rich
custom_theme = Theme({
    "info": "bold blue",
    "success": "bold green",
    "error": "bold red",
    "warning": "bold yellow"
})
console = Console(theme=custom_theme)

# Configurazione percorsi
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG_PATH = os.path.join(BASE_DIR, 'data', 'config.json')
LAST_TWEET_ID_PATH = os.path.join(BASE_DIR, 'data', 'last_tweet_id.json')
API_CALLS_FILE = os.path.join(BASE_DIR, 'data', 'api_calls.json')
USER_MANAGEMENT_PATH = os.path.join(BASE_DIR, 'data', 'user_management.json')
RATE_LIMITS_PATH = os.path.join(BASE_DIR, 'data', 'rate_limits.json')

# Costanti per i tipi di API
USER_LOOKUP = "USER_LOOKUP"      # get /2/users
TWEET_REPLY = "TWEET_REPLY"      # get /2/tweets
MENTION_SEARCH = "MENTION_SEARCH"  # get /2/tweets/search

# Variabili globali
total_mentions = 0
successful_mentions = 0
transactions_executed = 0

# Aggiorniamo la definizione dei rate limits
# RATE_LIMITS = {
#     "USER_LOOKUP": {
#         "limit": 100,        # per user/24h
#         "app_limit": 500,    # per app/24h
#         "window": 86400000,  # 24 ore in millisecondi
#         "counter": 0,
#         "app_counter": 0,
#         "endpoint": "/2/users",
#         "last_reset": 0
#     },
#     "TWEET_REPLY": {
#         "limit": 15,         # per user/15min
#         "app_limit": 15,     # per app/15min
#         "window": 900000,    # 15 minuti in millisecondi
#         "counter": 0,
#         "app_counter": 0,
#         "endpoint": "/2/tweets",
#         "last_reset": 0
#     },
#     "MENTION_SEARCH": {
#         "limit": 60,         # per user/15min
#         "app_limit": 60,     # per app/15min
#         "window": 900000,    # 15 minuti in millisecondi
#         "counter": 0,
#         "app_counter": 0,
#         "endpoint": "/2/tweets/search",
#         "last_reset": 0
#     }
# }

try:
    # Carica le credenziali da config.json
    with open(CONFIG_PATH, 'r') as f:
        config = json.load(f)
        SUPABASE_URL = config["SUPABASE_URL"]
        SUPABASE_API_KEY = config["SUPABASE_API_KEY"]
        
        # Verifica entrambe le possibili chiavi per la password Gmail
        GMAIL_APP_PASSWORD = config.get("GMAIL_APP_PASSWORD") or config.get("GMAIL_PASSWORD")
        
        if not GMAIL_APP_PASSWORD:
            logger.error("Password Gmail non trovata nel config.json. Cercare GMAIL_APP_PASSWORD o GMAIL_PASSWORD")
        else:
            logger.info("Password Gmail caricata correttamente")
            
        logger.info(f"File config.json caricato con successo da {CONFIG_PATH}")

    # Inizializza il client Supabase
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_API_KEY)
    logger.info("Client Supabase inizializzato")

    # Inizializza il client Twitter
    client = tweepy.Client(
        bearer_token=config["BEARER_TOKEN"],
        consumer_key=config["TWITTER_API_KEY"],
        consumer_secret=config["TWITTER_API_SECRET"],
        access_token=config["ACCESS_TOKEN"],
        access_token_secret=config["ACCESS_TOKEN_SECRET"]
    )
    logger.info("Client Twitter v2 inizializzato")

except FileNotFoundError as e:
    logger.error(f"Errore nel caricamento del file: {e}")
except Exception as e:
    logger.error(f"Errore generico: {e}")
    logger.error(f"Tipo di errore: {type(e)}")
    logger.error(f"Directory corrente: {os.getcwd()}")

# Carica i limiti di rate dal file JSON
with open(RATE_LIMITS_PATH) as f:
    rate_limits = json.load(f)

# Inizializza i contatori e le code
mention_counter = 0
message_counter = 0
mention_queue = deque()

# Coda globale per le menzioni da processare
mention_queue = queue.Queue()

class RateLimitManager:
    def __init__(self):
        self.pending_tweets = queue.PriorityQueue()
        self.last_log_time = 0
        self.log_interval = 60
        self.retry_delays = [5, 15, 30, 60]
        self.window_buffer = {}
        self.load_limits_from_file()  # Spostato dopo l'inizializzazione degli altri attributi

    def load_limits_from_file(self):
        """Carica i limiti dal file JSON"""
        try:
            with open(RATE_LIMITS_PATH, 'r') as f:
                self.limits = json.load(f)
            self.log_limits_status("Rate limits caricati dal file")
        except (FileNotFoundError, json.JSONDecodeError) as e:
            logger.error(f"Errore nel caricamento dei rate limits: {e}")
            logger.info("Inizializzazione con valori di default")
            self.initialize_default_limits()
        except Exception as e:
            logger.error(f"Errore imprevisto nel caricamento dei rate limits: {e}")
            self.initialize_default_limits()

    def log_limits_status(self, message=None):
        """Log dettagliato dei rate limits"""
        current_time = int(time.time() * 1000)
        if current_time - self.last_log_time < (self.log_interval * 1000):
            return

        logger.info(f"\n=== Rate Limits Status {message or ''} ===")
        for api_type, data in self.limits.items():
            window_usage = len(self.window_buffer.get(api_type, []))
            time_to_reset = max(0, (data["window"] - (current_time - data["last_reset"])) / 1000)
            
            logger.info(f"\n{api_type}:")
            logger.info(f"  Finestra mobile: {window_usage}/{data['limit']} richieste")
            logger.info(f"  App counter: {data['app_counter']}/{data['app_limit']}")
            logger.info(f"  Reset tra: {time_to_reset:.0f} secondi")
            logger.info(f"  Endpoint: {data['endpoint']}")

    def can_make_request(self, api_type, user_id=None):
        """Verifica se è possibile fare una richiesta"""
        current_time = int(time.time() * 1000)
        limit_data = self.limits[api_type]
        
        # Reset se necessario
        if current_time - limit_data["last_reset"] >= limit_data["window"]:
            limit_data["counter"] = 0
            limit_data["app_counter"] = 0
            limit_data["last_reset"] = current_time
            self.save_limits()
            
        # Verifica limiti per app
        if limit_data["app_counter"] >= limit_data["app_limit"]:
            wait_time = (limit_data["last_reset"] + limit_data["window"] - current_time) / 1000
            return False, wait_time
            
        # Verifica limiti per user se specificato
        if user_id and limit_data["counter"] >= limit_data["limit"]:
            wait_time = (limit_data["last_reset"] + limit_data["window"] - current_time) / 1000
            return False, wait_time
            
        return True, 0

    def add_to_queue(self, tweet, priority_time=None, retry_count=0):
        """Aggiunge un tweet alla coda con priorità e conteggio retry"""
        if priority_time is None:
            priority_time = time.time()
        self.pending_tweets.put((priority_time, retry_count, tweet))
        self.log_limits_status(f"Tweet {tweet.id} aggiunto alla coda (retry: {retry_count})")

    def process_queue(self):
        """Processa la coda dei tweet rispettando i rate limits"""
        while not self.pending_tweets.empty():
            priority_time, retry_count, tweet = self.pending_tweets.get()
            
            # Verifica rate limits per risposta
            can_reply, wait_time = self.can_make_request("TWEET_REPLY")
            if not can_reply:
                if retry_count < len(self.retry_delays):
                    # Calcola il nuovo tempo di priorità basato sul delay progressivo
                    next_try = time.time() + self.retry_delays[retry_count]
                    logger.info(f"Rate limit raggiunto per tweet {tweet.id}. "
                              f"Retry {retry_count + 1} tra {self.retry_delays[retry_count]} secondi")
                    self.add_to_queue(tweet, next_try, retry_count + 1)
                else:
                    logger.error(f"Troppi tentativi per tweet {tweet.id}, abbandonato dopo {retry_count} retry")
                continue
                
            if process_tweet(tweet, client):
                self.update_counter("TWEET_REPLY")
                update_last_tweet_id(tweet.id)
            
            self.log_limits_status()

    def update_counter(self, api_type, user_id=None):
        """Aggiorna i contatori per una richiesta"""
        try:
            self.limits[api_type]["app_counter"] += 1
            if user_id:
                self.limits[api_type]["counter"] += 1
            self.save_limits()
            self.log_limits_status(f"Contatori aggiornati per {api_type}")
        except Exception as e:
            logger.error(f"Errore nell'aggiornamento dei contatori: {e}")

    def save_limits(self):
        """Salva lo stato attuale dei limiti nel file"""
        try:
            with open(RATE_LIMITS_PATH, 'w') as f:
                json.dump(self.limits, f, indent=4)
        except Exception as e:
            logger.error(f"Errore nel salvataggio dei rate limits: {e}")

    def check_window_limit(self, api_type, current_time):
        """Gestisce finestra mobile per i rate limits"""
        if api_type not in self.window_buffer:
            self.window_buffer[api_type] = []
            
        window = self.limits[api_type]["window"]
        # Rimuovi chiamate vecchie
        self.window_buffer[api_type] = [
            t for t in self.window_buffer[api_type] 
            if current_time - t < window
        ]
        
        # Verifica limiti
        return len(self.window_buffer[api_type]) < self.limits[api_type]["limit"]

    def get_remaining_requests(self, api_type):
        """Calcola quante richieste rimangono per un dato tipo di API"""
        current_time = int(time.time() * 1000)
        limit_data = self.limits[api_type]
        
        if current_time - limit_data["last_reset"] >= limit_data["window"]:
            return limit_data["limit"]  # Reset completo
            
        return max(0, limit_data["limit"] - limit_data["counter"])

    def wait_for_reset(self, api_type):
        """Calcola il tempo di attesa per il reset"""
        current_time = int(time.time() * 1000)
        limit_data = self.limits[api_type]
        
        wait_time = (limit_data["last_reset"] + limit_data["window"] - current_time) / 1000
        return max(0, wait_time)

# Istanza globale del rate limit manager
rate_limit_manager = RateLimitManager()

# Funzione per cercare menzioni
def search_mentions(user_id):
    global mention_counter
    if can_make_mention_request():
        logger.info(f"Chiamata API per cercare menzioni per l'utente {user_id}")
        mention_counter += 1
        time.sleep(rate_limits["MENTION_SEARCH"]["interval"])  # Rispetta l'intervallo
    else:
        logger.warning("Limite di richieste per le menzioni superato. Accodando la richiesta.")

def extract_transaction_details(tweet_text, author, tweet_id):
    """Estrae i dettagli della transazione dal testo del tweet"""
    try:
        logger.info(f"\n=== Analisi transazione ===")
        logger.info(f"Testo originale: {tweet_text}")
        
        # Pulizia testo
        cleaned_text = tweet_text.strip().lower()
        cleaned_text = re.sub(r'^(@\w+\s+)+', '', cleaned_text)
        logger.info(f"Testo pulito: {cleaned_text}")
        
        # Pattern per la transazione
        pattern = r'^send\s+(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)\s+bp\s+to\s+@(\w+)\s+via\s+@boringlayer_$'
        match = re.search(pattern, cleaned_text)

        if not match:
            logger.info("❌ Pattern non corrispondente")
            return {
                "is_valid": False,
                "error": "Formato messaggio non valido"
            }

        # Estrai e valida i dati
        amount_str = match.group(1).replace(',', '')
        amount = round(float(amount_str), 2)
        recipient = match.group(2).lower()
        
        logger.info(f"Amount estratto: {amount}")
        logger.info(f"Recipient estratto: @{recipient}")

        # Verifica importo minimo
        MIN_AMOUNT = 0.1
        if amount < MIN_AMOUNT:
            logger.info(f"❌ Importo {amount} BP inferiore al minimo ({MIN_AMOUNT} BP)")
            return {
                "is_valid": False,
                "error": "Importo inferiore al minimo"
            }

        # Costruisci il risultato
        result = {
            "is_valid": True,
            "amount": amount,
            "recipient": recipient,
            "net_sent": round(amount * 0.9, 3),
            "fees": round(amount * 0.005, 3),
            "burned": round(amount * 0.005, 3),
            "sender": author.lower(),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "tweet_id": tweet_id
        }
        
        logger.info("✅ Transazione valida estratta")
        logger.info(f"Dettagli: {json.dumps(result, indent=2)}")
        
        return result
        
    except Exception as e:
        logger.error(f"❌ Errore nell'estrazione dei dettagli: {e}")
        traceback.print_exc()
        return {
            "is_valid": False,
            "error": str(e)
        }

def update_balances(transaction):
    """Aggiorna i bilanci degli utenti nella tabella user_balance di Supabase"""
    try:
        # Converti i nomi utente in minuscolo
        sender = transaction['sender'].lower()
        recipient = transaction['recipient'].lower()
        amount = transaction['amount']
        net_sent = transaction['net_sent']
        
        # Log dei valori prima dell'aggiornamento
        initial_balance = supabase.table("user_balance").select("balance").eq("username", sender).execute()
        logger.info(f"Bilancio iniziale di {sender}: {initial_balance.data[0]['balance']} BP")
        
        # Aggiorna il saldo del sender
        supabase.table("user_balance").update({"balance": initial_balance.data[0]['balance'] - amount}).eq("username", sender).execute()
        
        # Verifica se il recipient esiste
        recipient_balance = supabase.table("user_balance").select("balance").eq("username", recipient).execute()
        
        if not recipient_balance.data:
            # Se il recipient non esiste, crealo con il saldo iniziale + net_sent
            supabase.table("user_balance").insert({
                "username": recipient,
                "balance": 1000 + net_sent  # Saldo iniziale (1000) + importo ricevuto
            }).execute()
        else:
            # Se esiste, aggiorna il suo saldo
            supabase.table("user_balance").update({
                "balance": recipient_balance.data[0]['balance'] + net_sent
            }).eq("username", recipient).execute()
        
        # Log dei valori dopo l'aggiornamento
        final_balance = supabase.table("user_balance").select("balance").eq("username", sender).execute()
        logger.info(f"Bilancio finale di {sender}: {final_balance.data[0]['balance']} BP")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Errore nell'aggiornamento dei bilanci: {e}")
        return False

def register_transaction(transaction_data, tweet_id):
    """Registra la transazione su Supabase."""
    try:
        response = supabase.table("transactions").insert({
            "Date": datetime.now(timezone.utc).isoformat(),
            "Sender": transaction_data['sender'],
            "Recipient": transaction_data['recipient'],
            "Amount": transaction_data['amount'],
            "Net_sent": transaction_data['net_sent'],
            "Fees": transaction_data['fees'],
            "Burned": transaction_data['burned'],
            "Twitt ID": tweet_id
        }).execute()
        
        if response.data:
            logger.info("✅ Transazione registrata con successo")
            return True
        else:
            logger.error(f"❌ Errore nella registrazione: {response.error}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Errore durante la registrazione su Supabase: {e}")
        return False

def can_make_mention_request():
    global mention_counter
    if mention_counter < rate_limits["MENTION_SEARCH"]["limit"]:
        return True
    return False

def can_send_message():
    global message_counter
    if message_counter < rate_limits["MESSAGE_SEND"]["limit"]:
        return True
    return False

def reset_counters():
    global mention_counter, message_counter
    mention_counter = 0
    message_counter = 0

# Funzione per rispondere a un tweet
def send_message(tweet_id):
    global message_counter
    if can_send_message():
        logger.info(f"Risposta al tweet {tweet_id}")
        message_counter += 1
        time.sleep(rate_limits["MESSAGE_SEND"]["interval"])  # Rispetta l'intervallo
    else:
        logger.warning("Limite di richieste per l'invio di messaggi superato. Accodando la risposta.")
        mention_queue.append(tweet_id)

# Funzione per caricare i dati delle chiamate API
def load_api_calls():
    if os.path.exists(API_CALLS_FILE):
        with open(API_CALLS_FILE, 'r') as f:
            return json.load(f)
    return {
        "MENTION_SEARCH": [],
        "MESSAGE_SEND": [],
        "TWEET_LOOKUP": [],
        "USER_LOOKUP": []
    }

def initialize_api_calls_file():
    """Inizializza il file api_calls.json se non esiste"""
    if not os.path.exists(API_CALLS_FILE):
        default_structure = {
            "USER_LOOKUP": [],
            "TWEET_REPLY": [],
            "MENTION_SEARCH": []
        }
        with open(API_CALLS_FILE, 'w') as f:
            json.dump(default_structure, f, indent=4)
        logger.info("File api_calls.json inizializzato")

def update_api_call(api_type):
    """Aggiorna il conteggio delle chiamate API"""
    try:
        current_time = int(time.time() * 1000)  # Timestamp in millisecondi
        
        # Leggi il file esistente
        try:
            with open(API_CALLS_FILE, 'r') as f:
                api_calls = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            api_calls = {
                "USER_LOOKUP": [],
                "TWEET_REPLY": [],
                "MENTION_SEARCH": []
            }
        
        # Verifica che la chiave esista
        if api_type not in api_calls:
            api_calls[api_type] = []
            
        # Pulisci le chiamate vecchie
        api_calls[api_type] = [
            t for t in api_calls[api_type] 
            if (current_time - t) < rate_limits[api_type]["window"]
        ]
        
        # Aggiungi la nuova chiamata
        api_calls[api_type].append(current_time)
        
        # Scrivi il file con indentazione
        with open(API_CALLS_FILE, 'w') as f:
            json.dump(api_calls, f, indent=4)
            
        logger.info(f"API call registrata per {api_type} - totale chiamate: {len(api_calls[api_type])}")
            
    except Exception as e:
        logger.error(f"Errore nell'aggiornamento del counter API: {str(e)}")
        logger.error(traceback.format_exc())  # Aggiunto per debug dettagliato

# Funzione per ottenere i conteggi delle chiamate API
def get_api_call_counts():
    api_calls = load_api_calls()
    current_time = time.time()
    
    counts = {
        "MENTION_SEARCH": {
            "last_hour": len([t for t in api_calls["MENTION_SEARCH"] if current_time - t < 3600]),
            "last_24_hours": len([t for t in api_calls["MENTION_SEARCH"] if current_time - t < 86400]),
            "last_month": len([t for t in api_calls["MENTION_SEARCH"] if current_time - t < 2592000]),
        },
        "TWEET_REPLY": {
            "last_hour": len([t for t in api_calls["TWEET_REPLY"] if current_time - t < 3600]),
            "last_24_hours": len([t for t in api_calls["TWEET_REPLY"] if current_time - t < 86400]),
            "last_month": len([t for t in api_calls["TWEET_REPLY"] if current_time - t < 2592000]),
        },
        "USER_LOOKUP": {
            "last_hour": len([t for t in api_calls["USER_LOOKUP"] if current_time - t < 3600]),
            "last_24_hours": len([t for t in api_calls["USER_LOOKUP"] if current_time - t < 86400]),
            "last_month": len([t for t in api_calls["USER_LOOKUP"] if current_time - t < 2592000]),
        }
    }
    
    return counts

def load_fees_config():
    """Carica la configurazione delle percentuali dal file JSON"""
    config_path = os.path.join(BASE_DIR, 'data', 'fees_config.json')
    with open(config_path, 'r') as f:
        return json.load(f)

def load_user_lists():
    """Carica le liste degli utenti dal file JSON"""
    try:
        with open(USER_MANAGEMENT_PATH, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        # Se il file non esiste, crealo con liste vuote
        default_lists = {
            "blacklist": [],
            "suspect_list": []
        }
        with open(USER_MANAGEMENT_PATH, 'w') as f:
            json.dump(default_lists, f)
        logger.info("File user_management.json creato con liste vuote.")
        return default_lists

def save_user_lists(user_lists):
    """Salva le liste degli utenti nel file JSON"""
    with open(USER_MANAGEMENT_PATH, 'w') as f:
        json.dump(user_lists, f)

def is_user_suspicious(user, client):
    """Verifica se un utente è sospetto"""
    try:
        user_data = client.get_user(username=user)
        
        if user_data is None or user_data.data is None:
            return False  # Non consideriamo più automaticamente sospetto un utente non trovato
        
        user_data = user_data.data
        
        # Controlla il comportamento spammy
        current_time = datetime.now()
        user_id = user_data.id
        
        if not hasattr(is_user_suspicious, 'request_history'):
            is_user_suspicious.request_history = {}
        
        if user_id not in is_user_suspicious.request_history:
            is_user_suspicious.request_history[user_id] = []
        
        # Rimuovi le richieste più vecchie di 10 minuti
        is_user_suspicious.request_history[user_id] = [
            req_time for req_time in is_user_suspicious.request_history[user_id]
            if current_time - req_time < timedelta(minutes=10)
        ]
        
        # Aggiungi la richiesta corrente
        is_user_suspicious.request_history[user_id].append(current_time)
        
        # Controlla se ci sono più di 5 richieste negli ultimi 10 minuti
        return len(is_user_suspicious.request_history[user_id]) > 5
        
    except Exception as e:
        logger.error(f"Errore nel controllo dello stato dell'utente: {e}")
        return False

def send_email(subject, body, to_email):
    """Invia email usando Gmail SMTP"""
    try:
        from_email = "boringlayer@gmail.com"
        app_password = GMAIL_APP_PASSWORD
        
        # Crea il messaggio
        msg = MIMEText(body)
        msg['Subject'] = subject
        msg['From'] = from_email
        msg['To'] = to_email
        
        # Connessione al server SMTP di Gmail
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(from_email, app_password)
            server.send_message(msg)
            logger.info(f"Email inviata con successo a {to_email}")
            return True
            
    except Exception as e:
        logger.error(f"Errore nell'invio dell'email: {str(e)}")
        return False

def check_user_status(sender, recipient, client):
    """Verifica lo stato degli utenti coinvolti nella transazione"""
    try:
        # Carica le liste degli utenti
        with open(USER_MANAGEMENT_PATH, 'r') as f:
            user_lists = json.load(f)
        
        # Controlla solo se uno degli utenti è nella blacklist
        if sender.lower() in user_lists["blacklist"] or recipient.lower() in user_lists["blacklist"]:
            logger.info(f"Transazione bloccata: utente nella blacklist")
            return {"can_proceed": False, "reason": "blacklist"}
            
        return {"can_proceed": True}
        
    except Exception as e:
        logger.error(f"Errore nel controllo dello stato degli utenti: {e}")
        return {"can_proceed": False, "reason": "error"}

def process_tweet(tweet, client, users):
    """Processa un singolo tweet"""
    try:
        logger.info(f"\n=== Inizio processo tweet ===")
        logger.info(f"Tweet ID: {tweet.id}")
        logger.info(f"Tweet text: {tweet.text}")

        # Usa il dizionario users passato come parametro
        author = users.get(tweet.author_id)
        logger.info(f"Autore: @{author}")

        # Estrai i dettagli della transazione
        transaction = extract_transaction_details(tweet.text, author, tweet.id)
        
        if not transaction["is_valid"]:
            logger.info(f"Tweet non valido: {transaction.get('error', 'Motivo sconosciuto')}")
            return False

        # Verifica il saldo
        if not check_user_balance(author, transaction['amount']):
            amount = "{:,.2f}".format(transaction['amount'])
            response_text = (
                f"Transaction failed. Insufficient balance in @{author} account "
                f"to send {amount} BP. Check your Balance at boringlayer.com"
            )
            
            # Verifica rate limits prima di inviare la risposta
            with open(RATE_LIMITS_PATH, 'r') as f:
                limits = json.load(f)
                current_time = int(time.time() * 1000)
                
                if limits["TWEET_REPLY"]["counter"] >= limits["TWEET_REPLY"]["limit"]:
                    wait_time = (limits["TWEET_REPLY"]["window"] - 
                               (current_time - limits["TWEET_REPLY"]["last_reset"])) / 1000
                    logger.info(f"Rate limit risposta raggiunto, attendo {wait_time:.0f} secondi")
                    return False

            # Invia risposta di saldo insufficiente
            try:
                client.create_tweet(text=response_text, in_reply_to_tweet_id=tweet.id)
                logger.info(f"Risposta saldo insufficiente inviata: {response_text}")
                update_api_call("TWEET_REPLY")
                update_rate_limits_counter("TWEET_REPLY")
                return True
            except Exception as e:
                logger.error(f"Errore nell'invio risposta saldo insufficiente: {e}")
            
            return False

        # Verifica status utente
        user_status = check_user_status(author, transaction['recipient'], client)
        if not user_status["can_proceed"]:
            logger.info(f"Transazione bloccata: {user_status.get('reason', 'Motivo sconosciuto')}")
            return False

        # Esegui la transazione
        if execute_transaction(transaction):
            # Formatta la risposta
            amount = "{:,.2f}".format(transaction['amount'])
            net_sent = "{:,.3f}".format(transaction['net_sent'])
            fees = "{:,.3f}".format(transaction['fees'])
            burned = "{:,.3f}".format(transaction['burned'])
            
            response_text = (
                f"Transaction completed. @{author} sent {amount} BP to @{transaction['recipient']}\n"
                f"Net sent: {net_sent} / Reserve: {fees} / Burned: {burned}\n"
                f"Txn: {tweet.id}, {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')} (UTC)\n"
                f"Check your balance at http://boringlayer.com"
            )
            
            # Verifica rate limits prima di inviare la risposta
            with open(RATE_LIMITS_PATH, 'r') as f:
                limits = json.load(f)
                current_time = int(time.time() * 1000)
                
                if limits["TWEET_REPLY"]["counter"] >= limits["TWEET_REPLY"]["limit"]:
                    wait_time = (limits["TWEET_REPLY"]["window"] - 
                               (current_time - limits["TWEET_REPLY"]["last_reset"])) / 1000
                    logger.info(f"Rate limit risposta raggiunto, attendo {wait_time:.0f} secondi")
                    return False

            # Invia risposta di successo
            try:
                client.create_tweet(text=response_text, in_reply_to_tweet_id=tweet.id)
                logger.info(f"Risposta successo inviata: {response_text}")
                update_api_call("TWEET_REPLY")
                update_rate_limits_counter("TWEET_REPLY")
                return True
            except Exception as e:
                logger.error(f"Errore nell'invio risposta successo: {e}")
                return False

        return False

    except Exception as e:
        logger.error(f"❌ Errore durante l'elaborazione del tweet {tweet.id}: {e}")
        traceback.print_exc()
        return False

def update_last_tweet_id(tweet_id):
    """Aggiorna l'ultimo Tweet ID con backup"""
    try:
        # Verifica validità ID
        if not str(tweet_id).isdigit():
            logger.error(f"ID tweet non valido: {tweet_id}")
            return False

        # Backup del vecchio file
        if os.path.exists(LAST_TWEET_ID_PATH):
            backup_path = f"{LAST_TWEET_ID_PATH}.backup"
            shutil.copy2(LAST_TWEET_ID_PATH, backup_path)

        with open(LAST_TWEET_ID_PATH, 'w') as f:
            json.dump({'last_id': str(tweet_id)}, f)
        logger.info(f"Ultimo Tweet ID aggiornato: {tweet_id}")
        return True
    except Exception as e:
        logger.error(f"Errore aggiornamento Tweet ID: {e}")
        return False

def get_time_remaining(next_call):
    """Calcola il tempo rimanente per la prossima chiamata"""
    current_time = time.time()
    remaining_time = int(next_call - current_time)
    return max(0, remaining_time)

def get_next_available_call_time():
    """Calcola quando sarà possibile fare la prossima chiamata per ogni endpoint"""
    with open('/Users/trip77/Documents/boringlayer/boringlayer/data/rate_limits.json', 'r') as f:
        rate_limits = json.load(f)
    
    api_calls = load_api_calls()
    current_time = time.time()
    next_calls = {}
    
    for api_type in ["MENTION_SEARCH", "MESSAGE_SEND"]:
        if not api_calls[api_type]:
            next_calls[api_type] = (0, "Disponibile ora")  # (remaining_time, message)
            continue
            
        latest_call = max(api_calls[api_type])
        interval = rate_limits[api_type]["interval"]
        next_available = latest_call + interval
        
        if next_available <= current_time:
            next_calls[api_type] = (0, "Disponibile ora")
        else:
            wait_time = int(next_available - current_time)
            next_calls[api_type] = (wait_time, f"Tra {wait_time} secondi")
            logger.info(f"Limite di rate per {api_type} superato. Attendere {wait_time} secondi.")

    return next_calls

def load_last_tweet_id():
    """Carica l'ultimo tweet ID processato"""
    try:
        with open(LAST_TWEET_ID_PATH, 'r') as f:
            data = json.load(f)
            return data['last_id']
    except Exception as e:
        logger.error(f"Errore nel caricamento dell'ultimo tweet ID: {e}")
        # Se il file non esiste o è corrotto, inizializza con un ID di default
        default_id = "1"  # O un altro ID di partenza appropriato
        with open(LAST_TWEET_ID_PATH, 'w') as f:
            json.dump({'last_id': default_id}, f)
        return default_id

def process_twitter_notifications():
    try:
        last_tweet_id = load_last_tweet_id()
        logger.info(f"🔍 Ultimo tweet ID: {last_tweet_id}")

        # Verifica e attesa per TWEET_REPLY
        can_reply, wait_time = rate_limit_manager.can_make_request("TWEET_REPLY")
        if not can_reply:
            wait_time_minutes = wait_time / 60
            logger.info(f"Rate limit TWEET_REPLY raggiunto. Attendo {wait_time_minutes:.1f} minuti per il reset")
            time.sleep(wait_time)  # Aggiungiamo l'attesa effettiva
            return

        # Verifichiamo anche USER_LOOKUP per le 24 ore
        can_lookup, _ = rate_limit_manager.can_make_request("USER_LOOKUP")
        if not can_lookup:
            logger.info("Rate limit USER_LOOKUP giornaliero raggiunto")
            return

        # Calcoliamo quante risposte possiamo ancora fare in questo intervallo
        remaining_replies = rate_limits["TWEET_REPLY"]["limit"] - rate_limits["TWEET_REPLY"]["counter"]
        if remaining_replies <= 0:
            logger.info("Nessuna risposta disponibile in questo intervallo")
            return

        query = "@boringlayer_"
        logger.info(f"Eseguo query per massimo {remaining_replies} menzioni")
        
        # Modifica la chiamata search_recent_tweets per includere le informazioni dell'utente
        tweets = client.search_recent_tweets(
            query=query,
            since_id=last_tweet_id,
            tweet_fields=['created_at', 'author_id'],
            expansions=['author_id'],  # Richiede i dati degli autori
            user_fields=['username'],  # Richiede specificamente lo username
            max_results=min(remaining_replies, 60)
        )
        
        # Crea il dizionario degli utenti
        users = {user.id: user.username for user in tweets.includes['users']} if tweets.includes else {}

        update_api_call("MENTION_SEARCH")
        update_rate_limits_counter("MENTION_SEARCH")

        if not tweets.data:
            logger.info("📭 Nessuna nuova menzione")
            return

        logger.info(f"Trovate {len(tweets.data)} menzioni, ne processerò {remaining_replies}")
        
        # Processiamo solo il numero di tweet che possiamo effettivamente gestire
        for tweet in tweets.data[:remaining_replies]:
            can_reply, wait_time = rate_limit_manager.can_make_request("TWEET_REPLY")
            if not can_reply:
                logger.info(f"Rate limit TWEET_REPLY raggiunto durante il processing. Attendo {wait_time/60:.1f} minuti")
                time.sleep(wait_time)  # Aggiungiamo l'attesa effettiva
                break

            success = process_tweet(tweet, client, users)
            if success:
                update_last_tweet_id(tweet.id)
            
            # Verifichiamo dopo ogni risposta se abbiamo raggiunto il limite
            can_reply, _ = rate_limit_manager.can_make_request("TWEET_REPLY")
            if not can_reply:
                logger.info("Rate limit TWEET_REPLY raggiunto durante il processing")
                break

    except Exception as e:
        logger.error(f"❌ Errore nel processo di notifica: {e}")
        traceback.print_exc()

def process_mention_queue():
    """Processa le menzioni in coda rispettando i rate limits"""
    while not mention_queue.empty():
        tweet = mention_queue.get()
        
        # Verifica rate limit per risposte
        can_reply, wait_time = rate_limit_manager.can_make_request("MESSAGE_SEND")
        if not can_reply:
            logger.info(f"Rate limit raggiunto per risposte. Attendo {wait_time:.0f} secondi")
            # Rimetti il tweet nella coda e attendi
            mention_queue.put(tweet)
            time.sleep(wait_time)
            return

        if process_tweet(tweet, client):
            rate_limit_manager.update_counter("MESSAGE_SEND")
            update_last_tweet_id(tweet.id)
        
        mention_queue.task_done()

def check_rate_limit(api_type):
    """Verifica se possiamo fare una chiamata API"""
    try:
        if not os.path.exists(API_CALLS_FILE):
            return True, 0
            
        current_time = time.time()
        with open(API_CALLS_FILE, 'r') as f:
            api_calls = json.load(f)
            
        if api_type not in api_calls:
            return True, 0
        
        # Pulisci le chiamate vecchie
        window = rate_limits[api_type]["window"]
        recent_calls = [
            call for call in api_calls[api_type]
            if current_time - call < window
        ]
        
        # Verifica il limite
        if len(recent_calls) >= rate_limits[api_type]["requests"]:
            oldest_call = min(recent_calls)
            wait_time = oldest_call + window - current_time
            return False, max(0, wait_time)
            
        return True, 0
        
    except Exception as e:
        logger.error(f"Errore nel controllo rate limit: {e}")
        return True, 0  # In caso di errore, permettiamo la chiamata

def update_rate_limits_counter(api_type):
    """Aggiorna il counter e il timestamp nel file rate_limits.json"""
    try:
        # Leggi il file corrente
        with open(RATE_LIMITS_PATH, 'r') as f:
            limits = json.load(f)
        
        current_time = int(time.time() * 1000)
        
        # Reset se necessario
        if current_time - limits[api_type]['last_reset'] >= limits[api_type]['window']:
            limits[api_type]['counter'] = 1
            limits[api_type]['app_counter'] = 1
            limits[api_type]['last_reset'] = current_time
        else:
            limits[api_type]['counter'] += 1
            limits[api_type]['app_counter'] += 1
        
        # Salva il file aggiornato
        with open(RATE_LIMITS_PATH, 'w') as f:
            json.dump(limits, f, indent=4)
            
        logger.info(f"Counter aggiornato per {api_type}: user={limits[api_type]['counter']}, app={limits[api_type]['app_counter']}")
            
    except Exception as e:
        logger.error(f"❌ Errore nell'aggiornamento del counter: {e}")
        logger.error(traceback.format_exc())

def check_user_balance(username, amount):
    """Verifica se l'utente ha abbastanza BP per la transazione"""
    try:
        # Converti il nome utente in minuscolo
        username = username.lower()
        
        # Verifica se l'utente esiste
        response = supabase.table("user_balance").select("balance").eq("username", username).execute()
        
        if not response.data or len(response.data) == 0:
            # L'utente non esiste, verifichiamo se l'amount richiesto è <= 1000
            if amount > 1000:
                logger.info(f"Nuovo utente {username} sta tentando di inviare {amount} BP che è più di 1000")
                return False
                
            # Creiamo il nuovo utente con 1000 BP (senza sottrarre l'amount)
            new_user_data = {
                "username": username,  # Già in minuscolo
                "balance": 1000
            }
            
            supabase.table("user_balance").insert(new_user_data).execute()
            logger.info(f"Nuovo utente {username} creato con saldo iniziale di 1000 BP")
            
            return True
        else:
            current_balance = float(response.data[0]['balance'])
            logger.info(f"Saldo corrente di {username}: {current_balance} BP")
            return current_balance >= amount
            
    except Exception as e:
        logger.error(f"❌ Errore nel controllo del saldo: {e}")
        return False

def execute_transaction(transaction):
    """Esegue una transazione completa"""
    try:
        # Aggiorna i bilanci
        if update_balances(transaction):
            # Registra la transazione
            if register_transaction(transaction, transaction['tweet_id']):
                logger.info(f"✅ Transazione completata con successo")
                return True
            else:
                logger.error("❌ Errore nella registrazione della transazione")
                return False
            
    except Exception as e:
        logger.error(f"❌ Errore nell'esecuzione della transazione: {e}")
        return False

class TweetPriority:
    def __init__(self, tweet, created_at, retry_count=0):
        self.tweet = tweet
        self.created_at = created_at
        self.retry_count = retry_count
        self.priority = self.calculate_priority()

    def calculate_priority(self):
        """Calcola priorità basata su più fattori"""
        age = time.time() - self.created_at
        retry_penalty = self.retry_count * 10
        return age + retry_penalty

    def __lt__(self, other):
        return self.priority < other.priority

class PerformanceMonitor:
    def __init__(self):
        self.start_time = time.time()
        self.processed_tweets = 0
        self.successful_transactions = 0
        self.failed_transactions = 0
        self.rate_limit_hits = 0

    def log_stats(self):
        uptime = time.time() - self.start_time
        logger.info(f"\n=== Performance Stats ===")
        logger.info(f"Uptime: {uptime:.2f} seconds")
        logger.info(f"Tweets processati: {self.processed_tweets}")
        logger.info(f"Transazioni completate: {self.successful_transactions}")
        logger.info(f"Transazioni fallite: {self.failed_transactions}")
        logger.info(f"Rate limit hits: {self.rate_limit_hits}")

def safe_api_call(func, *args, **kwargs):
    max_retries = 3
    retry_delay = 5
    
    for attempt in range(max_retries):
        try:
            return func(*args, **kwargs)
        except (tweepy.TooManyRequests, tweepy.RateLimitError) as e:
            logger.error(f"Rate limit error: {e}")
            raise
        except (tweepy.HTTPException, tweepy.ConnectionError) as e:
            if attempt < max_retries - 1:
                logger.warning(f"Errore di rete, retry {attempt + 1}/{max_retries}: {e}")
                time.sleep(retry_delay * (attempt + 1))
            else:
                logger.error(f"Errore di rete dopo {max_retries} tentativi: {e}")
                raise

def cleanup_api_calls():
    """Pulisce le chiamate API vecchie"""
    try:
        current_time = time.time()
        with open(API_CALLS_FILE, 'r') as f:
            api_calls = json.load(f)
        
        for api_type in api_calls:
            window = rate_limits[api_type]["window"] / 1000  # Converti in secondi
            api_calls[api_type] = [
                t for t in api_calls[api_type] 
                if current_time - t < window
            ]
        
        with open(API_CALLS_FILE, 'w') as f:
            json.dump(api_calls, f, indent=4)
            
    except Exception as e:
        logger.error(f"Errore nella pulizia delle chiamate API: {e}")

# Esegui la funzione principale
if __name__ == "__main__":
    logger.info("🤖 Avvio del bot...")
    initialize_api_calls_file()
    try:
        process_twitter_notifications()
        
        min_interval = 10
        logger.info(f" Pausa di {min_interval} secondi prima della prossima verifica...")
        time.sleep(min_interval)
        
    except Exception as e:
        logger.error(f"❌ Errore nel ciclo principale: {e}")
