# backend/app/services/vector_store.py
"""
Vector Store Service for managing document embeddings.
Supports Pinecone vector search with seamless in-memory fallback if Pinecone is unconfigured or unreachable.
"""

from typing import List, Tuple, Dict, Any
import logging
import math
import re

from ..config import settings

logger = logging.getLogger(__name__)


class LocalMemoryStore:
    """In-memory TF-IDF / Cosine Similarity store for fallback RAG searching"""

    def __init__(self):
        self.namespaces: Dict[str, List[Dict[str, Any]]] = {}

    def store_chunks(self, chunks: List[Tuple[str, dict]], namespace: str, document_id: int):
        if namespace not in self.namespaces:
            self.namespaces[namespace] = []

        for idx, (text, metadata) in enumerate(chunks):
            chunk_data = {
                "vector_id": f"doc_{document_id}_chunk_{idx}",
                "text": text,
                "document_id": document_id,
                "chunk_index": idx,
                "metadata": metadata
            }
            self.namespaces[namespace].append(chunk_data)
        return len(chunks)

    def search(self, query: str, namespace: str, top_k: int = 5) -> List[dict]:
        chunks = self.namespaces.get(namespace, [])
        if not chunks:
            return []

        query_terms = set(re.findall(r'\w+', query.lower()))
        if not query_terms:
            return [{"text": c["text"], "score": 0.5, "chunk_index": c["chunk_index"], "document_id": c["document_id"]} for c in chunks[:top_k]]

        results = []
        for chunk in chunks:
            text_terms = re.findall(r'\w+', chunk["text"].lower())
            if not text_terms:
                continue
            matches = sum(1 for t in query_terms if t in text_terms)
            score = matches / (math.sqrt(len(query_terms)) * math.sqrt(len(set(text_terms))) + 1e-5)
            results.append({
                "text": chunk["text"],
                "score": float(score),
                "chunk_index": chunk["chunk_index"],
                "document_id": chunk["document_id"]
            })

        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]

    def delete_namespace(self, namespace: str):
        if namespace in self.namespaces:
            del self.namespaces[namespace]


# Global fallback store
_local_store = LocalMemoryStore()


class VectorStoreService:
    """Service for managing vector embeddings and similarity search"""
    
    EMBEDDING_DIMENSION = 3072

    def __init__(self):
        """Initialize Pinecone and embeddings with fallback"""
        self.use_pinecone = False
        self.pc = None
        self.index = None
        self.embeddings = None

        if settings.PINECONE_API_KEY and settings.PINECONE_API_KEY != "your_pinecone_api_key_here":
            try:
                from pinecone import Pinecone, ServerlessSpec
                from langchain_google_genai import GoogleGenerativeAIEmbeddings

                self.pc = Pinecone(api_key=settings.PINECONE_API_KEY)
                index_name = settings.PINECONE_INDEX_NAME

                existing_indexes = [idx["name"] for idx in self.pc.list_indexes()]
                if index_name not in existing_indexes:
                    logger.info(f"Creating Pinecone index '{index_name}'...")
                    self.pc.create_index(
                        name=index_name,
                        dimension=self.EMBEDDING_DIMENSION,
                        metric="cosine",
                        spec=ServerlessSpec(
                            cloud="aws",
                            region=settings.PINECONE_ENVIRONMENT or "us-east-1",
                        ),
                    )

                self.index = self.pc.Index(index_name)
                
                if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your_google_api_key_here":
                    self.embeddings = GoogleGenerativeAIEmbeddings(
                        model="models/gemini-embedding-001",
                        google_api_key=settings.GEMINI_API_KEY,
                    )
                    self.use_pinecone = True
                    logger.info(f"Vector store initialized with Pinecone index: {index_name}")
            except Exception as e:
                logger.warning(f"Pinecone initialization failed ({str(e)}). Falling back to in-memory store.")
                self.use_pinecone = False
        else:
            logger.info("Pinecone API key not set. Operating in high-speed local memory vector store mode.")
    
    def store_document_chunks(
        self,
        chunks: List[Tuple[str, dict]],
        namespace: str,
        document_id: int
    ) -> int:
        """Store document chunks in Pinecone or local store"""
        if self.use_pinecone and self.index and self.embeddings:
            try:
                vectors_to_upsert = []
                for idx, (text, metadata) in enumerate(chunks):
                    embedding = self.embeddings.embed_query(text)
                    vector_id = f"doc_{document_id}_chunk_{idx}"
                    vector_metadata = {
                        "text": text,
                        "document_id": document_id,
                        "chunk_index": idx,
                        **metadata
                    }
                    vectors_to_upsert.append((vector_id, embedding, vector_metadata))
                
                batch_size = 100
                for i in range(0, len(vectors_to_upsert), batch_size):
                    batch = vectors_to_upsert[i:i + batch_size]
                    self.index.upsert(vectors=batch, namespace=namespace)
                
                _local_store.store_chunks(chunks, namespace, document_id)
                return len(vectors_to_upsert)
            except Exception as e:
                logger.error(f"Pinecone storage error: {str(e)}. Using local store.")
                return _local_store.store_chunks(chunks, namespace, document_id)
        else:
            return _local_store.store_chunks(chunks, namespace, document_id)
    
    def similarity_search(
        self,
        query: str,
        namespace: str,
        top_k: int = 5
    ) -> List[dict]:
        """Perform similarity search to find relevant document chunks"""
        if self.use_pinecone and self.index and self.embeddings:
            try:
                query_embedding = self.embeddings.embed_query(query)
                results = self.index.query(
                    vector=query_embedding,
                    namespace=namespace,
                    top_k=top_k,
                    include_metadata=True
                )
                
                relevant_chunks = []
                for match in results['matches']:
                    chunk_data = {
                        "text": match['metadata'].get('text', ''),
                        "score": match['score'],
                        "chunk_index": match['metadata'].get('chunk_index', 0),
                        "document_id": match['metadata'].get('document_id'),
                    }
                    relevant_chunks.append(chunk_data)
                
                return relevant_chunks
            except Exception as e:
                logger.error(f"Pinecone similarity search error: {str(e)}. Falling back to local search.")
                return _local_store.search(query, namespace, top_k)
        else:
            return _local_store.search(query, namespace, top_k)
    
    def delete_namespace(self, namespace: str):
        """Delete all vectors in a namespace"""
        if self.use_pinecone and self.index:
            try:
                self.index.delete(delete_all=True, namespace=namespace)
            except Exception as e:
                logger.error(f"Pinecone delete error: {str(e)}")
        _local_store.delete_namespace(namespace)
    
    def get_index_stats(self) -> dict:
        """Get statistics about vector store"""
        if self.use_pinecone and self.index:
            try:
                return self.index.describe_index_stats()
            except Exception:
                pass
        return {"total_vector_count": len(_local_store.namespaces), "mode": "local_memory"}