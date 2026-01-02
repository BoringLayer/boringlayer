import os
import sys
import tweepy
import json
from datetime import datetime, timedelta
import logging

# Aggiungi la directory src al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from m import config, logger

def load_daily_counters():
    """Carica i contatori giornalieri dal file"""
    counter_file = os.path.join(os.path.dirname(__file__), 'data', 'daily_counters.json')
    try:
        with open(counter_file, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        # Se il file non esiste, crea una struttura di default
        return {
            "user_info_requests": {
                "count": 0,
                "reset_time": (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d %H:%M:%S')
            }
        }

def main():
    try:
        # Inizializza l'API
        auth = tweepy.OAuth1UserHandler(
            config["TWITTER_API_KEY"],
            config["TWITTER_API_SECRET"],
            config["ACCESS_TOKEN"],
            config["ACCESS_TOKEN_SECRET"]
        )
        api = tweepy.API(auth)
        limits = api.rate_limit_status()
        
        # Carica i contatori giornalieri
        daily_counters = load_daily_counters()
        daily_user_info = daily_counters['user_info_requests']
        daily_reset_time = datetime.strptime(daily_user_info['reset_time'], '%Y-%m-%d %H:%M:%S')
        
        print("\n=== Rate Limits Dettagliati delle API in uso ===")
        
        # 1. GET users/lookup (per client.get_user())
        user_lookup = limits['resources']['users']['/users/lookup']
        user_reset = datetime.fromtimestamp(user_lookup['reset'])
        time_to_reset = (user_reset - datetime.now())
        time_to_daily_reset = (daily_reset_time - datetime.now())
        
        print("\n1. Info Utenti (get_user):")
        print("  Limiti di tempo:")
        print(f"  • Limite per 15 min: {user_lookup['limit']} richieste")
        print(f"  • Limite per 24 ore: 500 richieste")
        print("\n  Stato attuale:")
        print(f"  • Richieste rimanenti (15 min): {user_lookup['remaining']}/{user_lookup['limit']}")
        print(f"  • Richieste rimanenti (24 ore): {500 - daily_user_info['count']}/500")
        print(f"  • Reset 15 min tra: {time_to_reset.seconds // 60} minuti e {time_to_reset.seconds % 60} secondi")
        print(f"  • Reset 24 ore tra: {time_to_daily_reset.seconds // 3600} ore e {(time_to_daily_reset.seconds % 3600) // 60} minuti")
        print(f"  • Orario reset 15 min: {user_reset.strftime('%H:%M:%S')}")
        print(f"  • Orario reset 24 ore: {daily_reset_time.strftime('%Y-%m-%d %H:%M:%S')}")
        print("\n  Utilizzo:")
        print(f"  • Richieste effettuate (15 min): {user_lookup['limit'] - user_lookup['remaining']}")
        print(f"  • Richieste effettuate (24 ore): {daily_user_info['count']}")
        print(f"  • Percentuale utilizzata (15 min): {((user_lookup['limit'] - user_lookup['remaining']) / user_lookup['limit'] * 100):.1f}%")
        print(f"  • Percentuale utilizzata (24 ore): {(daily_user_info['count'] / 500 * 100):.1f}%")
        
        # 2. GET search/tweets (per search_recent_tweets)
        search = limits['resources']['search']['/search/tweets']
        search_reset = datetime.fromtimestamp(search['reset'])
        time_to_reset = (search_reset - datetime.now())
        print("\n2. Ricerca Menzioni (search_recent_tweets):")
        print("  Limiti di tempo:")
        print(f"  • Limite per 15 min: {search['limit']} richieste")
        print(f"  • Limite per app: 450 richieste/15 min")
        print("\n  Stato attuale:")
        print(f"  • Richieste rimanenti: {search['remaining']}/{search['limit']}")
        print(f"  • Reset tra: {time_to_reset.seconds // 60} minuti e {time_to_reset.seconds % 60} secondi")
        print(f"  • Orario preciso reset: {search_reset.strftime('%H:%M:%S')}")
        print("\n  Utilizzo:")
        print(f"  • Richieste effettuate: {search['limit'] - search['remaining']}")
        print(f"  • Percentuale utilizzata: {((search['limit'] - search['remaining']) / search['limit'] * 100):.1f}%")
        
        # 3. POST tweets (per create_tweet)
        print("\n3. Invio Tweet (create_tweet):")
        print("  Limiti di tempo:")
        print("  • Limite per 15 min: 50 tweet")
        print("  • Limite per 3 ore: 300 tweet")
        print("  • Limite per 24 ore: 2.400 tweet")
        print("  • Limite mensile: ~86.400 tweet")
        print("\n  Restrizioni aggiuntive:")
        print("  • Max 25 menzioni per tweet")
        print("  • Max 5 foto per tweet")
        print("  • Max 280 caratteri per tweet")
        
        # Avvisi dettagliati per limiti critici
        print("\n=== Avvisi e Stato Generale ===")
        
        # Avvisi per user lookup
        user_percent = (user_lookup['limit'] - user_lookup['remaining']) / user_lookup['limit'] * 100
        if user_lookup['remaining'] < 20:
            print(f"⚠️  CRITICO: Solo {user_lookup['remaining']} richieste user lookup rimanenti!")
        elif user_percent > 80:
            print(f"⚡ ATTENZIONE: Utilizzato {user_percent:.1f}% del limite user lookup")
        
        # Avvisi per search
        search_percent = (search['limit'] - search['remaining']) / search['limit'] * 100
        if search['remaining'] < 20:
            print(f"⚠️  CRITICO: Solo {search['remaining']} ricerche menzioni rimanenti!")
        elif search_percent > 80:
            print(f"⚡ ATTENZIONE: Utilizzato {search_percent:.1f}% del limite ricerca")
        
        # Stato generale
        print("\nStato generale delle API:")
        print(f"• User Lookup: {'🟢' if user_percent < 50 else '🟡' if user_percent < 80 else '🔴'} {user_percent:.1f}% utilizzato")
        print(f"• Search: {'🟢' if search_percent < 50 else '🟡' if search_percent < 80 else '🔴'} {search_percent:.1f}% utilizzato")
        print(f"• Tweet Creation: Limiti statici (non monitorabili in tempo reale)")
        
        # Aggiungi avvisi per il limite giornaliero
        daily_percent = (daily_user_info['count'] / 500) * 100
        if (500 - daily_user_info['count']) < 50:
            print(f"⚠️  CRITICO: Solo {500 - daily_user_info['count']} richieste user lookup rimanenti nelle 24 ore!")
        elif daily_percent > 80:
            print(f"⚡ ATTENZIONE: Utilizzato {daily_percent:.1f}% del limite giornaliero user lookup")
            
    except Exception as e:
        print(f"Errore: {e}")
        print(f"Tipo di errore: {type(e)}")

if __name__ == "__main__":
    main()
