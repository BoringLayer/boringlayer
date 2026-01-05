#!/usr/bin/env python3
"""
Test completo del backend in modalità mock (senza chiamare API Twitter reali)
"""
import sys
import os
import json
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
    supabase,
    logger
)

# Restaura il client originale dopo l'import
tweepy.Client = original_client

def test_extract_transaction():
    """Test 1: Estrazione dettagli transazione"""
    print("\n" + "="*60)
    print("TEST 1: Estrazione dettagli transazione")
    print("="*60)
    
    test_cases = [
        {
            "text": "@boringlayer_ send 100 BP to @testuser via @boringlayer_",
            "author": "sender1",
            "tweet_id": "123456",
            "should_pass": True
        },
        {
            "text": "@boringlayer_ send 50.5 BP to @recipient via @boringlayer_",
            "author": "sender2",
            "tweet_id": "123457",
            "should_pass": True
        },
        {
            "text": "@boringlayer_ send 1,000 BP to @user via @boringlayer_",
            "author": "sender3",
            "tweet_id": "123458",
            "should_pass": True
        },
        {
            "text": "@boringlayer_ send 0.05 BP to @user via @boringlayer_",
            "author": "sender4",
            "tweet_id": "123459",
            "should_pass": False,  # Importo troppo basso
        },
        {
            "text": "invalid format",
            "author": "sender5",
            "tweet_id": "123460",
            "should_pass": False
        }
    ]
    
    passed = 0
    failed = 0
    
    for i, test in enumerate(test_cases, 1):
        print(f"\n--- Test case {i} ---")
        result = extract_transaction_details(test["text"], test["author"], test["tweet_id"])
        
        if result["is_valid"] == test["should_pass"]:
            print(f"✅ PASS: {test['text'][:50]}...")
            if result["is_valid"]:
                print(f"   Amount: {result['amount']}, Recipient: {result['recipient']}")
            passed += 1
        else:
            print(f"❌ FAIL: {test['text'][:50]}...")
            print(f"   Expected valid={test['should_pass']}, got valid={result['is_valid']}")
            failed += 1
    
    print(f"\n📊 Risultati: {passed} passati, {failed} falliti")
    return failed == 0

def test_supabase_connection():
    """Test 2: Connessione Supabase"""
    print("\n" + "="*60)
    print("TEST 2: Connessione Supabase")
    print("="*60)
    
    try:
        # Prova a fare una query semplice
        result = supabase.table("user_balance").select("username").limit(1).execute()
        print("✅ Connessione Supabase OK")
        print(f"   Query eseguita con successo")
        return True
    except Exception as e:
        print(f"❌ Errore connessione Supabase: {e}")
        return False

def test_user_balance_check():
    """Test 3: Verifica saldo utente"""
    print("\n" + "="*60)
    print("TEST 3: Verifica saldo utente")
    print("="*60)
    
    try:
        # Crea un utente di test se non esiste
        test_username = "test_balance_user"
        test_amount = 50.0
        
        # Verifica se esiste
        result = supabase.table("user_balance").select("balance").eq("username", test_username).execute()
        
        if not result.data:
            # Crea con saldo 1000
            supabase.table("user_balance").insert({
                "username": test_username,
                "balance": 1000
            }).execute()
            print(f"✅ Utente di test creato: @{test_username} con 1000 BP")
        
        # Test verifica saldo
        has_balance = check_user_balance(test_username, test_amount)
        print(f"✅ Verifica saldo OK: {has_balance}")
        return True
    except Exception as e:
        print(f"❌ Errore verifica saldo: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_transaction_processing_with_mock():
    """Test 4: Processamento transazione completa con mock Twitter"""
    print("\n" + "="*60)
    print("TEST 4: Processamento transazione completa (MOCK)")
    print("="*60)
    
    try:
        # Crea un mock client
        mock_client = MockTwitterClient()
        
        # Aggiungi una menzione mock valida
        mock_client.add_mock_mention(
            tweet_id="999999",
            text="@boringlayer_ send 100 BP to @recipient_test via @boringlayer_",
            author_username="sender_test"
        )
        
        # Crea utenti di test in Supabase
        sender_username = "sender_test"
        recipient_username = "recipient_test"
        
        # Crea sender se non esiste
        sender_check = supabase.table("user_balance").select("balance").eq("username", sender_username).execute()
        if not sender_check.data:
            supabase.table("user_balance").insert({
                "username": sender_username,
                "balance": 1000
            }).execute()
            print(f"✅ Sender creato: @{sender_username} con 1000 BP")
        
        # Simula la ricerca menzioni
        tweets_response = mock_client.search_recent_tweets(
            query="@boringlayer_",
            max_results=10
        )
        
        if not tweets_response.data:
            print("❌ Nessuna menzione mock trovata")
            return False
        
        # Processa il tweet mock
        tweet = tweets_response.data[0]
        users = {user.id: user.username for user in tweets_response.includes.get('users', [])}
        
        print(f"📝 Processando tweet mock: {tweet.text}")
        
        # Estrai dettagli
        transaction = extract_transaction_details(tweet.text, users.get(tweet.author_id, "unknown"), tweet.id)
        
        if not transaction["is_valid"]:
            print(f"❌ Transazione non valida: {transaction.get('error')}")
            return False
        
        print(f"✅ Transazione estratta:")
        print(f"   Amount: {transaction['amount']} BP")
        print(f"   Sender: {transaction['sender']}")
        print(f"   Recipient: {transaction['recipient']}")
        print(f"   Net sent: {transaction['net_sent']} BP")
        
        # Verifica saldo
        if not check_user_balance(sender_username, transaction['amount']):
            print(f"❌ Saldo insufficiente per @{sender_username}")
            return False
        
        print(f"✅ Saldo verificato: @{sender_username} ha fondi sufficienti")
        
        # Esegui transazione (opzionale, commenta se non vuoi modificare il DB)
        print("\n⚠️  Esecuzione transazione reale su Supabase...")
        # execute_transaction(transaction)  # Decommenta per eseguire realmente
        
        print("✅ Test processamento completato (transazione non eseguita per sicurezza)")
        return True
        
    except Exception as e:
        print(f"❌ Errore processamento: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_rate_limits():
    """Test 5: Verifica rate limits"""
    print("\n" + "="*60)
    print("TEST 5: Verifica rate limits")
    print("="*60)
    
    try:
        from m import rate_limit_manager
        
        # Test verifica rate limit
        can_reply, wait_time = rate_limit_manager.can_make_request("TWEET_REPLY")
        print(f"✅ Rate limit TWEET_REPLY: can_make={can_reply}, wait_time={wait_time}s")
        
        can_search, wait_time = rate_limit_manager.can_make_request("MENTION_SEARCH")
        print(f"✅ Rate limit MENTION_SEARCH: can_make={can_search}, wait_time={wait_time}s")
        
        return True
    except Exception as e:
        print(f"❌ Errore rate limits: {e}")
        return False

def main():
    """Esegue tutti i test"""
    print("\n" + "="*60)
    print("🚀 AVVIO TEST COMPLETO BACKEND (MOCK MODE)")
    print("="*60)
    print("⚠️  Modalità MOCK: nessuna chiamata reale alle API Twitter")
    print("="*60)
    
    results = []
    
    # Test 1: Estrazione transazioni
    results.append(("Estrazione transazioni", test_extract_transaction()))
    
    # Test 2: Connessione Supabase
    results.append(("Connessione Supabase", test_supabase_connection()))
    
    # Test 3: Verifica saldo
    results.append(("Verifica saldo", test_user_balance_check()))
    
    # Test 4: Processamento completo
    results.append(("Processamento transazione", test_transaction_processing_with_mock()))
    
    # Test 5: Rate limits
    results.append(("Rate limits", test_rate_limits()))
    
    # Riepilogo
    print("\n" + "="*60)
    print("📊 RIEPILOGO TEST")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {name}")
    
    print(f"\nTotale: {passed}/{total} test passati")
    
    if passed == total:
        print("\n🎉 TUTTI I TEST PASSATI!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test falliti")
        return 1

if __name__ == "__main__":
    sys.exit(main())




