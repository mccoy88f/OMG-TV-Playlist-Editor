import sqlite3
from sqlite3 import Connection
import json
import shutil
from typing import Optional
from pathlib import Path
from contextlib import contextmanager
from passlib.hash import bcrypt
from datetime import datetime

DATABASE_PATH = Path("data/playlists.db")
BACKUP_PATH = Path("data/backups")

def dict_factory(cursor, row):
    fields = [column[0] for column in cursor.description]
    return {key: value for key, value in zip(fields, row)}

sqlite3.register_adapter(dict, json.dumps)
sqlite3.register_converter("JSON", json.loads)

def create_backup():
    BACKUP_PATH.mkdir(exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = BACKUP_PATH / f"playlist_backup_{timestamp}.db"
    shutil.copy2(DATABASE_PATH, backup_file)

    # Mantieni solo gli ultimi 5 backup
    backups = sorted(BACKUP_PATH.glob("playlist_backup_*.db"))
    if len(backups) > 5:
        for backup in backups[:-5]:
            backup.unlink()

@contextmanager
def get_db() -> Connection:
    DATABASE_PATH.parent.mkdir(exist_ok=True)
    conn = sqlite3.connect(
        str(DATABASE_PATH),
        detect_types=sqlite3.PARSE_DECLTYPES,
        timeout=10.0,
        isolation_level='IMMEDIATE'
    )
    conn.row_factory = dict_factory
    
    try:
        yield conn
    except Exception as e:
        conn.rollback()
        raise e
    else:
        conn.commit()
    finally:
        conn.close()

def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('PRAGMA journal_mode=WAL')
        cursor.execute('PRAGMA foreign_keys=ON')
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS playlists (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                url TEXT,
                is_custom BOOLEAN DEFAULT FALSE,
                public_token TEXT UNIQUE,
                epg_url TEXT,
                last_sync TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_playlists_user_id 
            ON playlists(user_id)
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS channels (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                playlist_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                url TEXT NOT NULL,
                group_title TEXT,
                logo_url TEXT,
                tvg_id TEXT,
                position INTEGER,
                extra_tags JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (playlist_id) REFERENCES playlists (id) 
                ON DELETE CASCADE
            )
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_channels_playlist_id 
            ON channels(playlist_id)
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS custom_playlist_channels (
                playlist_id INTEGER NOT NULL,
                channel_id INTEGER NOT NULL,
                position INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (playlist_id, channel_id),
                FOREIGN KEY (playlist_id) REFERENCES playlists (id) 
                ON DELETE CASCADE,
                FOREIGN KEY (channel_id) REFERENCES channels (id) 
                ON DELETE CASCADE
            )
        """)

        # Verifica admin user
        admin_exists = cursor.execute(
            "SELECT 1 FROM users WHERE username = ?", 
            ("admin",)
        ).fetchone()

        if not admin_exists:
            password_hash = bcrypt.hash("admin")
            cursor.execute(
                "INSERT INTO users (username, password_hash) VALUES (?, ?)",
                ("admin", password_hash)
            )

def verify_password(username: str, password: str) -> bool:
    try:
        with get_db() as conn:
            user = conn.execute(
                "SELECT password_hash FROM users WHERE username = ?",
                (username,)
            ).fetchone()
            
            if user and bcrypt.verify(password, user['password_hash']):
                return True
    except Exception as e:
        print(f"Password verification error: {str(e)}")
    return False

if __name__ == "__main__":
    init_db()