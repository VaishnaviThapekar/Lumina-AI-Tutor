import json
import re
from typing import List, Dict
import logging

from app.services.vector_store import VectorStoreService
from app.config import settings

logger = logging.getLogger(__name__)


class FlashcardGenerator:
    """Service for generating flashcards (front/back pairs) from document content"""

    def __init__(self):
        self.vector_store = VectorStoreService()
        self.llm = None
        if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your_google_api_key_here":
            try:
                from langchain_google_genai import ChatGoogleGenerativeAI
                self.llm = ChatGoogleGenerativeAI(
                    model="gemini-1.5-flash",
                    google_api_key=settings.GEMINI_API_KEY,
                    temperature=0.6,
                    convert_system_message_to_human=True
                )
            except Exception as e:
                logger.warning(f"LLM init failed in FlashcardGenerator: {str(e)}")

    def generate_flashcards(self, namespace: str, num_cards: int = 10) -> List[Dict]:
        """
        Generate flashcards from document content.
        """
        context = self._get_document_context(namespace)

        if self.llm:
            try:
                from langchain_core.messages import HumanMessage, SystemMessage
                system_prompt = (
                    "You are an expert study-flashcard writer. Create concise, high-quality "
                    "flashcards from the given study material. Each flashcard should test ONE "
                    "specific fact, definition, or concept. The front should be a short question "
                    "or term; the back should be a concise, accurate answer (1-3 sentences)."
                )

                messages = [
                    SystemMessage(content=system_prompt),
                    HumanMessage(content=f"""Based on the following content, generate {num_cards} flashcards:

CONTENT:
{context}

Return ONLY a valid JSON array. Each flashcard must have this exact format:
{{
    "front": "Question or term",
    "back": "Concise answer or definition"
}}""")
                ]

                response = self.llm.invoke(messages)
                cards = self._parse_response(response.content)
                if cards:
                    return cards[:num_cards]
            except Exception as e:
                logger.warning(f"[FlashcardGenerator] Error using LLM: {e}")

        # Fallback card generation from context
        return self._generate_fallback_flashcards(num_cards, context)

    def _get_document_context(self, namespace: str) -> str:
        """Get diverse representative content from the document"""
        query_terms = ["definition", "concept", "principle", "example", "key term"]
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

    def _parse_response(self, raw_content: str) -> List[Dict]:
        """Extract a JSON array from the LLM response, tolerating markdown fences"""
        cleaned = raw_content.strip()
        cleaned = re.sub(r"^```(json)?", "", cleaned)
        cleaned = re.sub(r"```$", "", cleaned)
        cleaned = cleaned.strip()

        cards = json.loads(cleaned)
        if not isinstance(cards, list):
            raise ValueError("Expected a JSON array of flashcards")

        validated = []
        for card in cards:
            if isinstance(card, dict) and "front" in card and "back" in card:
                validated.append({"front": card["front"], "back": card["back"]})

        return validated

    def _generate_fallback_flashcards(self, num_cards: int, context: str = "") -> List[Dict]:
        """Generate flashcards from document chunks directly"""
        lines = [line.strip() for line in context.split("\n") if len(line.strip()) > 20] if context else []
        cards = []
        for i in range(num_cards):
            line = lines[i % len(lines)] if lines else f"Key Concept {i+1}"
            cards.append({
                "front": f"Concept definition: {line[:35]}...",
                "back": f"Detailed principle: {line[:120]}..."
            })
        return cards