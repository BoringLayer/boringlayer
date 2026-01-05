#!/usr/bin/env python3
"""
Test di integrazione Frontend-Backend
Verifica che i dati processati dal backend siano accessibili dal frontend
"""
import sys
import os
import json

# Aggiungi src al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from m import supabase

def test_top100_api():
    """Test che simula la chiamata API /api/top100"""
    print("\n" + "="*60)
    print("🌐 TEST: API Top 100 (simulazione frontend)")
    print("="*60)
    
    try:
        # Simula la query del frontend
        result = supabase.table("user_balance").select("username, balance").order("balance", desc=True).limit(100).execute()
        
        if result.data:
            print(f"✅ Query eseguita: {len(result.data)} utenti trovati")
            print(f"\n📊 Top 5 utenti:")
            for i, user in enumerate(result.data[:5], 1):
                print(f"   {i}. @{user['username']}: {user['balance']} BP")
            return True
        else:
            print("⚠️  Nessun utente trovato")
            return False
    except Exception as e:
        print(f"❌ Errore: {e}")
        return False

def test_transactions_api():
    """Test che simula la chiamata API /api/transactions"""
    print("\n" + "="*60)
    print("🌐 TEST: API Transactions (simulazione frontend)")
    print("="*60)
    
    try:
        # Simula la query del frontend
        result = supabase.table("transactions").select("*").order("Date", desc=True).limit(100).execute()
        
        if result.data:
            print(f"✅ Query eseguita: {len(result.data)} transazioni trovate")
            print(f"\n📊 Ultime 3 transazioni:")
            for i, tx in enumerate(result.data[:3], 1):
                print(f"   {i}. {tx.get('Sender')} -> {tx.get('Recipient')}: {tx.get('Amount')} BP")
            return True
        else:
            print("⚠️  Nessuna transazione trovata")
            return False
    except Exception as e:
        print(f"❌ Errore: {e}")
        return False

def test_user_search_api():
    """Test che simula la chiamata API /api/user"""
    print("\n" + "="*60)
    print("🌐 TEST: API User Search (simulazione frontend)")
    print("="*60)
    
    try:
        test_username = "alice_test"
        
        # Simula la query del frontend
        result = supabase.table("user_balance").select("username, balance").eq("username", test_username).single().execute()
        
        if result.data:
            print(f"✅ Utente trovato: @{result.data['username']}")
            print(f"   Saldo: {result.data['balance']} BP")
            return True
        else:
            print(f"⚠️  Utente @{test_username} non trovato")
            return False
    except Exception as e:
        print(f"❌ Errore: {e}")
        return False

def main():
    """Esegue i test di integrazione"""
    print("\n" + "="*60)
    print("🚀 TEST INTEGRAZIONE FRONTEND-BACKEND")
    print("="*60)
    
    results = []
    
    results.append(("API Top 100", test_top100_api()))
    results.append(("API Transactions", test_transactions_api()))
    results.append(("API User Search", test_user_search_api()))
    
    # Riepilogo
    print("\n" + "="*60)
    print("📊 RIEPILOGO TEST INTEGRAZIONE")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {name}")
    
    print(f"\nTotale: {passed}/{total} test passati")
    
    if passed == total:
        print("\n🎉 TUTTI I TEST DI INTEGRAZIONE PASSATI!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test falliti")
        return 1

if __name__ == "__main__":
    sys.exit(main())

