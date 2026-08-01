from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from typing import List, Dict, Tuple
from app.services.vector_store import VectorStoreService
from app.services.adaptive_engine import AdaptiveEngine
from app.config import settings

settings = settings


class RAGService:
    """
    Retrieval-Augmented Generation service
    Combines vector search with LLM for context-aware responses
    """
    
    def __init__(self):
        self.vector_store = VectorStoreService()
        self.adaptive_engine = AdaptiveEngine()
        
        # Initialize LLM
        self.llm = ChatOpenAI(
            model=settings.OPENAI_MODEL,
            openai_api_key=settings.OPENAI_API_KEY,
            temperature=0.7
        )
    
    def generate_response(
        self,
        query: str,
        namespace: str,
        competency_score: float,
        chat_history: List[Dict[str, str]] = None
    ) -> Tuple[str, List[str]]:
        """
        Generate response using RAG pipeline
        
        Args:
            query: User's question
            namespace: Pinecone namespace for document
            competency_score: Current competency score
            chat_history: Previous chat messages
        
        Returns:
            Tuple of (response_text, source_chunks)
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
        
        # Step 5: Prepare messages for LLM
        messages = [SystemMessage(content=system_prompt)]
        
        # Add chat history if available
        if chat_history:
            for msg in chat_history[-6:]:  # Last 6 messages for context
                if msg['role'] == 'user':
                    messages.append(HumanMessage(content=msg['content']))
                elif msg['role'] == 'assistant':
                    messages.append(AIMessage(content=msg['content']))
        
        # Add current query
        messages.append(HumanMessage(content=query))
        
        # Step 6: Generate response
        response = self.llm.invoke(messages)
        
        # Extract source references
        sources = [chunk['text'][:100] + "..." for chunk in relevant_chunks[:3]]
        
        return response.content, sources
    
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
