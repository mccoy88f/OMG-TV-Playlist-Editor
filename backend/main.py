from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.gzip import GZipMiddleware
from typing import List, Dict, Optional
import aiohttp
import asyncio
from datetime import datetime, timedelta
import uuid
import json
import sqlite3
from ratelimit import limits, sleep_and_retry

from database import get_db, init_db, create_backup
from models import *
from m3u_utils import parse_m3u, generate_m3u, M3UChannel
from auth import (
   authenticate_user, create_access_token, create_refresh_token,
   get_current_user, get_current_user_id, verify_refresh_token
)

app = FastAPI(title="OMG Playlist Manager")

# CORS and middleware config
origins = ["http://localhost", "http://localhost:5173"]

app.add_middleware(
   CORSMiddleware,
   allow_origins=origins,
   allow_credentials=True,
   allow_methods=["*"],
   allow_headers=["*"],
   expose_headers=["Content-Disposition"]
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

# Rate limiting
CALLS_LIMIT = 100
CALLS_PERIOD = 60

@app.on_event("startup")
async def startup_event():
   init_db()

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Auth endpoints
@sleep_and_retry
@limits(calls=CALLS_LIMIT, period=CALLS_PERIOD)
@app.post("/token", response_model=TokenResponse)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
   user = authenticate_user(form_data.username, form_data.password)
   if not user:
       raise HTTPException(
           status_code=status.HTTP_401_UNAUTHORIZED,
           detail="Invalid credentials",
           headers={"WWW-Authenticate": "Bearer"},
       )
   
   access_token = create_access_token({"sub": user.username})
   refresh_token = create_refresh_token({"sub": user.username})
   
   return {
       "access_token": access_token,
       "refresh_token": refresh_token,
       "token_type": "bearer"
   }

@app.post("/token/refresh", response_model=TokenResponse)
async def refresh_access_token(refresh_token: str):
   username = verify_refresh_token(refresh_token)
   if not username:
       raise HTTPException(
           status_code=status.HTTP_401_UNAUTHORIZED,
           detail="Invalid refresh token"
       )
   
   access_token = create_access_token({"sub": username})
   new_refresh_token = create_refresh_token({"sub": username})
   
   return {
       "access_token": access_token,
       "refresh_token": new_refresh_token,
       "token_type": "bearer"
   }

@app.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
   return current_user

# Playlist endpoints
@app.get("/playlists", response_model=List[Playlist])
async def get_playlists(user_id: int = Depends(get_current_user_id)):
   with get_db() as db:
       cursor = db.cursor()
       playlists = []
       
       for playlist in cursor.execute(
           """SELECT * FROM playlists 
              WHERE user_id = ? 
              ORDER BY created_at""",
           (user_id,)
       ).fetchall():
           channels = cursor.execute("""
               SELECT * FROM channels 
               WHERE playlist_id = ? 
               ORDER BY position, created_at
           """, (playlist['id'],)).fetchall()
           
           playlist_dict = dict(playlist)
           playlist_dict['channels'] = [dict(ch) for ch in channels]
           playlists.append(playlist_dict)
       
       return playlists

@app.post("/playlists", response_model=Playlist)
async def create_playlist(
   playlist: PlaylistCreate,
   user_id: int = Depends(get_current_user_id)
):
   with get_db() as db:
       cursor = db.cursor()
       try:
           cursor.execute(
               """INSERT INTO playlists 
                  (user_id, name, url, is_custom, public_token, epg_url)
                  VALUES (?, ?, ?, ?, ?, ?)""",
               (
                   user_id,
                   playlist.name,
                   playlist.url,
                   playlist.is_custom,
                   str(uuid.uuid4()) if playlist.is_custom else None,
                   playlist.epg_url
               )
           )
           
           new_playlist = cursor.execute(
               "SELECT * FROM playlists WHERE id = ?",
               (cursor.lastrowid,)
           ).fetchone()
           
           return dict(new_playlist)
       except sqlite3.Error as e:
           raise HTTPException(
               status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
               detail=f"Database error: {str(e)}"
           )

@app.get("/playlists/{playlist_id}", response_model=Playlist)
async def get_playlist(
   playlist_id: int,
   user_id: int = Depends(get_current_user_id)
):
   with get_db() as db:
       playlist = db.execute(
           """SELECT * FROM playlists 
              WHERE id = ? AND user_id = ?""",
           (playlist_id, user_id)
       ).fetchone()
       
       if not playlist:
           raise HTTPException(
               status_code=status.HTTP_404_NOT_FOUND,
               detail="Playlist not found"
           )
       
       channels = db.execute("""
           SELECT * FROM channels 
           WHERE playlist_id = ?
           ORDER BY position, created_at
       """, (playlist_id,)).fetchall()
       
       playlist_dict = dict(playlist)
       playlist_dict['channels'] = [dict(ch) for ch in channels]
       return playlist_dict
       
@app.put("/playlists/{playlist_id}", response_model=Playlist)
async def update_playlist(
   playlist_id: int,
   playlist: PlaylistUpdate,
   user_id: int = Depends(get_current_user_id)
):
   with get_db() as db:
       cursor = db.cursor()
       
       existing = cursor.execute(
           "SELECT * FROM playlists WHERE id = ? AND user_id = ?",
           (playlist_id, user_id)
       ).fetchone()
       
       if not existing:
           raise HTTPException(status_code=404, detail="Playlist not found")
       
       update_fields = []
       values = []
       if playlist.name is not None:
           update_fields.append("name = ?")
           values.append(playlist.name)
       if playlist.url is not None:
           update_fields.append("url = ?")
           values.append(playlist.url)
       if playlist.epg_url is not None:
           update_fields.append("epg_url = ?")
           values.append(playlist.epg_url)
       
       if update_fields:
           values.extend([playlist_id, user_id])
           cursor.execute(
               f"""UPDATE playlists 
                   SET {', '.join(update_fields)}
                   WHERE id = ? AND user_id = ?""",
               tuple(values)
           )
       
       return await get_playlist(playlist_id, user_id)

@app.delete("/playlists/{playlist_id}")
async def delete_playlist(
   playlist_id: int,
   user_id: int = Depends(get_current_user_id)
):
   with get_db() as db:
       cursor = db.cursor()
       
       playlist = cursor.execute(
           "SELECT * FROM playlists WHERE id = ? AND user_id = ?",
           (playlist_id, user_id)
       ).fetchone()
       
       if not playlist:
           raise HTTPException(status_code=404, detail="Playlist not found")
       
       cursor.execute(
           "DELETE FROM playlists WHERE id = ? AND user_id = ?",
           (playlist_id, user_id)
       )
       return {"message": "Playlist deleted"}

@app.post("/playlists/{playlist_id}/sync")
@sleep_and_retry
@limits(calls=10, period=60)
async def sync_playlist(
   playlist_id: int,
   user_id: int = Depends(get_current_user_id)
):
   timeout = aiohttp.ClientTimeout(total=30)
   async with aiohttp.ClientSession(timeout=timeout) as session:
       try:
           with get_db() as db:
               cursor = db.cursor()
               playlist = cursor.execute(
                   "SELECT * FROM playlists WHERE id = ? AND user_id = ?",
                   (playlist_id, user_id)
               ).fetchone()
               
               if not playlist:
                   raise HTTPException(status_code=404, detail="Playlist not found")
               if not playlist['url']:
                   raise HTTPException(status_code=400, detail="Playlist has no URL")
               
               async with session.get(playlist['url']) as response:
                   if response.status != 200:
                       raise HTTPException(
                           status_code=400,
                           detail=f"Failed to fetch playlist: HTTP {response.status}"
                       )
                   content = await response.text()
                   
               try:
                   channels = parse_m3u(content)
               except Exception as e:
                   raise HTTPException(
                       status_code=400,
                       detail=f"Failed to parse M3U content: {str(e)}"
                   )
               
               cursor.execute("BEGIN TRANSACTION")
               try:
                   # Mantieni i tvg_id e extra_tags esistenti
                   existing_channels = {
                       ch['url']: {
                           'tvg_id': ch['tvg_id'],
                           'extra_tags': ch['extra_tags']
                       }
                       for ch in cursor.execute(
                           "SELECT url, tvg_id, extra_tags FROM channels WHERE playlist_id = ?",
                           (playlist_id,)
                       ).fetchall()
                       if ch['tvg_id'] or ch['extra_tags']
                   }
                   
                   cursor.execute(
                       "DELETE FROM channels WHERE playlist_id = ?",
                       (playlist_id,)
                   )
                   
                   for i, channel in enumerate(channels, 1):
                       existing = existing_channels.get(channel.url, {})
                       tvg_id = existing.get('tvg_id', channel.tvg_id)
                       
                       extra_tags = channel.extra_tags.copy()
                       if 'extra_tags' in existing:
                           existing_extra = json.loads(existing['extra_tags'])
                           extra_tags.update(existing_extra)
                       
                       cursor.execute(
                           """INSERT INTO channels 
                              (playlist_id, name, url, group_title, logo_url, 
                               tvg_id, position, extra_tags)
                              VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                           (
                               playlist_id, channel.name, channel.url,
                               channel.group, channel.logo, tvg_id,
                               i, json.dumps(extra_tags)
                           )
                       )
                   
                   cursor.execute(
                       """UPDATE playlists 
                          SET last_sync = CURRENT_TIMESTAMP
                          WHERE id = ? AND user_id = ?""",
                       (playlist_id, user_id)
                   )
                   
                   cursor.execute("COMMIT")
                   create_backup()
                   
               except Exception as e:
                   cursor.execute("ROLLBACK")
                   raise HTTPException(
                       status_code=500,
                       detail=f"Database error during sync: {str(e)}"
                   )
                   
           return {
               "message": "Playlist synchronized successfully",
               "channels_count": len(channels)
           }
           
       except aiohttp.ClientError as e:
           raise HTTPException(
               status_code=400,
               detail=f"Failed to fetch playlist: {str(e)}"
           )
           
# Channel management endpoints
@app.post("/playlists/{playlist_id}/channels", response_model=Channel)
async def add_channel(
   playlist_id: int,
   channel: ChannelCreate,
   user_id: int = Depends(get_current_user_id)
):
   with get_db() as db:
       cursor = db.cursor()
       
       playlist = cursor.execute(
           "SELECT * FROM playlists WHERE id = ? AND user_id = ?",
           (playlist_id, user_id)
       ).fetchone()
       
       if not playlist:
           raise HTTPException(status_code=404, detail="Playlist not found")
           
       try:
           max_pos = cursor.execute(
               """SELECT MAX(position) as max_pos 
                  FROM channels 
                  WHERE playlist_id = ?""",
               (playlist_id,)
           ).fetchone()
           
           next_pos = (max_pos['max_pos'] or 0) + 1 if max_pos else 1
           
           cursor.execute(
               """INSERT INTO channels 
                  (playlist_id, name, url, group_title, logo_url, position, 
                   tvg_id, extra_tags)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
               (
                   playlist_id, channel.name, channel.url,
                   channel.group_title, channel.logo_url, next_pos,
                   channel.tvg_id, json.dumps(channel.extra_tags or {})
               )
           )
           
           new_channel = cursor.execute(
               "SELECT * FROM channels WHERE id = ?",
               (cursor.lastrowid,)
           ).fetchone()
           
           return dict(new_channel)
           
       except sqlite3.Error as e:
           raise HTTPException(
               status_code=500,
               detail=f"Database error: {str(e)}"
           )

@app.put("/channels/{channel_id}", response_model=Channel)
async def update_channel(
   channel_id: int,
   channel: ChannelUpdate,
   user_id: int = Depends(get_current_user_id)
):
   with get_db() as db:
       cursor = db.cursor()
       
       channel_data = cursor.execute("""
           SELECT c.* 
           FROM channels c
           JOIN playlists p ON c.playlist_id = p.id
           WHERE c.id = ? AND p.user_id = ?
       """, (channel_id, user_id)).fetchone()
       
       if not channel_data:
           raise HTTPException(status_code=404, detail="Channel not found")
       
       update_fields = []
       values = []
       
       if channel.name is not None:
           update_fields.append("name = ?")
           values.append(channel.name)
       if channel.url is not None:
           update_fields.append("url = ?")
           values.append(channel.url)
       if channel.group_title is not None:
           update_fields.append("group_title = ?")
           values.append(channel.group_title)
       if channel.logo_url is not None:
           update_fields.append("logo_url = ?")
           values.append(channel.logo_url)
       if channel.tvg_id is not None:
           update_fields.append("tvg_id = ?")
           values.append(channel.tvg_id)
       if channel.extra_tags is not None:
           update_fields.append("extra_tags = ?")
           values.append(json.dumps(channel.extra_tags))
       
       if update_fields:
           values.append(channel_id)
           cursor.execute(
               f"""UPDATE channels 
                   SET {', '.join(update_fields)}
                   WHERE id = ?""",
               tuple(values)
           )
           
           updated_channel = cursor.execute(
               "SELECT * FROM channels WHERE id = ?",
               (channel_id,)
           ).fetchone()
           
           return dict(updated_channel)
       
       return dict(channel_data)

@app.delete("/channels/{channel_id}")
async def delete_channel(
   channel_id: int,
   user_id: int = Depends(get_current_user_id)
):
   with get_db() as db:
       cursor = db.cursor()
       
       channel = cursor.execute("""
           SELECT c.* 
           FROM channels c
           JOIN playlists p ON c.playlist_id = p.id
           WHERE c.id = ? AND p.user_id = ?
       """, (channel_id, user_id)).fetchone()
       
       if not channel:
           raise HTTPException(status_code=404, detail="Channel not found")
       
       cursor.execute("DELETE FROM channels WHERE id = ?", (channel_id,))
       return {"message": "Channel deleted"}

@app.put("/playlists/{playlist_id}/channels/reorder")
async def reorder_channels(
   playlist_id: int,
   channel_orders: List[ChannelOrder],
   user_id: int = Depends(get_current_user_id)
):
   with get_db() as db:
       cursor = db.cursor()
       
       playlist = cursor.execute(
           "SELECT * FROM playlists WHERE id = ? AND user_id = ?",
           (playlist_id, user_id)
       ).fetchone()
       
       if not playlist:
           raise HTTPException(status_code=404, detail="Playlist not found")
       
       try:
           cursor.execute("BEGIN TRANSACTION")
           
           for order in channel_orders:
               if playlist['is_custom']:
                   cursor.execute("""
                       UPDATE custom_playlist_channels 
                       SET position = ? 
                       WHERE playlist_id = ? AND channel_id = ?
                   """, (order.position, playlist_id, order.id))
               else:
                   cursor.execute("""
                       UPDATE channels 
                       SET position = ? 
                       WHERE id = ? AND playlist_id = ?
                   """, (order.position, order.id, playlist_id))
           
           cursor.execute("COMMIT")
           return {"message": "Channels reordered successfully"}
           
       except Exception as e:
           cursor.execute("ROLLBACK")
           raise HTTPException(
               status_code=400,
               detail=f"Error reordering channels: {str(e)}"
           )
           
# Public playlist endpoints
@app.post("/playlists/{playlist_id}/generate-token")
async def generate_public_token(
   playlist_id: int,
   user_id: int = Depends(get_current_user_id)
):
   with get_db() as db:
       cursor = db.cursor()
       
       playlist = cursor.execute(
           "SELECT * FROM playlists WHERE id = ? AND user_id = ?",
           (playlist_id, user_id)
       ).fetchone()
       
       if not playlist:
           raise HTTPException(status_code=404, detail="Playlist not found")
       
       token = str(uuid.uuid4())
       cursor.execute(
           "UPDATE playlists SET public_token = ? WHERE id = ?",
           (token, playlist_id)
       )
       
       base_url = "/api/playlists"
       return {
           "token": token,
           "public_url": f"{base_url}/{token}/m3u",
           "epg_url": playlist['epg_url']
       }

@app.get("/public/playlist/{token}/m3u", response_class=PlainTextResponse)
@sleep_and_retry
@limits(calls=30, period=60)
async def get_public_playlist(token: str):
   with get_db() as db:
       playlist = db.execute(
           "SELECT * FROM playlists WHERE public_token = ?",
           (token,)
       ).fetchone()
       
       if not playlist:
           raise HTTPException(status_code=404, detail="Playlist not found")
       
       if playlist['is_custom']:
           channels_query = """
               SELECT c.* 
               FROM channels c
               JOIN custom_playlist_channels cpc ON c.id = cpc.channel_id
               WHERE cpc.playlist_id = ?
               ORDER BY cpc.position, c.name
           """
       else:
           channels_query = """
               SELECT * FROM channels 
               WHERE playlist_id = ?
               ORDER BY position, created_at
           """
       
       rows = db.execute(channels_query, (playlist['id'],)).fetchall()
       
       channels = []
       for row in rows:
           extra_tags = json.loads(row['extra_tags']) if row['extra_tags'] else {}
           channels.append(M3UChannel(
               name=row['name'],
               url=row['url'],
               group=row['group_title'],
               logo=row['logo_url'],
               tvg_id=row['tvg_id'],
               extra_tags=extra_tags
           ))
       
       content = generate_m3u(channels, playlist.get('epg_url'))
       
       return PlainTextResponse(
           content,
           media_type="application/x-mpegurl",
           headers={
               "Content-Disposition": f'attachment; filename="{playlist["name"]}.m3u"'
           }
       )

# Custom playlist management
@app.post("/playlists/{playlist_id}/add-channel/{channel_id}")
async def add_channel_to_custom_playlist(
   playlist_id: int,
   channel_id: int,
   user_id: int = Depends(get_current_user_id)
):
   with get_db() as db:
       cursor = db.cursor()
       
       playlist = cursor.execute(
           """SELECT * FROM playlists 
              WHERE id = ? AND user_id = ? AND is_custom = 1""",
           (playlist_id, user_id)
       ).fetchone()
       
       if not playlist:
           raise HTTPException(status_code=404, detail="Custom playlist not found")
       
       channel = cursor.execute("""
           SELECT c.* 
           FROM channels c
           JOIN playlists p ON c.playlist_id = p.id
           WHERE c.id = ? AND p.user_id = ?
       """, (channel_id, user_id)).fetchone()
       
       if not channel:
           raise HTTPException(status_code=404, detail="Channel not found")
       
       try:
           max_pos = cursor.execute(
               """SELECT MAX(position) as max_pos 
                  FROM custom_playlist_channels 
                  WHERE playlist_id = ?""",
               (playlist_id,)
           ).fetchone()
           
           next_pos = (max_pos['max_pos'] or 0) + 1
           
           cursor.execute(
               """INSERT INTO custom_playlist_channels 
                  (playlist_id, channel_id, position)
                  VALUES (?, ?, ?)""",
               (playlist_id, channel_id, next_pos)
           )
           
           return {"message": "Channel added to playlist"}
           
       except sqlite3.IntegrityError:
           raise HTTPException(status_code=400, detail="Channel already in playlist")

@app.get("/playlists/{playlist_id}/channels-available")
async def get_available_channels(
   playlist_id: int,
   user_id: int = Depends(get_current_user_id)
):
   with get_db() as db:
       playlist = db.execute(
           """SELECT * FROM playlists 
              WHERE id = ? AND user_id = ? AND is_custom = 1""",
           (playlist_id, user_id)
       ).fetchone()
       
       if not playlist:
           raise HTTPException(status_code=404, detail="Custom playlist not found")
       
       channels = db.execute("""
           SELECT c.*, p.name as source_playlist_name 
           FROM channels c
           JOIN playlists p ON c.playlist_id = p.id
           WHERE p.user_id = ? AND c.id NOT IN (
               SELECT channel_id 
               FROM custom_playlist_channels 
               WHERE playlist_id = ?
           )
           ORDER BY p.name, c.position, c.name
       """, (user_id, playlist_id)).fetchall()
       
       return channels

if __name__ == "__main__":
   import uvicorn
   uvicorn.run(app, host="0.0.0.0", port=8000)
   
