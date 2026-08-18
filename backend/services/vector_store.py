# backend/app/services/vector_store.py
"""
Vector Store Service for managing document embeddings in Pinecone
Compatible with the modern Pinecone SDK (v3+, package name 'pinecone')
"""

from pinecone import Pinecone, ServerlessSpec
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from typing import List, Tuple
import logging

from ..config import settings

logger = logging.getLogger(__name__)


class VectorStoreService:
    """Service for managing vector embeddings and similarity search"""
    
    # Google's embedding-001 model produces 768-dimensional vectors
    EMBEDDING_DIMENSION = 768

    def __init__(self):
        """Initialize Pinecone and embeddings"""
        # Initialize Pinecone client (modern SDK: no global init(), a client instance instead)
        self.pc = Pinecone(api_key=settings.PINECONE_API_KEY)

        index_name = settings.PINECONE_INDEX_NAME

        # Create the index automatically if it doesn't exist yet
        existing_indexes = [idx["name"] for idx in self.pc.list_indexes()]
        if index_name not in existing_indexes:
            logger.info(f"Index '{index_name}' not found, creating it...")
            self.pc.create_index(
                name=index_name,
                dimension=self.EMBEDDING_DIMENSION,
                metric="cosine",
                spec=ServerlessSpec(
                    cloud="aws",
                    region=settings.PINECONE_ENVIRONMENT or "us-east-1",
                ),
            )

        # Get index
        self.index = self.pc.Index(index_name)
        
        # Initialize embeddings
        self.embeddings = GoogleGenerativeAIEmbeddings(
    model="models/embedding-001",
    google_api_key=settings.GEMINI_API_KEY
)
        
        logger.info(f"Vector store initialized with index: {settings.PINECONE_INDEX_NAME}")
    
    def store_document_chunks(
        self,
        chunks: List[Tuple[str, dict]],
        namespace: str,
        document_id: int
    ) -> int:
        """Store document chunks in Pinecone vector database"""
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
            
            logger.info(f"Stored {len(vectors_to_upsert)} chunks in namespace: {namespace}")
            return len(vectors_to_upsert)
            
        except Exception as e:
            logger.error(f"Error storing document chunks: {str(e)}")
            raise
    
    def similarity_search(
        self,
        query: str,
        namespace: str,
        top_k: int = 5
    ) -> List[dict]:
        """Perform similarity search to find relevant document chunks"""
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
            
            logger.info(f"Found {len(relevant_chunks)} relevant chunks for query in namespace: {namespace}")
            return relevant_chunks
            
        except Exception as e:
            logger.error(f"Error performing similarity search: {str(e)}")
            raise
    
    def delete_namespace(self, namespace: str):
        """Delete all vectors in a namespace"""
        try:
            self.index.delete(delete_all=True, namespace=namespace)
            logger.info(f"Deleted namespace: {namespace}")
        except Exception as e:
            logger.error(f"Error deleting namespace: {str(e)}")
            raise
    
    def get_index_stats(self) -> dict:
        """Get statistics about the Pinecone index"""
        try:
            stats = self.index.describe_index_stats()
            return stats
        except Exception as e:
            logger.error(f"Error getting index stats: {str(e)}")
            raise