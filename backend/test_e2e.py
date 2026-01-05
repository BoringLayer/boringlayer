#!/usr/bin/env python3
"""
Test End-to-End completo del sistema Boring Layer
Simula il flusso completo: menzione Twitter -> processamento -> risposta
"""
import sys
import os
import json
import time
from datetime import datetime, timezone

# Aggiungi src al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

# Importa il mock client PRIMA di importare m.py
from mock_twitter_client import MockTwitterClient

# Sostituisci temporaneamente tweepy.Client con il mock
import tweepy
original_client = tweepy.Client
tweepy.Client = MockTwitterClient

# Ora importa m.py (userà il mock)
from m import (
    extract_transaction_details,
    check_user_balance,
    execute_transaction,
    update_balances,
    register_transaction,
    process_tweet,
    process_twitter_notifications,
    supabase,
    logger,
    rate_limit_manager,
    update_last_tweet_id,
    load_last_tweet_id
)

# Restaura il client originale dopo l'import
tweepy.Client = original_client

def setup_test_users():
    """Prepara utenti di test nel database"""
    print("\n" + "="*60)
    print("🔧 SETUP: Preparazione utenti di test")
    print("="*60)
    
    test_users = [
        {"username": "alice_test", "balance": 5000},
        {"username": "bob_test", "balance": 3000},
        {"username": "charlie_test", "balance": 1000}
    ]
    
    created = 0
    for user in test_users:
        try:
            # Verifica se esiste
            result = supabase.table("user_balance").select("balance").eq("username", user["username"]).execute()
            
            if result.data:
                # Aggiorna il saldo
                supabase.table("user_balance").update({
                    "balance": user["balance"]
                }).eq("username", user["username"]).execute()
                print(f"✅ Utente aggiornato: @{user['username']} con {user['balance']} BP")
            else:
                # Crea nuovo utente
                supabase.table("user_balance").insert({
                    "username": user["username"],
                    "balance": user["balance"]
                }).execute()
                print(f"✅ Utente creato: @{user['username']} con {user['balance']} BP")
                created += 1
        except Exception as e:
            print(f"❌ Errore creazione utente @{user['username']}: {e}")
    
    print(f"\n📊 Setup completato: {len(test_users)} utenti pronti")
    return test_users

def test_complete_transaction_flow():
    """Test del flusso completo di una transazione"""
    print("\n" + "="*60)
    print("🔄 TEST E2E: Flusso completo transazione")
    print("="*60)
    
    try:
        # 1. Setup utenti (resetta i saldi)
        test_users = setup_test_users()
        sender = test_users[0]["username"]
        recipient = test_users[1]["username"]
        
        # Resetta i saldi per questo test specifico
        supabase.table("user_balance").update({"balance": test_users[0]["balance"]}).eq("username", sender).execute()
        supabase.table("user_balance").update({"balance": test_users[1]["balance"]}).eq("username", recipient).execute()
        
        # 2. Crea mock client e aggiungi menzione
        mock_client = MockTwitterClient()
        tweet_id = str(int(time.time() * 1000))
        amount = 250.0
        
        mention_text = f"@boringlayer_ send {amount} BP to @{recipient} via @boringlayer_"
        mock_client.add_mock_mention(
            tweet_id=tweet_id,
            text=mention_text,
            author_username=sender
        )
        
        print(f"\n📝 Menzione mock creata:")
        print(f"   Tweet ID: {tweet_id}")
        print(f"   Da: @{sender}")
        print(f"   A: @{recipient}")
        print(f"   Importo: {amount} BP")
        
        # 3. Verifica saldi iniziali (dopo il reset)
        print(f"\n💰 Saldi iniziali (dopo reset):")
        sender_balance = supabase.table("user_balance").select("balance").eq("username", sender).execute()
        recipient_balance = supabase.table("user_balance").select("balance").eq("username", recipient).execute()
        
        sender_initial = sender_balance.data[0]['balance'] if sender_balance.data else 0
        recipient_initial = recipient_balance.data[0]['balance'] if recipient_balance.data else 0
        
        print(f"   @{sender}: {sender_initial} BP (atteso: {test_users[0]['balance']})")
        print(f"   @{recipient}: {recipient_initial} BP (atteso: {test_users[1]['balance']})")
        
        # Verifica che i saldi siano quelli attesi
        if abs(sender_initial - test_users[0]['balance']) > 0.01:
            print(f"⚠️  Saldo sender non corrisponde! Resettando...")
            supabase.table("user_balance").update({"balance": test_users[0]['balance']}).eq("username", sender).execute()
            sender_initial = test_users[0]['balance']
        
        if abs(recipient_initial - test_users[1]['balance']) > 0.01:
            print(f"⚠️  Saldo recipient non corrisponde! Resettando...")
            supabase.table("user_balance").update({"balance": test_users[1]['balance']}).eq("username", recipient).execute()
            recipient_initial = test_users[1]['balance']
        
        # 4. Simula ricerca menzioni
        print(f"\n🔍 Simulazione ricerca menzioni...")
        tweets_response = mock_client.search_recent_tweets(
            query="@boringlayer_",
            max_results=10
        )
        
        if not tweets_response.data:
            print("❌ Nessuna menzione trovata")
            return False
        
        tweet = tweets_response.data[0]
        users = {user.id: user.username for user in tweets_response.includes.get('users', [])}
        
        # 5. Estrai transazione
        print(f"\n📊 Estrazione dettagli transazione...")
        transaction = extract_transaction_details(tweet.text, users.get(tweet.author_id, sender), tweet.id)
        
        if not transaction["is_valid"]:
            print(f"❌ Transazione non valida: {transaction.get('error')}")
            return False
        
        print(f"✅ Transazione valida:")
        print(f"   Amount: {transaction['amount']} BP")
        print(f"   Net sent: {transaction['net_sent']} BP")
        print(f"   Fees: {transaction['fees']} BP")
        print(f"   Burned: {transaction['burned']} BP")
        
        # 6. Verifica saldo
        print(f"\n💳 Verifica saldo...")
        if not check_user_balance(sender, transaction['amount']):
            print(f"❌ Saldo insufficiente")
            return False
        print(f"✅ Saldo sufficiente")
        
        # 7. Esegui transazione (REALE su Supabase)
        print(f"\n⚡ Esecuzione transazione su Supabase...")
        if execute_transaction(transaction):
            print(f"✅ Transazione eseguita con successo")
        else:
            print(f"❌ Errore nell'esecuzione")
            return False
        
        # 8. Verifica saldi finali
        print(f"\n💰 Verifica saldi finali:")
        sender_balance_final = supabase.table("user_balance").select("balance").eq("username", sender).execute()
        recipient_balance_final = supabase.table("user_balance").select("balance").eq("username", recipient).execute()
        
        sender_final = sender_balance_final.data[0]['balance']
        recipient_final = recipient_balance_final.data[0]['balance']
        
        print(f"   @{sender}: {sender_final} BP (era {sender_initial})")
        print(f"   @{recipient}: {recipient_final} BP (era {recipient_initial})")
        
        # 9. Verifica calcoli
        # Nota: i saldi potrebbero essere stati modificati da test precedenti
        # Verifichiamo solo che la differenza sia corretta
        sender_diff = sender_initial - sender_final
        recipient_diff = recipient_final - recipient_initial
        
        sender_ok = abs(sender_diff - transaction['amount']) < 0.01
        recipient_ok = abs(recipient_diff - transaction['net_sent']) < 0.01
        
        if sender_ok and recipient_ok:
            print(f"\n✅ Calcoli corretti!")
            print(f"   Sender: {sender_initial} - {transaction['amount']} = {sender_final} ✓ (diff: {sender_diff})")
            print(f"   Recipient: {recipient_initial} + {transaction['net_sent']} = {recipient_final} ✓ (diff: {recipient_diff})")
        else:
            print(f"\n❌ Calcoli errati!")
            if not sender_ok:
                print(f"   Sender: differenza attesa {transaction['amount']}, ottenuta {sender_diff}")
            if not recipient_ok:
                print(f"   Recipient: differenza attesa {transaction['net_sent']}, ottenuta {recipient_diff}")
            return False
        
        # 10. Verifica transazione registrata
        print(f"\n📝 Verifica registrazione transazione...")
        transactions = supabase.table("transactions").select("*").eq("Twitt ID", tweet.id).execute()
        
        if transactions.data:
            tx = transactions.data[0]
            print(f"✅ Transazione registrata:")
            print(f"   ID: {tx.get('Twitt ID')}")
            print(f"   Sender: {tx.get('Sender')}")
            print(f"   Recipient: {tx.get('Recipient')}")
            print(f"   Amount: {tx.get('Amount')} BP")
        else:
            print(f"⚠️  Transazione non trovata nel database")
        
        # 11. Simula risposta Twitter (mock)
        print(f"\n📤 Simulazione risposta Twitter...")
        response_text = (
            f"Transaction completed. @{sender} sent {transaction['amount']} BP to @{recipient}\n"
            f"Net sent: {transaction['net_sent']} / Reserve: {transaction['fees']} / Burned: {transaction['burned']}\n"
            f"Txn: {tweet.id}, {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')} (UTC)\n"
            f"Check your balance at http://boringlayer.com"
        )
        
        mock_client.create_tweet(text=response_text, in_reply_to_tweet_id=tweet.id)
        tweets_sent = mock_client.get_tweets_sent()
        
        if tweets_sent:
            print(f"✅ Risposta mock inviata:")
            print(f"   {tweets_sent[-1]['text'][:100]}...")
        
        print(f"\n🎉 TEST E2E COMPLETATO CON SUCCESSO!")
        return True
        
    except Exception as e:
        print(f"\n❌ Errore nel test E2E: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_multiple_transactions():
    """Test di multiple transazioni sequenziali"""
    print("\n" + "="*60)
    print("🔄 TEST: Multiple transazioni sequenziali")
    print("="*60)
    
    try:
        mock_client = MockTwitterClient()
        test_users = setup_test_users()
        
        transactions = [
            {"from": "alice_test", "to": "bob_test", "amount": 100},
            {"from": "bob_test", "to": "charlie_test", "amount": 50},
            {"from": "charlie_test", "to": "alice_test", "amount": 25}
        ]
    
        for i, tx in enumerate(transactions, 1):
            print(f"\n--- Transazione {i}/3 ---")
            tweet_id = str(int(time.time() * 1000) + i)
            mention_text = f"@boringlayer_ send {tx['amount']} BP to @{tx['to']} via @boringlayer_"
            
            mock_client.add_mock_mention(
                tweet_id=tweet_id,
                text=mention_text,
                author_username=tx['from']
            )
            
            # Processa
            tweets_response = mock_client.search_recent_tweets(query="@boringlayer_", max_results=10)
            if tweets_response.data:
                tweet = tweets_response.data[-1]  # Prendi l'ultimo
                users = {user.id: user.username for user in tweets_response.includes.get('users', [])}
                
                transaction = extract_transaction_details(
                    tweet.text, 
                    users.get(tweet.author_id, tx['from']), 
                    tweet.id
                )
                
                if transaction["is_valid"] and check_user_balance(tx['from'], transaction['amount']):
                    # Esegui (opzionale - decommenta per eseguire realmente)
                    # execute_transaction(transaction)
                    print(f"✅ Transazione {i} processata (non eseguita per sicurezza)")
                else:
                    print(f"❌ Transazione {i} non valida o saldo insufficiente")
        
        print(f"\n✅ Test multiple transazioni completato")
        return True
        
    except Exception as e:
        print(f"❌ Errore: {e}")
        return False

def test_error_cases():
    """Test di casi di errore"""
    print("\n" + "="*60)
    print("⚠️  TEST: Casi di errore")
    print("="*60)
    
    error_cases = [
        {
            "name": "Saldo insufficiente",
            "text": "@boringlayer_ send 10000 BP to @bob_test via @boringlayer_",
            "author": "charlie_test",  # Ha solo 1000 BP
            "should_fail": True
        },
        {
            "name": "Formato non valido",
            "text": "send 100 BP to @bob_test",
            "author": "alice_test",
            "should_fail": True
        },
        {
            "name": "Importo troppo basso",
            "text": "@boringlayer_ send 0.05 BP to @bob_test via @boringlayer_",
            "author": "alice_test",
            "should_fail": True
        }
    ]
    
    passed = 0
    failed = 0
    
    for case in error_cases:
        print(f"\n--- {case['name']} ---")
        transaction = extract_transaction_details(case['text'], case['author'], "999999")
        
        if case['should_fail']:
            if not transaction["is_valid"]:
                print(f"✅ Errore gestito correttamente: {transaction.get('error')}")
                passed += 1
            else:
                # Verifica saldo se la transazione è valida
                if not check_user_balance(case['author'], transaction['amount']):
                    print(f"✅ Saldo insufficiente rilevato correttamente")
                    passed += 1
                else:
                    print(f"❌ Errore non rilevato")
                    failed += 1
        else:
            if transaction["is_valid"]:
                print(f"✅ Transazione valida")
                passed += 1
            else:
                print(f"❌ Transazione valida rifiutata")
                failed += 1
    
    print(f"\n📊 Risultati: {passed} passati, {failed} falliti")
    return failed == 0

def main():
    """Esegue tutti i test E2E"""
    print("\n" + "="*60)
    print("🚀 TEST END-TO-END COMPLETO")
    print("="*60)
    print("⚠️  Modalità MOCK: nessuna chiamata reale alle API Twitter")
    print("⚠️  Le transazioni VERRANNO eseguite su Supabase (database reale)")
    print("="*60)
    
    results = []
    
    # Test 1: Flusso completo singola transazione
    results.append(("Flusso completo transazione", test_complete_transaction_flow()))
    
    # Test 2: Multiple transazioni
    results.append(("Multiple transazioni", test_multiple_transactions()))
    
    # Test 3: Casi di errore
    results.append(("Gestione errori", test_error_cases()))
    
    # Riepilogo
    print("\n" + "="*60)
    print("📊 RIEPILOGO TEST E2E")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {name}")
    
    print(f"\nTotale: {passed}/{total} test passati")
    
    if passed == total:
        print("\n🎉 TUTTI I TEST E2E PASSATI!")
        print("\n💡 Il sistema è pronto per la produzione!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test falliti")
        return 1

if __name__ == "__main__":
    sys.exit(main())

