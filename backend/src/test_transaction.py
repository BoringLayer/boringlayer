from datetime import datetime, timezone
import json
import os
from supabase import create_client, Client

# Configurazione percorsi
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG_PATH = os.path.join(BASE_DIR, 'data', 'config.json')

# Carica le credenziali da config.json
with open(CONFIG_PATH, 'r') as f:
    config = json.load(f)
    SUPABASE_URL = config["SUPABASE_URL"]
    SUPABASE_API_KEY = config["SUPABASE_API_KEY"]

# Inizializza il client Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_API_KEY)

def test_transaction_insert():
    """Funzione di test per inserire una transazione su Supabase"""
    try:
        # Dati di test per la transazione
        test_data = {
            "Date": datetime.now(timezone.utc).isoformat(),
            "Sender": "test_sender",
            "Recipient": "test_recipient",
            "Amount": 100.0,
            "Net_sent": 90.0,  # 90% dell'Amount
            "Fees": 4.0,       # 4% dell'Amount
            "Burned": 6.0,     # 6% dell'Amount
            "Twitt ID": "test_tweet_123"
        }

        # Inserimento della transazione
        response = supabase.table("transactions").insert(test_data).execute()
        
        if response.data:
            print("✅ Test transazione inserita con successo")
            print("Dettagli transazione:")
            print(f"- Sender: {test_data['Sender']}")
            print(f"- Recipient: {test_data['Recipient']}")
            print(f"- Amount: {test_data['Amount']}")
            print(f"- Net sent: {test_data['Net_sent']}")
            
            # Verifica i bilanci aggiornati
            balances = supabase.table("user_balance").select("*").execute()
            print("\nBilanci aggiornati:")
            for balance in balances.data:
                print(f"- User: {balance['username']}, Balance: {balance['balance']}")
            
            return True
        else:
            print(f"❌ Errore nell'inserimento: {response.error}")
            return False
            
    except Exception as e:
        print(f"❌ Errore durante il test: {e}")
        return False

# Esegui il test
if __name__ == "__main__":
    print("🚀 Avvio test transazione...")
    test_transaction_insert()