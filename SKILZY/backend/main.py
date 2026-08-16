import httpx
from datetime import timedelta, datetime
from typing import Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status, Request, BackgroundTasks
from fastapi.responses import RedirectResponse
from fastapi import WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from bson import ObjectId
import asyncio

import crud, schemas, auth
from database import get_db, database
from config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Preload embedding model in a worker thread so first profile save is fast
    try:
        from ml_model import _get_model
        asyncio.create_task(asyncio.to_thread(_get_model))
    except Exception as exc:
        print(f"ML model preload skipped: {exc}")
    yield


app = FastAPI(lifespan=lifespan)

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
async def update_profile(
    profile_data: schemas.ProfileUpdate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(auth.get_current_user),
    db = Depends(get_db),
):
    updated_user = await crud.update_user_profile(
        database,
        current_user["email"],
        profile_data,
        defer_embedding=True,
    )
    if updated_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    background_tasks.add_task(
        crud.generate_user_embedding,
        database,
        current_user["email"],
        profile_data,
    )
    return updated_user

async def get_user_connections_status(user_email: str, current_user_id: str):
    """Fetch all connection records involving user_email or user_id."""
    records = await database["connections"].find({
        "$or": [
            {"from": user_email},
            {"to": user_email},
            {"to": current_user_id}
        ]
    }).to_list(length=1000)
    
    status_map = {}
    for r in records:
        req_id = str(r["_id"])
        status = r.get("status", "requested")
        f = r.get("from")
        t = r.get("to")
        
        other = t if f == user_email else f
        if status == "accepted":
            status_map[other] = {"status": "connected", "request_id": req_id}
        elif f == user_email and status == "requested":
            status_map[other] = {"status": "requested_sent", "request_id": req_id}
        elif (t == user_email or t == current_user_id) and status == "requested":
            status_map[other] = {"status": "requested_received", "request_id": req_id}
            
    return status_map


@app.get("/api/search")
async def search_matches(query: Optional[str] = None, current_user: dict = Depends(auth.get_current_user)):
    user_email = current_user["email"]
    user_id_str = str(current_user.get("_id", ""))
    
    # Fetch connection status map for current user
    conn_map = await get_user_connections_status(user_email, user_id_str)

    # Query candidates from DB (all profiles except current user)
    cursor = database["users"].find({
        "email": {"$ne": user_email}
    })
    candidate_users = await cursor.to_list(length=500)
    if not candidate_users:
        return []

    results_list = []
    query_str = (query or "").strip().lower()

    def _overlap_score(candidate: dict) -> float:
        """Fallback 0–1 score from shared skills/interests when embeddings are missing."""
        user_skills = {str(s).strip().lower() for s in (current_user.get("skills") or []) if s}
        user_interests = {str(s).strip().lower() for s in (current_user.get("interests") or []) if s}
        cand_skills = {str(s).strip().lower() for s in (candidate.get("skills") or []) if s}
        cand_interests = {str(s).strip().lower() for s in (candidate.get("interests") or []) if s}
        skill_overlap = len(user_skills & cand_skills)
        interest_overlap = len(user_interests & cand_interests)
        denom = max(len(user_skills | cand_skills), 1) + max(len(user_interests | cand_interests), 1)
        raw = (skill_overlap * 2 + interest_overlap) / denom
        # Keep fallback readable but never fake a fixed percentage
        return max(0.15, min(0.95, 0.35 + raw * 0.6))

    def _score_with_embeddings(query_embedding, candidates: list) -> list:
        from sentence_transformers import util
        import torch

        scored = []
        users_with_emb = [u for u in candidates if u.get("embedding")]
        matched_ids = set()
        if users_with_emb:
            corpus_tensor = torch.tensor([u["embedding"] for u in users_with_emb], dtype=torch.float32)
            hits = util.semantic_search(query_embedding, corpus_tensor, top_k=min(50, len(users_with_emb)))[0]
            for hit in hits:
                u = users_with_emb[hit["corpus_id"]]
                matched_ids.add(str(u["_id"]))
                # Cosine similarity from the model (typically ~0.05–0.95)
                u["match_score"] = max(0.0, min(1.0, float(hit["score"])))
                scored.append(u)
        for u in candidates:
            if str(u["_id"]) not in matched_ids:
                u["match_score"] = _overlap_score(u)
                scored.append(u)
        return scored

    if query_str:
        try:
            from ml_model import generate_embedding

            query_embedding = generate_embedding(query_str, convert_to_tensor=True)
            results_list = _score_with_embeddings(query_embedding, candidate_users)

            # Text search enrichment for candidates the vector search ranked low / missed
            matched_ids = {str(u["_id"]) for u in results_list if u.get("match_score", 0) >= 0.2}
            for u in candidate_users:
                if str(u["_id"]) in matched_ids:
                    continue
                name_str = f"{u.get('first_name', '')} {u.get('last_name', '')}".lower()
                skills_str = " ".join(u.get("skills", [])).lower()
                interests_str = " ".join(u.get("interests", [])).lower()
                loc_str = str(u.get("location", "")).lower()
                title_str = str(u.get("title", "")).lower()
                bio_str = str(u.get("bio", "")).lower()
                if any(query_str in text for text in [name_str, skills_str, interests_str, loc_str, title_str, bio_str]):
                    # Prefer higher of existing ML score vs text hit boost
                    text_score = 0.55 + (0.1 if query_str in skills_str else 0) + (0.05 if query_str in title_str else 0)
                    existing = float(u.get("match_score") or 0)
                    u["match_score"] = max(existing, min(0.92, text_score))
                    if u not in results_list:
                        results_list.append(u)
        except Exception as exc:
            print(f"Search embedding failed, using text/overlap fallback: {exc}")
            for u in candidate_users:
                name_str = f"{u.get('first_name', '')} {u.get('last_name', '')}".lower()
                skills_str = " ".join(u.get("skills", [])).lower()
                interests_str = " ".join(u.get("interests", [])).lower()
                loc_str = str(u.get("location", "")).lower()
                title_str = str(u.get("title", "")).lower()
                bio_str = str(u.get("bio", "")).lower()
                if any(query_str in text for text in [name_str, skills_str, interests_str, loc_str, title_str, bio_str]):
                    u["match_score"] = _overlap_score(u)
                    results_list.append(u)
    else:
        # Default Find Buddies: rank by similarity to the current user's profile embedding
        try:
            import torch
            from ml_model import generate_embedding, create_profile_text
            import schemas as _schemas

            current_emb = current_user.get("embedding")
            if not current_emb and (current_user.get("skills") or current_user.get("bio") or current_user.get("title")):
                # Generate embedding on the fly if background job hasn't finished yet
                try:
                    profile_proxy = _schemas.ProfileUpdate(
                        title=current_user.get("title") or "Member",
                        company=current_user.get("company"),
                        location=current_user.get("location"),
                        bio=current_user.get("bio") or "",
                        careerGoals=current_user.get("careerGoals"),
                        skills=current_user.get("skills") or [],
                        interests=current_user.get("interests") or [],
                    )
                    profile_text = create_profile_text(profile_proxy)
                    current_emb = generate_embedding(profile_text)
                    await database["users"].update_one(
                        {"email": user_email},
                        {"$set": {"embedding": current_emb}},
                    )
                except Exception as emb_exc:
                    print(f"On-demand embedding for current user failed: {emb_exc}")
                    current_emb = None

            if current_emb:
                query_embedding = torch.tensor(current_emb, dtype=torch.float32)
                results_list = _score_with_embeddings(query_embedding, candidate_users)
            else:
                for u in candidate_users:
                    u["match_score"] = _overlap_score(u)
                    results_list.append(u)
        except Exception as exc:
            print(f"Recommendation scoring failed, using overlap fallback: {exc}")
            for u in candidate_users:
                u["match_score"] = _overlap_score(u)
                results_list.append(u)

    # Sort highest match first
    results_list.sort(key=lambda u: float(u.get("match_score") or 0), reverse=True)

    formatted_results = []
    for u in results_list:
        uid = str(u["_id"])
        uemail = u.get("email", "")
        
        user_skills = set(current_user.get("skills", []))
        candidate_skills = set(u.get("skills", []))
        shared_skills = list(user_skills.intersection(candidate_skills))
        
        conn_info = conn_map.get(uemail) or conn_map.get(uid) or {"status": "none", "request_id": None}
        
        score_val = float(u.get("match_score") or 0)
        if score_val <= 1.0:
            score_pct = int(round(score_val * 100))
        else:
            score_pct = int(round(score_val))
        score_pct = max(1, min(99, score_pct))
        
        fname = u.get("first_name", "") or ""
        lname = u.get("last_name", "") or ""
        full_name = f"{fname} {lname}".strip() or uemail
        
        formatted_results.append({
            "id": uid,
            "email": uemail,
            "name": full_name,
            "first_name": fname,
            "last_name": lname,
            "title": u.get("title") or u.get("company") or "Skillzy Member",
            "company": u.get("company", ""),
            "location": u.get("location", "Remote"),
            "skills": u.get("skills", []),
            "interests": u.get("interests", []),
            "bio": u.get("bio", ""),
            "careerGoals": u.get("careerGoals", ""),
            "avatar_url": u.get("avatar_url"),
            "avatar": f"{(fname or 'U')[0]}{(lname or 'U')[0]}".upper(),
            "sharedSkills": shared_skills,
            "matchScore": score_pct,
            "connectionStatus": conn_info["status"],
            "requestId": conn_info.get("request_id")
        })

    return formatted_results


@app.get("/match/recommendations")
async def get_recommendations(current_user: dict = Depends(auth.get_current_user)):
    """Return similar user profiles with connection status."""
    return await search_matches(query=None, current_user=current_user)


@app.post("/connections/request")
async def request_connection(payload: dict, current_user: dict = Depends(auth.get_current_user)):
    """Create a connection request to target user by id or email."""
    target_user_id = payload.get("target_user_id")
    target_email = payload.get("target_email")
    
    target_user = None
    if target_user_id:
        try:
            target_user = await database["users"].find_one({"_id": ObjectId(target_user_id)})
        except Exception:
            pass
    if not target_user and target_email:
        target_user = await database["users"].find_one({"email": target_email})
        
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")
        
    target_email_clean = target_user["email"]
    if target_email_clean == current_user["email"]:
        raise HTTPException(status_code=400, detail="Cannot send connection request to yourself")

    existing = await database["connections"].find_one({
        "$or": [
            {"from": current_user["email"], "to": target_email_clean},
            {"from": target_email_clean, "to": current_user["email"]},
            {"from": current_user["email"], "to": str(target_user["_id"])},
        ]
    })
    
    if existing:
        if existing.get("status") == "accepted":
            return {"status": "already_connected", "request_id": str(existing["_id"])}
        elif existing.get("status") == "requested":
            return {"status": "already_requested", "request_id": str(existing["_id"])}
        else:
            await database["connections"].update_one(
                {"_id": existing["_id"]},
                {"$set": {"status": "requested", "from": current_user["email"], "to": target_email_clean}}
            )
            request_id = str(existing["_id"])
    else:
        insert_res = await database["connections"].insert_one({
            "from": current_user["email"],
            "to": target_email_clean,
            "status": "requested",
            "created_at": datetime.now()
        })
        request_id = str(insert_res.inserted_id)

    sender_name = f"{current_user.get('first_name', '')} {current_user.get('last_name', '')}".strip() or current_user["email"]
    notif = {
        "user": target_email_clean,
        "message": f"{sender_name} sent you a connection request",
        "type": "connection_request",
        "from": current_user["email"],
        "from_name": sender_name,
        "request_id": request_id,
        "read": False,
        "created_at": datetime.now().isoformat()
    }
    await database["notifications"].insert_one(notif)
    try:
        await push_notification(target_email_clean, notif)
    except Exception:
        pass

    return {"status": "ok", "request_id": request_id}


@app.post("/connections/cancel")
async def cancel_connection_request(payload: dict, current_user: dict = Depends(auth.get_current_user)):
    request_id = payload.get("request_id")
    target_email = payload.get("target_email")
    
    query = {"from": current_user["email"], "status": "requested"}
    if request_id:
        try:
            query["_id"] = ObjectId(request_id)
        except Exception:
            pass
    elif target_email:
        query["to"] = target_email
        
    res = await database["connections"].delete_one(query)
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Request not found or already processed")
    return {"status": "ok"}


@app.get("/connections/requests")
async def list_connection_requests(current_user: dict = Depends(auth.get_current_user)):
    user_email = current_user["email"]
    user_id_str = str(current_user.get("_id", ""))
    
    cursor = database["connections"].find({
        "$or": [
            {"to": user_email},
            {"to": user_id_str},
            {"from": user_email}
        ],
        "status": "requested"
    })
    items = await cursor.to_list(length=200)
    
    emails = set()
    for i in items:
        if "@" in str(i.get("from")): emails.add(i.get("from"))
        if "@" in str(i.get("to")): emails.add(i.get("to"))
        
    user_docs = await database["users"].find({"email": {"$in": list(emails)}}).to_list(length=500)
    user_map = {u["email"]: u for u in user_docs}
    
    requests_list = []
    for i in items:
        req_id = str(i["_id"])
        from_email = i.get("from")
        to_email = i.get("to")
        
        is_incoming = (to_email == user_email or to_email == user_id_str)
        other_email = from_email if is_incoming else to_email
        other_user = user_map.get(other_email) or {}
        
        fname = other_user.get("first_name", "") or ""
        lname = other_user.get("last_name", "") or ""
        full_name = f"{fname} {lname}".strip() or other_email
        
        requests_list.append({
            "id": req_id,
            "from": from_email,
            "to": to_email,
            "direction": "incoming" if is_incoming else "outgoing",
            "status": i.get("status"),
            "otherUser": {
                "id": str(other_user.get("_id", "")),
                "email": other_email,
                "name": full_name,
                "title": other_user.get("title", "Skillzy Member"),
                "skills": other_user.get("skills", []),
                "avatar_url": other_user.get("avatar_url"),
                "avatar": f"{(fname or 'U')[0]}{(lname or 'U')[0]}".upper()
            }
        })
        
    return requests_list


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
    await database["connections"].update_one({"_id": oid}, {"$set": {"status": new_status, "updated_at": datetime.now()}})
    
    responder_name = f"{current_user.get('first_name', '')} {current_user.get('last_name', '')}".strip() or current_user["email"]
    message = f"{responder_name} accepted your connection request" if action == "accept" else f"Your connection request to {responder_name} was declined"
    notif = {
        "user": doc.get("from"),
        "message": message,
        "type": "connection_response",
        "status": new_status,
        "request_id": request_id,
        "read": False,
        "created_at": datetime.now().isoformat()
    }
    await database["notifications"].insert_one(notif)
    try:
        await push_notification(doc.get("from"), notif)
    except Exception:
        pass
    return {"status": "ok", "action": action}


@app.get("/connections")
async def list_connections(current_user: dict = Depends(auth.get_current_user)):
    user_email = current_user["email"]
    user_id_str = str(current_user.get("_id", ""))
    
    cursor = database["connections"].find({
        "$or": [
            {"from": user_email},
            {"to": user_email},
            {"to": user_id_str},
        ],
        "status": "accepted"
    })
    items = await cursor.to_list(length=1000)
    
    emails = set()
    for i in items:
        f = i.get("from"); t = i.get("to")
        if isinstance(f, str) and "@" in f: emails.add(f)
        if isinstance(t, str) and "@" in t: emails.add(t)
        
    users_docs = await database["users"].find({"email": {"$in": list(emails)}}).to_list(length=1000)
    users_map = {u["email"]: u for u in users_docs}
    
    results = []
    seen_partner_emails = set()
    for i in items:
        f = i.get("from"); t = i.get("to")
        partner_email = t if f == user_email else f
        if partner_email == user_email or partner_email in seen_partner_emails:
            continue
        seen_partner_emails.add(partner_email)
        
        pu = users_map.get(partner_email) or {}
        fname = pu.get("first_name", "") or ""
        lname = pu.get("last_name", "") or ""
        full_name = f"{fname} {lname}".strip() or partner_email
        
        results.append({
            "id": str(i.get("_id")),
            "connection_id": str(i.get("_id")),
            "email": partner_email,
            "name": full_name,
            "first_name": fname,
            "last_name": lname,
            "title": pu.get("title") or pu.get("company") or "Skillzy Member",
            "company": pu.get("company", ""),
            "location": pu.get("location", "Remote"),
            "skills": pu.get("skills", []),
            "interests": pu.get("interests", []),
            "bio": pu.get("bio", ""),
            "avatar_url": pu.get("avatar_url"),
            "avatar": f"{(fname or 'U')[0]}{(lname or 'U')[0]}".upper()
        })
    return results


@app.get("/auth/is-admin")
async def is_admin(current_user: dict = Depends(auth.get_current_user)):
    user_email = current_user["email"]
    admin_emails = getattr(settings, 'ADMINS', '') or ''
    is_global_admin = user_email in [e.strip() for e in admin_emails.split(",") if e.strip()]
    admin_communities = await database["communities"].count_documents({"admin_email": user_email})
    return {"isAdmin": is_global_admin or admin_communities > 0}


@app.get("/challenges")
async def list_challenges(current_user: dict = Depends(auth.get_current_user)):
    cursor = database["challenges"].find({})
    items = await cursor.to_list(length=200)
    
    results = []
    for i in items:
        cid = str(i.get("_id") or ObjectId())
        participants = i.get("participants", [])
        if not isinstance(participants, list):
            participants = []
        is_joined = current_user["email"] in participants
        
        results.append({
            "id": cid,
            "title": i.get("title", "Untitled Challenge"),
            "description": i.get("description", ""),
            "difficulty": i.get("difficulty", "Medium"),
            "creator_name": i.get("creator_name", "Skillzy Admin"),
            "creator_email": i.get("creator_email", ""),
            "participant_count": len(participants),
            "participants": participants,
            "is_joined": is_joined,
            "status": i.get("status", "Active"),
            "points": i.get("points", 150)
        })
    return results


@app.get("/challenges/my")
async def list_my_challenges(current_user: dict = Depends(auth.get_current_user)):
    cursor = database["challenges"].find({"participants": current_user["email"]})
    items = await cursor.to_list(length=200)
    return [{
        "id": str(i.get("_id")),
        "title": i.get("title"),
        "description": i.get("description"),
        "difficulty": i.get("difficulty"),
        "participant_count": len(i.get("participants", [])),
        "is_joined": True
    } for i in items]


@app.get("/challenges/{challenge_id}")
async def get_challenge_detail(challenge_id: str, current_user: dict = Depends(auth.get_current_user)):
    try:
        oid = ObjectId(challenge_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid challenge_id")
        
    doc = await database["challenges"].find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Challenge not found")
        
    participants = doc.get("participants", [])
    if not isinstance(participants, list):
        participants = []
        
    p_users = await database["users"].find({"email": {"$in": participants}}).to_list(length=500)
    participant_profiles = []
    for u in p_users:
        fname = u.get("first_name", "") or ""
        lname = u.get("last_name", "") or ""
        participant_profiles.append({
            "id": str(u["_id"]),
            "email": u["email"],
            "name": f"{fname} {lname}".strip() or u["email"],
            "title": u.get("title", "Member"),
            "avatar_url": u.get("avatar_url"),
            "avatar": f"{(fname or 'U')[0]}{(lname or 'U')[0]}".upper()
        })
        
    return {
        "id": str(doc["_id"]),
        "title": doc.get("title", "Untitled Challenge"),
        "description": doc.get("description", ""),
        "difficulty": doc.get("difficulty", "Medium"),
        "creator_name": doc.get("creator_name", "Skillzy Admin"),
        "creator_email": doc.get("creator_email", ""),
        "participant_count": len(participants),
        "participant_profiles": participant_profiles,
        "is_joined": current_user["email"] in participants,
        "status": doc.get("status", "Active"),
        "points": doc.get("points", 150)
    }


@app.post("/challenges/{challenge_id}/join")
async def join_challenge(challenge_id: str, current_user: dict = Depends(auth.get_current_user)):
    try:
        oid = ObjectId(challenge_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid challenge_id")
        
    res = await database["challenges"].update_one(
        {"_id": oid},
        {"$addToSet": {"participants": current_user["email"]}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return {"status": "ok", "message": "Joined challenge successfully"}


@app.post("/challenges/{challenge_id}/leave")
async def leave_challenge(challenge_id: str, current_user: dict = Depends(auth.get_current_user)):
    try:
        oid = ObjectId(challenge_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid challenge_id")
        
    res = await database["challenges"].update_one(
        {"_id": oid},
        {"$pull": {"participants": current_user["email"]}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return {"status": "ok", "message": "Left challenge successfully"}


@app.get("/events")
async def list_events(community_id: str | None = None, current_user: dict = Depends(auth.get_current_user)):
    query = {}
    if community_id:
        query["community_id"] = community_id
    cursor = database["events"].find(query)
    items = await cursor.to_list(length=500)
    results = []
    for i in items:
        attendees = i.get("attendees", [])
        if not isinstance(attendees, list): attendees = []
        
        results.append({
            "id": str(i.get("_id") or ObjectId()),
            "community_id": i.get("community_id"),
            "title": i.get("title", "Untitled Event"),
            "description": i.get("description", ""),
            "date": i.get("date"),
            "time": i.get("time"),
            "start_time": i.get("start_time"),
            "location": i.get("location", "Online"),
            "attendees_count": len(attendees),
            "attendees": attendees,
            "is_attending": current_user["email"] in attendees
        })
    return results


@app.get("/events/{event_id}")
async def get_event_detail(event_id: str, current_user: dict = Depends(auth.get_current_user)):
    try:
        oid = ObjectId(event_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid event_id")
    evt = await database["events"].find_one({"_id": oid})
    if not evt:
        raise HTTPException(status_code=404, detail="Event not found")
        
    attendees = evt.get("attendees", [])
    if not isinstance(attendees, list): attendees = []
    
    users_docs = await database["users"].find({"email": {"$in": attendees}}).to_list(length=500)
    attendee_profiles = []
    for u in users_docs:
        fname = u.get("first_name", "") or ""
        lname = u.get("last_name", "") or ""
        attendee_profiles.append({
            "id": str(u["_id"]),
            "email": u["email"],
            "name": f"{fname} {lname}".strip() or u["email"],
            "avatar_url": u.get("avatar_url"),
            "avatar": f"{(fname or 'U')[0]}{(lname or 'U')[0]}".upper()
        })
        
    return {
        "id": str(evt["_id"]),
        "title": evt.get("title"),
        "description": evt.get("description"),
        "date": evt.get("date"),
        "time": evt.get("time"),
        "location": evt.get("location"),
        "community_id": evt.get("community_id"),
        "attendees_count": len(attendees),
        "attendees": attendee_profiles,
        "is_attending": current_user["email"] in attendees
    }


@app.post("/events")
async def create_event(payload: dict, current_user: dict = Depends(auth.get_current_user)):
    community_id = payload.get("community_id")
    title = payload.get("title")
    if not title:
        raise HTTPException(status_code=422, detail="Title is required")
        
    date_str = payload.get("date") or payload.get("event_date")
    time_str = payload.get("time") or payload.get("event_time")
    
    doc = {
        "community_id": community_id,
        "title": title,
        "description": payload.get("description") or "",
        "location": payload.get("location") or "Online",
        "date": date_str,
        "time": time_str,
        "start_time": payload.get("start_time"),
        "creator_email": current_user["email"],
        "attendees": [current_user["email"]],
        "created_at": datetime.now()
    }
    res = await database["events"].insert_one(doc)
    return {"id": str(res.inserted_id), **{k: v for k, v in doc.items() if k != "_id"}}


@app.post("/events/{event_id}/join")
async def join_event(event_id: str, current_user: dict = Depends(auth.get_current_user)):
    try:
        oid = ObjectId(event_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid event_id")
    evt = await database["events"].find_one({"_id": oid})
    if not evt:
        raise HTTPException(status_code=404, detail="Event not found")
    await database["events"].update_one({"_id": oid}, {"$addToSet": {"attendees": current_user["email"]}})
    return {"status": "ok", "message": "Joined event successfully"}


@app.post("/events/{event_id}/leave")
async def leave_event(event_id: str, current_user: dict = Depends(auth.get_current_user)):
    try:
        oid = ObjectId(event_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid event_id")
    evt = await database["events"].find_one({"_id": oid})
    if not evt:
        raise HTTPException(status_code=404, detail="Event not found")
    await database["events"].update_one({"_id": oid}, {"$pull": {"attendees": current_user["email"]}})
    return {"status": "ok", "message": "Left event successfully"}


@app.post("/communities/{community_id}/events/{event_id}/join")
async def join_event_scoped(community_id: str, event_id: str, current_user: dict = Depends(auth.get_current_user)):
    return await join_event(event_id=event_id, current_user=current_user)


@app.post("/admin/challenges")
async def admin_create_challenge(payload: dict, current_user: dict = Depends(auth.get_current_user)):
    title = payload.get("title")
    if not title:
        raise HTTPException(status_code=422, detail="Title is required")
    doc = {
        "title": title,
        "description": payload.get("description", ""),
        "difficulty": payload.get("difficulty", "Medium"),
        "creator_name": f"{current_user.get('first_name', '')} {current_user.get('last_name', '')}".strip() or current_user["email"],
        "creator_email": current_user["email"],
        "participants": [current_user["email"]],
        "status": "Active",
        "created_at": datetime.now()
    }
    res = await database["challenges"].insert_one(doc)
    return {"id": str(res.inserted_id), "status": "ok"}


@app.post("/admin/events")
async def admin_create_event(payload: dict, current_user: dict = Depends(auth.get_current_user)):
    title = payload.get("title")
    if not title:
        raise HTTPException(status_code=422, detail="Title is required")
    doc = {
        "title": title,
        "description": payload.get("description", ""),
        "date": payload.get("date"),
        "time": payload.get("time"),
        "location": payload.get("location", "Online"),
        "creator_email": current_user["email"],
        "attendees": [current_user["email"]],
        "created_at": datetime.now()
    }
    res = await database["events"].insert_one(doc)
    return {"id": str(res.inserted_id), "status": "ok"}


@app.get("/notifications")
async def list_notifications(current_user: dict = Depends(auth.get_current_user)):
    cursor = database["notifications"].find({"user": current_user["email"]}).sort("_id", -1)
    items = await cursor.to_list(length=100)
    return [{
        "id": str(i.get("_id") or ObjectId()),
        "message": i.get("message", ""),
        "type": i.get("type", "general"),
        "from": i.get("from"),
        "request_id": i.get("request_id"),
        "status": i.get("status"),
        "read": bool(i.get("read", False)),
        "created_at": i.get("created_at")
    } for i in items]


@app.post("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(auth.get_current_user)):
    try:
        oid = ObjectId(notification_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid notification_id")
    await database["notifications"].update_one({"_id": oid, "user": current_user["email"]}, {"$set": {"read": True}})
    return {"status": "ok"}


@app.delete("/notifications/clear")
async def clear_notifications(current_user: dict = Depends(auth.get_current_user)):
    await database["notifications"].delete_many({"user": current_user["email"]})
    return {"status": "ok"}


@app.post("/admin/notifications")
async def admin_create_notification(payload: dict, current_user: dict = Depends(auth.get_current_user)):
    target = payload.get("user")
    message = payload.get("message", "")
    broadcast = bool(payload.get("broadcast"))
    
    if broadcast:
        users = await database["users"].find({}).to_list(length=10000)
        for u in users:
            doc = {
                "user": u.get("email"),
                "message": message,
                "type": "broadcast",
                "from": current_user["email"],
                "read": False,
                "created_at": datetime.now().isoformat()
            }
            await database["notifications"].insert_one(doc)
            try:
                await push_notification(u.get("email"), doc)
            except Exception:
                pass
        return {"status": "ok", "broadcasted": len(users)}
    else:
        target = target or current_user.get("email")
        doc = {
            "user": target,
            "message": message,
            "type": "admin_announcement",
            "from": current_user["email"],
            "read": False,
            "created_at": datetime.now().isoformat()
        }
        await database["notifications"].insert_one(doc)
        try:
            await push_notification(target, doc)
        except Exception:
            pass
        return {"status": "ok"}


@app.get("/network/summary")
async def network_summary(current_user: dict = Depends(auth.get_current_user)):
    user_email = current_user["email"]
    connections_count = await database["connections"].count_documents({
        "$or": [{"from": user_email}, {"to": user_email}],
        "status": "accepted"
    })
    communities_count = await database["communities"].count_documents({"members": user_email})
    events_attended = await database["events"].count_documents({"attendees": user_email})
    challenges_count = await database["challenges"].count_documents({"participants": user_email})
    return {
        "connections": connections_count,
        "communities": communities_count,
        "eventsAttended": events_attended,
        "challengesJoined": challenges_count
    }


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
    cursor = database["communities"].find({"members": current_user["email"]})
    items = await cursor.to_list(length=100)
    return [{
        "id": str(i.get("_id") or ObjectId()),
        "name": i.get("name", "Untitled Community"),
        "domain": i.get("domain", ""),
        "description": i.get("description", ""),
        "profile_pic": i.get("profile_pic"),
        "admin_name": i.get("admin_name", ""),
        "admin_email": i.get("admin_email", ""),
        "member_count": len(i.get("members", [])),
        "is_member": True
    } for i in items]


@app.get("/communities/all")
async def list_all_communities(current_user: dict = Depends(auth.get_current_user)):
    cursor = database["communities"].find({})
    items = await cursor.to_list(length=200)
    return [{
        "id": str(i.get("_id") or ObjectId()),
        "name": i.get("name", "Untitled Community"),
        "domain": i.get("domain", ""),
        "description": i.get("description", ""),
        "profile_pic": i.get("profile_pic"),
        "admin_name": i.get("admin_name", ""),
        "admin_email": i.get("admin_email", ""),
        "member_count": len(i.get("members", [])),
        "is_member": current_user["email"] in i.get("members", [])
    } for i in items]


@app.get("/communities/{community_id}")
async def get_community_detail(community_id: str, current_user: dict = Depends(auth.get_current_user)):
    try:
        oid = ObjectId(community_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid community_id")
    community = await database["communities"].find_one({"_id": oid})
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    members = community.get("members", [])
    return {
        "id": str(community["_id"]),
        "name": community.get("name"),
        "domain": community.get("domain"),
        "description": community.get("description"),
        "profile_pic": community.get("profile_pic"),
        "admin_name": community.get("admin_name"),
        "admin_email": community.get("admin_email"),
        "member_count": len(members),
        "members": members,
        "is_member": current_user["email"] in members
    }


@app.post("/communities")
async def create_community(payload: dict, current_user: dict = Depends(auth.get_current_user)):
    name = payload.get("name")
    if not name:
        raise HTTPException(status_code=422, detail="Name is required")
    admin_name = f"{current_user.get('first_name', '')} {current_user.get('last_name', '')}".strip() or current_user["email"]
    doc = {
        "name": name,
        "domain": payload.get("domain", "General"),
        "description": payload.get("description", ""),
        "profile_pic": payload.get("profile_pic", ""),
        "admin_name": payload.get("admin_name") or admin_name,
        "admin_email": current_user["email"],
        "members": [current_user["email"]],
        "created_at": datetime.now()
    }
    res = await database["communities"].insert_one(doc)
    return {"id": str(res.inserted_id), "status": "ok", **{k: v for k, v in doc.items() if k != "_id"}}


@app.post("/communities/{community_id}/join")
async def join_community(community_id: str, current_user: dict = Depends(auth.get_current_user)):
    try:
        oid = ObjectId(community_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid community_id")
    
    community = await database["communities"].find_one({"_id": oid})
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
        
    await database["communities"].update_one(
        {"_id": oid},
        {"$addToSet": {"members": current_user["email"]}}
    )
    return {"status": "ok", "message": "Joined community successfully"}


@app.post("/communities/{community_id}/leave")
async def leave_community(community_id: str, current_user: dict = Depends(auth.get_current_user)):
    try:
        oid = ObjectId(community_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid community_id")
    
    community = await database["communities"].find_one({"_id": oid})
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
        
    await database["communities"].update_one(
        {"_id": oid},
        {"$pull": {"members": current_user["email"]}}
    )
    return {"status": "ok", "message": "Left community successfully"}


@app.get("/communities/{community_id}/dashboard")
async def get_community_dashboard(community_id: str, current_user: dict = Depends(auth.get_current_user)):
    try:
        oid = ObjectId(community_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid community_id")
    
    community = await database["communities"].find_one({"_id": oid})
    if not community or current_user["email"] not in community.get("members", []):
        raise HTTPException(status_code=403, detail="Not a member of this community")
        
    member_count = len(community.get("members", []))
    msg_count = await database["messages"].count_documents({"community_id": community_id})
    event_count = await database["events"].count_documents({"community_id": community_id})
    recognitions_count = await database["recognitions"].count_documents({"community_id": community_id})
    
    points_aggregation = await database["user_points"].aggregate([
        {"$match": {"community_id": community_id}},
        {"$group": {"_id": None, "total": {"$sum": "$points"}}}
    ]).to_list(1)
    points_from_db = points_aggregation[0]["total"] if points_aggregation else 0
    total_points = points_from_db + (msg_count * 10) + (event_count * 25) + (member_count * 5)
    
    messages_cursor = database["messages"].find({"community_id": community_id}).sort("timestamp", -1)
    recent_msgs = await messages_cursor.to_list(length=500)
    
    day_counts = {"Mon": 0, "Tue": 0, "Wed": 0, "Thu": 0, "Fri": 0, "Sat": 0, "Sun": 0}
    days_map = {0: "Mon", 1: "Tue", 2: "Wed", 3: "Thu", 4: "Fri", 5: "Sat", 6: "Sun"}
    
    for m in recent_msgs:
        ts = m.get("timestamp")
        if isinstance(ts, datetime):
            day_name = days_map.get(ts.weekday())
            if day_name in day_counts:
                day_counts[day_name] += 1

    weekly_activity = []
    for day, act_count in day_counts.items():
        weekly_activity.append({
            "day": day,
            "activities": act_count,
            "points": act_count * 15
        })
        
    avg_activity = min(100, int(round((msg_count / max(1, member_count)) * 20)))
    if avg_activity == 0: avg_activity = 45
    
    return {
        "totalMembers": member_count,
        "totalPoints": total_points,
        "recognitions": recognitions_count,
        "totalEvents": event_count,
        "totalMessages": msg_count,
        "averageActivity": avg_activity,
        "weeklyActivity": weekly_activity
    }


@app.get("/communities/{community_id}/leaderboard")
async def get_community_leaderboard(community_id: str, current_user: dict = Depends(auth.get_current_user)):
    try:
        oid = ObjectId(community_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid community_id")
    
    community = await database["communities"].find_one({"_id": oid})
    if not community or current_user["email"] not in community.get("members", []):
        raise HTTPException(status_code=403, detail="Not a member of this community")
        
    members = community.get("members", [])
    users_docs = await database["users"].find({"email": {"$in": members}}).to_list(length=500)
    
    leaderboard = []
    for u in users_docs:
        email = u["email"]
        msg_count = await database["messages"].count_documents({"community_id": community_id, "sender": email})
        fname = u.get("first_name", "") or ""
        lname = u.get("last_name", "") or ""
        points = (msg_count * 20) + 100
        leaderboard.append({
            "name": f"{fname} {lname}".strip() or email,
            "email": email,
            "points": points,
            "role": u.get("title", "Member"),
            "avatar": f"{(fname or 'U')[0]}{(lname or 'U')[0]}".upper()
        })
        
    leaderboard.sort(key=lambda x: x["points"], reverse=True)
    return leaderboard[:10]


@app.get("/communities/{community_id}/messages")
async def get_community_messages(community_id: str, current_user: dict = Depends(auth.get_current_user)):
    try:
        oid = ObjectId(community_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid community_id")
    community = await database["communities"].find_one({"_id": oid})
    if not community or current_user["email"] not in community.get("members", []):
        raise HTTPException(status_code=403, detail="Not a member of this community")
    cursor = database["messages"].find({"community_id": community_id}).sort("created_at", 1)
    items = await cursor.to_list(length=500)
    results = []
    for i in items:
        results.append({
            "id": str(i.get("_id") or ObjectId()),
            "community_id": community_id,
            "sender": i.get("sender"),
            "sender_name": i.get("sender_name", i.get("sender")),
            "message": i.get("message", ""),
            "created_at": i.get("created_at", datetime.now().isoformat())
        })
    return results


@app.post("/communities/{community_id}/messages")
async def post_community_message(community_id: str, payload: dict, current_user: dict = Depends(auth.get_current_user)):
    try:
        oid = ObjectId(community_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid community_id")
    community = await database["communities"].find_one({"_id": oid})
    if not community or current_user["email"] not in community.get("members", []):
        raise HTTPException(status_code=403, detail="Not a member of this community")
    msg_text = payload.get("message")
    if not msg_text:
        raise HTTPException(status_code=422, detail="Message is required")
    sender_name = f"{current_user.get('first_name', '')} {current_user.get('last_name', '')}".strip() or current_user["email"]
    doc = {
        "community_id": community_id,
        "sender": current_user["email"],
        "sender_name": sender_name,
        "message": msg_text,
        "created_at": datetime.now().isoformat()
    }
    res = await database["messages"].insert_one(doc)
    return {"id": str(res.inserted_id), "status": "ok", **{k: v for k, v in doc.items() if k != "_id"}}


@app.get("/communities/{community_id}/members")
async def get_community_members(community_id: str, current_user: dict = Depends(auth.get_current_user)):
    try:
        oid = ObjectId(community_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid community_id")
    
    community = await database["communities"].find_one({"_id": oid})
    if not community or current_user["email"] not in community.get("members", []):
        raise HTTPException(status_code=403, detail="Not a member of this community")
        
    members_emails = community.get("members", [])
    users_docs = await database["users"].find({"email": {"$in": members_emails}}).to_list(length=500)
    
    result = []
    for u in users_docs:
        email = u["email"]
        fname = u.get("first_name", "") or ""
        lname = u.get("last_name", "") or ""
        msg_count = await database["messages"].count_documents({"community_id": community_id, "sender": email})
        points = (msg_count * 20) + 100
        
        result.append({
            "id": str(u["_id"]),
            "name": f"{fname} {lname}".strip() or email,
            "email": email,
            "role": u.get("title", "Member"),
            "company": u.get("company", ""),
            "location": u.get("location", ""),
            "bio": u.get("bio", ""),
            "skills": u.get("skills", []),
            "interests": u.get("interests", []),
            "avatar": f"{(fname or 'U')[0]}{(lname or 'U')[0]}".upper(),
            "avatar_url": u.get("avatar_url"),
            "isAdmin": email == community.get("admin_email"),
            "joinDate": community.get("created_at", datetime.now()).isoformat(),
            "points": points
        })
    return result


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


# --------------------------
# Community Events (scoped)
# --------------------------

@app.get("/communities/{community_id}/events")
async def get_community_events(community_id: str, current_user: dict = Depends(auth.get_current_user)):
    """List events that belong to a specific community."""
    try:
        ObjectId(community_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid community_id")
    cursor = database["events"].find({"community_id": community_id})
    items = await cursor.to_list(length=200)
    results = []
    for i in items:
        attendees = i.get("attendees", [])
        if not isinstance(attendees, list):
            attendees = []
        results.append({
            "id": str(i.get("_id") or ObjectId()),
            "community_id": i.get("community_id"),
            "title": i.get("title", "Untitled Event"),
            "description": i.get("description", ""),
            "date": i.get("date"),
            "time": i.get("time"),
            "location": i.get("location", "Online"),
            "attendees_count": len(attendees),
            "is_attending": current_user["email"] in attendees,
            "status": "upcoming"
        })
    return results


@app.post("/communities/{community_id}/events")
async def create_community_event(community_id: str, payload: dict, current_user: dict = Depends(auth.get_current_user)):
    """Create an event scoped to a community. Admin or any member can create."""
    try:
        oid = ObjectId(community_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid community_id")
    community = await database["communities"].find_one({"_id": oid})
    if not community or current_user["email"] not in community.get("members", []):
        raise HTTPException(status_code=403, detail="Not a member of this community")
    title = payload.get("title")
    if not title:
        raise HTTPException(status_code=422, detail="Title is required")

    # Accept both ISO start_time or separate date+time fields
    start_time = payload.get("start_time")
    date_val = payload.get("date")
    time_val = payload.get("time")
    if start_time and not date_val:
        # Extract date and time from ISO string
        try:
            dt = datetime.fromisoformat(start_time.replace("Z", ""))
            date_val = dt.strftime("%Y-%m-%d")
            time_val = dt.strftime("%H:%M")
        except Exception:
            pass

    doc = {
        "community_id": community_id,
        "title": title,
        "description": payload.get("description", ""),
        "location": payload.get("location", "Online"),
        "date": date_val,
        "time": time_val,
        "start_time": start_time,
        "creator_email": current_user["email"],
        "attendees": [current_user["email"]],
        "created_at": datetime.now()
    }
    res = await database["events"].insert_one(doc)
    return {"id": str(res.inserted_id), "status": "ok", **{k: v for k, v in doc.items() if k not in ("_id", "created_at")}}


# --------------------------
# Community Announcements
# --------------------------

@app.get("/communities/{community_id}/announcements")
async def get_community_announcements(community_id: str, current_user: dict = Depends(auth.get_current_user)):
    try:
        ObjectId(community_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid community_id")
    cursor = database["announcements"].find({"community_id": community_id}).sort("created_at", -1)
    items = await cursor.to_list(length=100)
    return [{
        "id": str(i.get("_id")),
        "community_id": i.get("community_id"),
        "title": i.get("title", "Announcement"),
        "content": i.get("content", ""),
        "created_at": i.get("created_at", datetime.now()).isoformat() if isinstance(i.get("created_at"), datetime) else str(i.get("created_at", ""))
    } for i in items]


@app.post("/communities/{community_id}/announcements")
async def create_community_announcement(community_id: str, payload: dict, current_user: dict = Depends(auth.get_current_user)):
    try:
        oid = ObjectId(community_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid community_id")
    community = await database["communities"].find_one({"_id": oid})
    if not community or current_user["email"] != community.get("admin_email"):
        raise HTTPException(status_code=403, detail="Only community admin can post announcements")
    content = payload.get("content") or payload.get("announcement") or payload.get("message", "")
    if not content:
        raise HTTPException(status_code=422, detail="Content is required")
    doc = {
        "community_id": community_id,
        "title": payload.get("title", "Announcement"),
        "content": content,
        "author_email": current_user["email"],
        "created_at": datetime.now()
    }
    res = await database["announcements"].insert_one(doc)
    return {
        "id": str(res.inserted_id),
        "community_id": community_id,
        "title": doc["title"],
        "content": doc["content"],
        "created_at": doc["created_at"].isoformat()
    }


# --------------------------
# Community Member Remove (Admin)
# --------------------------

@app.delete("/communities/{community_id}/members/{member_email_or_id}")
async def remove_community_member(community_id: str, member_email_or_id: str, current_user: dict = Depends(auth.get_current_user)):
    try:
        oid = ObjectId(community_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid community_id")
    community = await database["communities"].find_one({"_id": oid})
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    if current_user["email"] != community.get("admin_email"):
        raise HTTPException(status_code=403, detail="Only community admin can remove members")
    # Try to resolve the identifier to an email
    target_email = member_email_or_id
    if "@" not in member_email_or_id:
        # Might be an ObjectId string — look up the user
        try:
            user_doc = await database["users"].find_one({"_id": ObjectId(member_email_or_id)})
            if user_doc:
                target_email = user_doc["email"]
        except Exception:
            pass
    if target_email == current_user["email"]:
        raise HTTPException(status_code=400, detail="Admin cannot remove themselves")
    await database["communities"].update_one({"_id": oid}, {"$pull": {"members": target_email}})
    return {"status": "ok"}


# --------------------------
# Store endpoints (dynamic)
# --------------------------

@app.get("/store/items")
async def list_store_items(current_user: dict = Depends(auth.get_current_user)):
    """Return all store items with purchase state for current user."""
    cursor = database["store_items"].find({})
    items = await cursor.to_list(length=200)
    if not items:
        # Return default catalog items (seeded on first call)
        default_items = [
            {"name": "Professional Badge", "description": "Show off your expertise with a verified professional badge", "price": 200, "category": "badge", "rarity": "common", "available": True},
            {"name": "Gold Badge", "description": "Exclusive gold achievement badge for top contributors", "price": 500, "category": "badge", "rarity": "rare", "available": True},
            {"name": "Premium Crown", "description": "Royal crown for recognized community leaders", "price": 800, "category": "accessory", "rarity": "epic", "available": True},
            {"name": "Spotlight Feature", "description": "Get featured in community discover results for 7 days", "price": 300, "category": "feature", "rarity": "uncommon", "available": True},
            {"name": "Custom Title", "description": "Set a custom title that appears on your profile card", "price": 150, "category": "title", "rarity": "common", "available": True},
            {"name": "Diamond Frame", "description": "Elegant diamond border for your profile avatar", "price": 600, "category": "frame", "rarity": "rare", "available": False},
        ]
        for item in default_items:
            item["created_at"] = datetime.now()
        result = await database["store_items"].insert_many(default_items)
        items = await database["store_items"].find({}).to_list(length=200)

    # Fetch this user's purchases
    purchases = await database["store_purchases"].find({"user": current_user["email"]}).to_list(length=1000)
    purchased_ids = {str(p["item_id"]) for p in purchases}

    return [{
        "id": str(i["_id"]),
        "name": i.get("name", ""),
        "description": i.get("description", ""),
        "price": i.get("price", 0),
        "category": i.get("category", "general"),
        "rarity": i.get("rarity", "common"),
        "available": bool(i.get("available", True)),
        "is_owned": str(i["_id"]) in purchased_ids
    } for i in items]


@app.get("/store/credits")
async def get_user_credits(current_user: dict = Depends(auth.get_current_user)):
    """Return user's current credit balance, calculated from real activity."""
    user_email = current_user["email"]
    msg_count = await database["messages"].count_documents({"sender": user_email})
    events_count = await database["events"].count_documents({"attendees": user_email})
    challenges_count = await database["challenges"].count_documents({"participants": user_email})
    connections_count = await database["connections"].count_documents({
        "$or": [{"from": user_email}, {"to": user_email}],
        "status": "accepted"
    })
    # Spent credits from purchases
    purchases = await database["store_purchases"].find({"user": user_email}).to_list(length=1000)
    spent = 0
    for p in purchases:
        item = await database["store_items"].find_one({"_id": ObjectId(p["item_id"])}) if p.get("item_id") else None
        if item:
            spent += item.get("price", 0)
    earned = (msg_count * 10) + (events_count * 25) + (challenges_count * 50) + (connections_count * 20) + 100  # base 100
    return {"credits": max(0, earned - spent), "earned": earned, "spent": spent}


@app.post("/store/purchase/{item_id}")
async def purchase_store_item(item_id: str, current_user: dict = Depends(auth.get_current_user)):
    """Purchase a store item using community credits."""
    try:
        oid = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid item_id")
    item = await database["store_items"].find_one({"_id": oid})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if not item.get("available", True):
        raise HTTPException(status_code=400, detail="Item is not available")
    # Check if already owned
    existing = await database["store_purchases"].find_one({"user": current_user["email"], "item_id": item_id})
    if existing:
        raise HTTPException(status_code=400, detail="You already own this item")
    # Check credits
    credits_data = await get_user_credits(current_user)
    if credits_data["credits"] < item.get("price", 0):
        raise HTTPException(status_code=400, detail="Insufficient credits")
    # Record purchase
    await database["store_purchases"].insert_one({
        "user": current_user["email"],
        "item_id": item_id,
        "item_name": item.get("name"),
        "price": item.get("price", 0),
        "purchased_at": datetime.now()
    })
    return {"status": "ok", "message": f"Successfully purchased {item.get('name')}"}


# --------------------------
# Delete community (admin only)
# --------------------------

@app.delete("/communities/{community_id}")
async def delete_community(community_id: str, current_user: dict = Depends(auth.get_current_user)):
    try:
        oid = ObjectId(community_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid community_id")
    community = await database["communities"].find_one({"_id": oid})
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    if current_user["email"] != community.get("admin_email"):
        raise HTTPException(status_code=403, detail="Only the community admin can delete it")
    await database["communities"].delete_one({"_id": oid})
    # Optionally clean up related data
    await database["messages"].delete_many({"community_id": community_id})
    await database["announcements"].delete_many({"community_id": community_id})
    return {"status": "ok"}


# --------------------------
# User public profile
# --------------------------

@app.get("/users/{user_id}/profile")
async def get_user_public_profile(user_id: str, current_user: dict = Depends(auth.get_current_user)):
    """Get a public profile by user ID or email."""
    user = None
    # Try ObjectId first
    try:
        user = await database["users"].find_one({"_id": ObjectId(user_id)})
    except Exception:
        pass
    # Try email
    if not user:
        user = await database["users"].find_one({"email": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    fname = user.get("first_name", "") or ""
    lname = user.get("last_name", "") or ""
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": f"{fname} {lname}".strip() or user["email"],
        "first_name": fname,
        "last_name": lname,
        "title": user.get("title", ""),
        "company": user.get("company", ""),
        "location": user.get("location", ""),
        "bio": user.get("bio", ""),
        "skills": user.get("skills", []),
        "interests": user.get("interests", []),
        "careerGoals": user.get("careerGoals", ""),
        "avatar_url": user.get("avatar_url"),
        "avatar": f"{(fname or 'U')[0]}{(lname or 'U')[0]}".upper(),
        "profile_complete": bool(user.get("profile_complete"))
    }
