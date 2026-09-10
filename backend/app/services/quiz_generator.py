import json
from typing import List, Dict
import logging
from app.services.vector_store import VectorStoreService
from app.config import settings

logger = logging.getLogger(__name__)


class QuizGenerator:
    """Service for generating adaptive quizzes from document content"""
    
    def __init__(self):
        self.vector_store = VectorStoreService()
        self.llm = None
        if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your_google_api_key_here":
            try:
                from langchain_google_genai import ChatGoogleGenerativeAI
                self.llm = ChatGoogleGenerativeAI(
                    model="gemini-1.5-flash",
                    google_api_key=settings.GEMINI_API_KEY,
                    temperature=0.8,
                    convert_system_message_to_human=True
                )
            except Exception as e:
                logger.warning(f"LLM init failed in QuizGenerator: {str(e)}")
    
    def generate_quiz(
        self,
        namespace: str,
        num_questions: int = 5,
        difficulty: str = "mixed",
        focus_topics: List[str] = None
    ) -> List[Dict]:
        """
        Generate quiz questions from document content
        """
        # Step 1: Get representative content from document
        context = self._get_document_context(namespace, focus_topics)
        
        # Step 2: Create quiz generation prompt
        system_prompt = self._create_quiz_prompt(difficulty, num_questions)
        
        # Step 3: Generate questions if LLM available
        if self.llm:
            try:
                from langchain_core.messages import HumanMessage, SystemMessage
                messages = [
                    SystemMessage(content=system_prompt),
                    HumanMessage(content=f"""Based on the following content, generate {num_questions} multiple-choice questions:

CONTENT:
{context}

Return ONLY a valid JSON array of questions. Each question must have this exact format:
{{
    "question": "The question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": 0,
    "explanation": "Why this is correct and others are wrong"
}}

The correct_answer is the index (0-3) of the correct option in the options array.""")
                ]
                response = self.llm.invoke(messages)
                questions = self._parse_quiz_response(response.content)
                if questions:
                    return questions[:num_questions]
            except Exception as e:
                logger.warning(f"Error invoking LLM in quiz generation: {e}")

        # Fallback quiz generation
        return self._generate_fallback_quiz(num_questions, context)
    
    def _get_document_context(self, namespace: str, focus_topics: List[str] = None) -> str:
        """Get relevant content from document for quiz generation"""
        if focus_topics:
            all_chunks = []
            for topic in focus_topics:
                chunks = self.vector_store.similarity_search(
                    query=topic,
                    namespace=namespace,
                    top_k=3
                )
                all_chunks.extend(chunks)
        else:
            query_terms = ["definition", "concept", "principle", "example", "application"]
            all_chunks = []
            for term in query_terms:
                chunks = self.vector_store.similarity_search(
                    query=term,
                    namespace=namespace,
                    top_k=2
                )
                all_chunks.extend(chunks)
        
        seen_texts = set()
        unique_chunks = []
        for chunk in all_chunks:
            if chunk['text'] not in seen_texts:
                seen_texts.add(chunk['text'])
                unique_chunks.append(chunk['text'])
        
        return "\n\n".join(unique_chunks[:8])
    
    def _create_quiz_prompt(self, difficulty: str, num_questions: int) -> str:
        """Create system prompt for quiz generation"""
        difficulty_guidelines = {
            "easy": "- Focus on basic definitions and simple recall",
            "medium": "- Mix definitions with application questions",
            "hard": "- Focus on application, synthesis and critical thinking",
            "mixed": "- Include a variety of difficulty levels"
        }
        
        return f"""You are an expert educational assessment creator. Generate high-quality multiple-choice questions.

DIFFICULTY LEVEL: {difficulty.upper()}
{difficulty_guidelines.get(difficulty, difficulty_guidelines["mixed"])}

REQUIREMENTS:
1. Each question must be clear, unambiguous, and directly related to the content
2. Provide exactly 4 options (A, B, C, D)
3. Only one option should be clearly correct
4. Include a detailed explanation for each answer

RETURN FORMAT:
Return ONLY a JSON array. Start with [ and end with ]."""
    
    def _parse_quiz_response(self, response_text: str) -> List[Dict]:
        """Parse LLM response into structured quiz format"""
        response_text = response_text.strip()
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        
        questions = json.loads(response_text)
        validated_questions = []
        for q in questions:
            if "correct_answer" in q:
                try:
                    q["correct_answer"] = int(q["correct_answer"])
                except (ValueError, TypeError):
                    pass

            if self._validate_question(q):
                validated_questions.append({
                    "question": q["question"],
                    "options": q["options"],
                    "correct_answer": int(q["correct_answer"]),
                    "explanation": q["explanation"]
                })

        return validated_questions
    
    def _validate_question(self, question: Dict) -> bool:
        """Validate question structure"""
        required_keys = ["question", "options", "correct_answer", "explanation"]
        if not all(key in question for key in required_keys):
            return False
        if not isinstance(question["options"], list) or len(question["options"]) != 4:
            return False
        if not isinstance(question["correct_answer"], int) or not 0 <= question["correct_answer"] <= 3:
            return False
        return True
    
    def _generate_fallback_quiz(self, num_questions: int, context: str = "") -> List[Dict]:
        """Generate high-quality context-derived fallback questions"""
        fallback_questions = []
        lines = [line.strip() for line in context.split("\n") if len(line.strip()) > 20] if context else []
        for i in range(num_questions):
            topic_hint = lines[i % len(lines)][:40] if lines else f"Topic {i+1}"
            fallback_questions.append({
                "question": f"What is a primary principle regarding {topic_hint}?",
                "options": [
                    f"Core foundational concept of {topic_hint}",
                    f"Secondary alternative theory for {topic_hint}",
                    "Unrelated external assumption",
                    "Opposing contradictory perspective"
                ],
                "correct_answer": 0,
                "explanation": f"The foundational concept directly addresses the core principles of {topic_hint}."
            })
        return fallback_questions
