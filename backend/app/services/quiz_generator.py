from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
import json
from typing import List, Dict
from app.services.vector_store import VectorStoreService
from app.config import settings

settings = settings


class QuizGenerator:
    """Service for generating adaptive quizzes from document content"""
    
    def __init__(self):
        self.vector_store = VectorStoreService()
        self.llm = ChatOpenAI(
            model=settings.OPENAI_MODEL,
            openai_api_key=settings.OPENAI_API_KEY,
            temperature=0.8
        )
    
    def generate_quiz(
        self,
        namespace: str,
        num_questions: int = 5,
        difficulty: str = "mixed",
        focus_topics: List[str] = None
    ) -> List[Dict]:
        """
        Generate quiz questions from document content
        
        Args:
            namespace: Pinecone namespace for document
            num_questions: Number of questions to generate
            difficulty: easy, medium, hard, or mixed
            focus_topics: Optional list of topics to focus on
        
        Returns:
            List of quiz questions with options and answers
        """
        # Step 1: Get representative content from document
        context = self._get_document_context(namespace, focus_topics)
        
        # Step 2: Create quiz generation prompt
        system_prompt = self._create_quiz_prompt(difficulty, num_questions)
        
        # Step 3: Generate questions
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
        
        # Step 4: Parse and validate response
        try:
            questions = self._parse_quiz_response(response.content)
            return questions[:num_questions]
        except Exception as e:
            print(f"Error parsing quiz: {e}")
            return self._generate_fallback_quiz(num_questions)
    
    def _get_document_context(self, namespace: str, focus_topics: List[str] = None) -> str:
        """Get relevant content from document for quiz generation"""
        if focus_topics:
            # Search for specific topics
            all_chunks = []
            for topic in focus_topics:
                chunks = self.vector_store.similarity_search(
                    query=topic,
                    namespace=namespace,
                    top_k=3
                )
                all_chunks.extend(chunks)
        else:
            # Get diverse content using different query terms
            query_terms = ["definition", "concept", "principle", "example", "application"]
            all_chunks = []
            for term in query_terms:
                chunks = self.vector_store.similarity_search(
                    query=term,
                    namespace=namespace,
                    top_k=2
                )
                all_chunks.extend(chunks)
        
        # Combine and deduplicate
        seen_texts = set()
        unique_chunks = []
        for chunk in all_chunks:
            if chunk['text'] not in seen_texts:
                seen_texts.add(chunk['text'])
                unique_chunks.append(chunk['text'])
        
        return "\n\n".join(unique_chunks[:8])  # Limit to 8 chunks
    
    def _create_quiz_prompt(self, difficulty: str, num_questions: int) -> str:
        """Create system prompt for quiz generation"""
        difficulty_guidelines = {
            "easy": """- Focus on basic definitions and simple recall
- Use straightforward language
- Include obvious incorrect options
- Test fundamental understanding""",
            
            "medium": """- Mix definitions with application questions
- Require understanding of relationships between concepts
- Include plausible distractors
- Test comprehension and analysis""",
            
            "hard": """- Focus on application and synthesis
- Require critical thinking and analysis
- Include subtle distinctions in options
- Test deep understanding and problem-solving""",
            
            "mixed": """- Include a variety of difficulty levels
- Start with easier questions and progress to harder ones
- Balance recall, comprehension, and application
- Ensure comprehensive coverage"""
        }
        
        return f"""You are an expert educational assessment creator. Generate high-quality multiple-choice questions.

DIFFICULTY LEVEL: {difficulty.upper()}
{difficulty_guidelines.get(difficulty, difficulty_guidelines["mixed"])}

REQUIREMENTS:
1. Each question must be clear, unambiguous, and directly related to the content
2. Provide exactly 4 options (A, B, C, D)
3. Only one option should be clearly correct
4. Incorrect options should be plausible but distinctly wrong
5. Include a detailed explanation for each answer
6. Vary question types: definitions, applications, comparisons, scenarios
7. Ensure questions test understanding, not just memorization

RETURN FORMAT:
Return ONLY a JSON array. NO markdown, NO code blocks, NO additional text.
Start with [ and end with ]."""
    
    def _parse_quiz_response(self, response_text: str) -> List[Dict]:
        """Parse LLM response into structured quiz format"""
        # Clean response
        response_text = response_text.strip()
        
        # Remove markdown code blocks if present
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        
        # Parse JSON
        questions = json.loads(response_text)
        
        # Validate structure
        validated_questions = []
        for q in questions:
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
    
    def _generate_fallback_quiz(self, num_questions: int) -> List[Dict]:
        """Generate fallback quiz if parsing fails"""
        return [
            {
                "question": f"Sample question {i+1} (Error in quiz generation)",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correct_answer": 0,
                "explanation": "This is a fallback question due to generation error."
            }
            for i in range(num_questions)
        ]
