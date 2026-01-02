import tweepy
import json
import os
import time
from datetime import datetime, timedelta

# Percorso del file config.json
config_path = os.path.join('data', 'config.json')

# Carica le credenziali da config.json
with open(config_path, 'r') as f:
    config = json.load(f)

# Configura le credenziali
bearer_token = config["BEARER_TOKEN"]
consumer_key = config["TWITTER_API_KEY"]
consumer_secret = config["TWITTER_API_SECRET"]
access_token = config["ACCESS_TOKEN"]
access_token_secret = config["ACCESS_TOKEN_SECRET"]

# Autenticazione
client = tweepy.Client(bearer_token=bearer_token, consumer_key=consumer_key,
                       consumer_secret=consumer_secret, access_token=access_token,
                       access_token_secret=access_token_secret)

# Percorso del file per salvare il conteggio delle richieste
count_file_path = os.path.join('data', 'request_count.json')

# Funzione per caricare il conteggio delle richieste
def load_request_count():
    if os.path.exists(count_file_path):
        with open(count_file_path, 'r') as f:
            return json.load(f).get('request_count', 0)
    return 0  # Se il file non esiste, ritorna 0

# Funzione per salvare il conteggio delle richieste
def save_request_count(count):
    with open(count_file_path, 'w') as f:
        json.dump({'request_count': count}, f)

# Variabili per il monitoraggio delle richieste e dei tweet
request_count = load_request_count()  # Carica il conteggio all'avvio
request_reset_time = datetime.now() + timedelta(minutes=15)
tweet_count = 0
tweet_reset_time = datetime.now() + timedelta(hours=24)

# Limite delle richieste
MAX_REQUESTS = 10  # Massimo di 10 richieste in 15 minuti

# Funzione per ottenere l'ID utente dal nome utente
def get_user_id(username):
    try:
        user = client.get_user(username=username)
        return user.data.id
    except tweepy.TweepyException as e:
        print(f"Errore nel recupero dell'ID utente: {e}")
        return None

# Funzione per controllare le menzioni e i limiti delle API
def check_rate_limits(user_id):
    global request_count, request_reset_time, tweet_count, tweet_reset_time

    if user_id is None:
        print("ID utente non valido. Assicurati di fornire un nome utente corretto.")
        return

    try:
        # Controlla se il limite delle richieste è stato raggiunto
        if request_count >= MAX_REQUESTS:
            print("Limite di richieste raggiunto. Attendere il reset.")
            return

        # Controlla le menzioni
        mentions = client.get_users_mentions(id=user_id, max_results=10)
        request_count += 1  # Incrementa il conteggio delle richieste
        print(f"Richiesta effettuata. Conteggio attuale: {request_count}")

        # Stampa le menzioni
        print("Menzioni recenti:")
        if mentions.data:
            for mention in mentions.data:
                print(f"- {mention.text} (ID: {mention.id})")
        else:
            print("Nessuna menzione recente.")

        # Controlla il numero di richieste effettuate
        if datetime.now() >= request_reset_time:
            print("Reset del conteggio delle richieste.")
            print(f"Conteggio delle richieste prima del reset: {request_count}")
            request_count = 0  # Resetta il conteggio dopo 15 minuti
            request_reset_time = datetime.now() + timedelta(minutes=15)  # Aggiorna il tempo di reset

        # Salva il conteggio delle richieste
        save_request_count(request_count)

        # Limiti delle richieste
        print("\nLimiti delle richieste:")
        print(f"Richieste effettuate negli ultimi 15 minuti: {request_count}")
        print(f"Richieste rimanenti nei prossimi 15 minuti: {MAX_REQUESTS - request_count}")
        print(f"Reset del limite a: {request_reset_time.strftime('%Y-%m-%d %H:%M:%S')}")

        # Controllo dei tweet inviati
        if datetime.now() >= tweet_reset_time:
            tweet_count = 0
            tweet_reset_time = datetime.now() + timedelta(hours=24)

        print("\nLimiti per l'invio di tweet:")
        print(f"Tweet inviati nelle ultime 24 ore: {tweet_count}")
        print(f"Tweet rimanenti nelle ultime 24 ore: {100 - tweet_count}")

    except tweepy.TweepyException as e:
        print(f"Errore nel recupero delle menzioni: {e}")
    except Exception as e:
        print(f"Errore generico: {e}")

if __name__ == "__main__":
    username = 'boringlayer_'  # Sostituisci con il tuo nome utente Twitter
    user_id = get_user_id(username)  # Ottieni l'ID utente dal nome utente

    while True:
        check_rate_limits(user_id)  # Controlla i limiti delle menzioni
        time.sleep(100)  # Aspetta 100 secondi prima della prossima richiesta