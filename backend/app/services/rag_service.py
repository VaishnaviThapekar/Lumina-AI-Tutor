from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from typing import List, Dict, Tuple
import logging

from app.services.vector_store import VectorStoreService
from app.services.adaptive_engine import AdaptiveEngine
from app.config import settings

logger = logging.getLogger(__name__)


class RAGService:
    """
    Retrieval-Augmented Generation service
    Combines vector search with LLM for context-aware responses
    """
    
    def __init__(self):
        self.vector_store = VectorStoreService()
        self.adaptive_engine = AdaptiveEngine()
        self.llm = None

        if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your_google_api_key_here":
            try:
                self.llm = ChatGoogleGenerativeAI(
                    model="gemini-3.6-flash",
                    google_api_key=settings.GEMINI_API_KEY,
                    temperature=0.7,
                    convert_system_message_to_human=True
                )
            except Exception as e:
                logger.warning(f"LLM init failed ({str(e)}). Fallback mode enabled.")
    
    def generate_response(
        self,
        query: str,
        namespace: str,
        competency_score: float,
        chat_history: List[Dict[str, str]] = None
    ) -> Tuple[str, List[str]]:
        """
        Generate response using RAG pipeline
        """
        # Step 1: Retrieve relevant context
        relevant_chunks = self.vector_store.similarity_search(
            query=query,
            namespace=namespace,
            top_k=5
        )
        
        # Step 2: Prepare context from retrieved chunks
        context = self._format_context(relevant_chunks)
        
        # Step 3: Determine teaching mode
        teaching_mode = self.adaptive_engine.determine_teaching_mode(competency_score)
        
        # Step 4: Create system prompt with context and teaching mode
        system_prompt = self.adaptive_engine.get_system_prompt(teaching_mode, context)
        sources = [chunk['text'][:100] + "..." for chunk in relevant_chunks[:3]] if relevant_chunks else []
        
        # Step 5: Try generating response with LLM if available
        if self.llm:
            try:
                messages = []
                if chat_history:
                    for msg in chat_history[-6:]:
                        if msg['role'] == 'user':
                            messages.append(HumanMessage(content=msg['content']))
                        elif msg['role'] == 'assistant':
                            messages.append(AIMessage(content=msg['content']))

                messages.append(HumanMessage(
                    content=f"{system_prompt}\n\n---\n\nStudent's question: {query}"
                ))
                response = self.llm.invoke(messages)
                return response.content, sources
            except Exception as e:
                logger.warning(f"Gemini API invocation error: {str(e)}. Using adaptive fallback.")

        # Fallback response generator based on context & mode
        if relevant_chunks:
            primary_text = relevant_chunks[0]['text']
            if teaching_mode == 'socratic':
                fallback_msg = f"Based on your document:\n\n> \"{primary_text[:250]}...\"\n\n💡 **Socratic Guidance**: How do you think this key principle applies to *{query}*? Try explaining the connection in your own words!"
            elif teaching_mode == 'scaffolding':
                fallback_msg = f"Let's break down **{query}** step-by-step using your document:\n\n1. **Core Concept**: {primary_text[:200]}...\n2. **Key Insight**: Understanding this foundation allows you to solve more complex problems.\n\nWould you like me to clarify any step?"
            else:
                fallback_msg = f"Here is what your document says regarding **{query}**:\n\n{primary_text}\n\n*Competency Score: {int(competency_score * 100)}% (Mode: {teaching_mode.title()})*"
        else:
            fallback_msg = f"I evaluated your question about **{query}**. While no direct matching section was found in the current document, feel free to rephrase or upload related notes!"

        return fallback_msg, sources
    
    def _format_context(self, relevant_chunks: List[Dict]) -> str:
        """Format retrieved chunks into context string"""
        if not relevant_chunks:
            return "No specific context available from the document."
        
        context_parts = []
        for i, chunk in enumerate(relevant_chunks, 1):
            context_parts.append(f"[Source {i}]:\n{chunk['text']}\n")
        
        return "\n".join(context_parts)
    
    def evaluate_response_quality(
        self, 
        student_response: str, 
        expected_concepts: List[str]
    ) -> float:
        """
        Evaluate student response quality (for future enhancement)
        Returns score between 0 and 1
        """
        # Simple keyword matching - can be enhanced with semantic similarity
        response_lower = student_response.lower()
        matches = sum(1 for concept in expected_concepts if concept.lower() in response_lower)
        
        if not expected_concepts:
            return 0.5
        
        return min(matches / len(expected_concepts), 1.0)