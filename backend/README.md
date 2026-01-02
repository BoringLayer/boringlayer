# Bot Twitter

## Setup
1. Clona il repository
2. Esegui `chmod +x setup.sh start.sh` per rendere gli script eseguibili
3. Esegui `./setup.sh` per installare le dipendenze
4. Assicurati che i file di configurazione siano presenti in `data/`

## Avvio
- Esegui `./start.sh` per avviare il bot

## Requisiti
- Python 3.x
- File di configurazione in data/config.json

## File di Configurazione
Assicurati che nella cartella `data/` siano presenti:
- `config.json` con le credenziali di Twitter e Supabase
- Altri file di configurazione necessari

## Note
- L'applicazione utilizza un ambiente virtuale Python (.venv)
- Le dipendenze sono elencate in `requirements.txt`
- Gli script di setup e avvio automatizzano l'installazione e l'esecuzione
