"""
Compatibility module re-exporting from app.api.upload
Ensures zero duplication, streaming size checks, and atomic vector store transactions.
"""
from app.api.upload import router, upload_document, list_documents, delete_document, sanitize_filename

__all__ = [
    "router",
    "upload_document",
    "list_documents",
    "delete_document",
    "sanitize_filename",
]
