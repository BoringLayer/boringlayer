#!/bin/bash
cd "$(dirname "$0")"

echo "🧪 Avvio test backend in modalità MOCK..."
echo ""

# Attiva ambiente virtuale se esiste
if [ -d ".venv" ]; then
    source .venv/bin/activate
    echo "✅ Ambiente virtuale attivato"
else
    echo "⚠️  Ambiente virtuale non trovato. Esegui ./setup.sh prima"
    exit 1
fi

# Esegui i test
python3 test_all.py

echo ""
echo "✅ Test completati"




