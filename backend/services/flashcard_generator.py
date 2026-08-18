from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
import json
import re
from typing import List, Dict

from app.services.vector_store import VectorStoreService
from app.config import settings


class FlashcardGenerator:
    """Service for generating flashcards (front/back pairs) from document content"""

    def __init__(self):
        self.vector_store = VectorStoreService()
        self.llm = ChatOpenAI(
            model=settings.OPENAI_MODEL,
            openai_api_key=settings.OPENAI_API_KEY,
            temperature=0.6
        )

    def generate_flashcards(self, namespace: str, num_cards: int = 10) -> List[Dict]:
        """
        Generate flashcards from document content.

        Args:
            namespace: Pinecone namespace for the document
            num_cards: Number of flashcards to generate

        Returns:
            List of dicts, each with "front" and "back" keys
        """
        context = self._get_document_context(namespace)

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

        try:
            cards = self._parse_response(response.content)
            return cards[:num_cards]
        except Exception as e:
            print(f"[FlashcardGenerator] Error parsing response: {e}")
            raise Exception(f"Could not generate flashcards: {e}")

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

        for card in cards:
            if "front" not in card or "back" not in card:
                raise ValueError("Each flashcard needs 'front' and 'back'")

        return cards
