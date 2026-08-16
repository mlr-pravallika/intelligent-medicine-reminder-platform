from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models import User, Medicine
from app.schemas import ChatRequest
from app.ai_service import ask_ai


router = APIRouter(
    tags=["AI Assistant"],
)


@router.post("/assistant/chat")
def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Chat with MediCare AI using the logged-in patient's medicines.

    The route accepts:
        {"message": "..."}
    and returns:
        {"reply": "..."}
    """

    question = (
        request.message or ""
    ).strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail=(
                "Please enter a question for the AI assistant."
            ),
        )

    print(
        "Assistant endpoint called:",
        current_user.id,
    )

    medicines = (
        db.query(Medicine)
        .filter(
            Medicine.user_id ==
            current_user.id,
        )
        .order_by(
            Medicine.created_at.desc(),
        )
        .all()
    )

    try:
        answer = ask_ai(
            question,
            medicines,
        )

        return {
            "reply": str(
                answer or ""
            ).strip(),
        }

    except Exception as exc:
        print(
            "Assistant route error:",
            repr(exc),
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "The AI assistant could not process "
                "the request."
            ),
        )
