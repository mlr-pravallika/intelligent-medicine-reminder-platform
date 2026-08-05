from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models import User, Medicine
from app.schemas import ChatRequest
from app.ai_service import ask_ai

router = APIRouter(
    tags=["AI Assistant"]
)


@router.post("/assistant/chat")
async def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    print("Assistant endpoint called")

    medicines = (
        db.query(Medicine)
        .filter(
            Medicine.user_id == current_user.id
        )
        .all()
    )

    answer = ask_ai(
        request.message,
        medicines
    )

    return {
        "reply": answer
    }