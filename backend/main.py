from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import get_connection

# The database schema is applied manually through the Supabase SQL Editor.
app = FastAPI(
    title="Fortnight API",
    description="API for managing Fortnight profiles and shifts with Supabase authentication",
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    redoc_url=None,
)

# =====================================================
# CORS CONFIGURATION
# Allows React frontend at http://localhost:5173 to call the API
# In production, restrict origins to your actual frontend domain
# =====================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative React dev server
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================
# ROUTERS
# Import and include route modules
# =====================================================
from auth import router as auth_router
from fortnight import router as fortnight_router

app.include_router(auth_router)
app.include_router(fortnight_router)


# =====================================================
# ROOT ENDPOINTS
# =====================================================
@app.get("/api")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to the Fortnight API",
        "docs": "/api/docs"
    }


@app.get("/api/health")
async def health():
    """Health check endpoint."""
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1")
        cur.close()
        conn.close()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)