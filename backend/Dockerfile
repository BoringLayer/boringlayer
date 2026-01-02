   # Usa un'immagine base di Python
   FROM python:3.9-slim

   # Imposta la cartella di lavoro
   WORKDIR /app

   # Copia i file necessari
   COPY requirements.txt .
   COPY . .

   # Installa le dipendenze
   RUN pip install --no-cache-dir -r requirements.txt

   # Comando per eseguire l'app
   CMD ["python", "src/m.py"]
   