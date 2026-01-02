import sys
import os

# Aggiungi la directory src al path di Python
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from m import load_user_lists, save_user_lists, logger

def move_user_to_blacklist(username):
    """Sposta un utente dalla suspect list alla blacklist"""
    user_lists = load_user_lists()
    username = username.lower()
    
    if username in user_lists["suspect_list"]:
        user_lists["suspect_list"].remove(username)
        user_lists["blacklist"].append(username)
        save_user_lists(user_lists)
        logger.info(f"Utente {username} spostato dalla suspect list alla blacklist.")
    else:
        logger.warning(f"Utente {username} non trovato nella suspect list.")

def move_user_to_suspectlist(username):
    """Sposta un utente dalla blacklist alla suspect list"""
    user_lists = load_user_lists()
    username = username.lower()
    
    if username in user_lists["blacklist"]:
        user_lists["blacklist"].remove(username)
        user_lists["suspect_list"].append(username)
        save_user_lists(user_lists)
        logger.info(f"Utente {username} spostato dalla blacklist alla suspect list.")
    else:
        logger.warning(f"Utente {username} non trovato nella blacklist.")

def remove_user_from_lists(username):
    """Rimuove un utente da entrambe le liste"""
    user_lists = load_user_lists()
    username = username.lower()
    
    removed = False
    if username in user_lists["blacklist"]:
        user_lists["blacklist"].remove(username)
        removed = True
    if username in user_lists["suspect_list"]:
        user_lists["suspect_list"].remove(username)
        removed = True
    
    if removed:
        save_user_lists(user_lists)
        logger.info(f"Utente {username} rimosso da tutte le liste.")
    else:
        logger.warning(f"Utente {username} non trovato in nessuna lista.")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python manage_users.py <command> <username>")
        print("Commands: to_blacklist, to_suspectlist, remove")
    else:
        command = sys.argv[1]
        username = sys.argv[2]
        
        if command == "to_blacklist":
            move_user_to_blacklist(username)
        elif command == "to_suspectlist":
            move_user_to_suspectlist(username)
        elif command == "remove":
            remove_user_from_lists(username)
        else:
            print("Comando non riconosciuto. Usa: to_blacklist, to_suspectlist, remove") 