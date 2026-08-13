import httpx
from datetime import timedelta, datetime
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from fastapi import WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from bson import ObjectId

import crud, schemas, auth
from database import get_db, database
from config import settings

app = FastAPI()

# Broaden CORS for local development: localhost, 127.0.0.1, and common LAN ranges
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
)

GOOGLE_AUTHORIZATION_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v1/userinfo"
REDIRECT_URI = "http://localhost:8000/auth/google/callback"
SCOPES = "openid email profile"

@app.get("/auth/google/login")
async def login_google():
    params = {"response_type": "code", "client_id": settings.GOOGLE_CLIENT_ID, "redirect_uri": REDIRECT_URI, "scope": SCOPES, "access_type": "offline", "prompt": "select_account"}
    auth_url = f"{GOOGLE_AUTHORIZATION_URL}?{'&'.join([f'{k}={v}' for k, v in params.items()])}"
    return RedirectResponse(url=auth_url)

@app.get("/auth/google/callback")
async def auth_google_callback(code: str, request: Request, db = Depends(get_db)):
    token_data = {"code": code, "client_id": settings.GOOGLE_CLIENT_ID, "client_secret": settings.GOOGLE_CLIENT_SECRET, "redirect_uri": REDIRECT_URI, "grant_type": "authorization_code"}
    async with httpx.AsyncClient() as client:
        token_response = await client.post(GOOGLE_TOKEN_URL, data=token_data)
    token_json = token_response.json()
    headers = {"Authorization": f"Bearer {token_json['access_token']}"}
    async with httpx.AsyncClient() as client:
        userinfo_response = await client.get(GOOGLE_USERINFO_URL, headers=headers)
    user_info = userinfo_response.json()
    user = await crud.get_user_by_google_id(database, google_id=user_info.get('id') or user_info.get('sub'))
    if not user:
        user = await crud.get_user_by_email(database, email=user_info['email'])
        if not user:
            user = await crud.create_user_from_google(database, user_info)
        else:
            await database["users"].update_one({"email": user_info['email']}, {"$set": {"google_id": user_info.get('id') or user_info.get('sub')}})
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(data={"sub": user["email"]}, expires_delta=access_token_expires)
    # Prefer configured frontend base URL; otherwise infer from Origin header
    frontend_base = getattr(settings, 'FRONTEND_BASE_URL', None) or request.headers.get("origin") or "http://localhost:5173"
    frontend_redirect_url = f"{frontend_base.rstrip('/')}/auth/callback?token={access_token}"
    return RedirectResponse(url=frontend_redirect_url)

# New endpoint for creating a user (Sign Up)
@app.post("/auth/signup", response_model=schemas.Token)
async def signup_user(user: schemas.UserCreate, db = Depends(get_db)):
    db_user = await crud.get_user_by_email(database, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = await crud.create_user(database, user=user)
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(data={"sub": new_user["email"]}, expires_delta=access_token_expires)
    return {"access_token": access_token, "token_type": "bearer"}

# New endpoint for logging in a user (Sign In)
@app.post("/auth/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db = Depends(get_db)):
    user = await auth.authenticate_user(database, email=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(data={"sub": user["email"]}, expires_delta=access_token_expires)
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.UserInDB)
async def read_users_me(current_user: dict = Depends(auth.get_current_user)):
    return current_user

@app.post("/users/me/profile", response_model=schemas.UserInDB)
async def update_profile(profile_data: schemas.ProfileUpdate, current_user: dict = Depends(auth.get_current_user), db = Depends(get_db)):
    updated_user = await crud.update_user_profile(database, current_user["email"], profile_data)
    if updated_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user

@app.get("/api/search")
async def search_matches(query: str, current_user: dict = Depends(auth.get_current_user)):
    from ml_model import generate_embedding
    from sentence_transformers import util
    import torch

    if not query: return []
    query_embedding = generate_embedding(query, convert_to_tensor=True)
    users_cursor = database["users"].find({"profile_complete": True, "embedding": {"$exists": True}, "email": {"$ne": current_user["email"]}})
    users_with_embeddings = await users_cursor.to_list(length=1000)
    if not users_with_embeddings: return []
    corpus_embeddings = [user['embedding'] for user in users_with_embeddings]
    corpus_tensor = torch.tensor(corpus_embeddings)
    hits = util.semantic_search(query_embedding, corpus_tensor, top_k=15)[0]
    results = []
    for hit in hits:
        matched_user = users_with_embeddings[hit['corpus_id']]
        matched_user['match_score'] = hit['score']
        results.append(matched_user)
    return results

# --------------------------
# Additional API Endpoints
# --------------------------

@app.get("/match/recommendations")
async def get_recommendations(current_user: dict = Depends(auth.get_current_user)):
    """Return similar user profiles based on the current user's embedding."""
    from sentence_transformers import util
    import torch

    # Ensure the user has an embedding
    user_embedding = current_user.get("embedding")
    if not user_embedding:
        # If the user doesn't have an embedding yet, they likely didn't complete profile setup
        return []

    # Load candidate users
    users_cursor = database["users"].find({
        "profile_complete": True,
        "embedding": {"$exists": True},
        "email": {"$ne": current_user["email"]}
    })
    users_with_embeddings = await users_cursor.to_list(length=1000)
    if not users_with_embeddings:
        return []

    # Compute similarities
    query_tensor = torch.tensor([user_embedding])
    corpus_embeddings = [u["embedding"] for u in users_with_embeddings]
    corpus_tensor = torch.tensor(corpus_embeddings)
    hits = util.semantic_search(query_tensor, corpus_tensor, top_k=15)[0]

    # Build response objects with a minimal safe projection
    results = []
    for hit in hits:
        u = users_with_embeddings[hit["corpus_id"]]
        results.append({
            "id": str(u.get("_id") or ObjectId()),
            "email": u.get("email"),
            "name": f"{(u.get('first_name') or '').strip()} {(u.get('last_name') or '').strip()}".strip() or None,
            "location": u.get("location"),
            "skills": u.get("skills", []),
            "avatar_url": u.get("avatar_url"),
            "match_score": hit.get("score")
        })
    return results


@app.post("/connections/request")
async def request_connection(payload: dict, current_user: dict = Depends(auth.get_current_user)):
    """Create a connection request from the current user to the target user."""
    target_user_id = payload.get("target_user_id")
    if not target_user_id:
        raise HTTPException(status_code=400, detail="target_user_id is required")
    try:
        target_oid = ObjectId(target_user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid target_user_id")

    # Ensure target exists
    target_user = await database["users"].find_one({"_id": target_oid})
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")

    # Insert a connection request
    insert_res = await database["connections"].insert_one({
        "from": current_user["email"],
        # store email for readability; keep old id support elsewhere
        "to": target_user.get("email"),
        "status": "requested"
    })
    # Notify target user
    request_id = str(insert_res.inserted_id)
    notif = {"user": target_user.get("email"), "message": f"{current_user['email']} sent a connection request", "type": "connection_request", "from": current_user["email"], "request_id": request_id}
    await database["notifications"].insert_one(notif)
    try:
        await push_notification(target_user.get("email"), notif)
    except Exception:
        pass
    return {"status": "ok", "request_id": request_id}


@app.get("/connections/requests")
async def list_connection_requests(current_user: dict = Depends(auth.get_current_user)):
    cursor = database["connections"].find({"to": {"$in": [current_user["email"], str(current_user.get("_id", ""))]}, "status": "requested"})
    items = await cursor.to_list(length=100)
    return [{"id": str(i.get("_id")), "from": i.get("from"), "to": i.get("to"), "status": i.get("status") } for i in items]


@app.post("/connections/respond")
async def respond_connection(payload: dict, current_user: dict = Depends(auth.get_current_user)):
    request_id = payload.get("request_id")
    action = payload.get("action")
    if action not in ("accept", "reject"):
        raise HTTPException(status_code=400, detail="Invalid action")
    try:
        oid = ObjectId(request_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid request_id")
    doc = await database["connections"].find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Request not found")
    if doc.get("to") not in [current_user["email"], str(current_user.get("_id", ""))]:
        raise HTTPException(status_code=403, detail="Not allowed")
    new_status = "accepted" if action == "accept" else "rejected"
    await database["connections"].update_one({"_id": oid}, {"$set": {"status": new_status}})
    # Notify requester
    message = f"Your connection request was {new_status}"
    notif = {"user": doc.get("from"), "message": message, "type": "connection_response", "status": new_status, "request_id": request_id}
    await database["notifications"].insert_one(notif)
    try:
        await push_notification(doc.get("from"), notif)
    except Exception:
        pass
    return {"status": "ok"}


@app.get("/auth/is-admin")
async def is_admin(current_user: dict = Depends(auth.get_current_user)):
    # Check if user is admin of any community
    admin_communities = await database["communities"].count_documents({"admin_email": current_user["email"]})
    return {"isAdmin": admin_communities > 0}


@app.get("/requests")
async def list_requests(community_id: str | None = None, current_user: dict = Depends(auth.get_current_user)):
    """Fallback endpoint for community member requests. Returns empty list if feature not implemented.
    If your app stores join requests in a collection, filter them here by community_id.
    """
    try:
        # Attempt to read from a possible collection name; if not present, return []
        coll = database.get_collection("community_requests")
        query = {"status": "pending"}
        if community_id:
            query["community_id"] = community_id
        items = await coll.find(query).to_list(length=200)
        return [{
            "id": str(i.get("_id") or ObjectId()),
            "community_id": i.get("community_id"),
            "email": i.get("email") or i.get("user_email"),
            "name": i.get("name") or i.get("user_name"),
            "status": i.get("status", "pending")
        } for i in items]
    except Exception:
        return []


@app.get("/challenges")
async def list_challenges(current_user: dict = Depends(auth.get_current_user)):
    """Return available challenges. Falls back to an empty list if none."""
    cursor = database["challenges"].find({})
    items = await cursor.to_list(length=100)
    # Normalize
    return [{
        "id": str(i.get("_id") or ObjectId()),
        "title": i.get("title", "Untitled Challenge"),
        "description": i.get("description", ""),
        "difficulty": i.get("difficulty", "Medium")
    } for i in items]


@app.get("/events")
async def list_events(community_id: str | None = None, current_user: dict = Depends(auth.get_current_user)):
    query = {}
    if community_id:
        query["community_id"] = community_id
    cursor = database["events"].find(query)
    items = await cursor.to_list(length=500)
    results = []
    for i in items:
        results.append({
            "id": str(i.get("_id") or ObjectId()),
            "community_id": i.get("community_id"),
            "title": i.get("title", "Untitled Event"),
            "description": i.get("description", ""),
            "date": i.get("date"),
            "time": i.get("time"),
            "start_time": i.get("start_time"),
            "location": i.get("location"),
            "attendees": len(i.get("attendees", []))
        })
    return results


@app.post("/events")
async def create_event(payload: dict, current_user: dict = Depends(auth.get_current_user)):
    """Create an event. Expects either start_time ISO or (date + time)."""
    community_id = payload.get("community_id")
    title = payload.get("title")
    if not community_id or not title:
        raise HTTPException(status_code=422, detail="community_id and title are required")
    # Normalize times
    start_time = payload.get("start_time") or payload.get("datetime") or payload.get("startAt") or payload.get("start_at")
    date_str = payload.get("date") or payload.get("event_date")
    time_str = payload.get("time") or payload.get("event_time")
    dt_val = None
    if start_time:
        try:
            dt_val = datetime.fromisoformat(start_time.replace("Z", ""))
        except Exception:
            raise HTTPException(status_code=422, detail="Invalid start_time format; expected ISO 8601")
    elif date_str:
        # Build from date + optional time (HH:mm)
        hhmm = (time_str or "00:00").strip()
        try:
            dt_val = datetime.fromisoformat(f"{date_str}T{hhmm}:00")
        except Exception:
            raise HTTPException(status_code=422, detail="Invalid date/time; expected date=YYYY-MM-DD and time=HH:mm")

    doc = {
        "community_id": community_id,
        "title": title,
        "description": payload.get("description") or payload.get("details") or "",
        "location": payload.get("location") or payload.get("venue"),
        "date": date_str,
        "time": time_str,
        "start_time": dt_val.isoformat() if dt_val else None,
        "attendees": []
    }
    res = await database["events"].insert_one(doc)
    return {
        "id": str(res.inserted_id),
        **{k: v for k, v in doc.items() if k != "_id"}
    }

# Scoped routes for compatibility with frontend calls
@app.get("/communities/{community_id}/announcements")
async def list_announcements_scoped(community_id: str, current_user: dict = Depends(auth.get_current_user)):
    return await list_announcements(community_id=community_id, current_user=current_user)


@app.post("/communities/{community_id}/announcements")
async def create_announcement_scoped(community_id: str, payload: dict, current_user: dict = Depends(auth.get_current_user)):
    payload = {
        **payload,
        "community_id": payload.get("community_id") or community_id,
    }
    return await create_announcement(payload=payload, current_user=current_user)


@app.post("/communities/{community_id}/events/{event_id}/join")
async def join_event_scoped(community_id: str, event_id: str, current_user: dict = Depends(auth.get_current_user)):
    """Join an event by community scope."""
    try:
        oid = ObjectId(event_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid event_id")
    evt = await database["events"].find_one({"_id": oid, "community_id": community_id})
    if not evt:
        raise HTTPException(status_code=404, detail="Event not found")
    await database["events"].update_one({"_id": oid}, {"$addToSet": {"attendees": current_user["email"]}})
    return {"status": "ok"}


@app.post("/events/{event_id}/join")
async def join_event(event_id: str, current_user: dict = Depends(auth.get_current_user)):
    """Join an event by id only."""
    try:
        oid = ObjectId(event_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid event_id")
    evt = await database["events"].find_one({"_id": oid})
    if not evt:
        raise HTTPException(status_code=404, detail="Event not found")
    await database["events"].update_one({"_id": oid}, {"$addToSet": {"attendees": current_user["email"]}})
    return {"status": "ok"}


@app.post("/admin/challenges")
async def admin_create_challenge(payload: dict, current_user: dict = Depends(auth.get_current_user)):
    # Simple admin check by email list from settings, extend as needed
    if current_user.get("email") not in getattr(settings, 'ADMINS', [current_user.get("email")]):
        raise HTTPException(status_code=403, detail="Not authorized")
    doc = {
        "title": payload.get("title"),
        "description": payload.get("description", ""),
        "difficulty": payload.get("difficulty", "Medium")
    }
    res = await database["challenges"].insert_one(doc)
    return {"id": str(res.inserted_id)}


@app.post("/admin/events")
async def admin_create_event(payload: dict, current_user: dict = Depends(auth.get_current_user)):
    if current_user.get("email") not in getattr(settings, 'ADMINS', [current_user.get("email")]):
        raise HTTPException(status_code=403, detail="Not authorized")
    doc = {
        "title": payload.get("title"),
        "description": payload.get("description", ""),
        "date": payload.get("date"),
        "location": payload.get("location")
    }
    res = await database["events"].insert_one(doc)
    return {"id": str(res.inserted_id)}


@app.get("/notifications")
async def list_notifications(current_user: dict = Depends(auth.get_current_user)):
    """Return notifications for the current user."""
    cursor = database["notifications"].find({"user": current_user["email"]})
    items = await cursor.to_list(length=100)
    return [{
        "id": str(i.get("_id") or ObjectId()),
        "message": i.get("message", ""),
        "type": i.get("type"),
        "from": i.get("from"),
        "request_id": i.get("request_id"),
        "status": i.get("status")
    } for i in items]


@app.post("/admin/notifications")
async def admin_create_notification(payload: dict, current_user: dict = Depends(auth.get_current_user)):
    if current_user.get("email") not in getattr(settings, 'ADMINS', [current_user.get("email")]):
        raise HTTPException(status_code=403, detail="Not authorized")
    target = payload.get("user")
    message = payload.get("message", "")
    broadcast = bool(payload.get("broadcast"))
    if broadcast:
        cursor = database["users"].find({})
        users = await cursor.to_list(length=10000)
        for u in users:
            doc = {"user": u.get("email"), "message": message, "type": "broadcast"}
            await database["notifications"].insert_one(doc)
            try:
                await push_notification(u.get("email"), doc)
            except Exception:
                pass
        return {"status": "ok", "broadcasted": len(users)}
    else:
        target = target or current_user.get("email")
        doc = {"user": target, "message": message}
        await database["notifications"].insert_one(doc)
        try:
            await push_notification(target, doc)
        except Exception:
            pass
        return {"status": "ok"}


@app.get("/connections")
async def list_connections(current_user: dict = Depends(auth.get_current_user)):
    cursor = database["connections"].find({
        "$or": [
            {"from": current_user["email"]},
            {"to": current_user["email"]},
            # legacy records may store 'to' as user id string
            {"to": str(current_user.get("_id", ""))},
        ],
        "status": "accepted"
    })
    items = await cursor.to_list(length=1000)
    # Build map of emails to names
    emails: set[str] = set()
    for i in items:
        f = i.get("from"); t = i.get("to")
        if isinstance(f, str) and "@" in f: emails.add(f)
        if isinstance(t, str) and "@" in t: emails.add(t)
    users = await database["users"].find({"email": {"$in": list(emails)}}).to_list(length=1000)
    email_to_name = {u.get("email"): (f"{(u.get('first_name') or '').strip()} {(u.get('last_name') or '').strip()}".strip() or u.get('email')) for u in users}
    results = []
    for i in items:
        results.append({
            "id": str(i.get("_id")),
            "from": i.get("from"),
            "to": i.get("to"),
            "fromName": email_to_name.get(i.get("from"), i.get("from")),
            "toName": email_to_name.get(i.get("to"), i.get("to")),
        })
    return results


@app.post("/seed/challenges")
async def seed_challenges():
    """Insert a small set of sample challenges if collection is empty."""
    count = await database["challenges"].count_documents({})
    if count > 0:
        return {"inserted": 0}
    docs = [
        {"title": "30-Day Coding Sprint", "description": "Code daily for 30 days", "difficulty": "Medium"},
        {"title": "UI Design Challenge", "description": "Redesign a dashboard page", "difficulty": "Easy"},
        {"title": "AI Paper Club", "description": "Summarize 4 recent AI papers", "difficulty": "Hard"},
    ]
    res = await database["challenges"].insert_many(docs)
    return {"inserted": len(res.inserted_ids)}


@app.post("/seed/notifications")
async def seed_notifications(current_user: dict = Depends(auth.get_current_user)):
    """Insert a few notifications for the current user for demo."""
    docs = [
        {"user": current_user["email"], "message": "Buddy Match approved"},
        {"user": current_user["email"], "message": "Challenge reminder"},
        {"user": current_user["email"], "message": "New event invitation"},
    ]
    await database["notifications"].insert_many(docs)
    return {"inserted": len(docs)}


@app.get("/network/summary")
async def network_summary(current_user: dict = Depends(auth.get_current_user)):
    """Return counts for connections, communities, and events attended."""
    connections_count = await database["connections"].count_documents({"$or": [{"from": current_user["email"]}, {"to": current_user["email"]}], "status": {"$in": ["accepted", "requested"]}})
    communities_count = await database["communities"].count_documents({"members": current_user["email"]})
    events_attended = await database["events"].count_documents({"attendees": current_user["email"]})
    return {"connections": connections_count, "communities": communities_count, "eventsAttended": events_attended}


@app.get("/users/me/settings")
async def get_settings(current_user: dict = Depends(auth.get_current_user)):
    user = await database["users"].find_one({"email": current_user["email"]})
    settings_doc = (user or {}).get("settings") or {}
    return {
        "emailNotifications": settings_doc.get("emailNotifications", True),
        "pushNotifications": settings_doc.get("pushNotifications", True),
        "profileVisibility": settings_doc.get("profileVisibility", "public")
    }


@app.get("/communities")
async def list_communities(current_user: dict = Depends(auth.get_current_user)):
    """Return communities the user is a member of."""
    cursor = database["communities"].find({"members": current_user["email"]})
    items = await cursor.to_list(length=100)
    return [{
        "id": str(i.get("_id") or ObjectId()),
        "name": i.get("name", "Untitled Community"),
        "domain": i.get("domain", ""),
        "description": i.get("description", ""),
        "profile_pic": i.get("profile_pic"),
        "admin_name": i.get("admin_name", ""),
        "member_count": len(i.get("members", []))
    } for i in items]


@app.get("/communities/all")
async def list_all_communities(current_user: dict = Depends(auth.get_current_user)):
    """Return all communities that the user can join."""
    cursor = database["communities"].find({})
    items = await cursor.to_list(length=100)
    return [{
        "id": str(i.get("_id") or ObjectId()),
        "name": i.get("name", "Untitled Community"),
        "domain": i.get("domain", ""),
        "description": i.get("description", ""),
        "profile_pic": i.get("profile_pic"),
        "admin_name": i.get("admin_name", ""),
        "member_count": len(i.get("members", [])),
        "is_member": current_user["email"] in i.get("members", [])
    } for i in items]


@app.post("/communities/{community_id}/join")
async def join_community(community_id: str, current_user: dict = Depends(auth.get_current_user)):
    """Join a community."""
    try:
        oid = ObjectId(community_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid community_id")
    
    community = await database["communities"].find_one({"_id": oid})
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    
    if current_user["email"] in community.get("members", []):
        raise HTTPException(status_code=400, detail="Already a member of this community")
    
    await database["communities"].update_one(
        {"_id": oid},
        {"$addToSet": {"members": current_user["email"]}}
    )
    return {"status": "ok"}


@app.post("/communities")
async def create_community(payload: dict, current_user: dict = Depends(auth.get_current_user)):
    """Create a new community."""
    doc = {
        "name": payload.get("name"),
        "domain": payload.get("domain", ""),
        "description": payload.get("description", ""),
        "profile_pic": payload.get("profile_pic"),
        "admin_name": payload.get("admin_name", current_user.get("email")),
        "admin_email": current_user["email"],
        "members": [current_user["email"]],
        "created_at": datetime.now()
    }
    res = await database["communities"].insert_one(doc)
    return {"id": str(res.inserted_id)}


@app.get("/communities/{community_id}/messages")
async def get_community_messages(community_id: str, current_user: dict = Depends(auth.get_current_user)):
    """Get messages for a community."""
    try:
        oid = ObjectId(community_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid community_id")
    
    # Check if user is member
    community = await database["communities"].find_one({"_id": oid})
    if not community or current_user["email"] not in community.get("members", []):
        raise HTTPException(status_code=403, detail="Not a member of this community")
    
    cursor = database["messages"].find({"community_id": community_id}).sort("timestamp", -1).limit(50)
    items = await cursor.to_list(length=50)
    return [{
        "id": str(i.get("_id") or ObjectId()),
        "sender": i.get("sender"),
        "message": i.get("message", ""),
        "timestamp": i.get("timestamp"),
        "sender_name": i.get("sender_name", "")
    } for i in reversed(items)]


@app.post("/communities/{community_id}/messages")
async def send_community_message(community_id: str, payload: dict, current_user: dict = Depends(auth.get_current_user)):
    """Send a message to a community."""
    try:
        oid = ObjectId(community_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid community_id")
    
    # Check if user is member
    community = await database["communities"].find_one({"_id": oid})
    if not community or current_user["email"] not in community.get("members", []):
        raise HTTPException(status_code=403, detail="Not a member of this community")
    
    message_doc = {
        "community_id": community_id,
        "sender": current_user["email"],
        "sender_name": f"{current_user.get('first_name', '')} {current_user.get('last_name', '')}".strip() or current_user["email"],
        "message": payload.get("message", ""),
        "timestamp": datetime.now()
    }
    res = await database["messages"].insert_one(message_doc)
    return {"id": str(res.inserted_id)}


@app.delete("/notifications/clear")
async def clear_notifications(current_user: dict = Depends(auth.get_current_user)):
    """Clear all notifications for the current user."""
    await database["notifications"].delete_many({"user": current_user["email"]})
    return {"status": "ok"}


@app.get("/communities/{community_id}/dashboard")
async def get_community_dashboard(community_id: str, current_user: dict = Depends(auth.get_current_user)):
    """Get community dashboard data."""
    try:
        oid = ObjectId(community_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid community_id")
    
    # Check if user is member
    community = await database["communities"].find_one({"_id": oid})
    if not community or current_user["email"] not in community.get("members", []):
        raise HTTPException(status_code=403, detail="Not a member of this community")
    
    # Calculate dashboard metrics
    total_points = await database["user_points"].aggregate([
        {"$match": {"community_id": community_id}},
        {"$group": {"_id": None, "total": {"$sum": "$points"}}}
    ]).to_list(1)
    
    recognitions = await database["recognitions"].count_documents({"community_id": community_id})
    
    return {
        "totalPoints": total_points[0]["total"] if total_points else 0,
        "recognitions": recognitions,
        "averageActivity": 85,  # Mock for now
        "weeklyActivity": [
            {"day": "Mon", "points": 120, "activities": 8},
            {"day": "Tue", "points": 95, "activities": 6},
            {"day": "Wed", "points": 150, "activities": 10},
            {"day": "Thu", "points": 180, "activities": 12},
            {"day": "Fri", "points": 200, "activities": 15},
            {"day": "Sat", "points": 85, "activities": 5},
            {"day": "Sun", "points": 60, "activities": 4}
        ]
    }


@app.get("/communities/{community_id}/leaderboard")
async def get_community_leaderboard(community_id: str, current_user: dict = Depends(auth.get_current_user)):
    """Get community leaderboard."""
    try:
        oid = ObjectId(community_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid community_id")
    
    # Check if user is member
    community = await database["communities"].find_one({"_id": oid})
    if not community or current_user["email"] not in community.get("members", []):
        raise HTTPException(status_code=403, detail="Not a member of this community")
    
    # Get top members by points
    leaderboard = await database["user_points"].aggregate([
        {"$match": {"community_id": community_id}},
        {"$group": {"_id": "$user_email", "total_points": {"$sum": "$points"}}},
        {"$sort": {"total_points": -1}},
        {"$limit": 10}
    ]).to_list(10)
    
    # Get user details for leaderboard
    result = []
    for item in leaderboard:
        user = await database["users"].find_one({"email": item["_id"]})
        if user:
            result.append({
                "name": f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() or user["email"],
                "points": item["total_points"],
                "role": user.get("title", "Member"),
                "avatar": f"{user.get('first_name', 'U')[0]}{user.get('last_name', 'U')[0]}".upper()
            })
    
    return result


@app.get("/communities/{community_id}/members")
async def get_community_members(community_id: str, current_user: dict = Depends(auth.get_current_user)):
    """Get community members."""
    try:
        oid = ObjectId(community_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid community_id")
    
    # Check if user is member
    community = await database["communities"].find_one({"_id": oid})
    if not community or current_user["email"] not in community.get("members", []):
        raise HTTPException(status_code=403, detail="Not a member of this community")
    
    # Get member details
    members = []
    for email in community.get("members", []):
        user = await database["users"].find_one({"email": email})
        if user:
            # Get user points for this community
            points_result = await database["user_points"].aggregate([
                {"$match": {"community_id": community_id, "user_email": email}},
                {"$group": {"_id": None, "total": {"$sum": "$points"}}}
            ]).to_list(1)
            
            members.append({
                "id": str(user["_id"]),
                "name": f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() or user["email"],
                "email": email,
                "role": user.get("title", "Member"),
                "skills": user.get("skills", []),
                "achievements": user.get("achievements", []),
                "avatar": f"{user.get('first_name', 'U')[0]}{user.get('last_name', 'U')[0]}".upper(),
                "isAdmin": email == community.get("admin_email"),
                "joinDate": community.get("created_at", datetime.now()).isoformat(),
                "points": points_result[0]["total"] if points_result else 0
            })
    
    return members


@app.post("/users/me/settings")
async def update_settings(payload: dict, current_user: dict = Depends(auth.get_current_user)):
    settings_doc = {
        "emailNotifications": bool(payload.get("emailNotifications", True)),
        "pushNotifications": bool(payload.get("pushNotifications", True)),
        "profileVisibility": payload.get("profileVisibility", "public"),
    }
    await database["users"].update_one(
        {"email": current_user["email"]},
        {"$set": {"settings": settings_doc}}
    )
    return {"status": "ok"}


# --------------------------
# Real-time notifications via WebSocket
# --------------------------

active_connections: dict[str, WebSocket] = {}

@app.websocket("/ws/notifications")
async def websocket_notifications(websocket: WebSocket):
    await websocket.accept()
    try:
        # Expect the client to immediately send a token message: {"token": "..."}
        first = await websocket.receive_json()
        token = first.get("token")
        if not token:
            await websocket.close(code=4001)
            return
        # Validate token
        try:
            payload = auth.jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            email = payload.get("sub")
            if not email:
                await websocket.close(code=4002)
                return
        except Exception:
            await websocket.close(code=4003)
            return

        active_connections[email] = websocket

        # Keep connection alive
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        # Remove closed connection
        for k, v in list(active_connections.items()):
            if v is websocket:
                active_connections.pop(k, None)
    except Exception:
        for k, v in list(active_connections.items()):
            if v is websocket:
                active_connections.pop(k, None)


async def push_notification(email: str, message: str):
    ws = active_connections.get(email)
    if ws:
        await ws.send_json({"message": message})