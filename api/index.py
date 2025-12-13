"""
MBA Copilot - FastAPI Backend
A RAG-powered document Q&A system for MBA students.
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import io

# Initialize FastAPI
app = FastAPI(title="MBA Copilot API")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# Configuration
# =============================================================================

class Config:
    # OpenAI
    OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
    OPENAI_BASE_URL = os.environ.get("OPENAI_BASE_URL")  # Optional: for school endpoints
    EMBEDDING_MODEL = "text-embedding-3-small"
    CHAT_MODEL = "gpt-4o-mini"
    EMBEDDING_DIMENSIONS = 1536
    
    # Pinecone
    PINECONE_API_KEY = os.environ.get("PINECONE_API_KEY")
    PINECONE_INDEX = os.environ.get("PINECONE_INDEX", "mba-copilot")
    
    # RAG Settings
    CHUNK_SIZE = 1000
    CHUNK_OVERLAP = 200
    TOP_K = 5
    MIN_SCORE = 0.7
    
    # System Prompt - Customize this!
    SYSTEM_PROMPT = """You are an intelligent assistant for MBA students. Your role is to:
- Help students understand their course materials
- Explain concepts clearly and concisely
- Connect ideas across different readings
- Provide practical business examples when relevant

When answering questions:
1. Base your answers on the provided context from the student's documents
2. If the context doesn't contain relevant information, say so
3. Use clear, professional language appropriate for business school
4. Cite which documents you're drawing from when relevant"""

config = Config()

# =============================================================================
# Clients (lazy initialization for serverless)
# =============================================================================

_openai_client = None
_pinecone_index = None

def get_openai():
    global _openai_client
    if _openai_client is None:
        from openai import OpenAI
        _openai_client = OpenAI(
            api_key=config.OPENAI_API_KEY,
            base_url=config.OPENAI_BASE_URL
        )
    return _openai_client

def get_pinecone_index():
    global _pinecone_index
    if _pinecone_index is None:
        from pinecone import Pinecone
        pc = Pinecone(api_key=config.PINECONE_API_KEY)
        _pinecone_index = pc.Index(config.PINECONE_INDEX)
    return _pinecone_index

# =============================================================================
# Document Processing
# =============================================================================

def extract_text(file: UploadFile) -> str:
    """Extract text from uploaded file."""
    content = file.file.read()
    filename = file.filename.lower()
    
    if filename.endswith('.pdf'):
        import fitz  # PyMuPDF
        doc = fitz.open(stream=content, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text
    
    elif filename.endswith('.docx'):
        from docx import Document
        doc = Document(io.BytesIO(content))
        return "\n".join([para.text for para in doc.paragraphs])
    
    elif filename.endswith(('.txt', '.md', '.csv')):
        return content.decode('utf-8')
    
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {filename}")


def chunk_text(text: str) -> List[str]:
    """Split text into overlapping chunks."""
    chunks = []
    text = text.replace('\r\n', '\n').strip()
    
    if len(text) <= config.CHUNK_SIZE:
        return [text] if text else []
    
    start = 0
    while start < len(text):
        end = start + config.CHUNK_SIZE
        
        # Try to break at paragraph or sentence boundary
        if end < len(text):
            para_break = text.rfind('\n\n', start + config.CHUNK_SIZE // 2, end)
            if para_break > 0:
                end = para_break
            else:
                sent_break = text.rfind('. ', start + config.CHUNK_SIZE // 2, end)
                if sent_break > 0:
                    end = sent_break + 1
        
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        
        start = end - config.CHUNK_OVERLAP
        if start < 0:
            start = 0
    
    return chunks


def generate_document_id() -> str:
    """Generate unique document ID."""
    import time
    import random
    import string
    return f"doc_{int(time.time())}_{(''.join(random.choices(string.ascii_lowercase, k=6)))}"

# =============================================================================
# Embeddings
# =============================================================================

def generate_embedding(text: str) -> List[float]:
    """Generate embedding for a single text."""
    client = get_openai()
    response = client.embeddings.create(
        model=config.EMBEDDING_MODEL,
        input=text
    )
    return response.data[0].embedding


def generate_embeddings_batch(texts: List[str]) -> List[List[float]]:
    """Generate embeddings for multiple texts (more efficient)."""
    client = get_openai()
    response = client.embeddings.create(
        model=config.EMBEDDING_MODEL,
        input=texts
    )
    return [d.embedding for d in response.data]

# =============================================================================
# Pinecone Operations
# =============================================================================

def store_chunks(chunks: List[dict]):
    """Store chunks in Pinecone."""
    index = get_pinecone_index()
    
    # Batch upsert (Pinecone recommends batches of 100)
    batch_size = 100
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i + batch_size]
        vectors = [
            {
                "id": c["id"],
                "values": c["embedding"],
                "metadata": c["metadata"]
            }
            for c in batch
        ]
        index.upsert(vectors=vectors)


def query_similar(embedding: List[float], top_k: int = None) -> List[dict]:
    """Find similar chunks."""
    index = get_pinecone_index()
    
    results = index.query(
        vector=embedding,
        top_k=top_k or config.TOP_K,
        include_metadata=True
    )
    
    return [
        {
            "id": m.id,
            "score": m.score,
            "text": m.metadata.get("text", ""),
            "filename": m.metadata.get("filename", ""),
            "metadata": m.metadata
        }
        for m in results.matches
    ]


def delete_document(document_id: str):
    """Delete all chunks for a document."""
    index = get_pinecone_index()
    index.delete(filter={"document_id": {"$eq": document_id}})


def list_documents() -> List[dict]:
    """List all documents."""
    index = get_pinecone_index()
    
    # Query for first chunks (which have document metadata)
    results = index.query(
        vector=[0.0] * config.EMBEDDING_DIMENSIONS,
        top_k=1000,
        include_metadata=True,
        filter={"is_first_chunk": {"$eq": True}}
    )
    
    documents = []
    for m in results.matches:
        if m.metadata:
            documents.append({
                "id": m.metadata.get("document_id"),
                "filename": m.metadata.get("filename"),
                "chunks": m.metadata.get("total_chunks", 1),
                "uploaded_at": m.metadata.get("uploaded_at", "")
            })
    
    return documents

# =============================================================================
# RAG Pipeline
# =============================================================================

def generate_answer(question: str, context: str, history: List[dict] = None) -> str:
    """Generate answer using retrieved context."""
    client = get_openai()
    
    messages = [{"role": "system", "content": config.SYSTEM_PROMPT}]
    
    if context:
        messages.append({
            "role": "system",
            "content": f"Here is relevant information from the student's documents:\n\n{context}\n\nUse this to answer the question. Cite sources when appropriate."
        })
    else:
        messages.append({
            "role": "system",
            "content": "No relevant documents were found. Let the student know they should upload relevant materials, but still try to help with general knowledge."
        })
    
    # Add conversation history
    if history:
        for msg in history[-6:]:  # Last 6 messages
            messages.append({"role": msg["role"], "content": msg["content"]})
    
    messages.append({"role": "user", "content": question})
    
    response = client.chat.completions.create(
        model=config.CHAT_MODEL,
        messages=messages,
        temperature=0.7,
        max_tokens=1000
    )
    
    return response.choices[0].message.content

# =============================================================================
# API Endpoints
# =============================================================================

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = None

class ChatResponse(BaseModel):
    answer: str
    sources: List[dict]

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Chat with your documents."""
    try:
        # Generate query embedding
        query_embedding = generate_embedding(request.message)
        
        # Find similar chunks
        similar = query_similar(query_embedding)
        
        # Filter by minimum score
        relevant = [c for c in similar if c["score"] >= config.MIN_SCORE]
        
        # Build context
        if relevant:
            context = "\n\n---\n\n".join([
                f"[Source: {c['filename']}]\n{c['text']}"
                for c in relevant
            ])
        else:
            context = ""
        
        # Generate answer
        answer = generate_answer(request.message, context, request.history)
        
        # Format sources
        sources = [
            {
                "text": c["text"][:200] + "..." if len(c["text"]) > 200 else c["text"],
                "score": c["score"],
                "filename": c["filename"]
            }
            for c in relevant
        ]
        
        return ChatResponse(answer=answer, sources=sources)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/upload")
async def upload(file: UploadFile = File(...)):
    """Upload and process a document."""
    try:
        # Extract text
        text = extract_text(file)
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from file")
        
        # Chunk text
        text_chunks = chunk_text(text)
        if not text_chunks:
            raise HTTPException(status_code=400, detail="No content to process")
        
        # Generate embeddings
        embeddings = generate_embeddings_batch(text_chunks)
        
        # Prepare for storage
        document_id = generate_document_id()
        from datetime import datetime
        uploaded_at = datetime.utcnow().isoformat()
        
        chunks = []
        for i, (text_chunk, embedding) in enumerate(zip(text_chunks, embeddings)):
            chunks.append({
                "id": f"{document_id}_chunk_{i}",
                "embedding": embedding,
                "metadata": {
                    "text": text_chunk,
                    "document_id": document_id,
                    "filename": file.filename,
                    "chunk_index": i,
                    "total_chunks": len(text_chunks),
                    "uploaded_at": uploaded_at,
                    "is_first_chunk": i == 0
                }
            })
        
        # Store in Pinecone
        store_chunks(chunks)
        
        return {
            "success": True,
            "document_id": document_id,
            "filename": file.filename,
            "chunks": len(text_chunks)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/documents")
async def get_documents():
    """List all uploaded documents."""
    try:
        documents = list_documents()
        return {"documents": documents}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/documents/{document_id}")
async def remove_document(document_id: str):
    """Delete a document."""
    try:
        delete_document(document_id)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok"}


# For local development with uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
