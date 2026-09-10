import pytest
import os
import json
import time
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Set test environment
os.environ["ENVIRONMENT"] = "test"
os.environ["DATABASE_URL"] = "sqlite:///./test_lumina.db"
os.environ["JWT_SECRET_KEY"] = "test-secret-key-that-is-at-least-32-chars-long-for-tests"
os.environ["SECRET_KEY"] = "test-secret-key-that-is-at-least-32-chars-long-for-tests"
os.environ["RATE_LIMIT_ENABLED"] = "true"

from app.database import Base, get_db, User, Document, LearningSession, QuizAttempt, Flashcard, PasswordResetToken
from app.main import app
from app.utils.security import hash_password, create_access_token

# Setup test DB
TEST_DB_URL = "sqlite:///./test_lumina.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def user_a(client):
    db = TestingSessionLocal()
    user = User(
        username="usera",
        email="usera@example.com",
        hashed_password=hash_password("password123")
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(user.id, user.email)
    db.close()
    return {"id": user.id, "email": user.email, "token": token}

@pytest.fixture
def user_b(client):
    db = TestingSessionLocal()
    user = User(
        username="userb",
        email="userb@example.com",
        hashed_password=hash_password("password456")
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(user.id, user.email)
    db.close()
    return {"id": user.id, "email": user.email, "token": token}


# ==================== 1. AUTHENTICATION TESTS ====================

def test_signup_and_login_success(client):
    # Signup
    res = client.post("/api/auth/signup", json={
        "username": "newstudent",
        "email": "student@example.com",
        "password": "strongPassword123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "student@example.com"

    # Login
    login_res = client.post("/api/auth/login", json={
        "email": "student@example.com",
        "password": "strongPassword123"
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

def test_invalid_login_rejected(client, user_a):
    res = client.post("/api/auth/login", json={
        "email": user_a["email"],
        "password": "wrongpassword"
    })
    assert res.status_code == 401
    assert "Incorrect email or password" in res.json()["detail"]

def test_oauth_bypass_rejected_without_valid_token(client):
    # Attacker attempting to pass plain email
    res = client.post("/api/auth/oauth-login", json={
        "provider": "google",
        "token": "fake_unverified_token",
        "email": "victim@example.com"
    })
    assert res.status_code == 401
    assert "Invalid or unverified OAuth token" in res.json()["detail"]

def test_expired_or_invalid_jwt_rejected(client):
    res = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.token.value"})
    assert res.status_code == 401

def test_password_reset_persistent_token_flow(client, user_a):
    # 1. Request reset
    forgot_res = client.post("/api/forgot-password", json={"email": user_a["email"]})
    assert forgot_res.status_code == 200

    # 2. Check token in DB
    db = TestingSessionLocal()
    reset_record = db.query(PasswordResetToken).filter(PasswordResetToken.user_id == user_a["id"]).first()
    assert reset_record is not None
    assert reset_record.used is False
    token_hash = reset_record.token_hash
    db.close()


# ==================== 2. IDOR / BOLA AUTHORIZATION TESTS ====================

def test_user_a_cannot_access_user_b_document(client, user_a, user_b):
    db = TestingSessionLocal()
    doc_b = Document(
        user_id=user_b["id"],
        filename="b_private.pdf",
        file_path="uploads/b_private.pdf",
        pinecone_namespace="doc_b"
    )
    db.add(doc_b)
    db.commit()
    db.refresh(doc_b)
    doc_b_id = doc_b.id
    db.close()

    # User A tries to delete User B's document
    res = client.delete(f"/api/upload/documents/{doc_b_id}", headers={"Authorization": f"Bearer {user_a['token']}"})
    assert res.status_code == 404

    # User A tries to generate quiz from User B's document
    res = client.post("/api/quiz/generate", json={"document_id": doc_b_id, "num_questions": 5}, headers={"Authorization": f"Bearer {user_a['token']}"})
    assert res.status_code == 404

    # User A tries to create session on User B's document
    res = client.post("/api/chat/session", json={"document_id": doc_b_id}, headers={"Authorization": f"Bearer {user_a['token']}"})
    assert res.status_code == 404

def test_user_a_cannot_modify_user_b_session_or_quiz(client, user_a, user_b):
    db = TestingSessionLocal()
    doc_b = Document(user_id=user_b["id"], filename="b.pdf", file_path="uploads/b.pdf", pinecone_namespace="doc_b")
    db.add(doc_b)
    db.commit()

    session_b = LearningSession(user_id=user_b["id"], document_id=doc_b.id, competency_score=0.5)
    db.add(session_b)

    quiz_b = QuizAttempt(
        user_id=user_b["id"],
        document_id=doc_b.id,
        quiz_data=json.dumps([{"question": "Q1", "options": ["A", "B"], "correct_answer": 0, "explanation": "E"}]),
        score=0.0,
        total_questions=1,
        correct_answers=0,
        submitted=False
    )
    db.add(quiz_b)
    db.commit()
    session_b_id = session_b.id
    quiz_b_id = quiz_b.id
    db.close()

    # User A tries to submit User B's quiz
    res = client.post("/api/quiz/submit", json={"quiz_id": quiz_b_id, "session_id": session_b_id, "answers": [0]}, headers={"Authorization": f"Bearer {user_a['token']}"})
    assert res.status_code == 404

    # User A tries to send chat message to User B's session
    res = client.post("/api/chat/message", json={"session_id": session_b_id, "message": "hello"}, headers={"Authorization": f"Bearer {user_a['token']}"})
    assert res.status_code == 404


# ==================== 3. QUIZ SECURITY TESTS ====================

def test_quiz_does_not_leak_answer_key_before_submission(client, user_a):
    db = TestingSessionLocal()
    doc_a = Document(user_id=user_a["id"], filename="a.pdf", file_path="uploads/a.pdf", pinecone_namespace="doc_a")
    db.add(doc_a)
    db.commit()
    doc_id = doc_a.id
    db.close()

    res = client.post("/api/quiz/generate", json={"document_id": doc_id, "num_questions": 3}, headers={"Authorization": f"Bearer {user_a['token']}"})
    assert res.status_code == 200
    data = res.json()
    assert "questions" in data
    for q in data["questions"]:
        # Verify correct_answer and explanation are NOT present in the public response
        assert "correct_answer" not in q
        assert "explanation" not in q
        assert "question" in q
        assert "options" in q

def test_quiz_submission_validation_and_score_calc(client, user_a):
    db = TestingSessionLocal()
    doc_a = Document(user_id=user_a["id"], filename="a.pdf", file_path="uploads/a.pdf", pinecone_namespace="doc_a")
    db.add(doc_a)
    db.commit()

    session_a = LearningSession(user_id=user_a["id"], document_id=doc_a.id, competency_score=0.5)
    db.add(session_a)

    sample_questions = [
        {"question": "Q1", "options": ["A0", "A1", "A2", "A3"], "correct_answer": 1, "explanation": "Ans is 1"},
        {"question": "Q2", "options": ["B0", "B1", "B2", "B3"], "correct_answer": 0, "explanation": "Ans is 0"},
    ]
    quiz_attempt = QuizAttempt(
        user_id=user_a["id"],
        document_id=doc_a.id,
        quiz_data=json.dumps(sample_questions),
        score=0.0,
        total_questions=2,
        correct_answers=0,
        submitted=False
    )
    db.add(quiz_attempt)
    db.commit()
    quiz_id = quiz_attempt.id
    session_id = session_a.id
    db.close()

    # Invalid out of bounds answer index
    invalid_res = client.post("/api/quiz/submit", json={
        "quiz_id": quiz_id,
        "session_id": session_id,
        "answers": [1, 999]  # 999 is out of bounds
    }, headers={"Authorization": f"Bearer {user_a['token']}"})
    assert invalid_res.status_code == 400
    assert "Invalid answer index" in invalid_res.json()["detail"]

    # Valid submission: 1 correct (answer 1), 1 incorrect (answer 2 instead of 0) -> score = 0.5 (50%)
    valid_res = client.post("/api/quiz/submit", json={
        "quiz_id": quiz_id,
        "session_id": session_id,
        "answers": [1, 2]
    }, headers={"Authorization": f"Bearer {user_a['token']}"})
    assert valid_res.status_code == 200
    res_data = valid_res.json()
    assert res_data["score"] == 0.5
    assert res_data["correct_answers"] == 1
    assert res_data["total_questions"] == 2

    # Replay attack prevention: attempting to submit the same quiz again
    replay_res = client.post("/api/quiz/submit", json={
        "quiz_id": quiz_id,
        "session_id": session_id,
        "answers": [1, 0]
    }, headers={"Authorization": f"Bearer {user_a['token']}"})
    assert replay_res.status_code == 400
    assert "already been submitted" in replay_res.json()["detail"]


# ==================== 4. FILE UPLOAD SECURITY TESTS ====================

def test_upload_rejects_non_pdf(client, user_a):
    res = client.post(
        "/api/upload/",
        files={"file": ("malicious.txt", b"plain text content", "text/plain")},
        headers={"Authorization": f"Bearer {user_a['token']}"}
    )
    assert res.status_code == 400

def test_upload_rejects_spoofed_pdf_without_magic_bytes(client, user_a):
    res = client.post(
        "/api/upload/",
        files={"file": ("fake.pdf", b"not a real pdf content", "application/pdf")},
        headers={"Authorization": f"Bearer {user_a['token']}"}
    )
    assert res.status_code == 400
    assert "not a valid PDF" in res.json()["detail"]


# ==================== 5. ACCOUNT DELETION CLEANUP TESTS ====================

def test_account_deletion_cleans_up_all_resources(client, user_a):
    db = TestingSessionLocal()
    doc = Document(user_id=user_a["id"], filename="doc.pdf", file_path="uploads/test_delete.pdf", pinecone_namespace="doc_del")
    db.add(doc)
    db.commit()

    flashcard = Flashcard(user_id=user_a["id"], document_id=doc.id, front="F", back="B")
    db.add(flashcard)
    db.commit()
    db.close()

    # Delete account
    del_res = client.request(
        "DELETE",
        "/api/settings/account",
        json={"password": "password123"},
        headers={"Authorization": f"Bearer {user_a['token']}"}
    )
    assert del_res.status_code == 200

    # Verify user and all dependent records are gone
    db = TestingSessionLocal()
    assert db.query(User).filter(User.id == user_a["id"]).first() is None
    assert db.query(Document).filter(Document.user_id == user_a["id"]).first() is None
    assert db.query(Flashcard).filter(Flashcard.user_id == user_a["id"]).first() is None
    db.close()
