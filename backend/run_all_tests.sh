#!/bin/bash
cd "$(dirname "$0")"

echo "🧪 =========================================="
echo "   TEST COMPLETO SISTEMA BORING LAYER"
echo "=========================================="
echo ""

# Attiva ambiente virtuale se esiste
if [ -d ".venv" ]; then
    source .venv/bin/activate
    echo "✅ Ambiente virtuale attivato"
else
    echo "⚠️  Ambiente virtuale non trovato. Esegui ./setup.sh prima"
    exit 1
fi

echo ""
echo "📋 Esecuzione test in ordine:"
echo "   1. Test unitari (estrazione, validazione, rate limits)"
echo "   2. Test End-to-End (flusso completo transazione)"
echo "   3. Test integrazione Frontend-Backend"
echo ""

# Usa il python del venv
PYTHON_CMD=".venv/bin/python3"

# Test 1: Unitari
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 1: Test Unitari"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
$PYTHON_CMD test_all.py
UNIT_RESULT=$?

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 2: Test End-to-End"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
$PYTHON_CMD test_e2e.py
E2E_RESULT=$?

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 3: Test Integrazione Frontend-Backend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
$PYTHON_CMD test_frontend_integration.py
INTEGRATION_RESULT=$?

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RIEPILOGO FINALE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $UNIT_RESULT -eq 0 ]; then
    echo "✅ Test Unitari: PASS"
else
    echo "❌ Test Unitari: FAIL"
fi

if [ $E2E_RESULT -eq 0 ]; then
    echo "✅ Test End-to-End: PASS"
else
    echo "❌ Test End-to-End: FAIL"
fi

if [ $INTEGRATION_RESULT -eq 0 ]; then
    echo "✅ Test Integrazione: PASS"
else
    echo "❌ Test Integrazione: FAIL"
fi

TOTAL_FAILED=$((UNIT_RESULT + E2E_RESULT + INTEGRATION_RESULT))

echo ""
if [ $TOTAL_FAILED -eq 0 ]; then
    echo "🎉 TUTTI I TEST PASSATI!"
    echo "✅ Il sistema è pronto per la produzione"
    exit 0
else
    echo "⚠️  Alcuni test sono falliti. Controlla i log sopra."
    exit 1
fi

