"""
Mock Twitter Client per test senza chiamare le API reali
"""
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import json

class MockTweet:
    """Mock di un oggetto Tweet"""
    def __init__(self, id: str, text: str, author_id: str, created_at: Optional[str] = None):
        self.id = id
        self.text = text
        self.author_id = author_id
        self.created_at = created_at or datetime.now(timezone.utc).isoformat()

class MockUser:
    """Mock di un oggetto User"""
    def __init__(self, id: str, username: str):
        self.id = id
        self.username = username

class MockResponse:
    """Mock di una risposta API"""
    def __init__(self, data=None, includes=None, errors=None):
        self.data = data or []
        self.includes = includes or {}
        self.errors = errors or []

class MockTwitterClient:
    """Mock del client Twitter che simula le chiamate API"""
    
    def __init__(self, *args, **kwargs):
        """Inizializza il mock client (ignora le credenziali)"""
        self.tweets_sent = []
        self.mock_mentions = []
        self.mock_users = {}
        print("🤖 Mock Twitter Client inizializzato (nessuna chiamata reale alle API)")
    
    def add_mock_mention(self, tweet_id: str, text: str, author_username: str, author_id: str = None):
        """Aggiungi una menzione mock per i test"""
        if author_id is None:
            author_id = f"user_{author_username}"
        
        self.mock_mentions.append({
            'id': tweet_id,
            'text': text,
            'author_id': author_id,
            'author_username': author_username
        })
        
        # Aggiungi anche l'utente mock
        self.mock_users[author_id] = MockUser(author_id, author_username)
    
    def search_recent_tweets(self, query: str, since_id: str = None, 
                            tweet_fields: list = None, expansions: list = None,
                            user_fields: list = None, max_results: int = 10):
        """Simula la ricerca di tweet recenti"""
        print(f"🔍 [MOCK] Cerca menzioni: {query}")
        print(f"   Since ID: {since_id}, Max results: {max_results}")
        
        # Filtra le menzioni mock
        filtered_mentions = []
        if since_id:
            # Simula il filtro since_id (solo tweet più recenti)
            for mention in self.mock_mentions:
                if int(mention['id']) > int(since_id):
                    filtered_mentions.append(mention)
        else:
            filtered_mentions = self.mock_mentions[:max_results]
        
        # Crea oggetti MockTweet
        tweets = []
        users = []
        for mention in filtered_mentions[:max_results]:
            tweet = MockTweet(
                id=mention['id'],
                text=mention['text'],
                author_id=mention['author_id']
            )
            tweets.append(tweet)
            
            # Aggiungi l'utente se non esiste già
            if mention['author_id'] in self.mock_users:
                users.append(self.mock_users[mention['author_id']])
        
        print(f"✅ [MOCK] Trovate {len(tweets)} menzioni")
        
        response = MockResponse(
            data=tweets,
            includes={'users': users} if users else {}
        )
        return response
    
    def create_tweet(self, text: str, in_reply_to_tweet_id: str = None):
        """Simula la creazione di un tweet"""
        tweet_id = str(int(datetime.now().timestamp() * 1000))
        print(f"📤 [MOCK] Crea tweet:")
        print(f"   ID: {tweet_id}")
        print(f"   Testo: {text}")
        if in_reply_to_tweet_id:
            print(f"   In risposta a: {in_reply_to_tweet_id}")
        
        # Salva il tweet inviato
        self.tweets_sent.append({
            'id': tweet_id,
            'text': text,
            'in_reply_to_tweet_id': in_reply_to_tweet_id,
            'created_at': datetime.now(timezone.utc).isoformat()
        })
        
        # Crea un oggetto MockTweet per la risposta
        mock_response = type('Response', (), {
            'data': type('TweetData', (), {
                'id': tweet_id,
                'text': text
            })()
        })()
        
        return mock_response
    
    def get_user(self, username: str = None, id: str = None):
        """Simula il lookup di un utente"""
        print(f"👤 [MOCK] Cerca utente: username={username}, id={id}")
        
        # Cerca l'utente nei mock
        if username:
            for user_id, user in self.mock_users.items():
                if user.username.lower() == username.lower():
                    print(f"✅ [MOCK] Utente trovato: @{user.username}")
                    return type('Response', (), {
                        'data': user
                    })()
        
        # Se non trovato, crea un utente mock di default
        if username:
            user_id = f"user_{username}"
            user = MockUser(user_id, username)
            self.mock_users[user_id] = user
            print(f"✅ [MOCK] Utente creato: @{username}")
            return type('Response', (), {
                'data': user
            })()
        
        print(f"❌ [MOCK] Utente non trovato")
        return type('Response', (), {
            'data': None
        })()
    
    def get_tweets_sent(self):
        """Ritorna tutti i tweet inviati durante i test"""
        return self.tweets_sent
    
    def clear_mock_data(self):
        """Pulisce i dati mock"""
        self.mock_mentions = []
        self.mock_users = {}
        self.tweets_sent = []
        print("🧹 [MOCK] Dati mock puliti")




