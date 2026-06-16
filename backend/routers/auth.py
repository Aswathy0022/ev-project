from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from models.db import get_db
from models.schemas import LoginRequest, SignupRequest, TokenResponse, UserOut
from services.auth_service import create_access_token, decode_token, get_user_by_id, login_user, signup_user
from services.history_service import seed_history_for_user

router = APIRouter(prefix="/auth", tags=["auth"])


def _user_out(user) -> UserOut:
    return UserOut(
        id=user.id,
        name=user.name,
        email=user.email,
        mode="admin" if user.is_admin else "user",
        is_admin=user.is_admin,
    )


def get_current_user(
    access_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
):
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(access_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = get_user_by_id(db, int(payload["sub"]))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.post("/signup", response_model=TokenResponse)
def signup(body: SignupRequest, response: Response, db: Session = Depends(get_db)):
    ok, msg, user = signup_user(db, body.name, body.email, body.password)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    seed_history_for_user(db, user.id)
    token = create_access_token({"sub": str(user.id)})
    response.set_cookie("access_token", token, httponly=True, samesite="lax", max_age=60 * 60 * 24 * 7)
    return TokenResponse(access_token=token, user=_user_out(user))


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, response: Response, db: Session = Depends(get_db)):
    ok, msg, user = login_user(db, body.email, body.password)
    if not ok:
        raise HTTPException(status_code=401, detail=msg)
    token = create_access_token({"sub": str(user.id)})
    response.set_cookie("access_token", token, httponly=True, samesite="lax", max_age=60 * 60 * 24 * 7)
    return TokenResponse(access_token=token, user=_user_out(user))


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "Logged out"}


@router.get("/me", response_model=UserOut)
def me(current_user=Depends(get_current_user)):
    return _user_out(current_user)
