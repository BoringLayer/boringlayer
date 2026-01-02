#!/bin/bash
# Crea e attiva l'ambiente virtuale
python3 -m venv .venv
source .venv/bin/activate

# Installa le dipendenze
python3 -m pip install -r requirements.txt

echo "Setup completato! Per avviare l'applicazione usa: python3 src/m.py"
