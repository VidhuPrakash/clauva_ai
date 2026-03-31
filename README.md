# Clauva AI

An AI-powered legal contract analysis platform. Upload a PDF contract and get instant natural language Q&A, automated risk scanning against 41 CUAD clause categories, and multilingual output — all backed by a RAG pipeline running on Groq LLMs and ChromaDB.

---

## Features

- **Contract Upload** — drag-and-drop PDF upload; text is extracted, split into legal clauses, embedded via `all-MiniLM-L6-v2`, and stored in ChromaDB + Supabase.
- **Natural Language Q&A** — ask any question about a contract; top-k chunks are retrieved, reranked via `CrossEncoder`, and passed to the LLM. Answers and source citations are saved to history.
- **AI Risk Scan** — every contract clause is semantically matched against the CUAD v1 knowledge base (41 lawyer-labeled clause types), LLM-verified, severity-rated (HIGH / MEDIUM / LOW), and returned with plain-English explanations.
- **Multilingual Output** — risk results can be translated into 7 languages (English, Hindi, Tamil, Malayalam, Kannada, Telugu, Arabic) via NLLB-200 on Hugging Face Inference API.
- **Admin Panel** — role-gated dashboard for managing users and contracts with full CRUD and usage stats.
- **Query History** — per-contract Q&A history persisted in Supabase with Row-Level Security.

---

## Tech Stack

| Layer            | Technology                                                                         |
| ---------------- | ---------------------------------------------------------------------------------- |
| Frontend         | Next.js 16 (App Router), React 19, TypeScript 5                                    |
| Styling          | Tailwind CSS v4, Radix UI, shadcn/ui, Framer Motion                                |
| State            | Zustand v5 with localStorage persistence                                           |
| Backend          | FastAPI 0.135, Python 3.11                                                         |
| Auth & DB        | Supabase (PostgreSQL + Auth + RLS)                                                 |
| Vector Store     | ChromaDB (local)                                                                   |
| Embeddings       | `sentence-transformers/all-MiniLM-L6-v2` (CPU)                                     |
| Reranker         | `CrossEncoder` (sentence-transformers)                                             |
| LLM              | Groq — `llama-3.3-70b-versatile` (Q&A), `llama-3.1-8b-instant` (risk verification) |
| PDF Parsing      | pdfplumber                                                                         |
| Translation      | `facebook/nllb-200-distilled-600M` via HF Inference API                            |
| Orchestration    | LangChain, LangGraph                                                               |
| Containerization | Docker (python:3.11-slim)                                                          |

---

## Project Structure

```
legalmind/
├── backend/                  # FastAPI application
│   ├── main.py               # App factory, CORS, router registration
│   ├── start.py              # Uvicorn entry point
│   ├── auth/                 # JWT validation, role enforcement
│   ├── core/                 # Startup tasks, risk rules, logger
│   ├── db/                   # Supabase client wrappers (anon, admin, user-scoped)
│   ├── module/               # Feature modules (router → controller → service)
│   │   ├── upload/           # POST /upload, GET /upload (paginated list)
│   │   ├── query/            # POST /query, GET /query/history/{id}
│   │   ├── risk/             # GET /risk-scan/{id}, GET /risk-scan/flags/{id}
│   │   ├── admin/            # /admin — RBAC-gated CRUD
│   │   └── profile/          # PATCH /me/profile
│   ├── services/             # Shared singletons
│   │   ├── embedder_service.py
│   │   ├── vector_service.py
│   │   ├── llm_service.py
│   │   ├── pdf_service.py
│   │   └── translation_service.py
│   ├── scripts/              # CLI utilities (build knowledge base, benchmarks, create admin)
│   ├── data/
│   │   └── CUAD_v1.json      # CUAD dataset — 41 clause categories
│   └── Dockerfile
└── frontend/                 # Next.js application
    ├── app/
    │   ├── (auth)/           # login, signup, forgot-password
    │   ├── home/             # dashboard, contract detail (Q&A + risk tabs), profile
    │   └── admin/            # admin dashboard, users, contracts
    ├── components/           # shared UI primitives, layout, auth panel
    ├── store/                # authStore, contractStore, readinessStore
    ├── lib/
    │   ├── api.ts            # Axios client with JWT interceptor
    │   └── supabase.ts
    └── middleware.ts         # Auth guards and redirects
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+ and pnpm
- A [Supabase](https://supabase.com) project
- A [Groq](https://console.groq.com) API key
- A [Hugging Face](https://huggingface.co) token (for embeddings and translation)

### Backend

```bash
cd backend
pip install -r requirements.txt
```

Copy `.env.example` to `.env` (or populate `.env` directly) with the values below, then start the server:

```bash
python start.py
```

The server runs on `http://localhost:8000`. On first boot, a background task loads the embedding model and populates the CUAD knowledge base into ChromaDB — poll `GET /ready` to track progress.

#### Required environment variables

| Variable                    | Description                                                        |
| --------------------------- | ------------------------------------------------------------------ |
| `SUPABASE_URL`              | Supabase project URL                                               |
| `SUPABASE_ANON_KEY`         | Supabase anon key                                                  |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (bypasses RLS)                           |
| `SUPABASE_JWT_SECRET`       | JWT secret from Supabase Settings → API                            |
| `GROQ_API_KEY`              | Groq API key                                                       |
| `HF_TOKEN`                  | Hugging Face token                                                 |
| `LLM_PROVIDER`              | `groq` \| `ollama` \| `hf` (default: `groq`)                       |
| `RISK_VERIFY_MODEL`         | Fast model for risk verification (default: `llama-3.1-8b-instant`) |
| `QA_MODEL`                  | Capable model for Q&A answers (default: `llama-3.3-70b-versatile`) |
| `CHROMA_PERSIST_DIR`        | ChromaDB data directory (default: `./chroma_db`)                   |
| `FRONTEND_URL`              | CORS allowed origin (default: `http://localhost:3000`)             |
| `PORT`                      | Server port (default: `8000`)                                      |

### Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

The app runs on `http://localhost:3000`. Set `NEXT_PUBLIC_API_URL=http://localhost:8000` in `frontend/.env.local`.

### Docker (Backend)

```bash
cd backend
docker build -t clauva-backend .
docker run -p 7860:7860 --env-file .env clauva-backend
```

---

## RAG Pipeline

Clauva AI is built around two distinct retrieval-augmented generation pipelines — one for open-ended Q&A and one for structured risk analysis — sharing the same embedding and vector infrastructure.

### Ingestion (runs once per upload)

```
PDF file
  │
  ▼  pdfplumber
Raw text
  │
  ▼  Regex-based legal clause splitter
     (WHEREAS · ARTICLE · Section · NOW THEREFORE · defined terms …)
Clause chunks                          ← domain-aware splitting, not naive token windows
  │
  ▼  sentence-transformers/all-MiniLM-L6-v2  (384-dim, CPU-optimised)
Dense embeddings
  │
  ├──▶  ChromaDB  — per-contract collection (vectors + chunk text + metadata)
  └──▶  Supabase  — contracts table (filename, page count, owner, timestamps)
```

> **Why per-contract collections?** Scoping each contract to its own ChromaDB collection means retrieval never bleeds across documents — no cross-contract hallucination, zero filtering overhead at query time.

---

### Pipeline 1 — Contract Q&A

A classic **Retrieve → Rerank → Generate** loop optimised for factual grounding:

```
User question
  │
  ▼  all-MiniLM-L6-v2  (same model — symmetric search)
Query embedding
  │
  ▼  ChromaDB cosine similarity  →  top-k candidates
     (k tuned per contract length)
Candidate chunks
  │
  ▼  CrossEncoder reranker  (sentence-transformers)
     Scores every (question, chunk) pair jointly — eliminates bi-encoder noise
Reranked chunks  ←  source citations preserved here
  │
  ▼  LangChain prompt  +  llama-3.3-70b-versatile  via Groq
     System: "Answer using ONLY the provided contract excerpts."
     Grounded answer  +  source paragraph references
  │
  ▼  Supabase  — query_history table  (persisted per contract, per user)
```

**Key design decisions:**

- **Two-stage retrieval** (bi-encoder fetch + cross-encoder rerank) gives near-reranker accuracy at bi-encoder speed — the cross-encoder only runs on the small candidate set, not the full corpus.
- **Citation plumbing** — chunk metadata flows all the way through to the response, so every answer links back to the exact contract paragraph.
- **70B model for Q&A** — `llama-3.3-70b-versatile` on Groq delivers GPT-4-class reasoning at ~300 tok/s; the larger context window handles multi-clause reasoning questions.

---

### Pipeline 2 — AI Risk Scan

A **dual-retrieval verification** architecture that cross-references the contract against a pre-built CUAD legal knowledge base:

```
Contract chunks  (from ingestion)
  │
  ▼  all-MiniLM-L6-v2  embeddings
  │
  ▼  ChromaDB cosine search  →  CUAD knowledge base collection
     (41 clause categories · 500+ labelled examples · built at startup from CUAD_v1.json)
Candidate CUAD matches  +  similarity score
  │
  ▼  Score threshold filter  →  drops low-confidence matches
Confirmed clause-type candidates
  │
  ▼  CUAD_SEVERITY_MAP  (risk_rules.py)
     Deterministic mapping: clause type  →  HIGH / MEDIUM / LOW
     (e.g. Unlimited Liability → HIGH · Renewal Term → LOW)
  │
  ▼  llama-3.1-8b-instant  via Groq  (14,400 RPD free tier)
     Verification prompt: "Does this clause actually contain [clause type]? YES/NO + reason"
     ← fast 8B model — binary classification, not generation
Verified risk flags
  │
  ├──▶  Supabase  — risk_flags table  (cached; subsequent calls skip re-scan)
  └──▶  translation_service  (optional)
           facebook/nllb-200-distilled-600M  via HF Inference API
           English  →  Hindi · Tamil · Malayalam · Kannada · Telugu · Arabic
```

**Key design decisions:**

- **Separate models for separate tasks** — the 8B instant model handles YES/NO verification at ~10× lower latency and cost than the 70B; the 70B is reserved for generation tasks that actually need it.
- **Knowledge base as a second vector index** — instead of prompting the LLM to classify clause types from scratch (expensive, inconsistent), semantic search against CUAD examples does the heavy lifting; the LLM only confirms.
- **Deterministic severity** — severity is assigned via a static map, not LLM judgement. This makes ratings auditable, reproducible, and unaffected by prompt drift.
- **Caching** — completed risk scans are persisted in Supabase. Re-opening a contract loads flags from the DB instantly; the full LLM pipeline only runs once.

---

### Startup: Knowledge Base Construction

On first boot, `core/startup.py` runs a background task that:

1. Loads `data/CUAD_v1.json` (41 clause categories, thousands of labelled examples)
2. Embeds examples in batches of 100 (memory-safe)
3. Stores them in a dedicated ChromaDB collection (`cuad_knowledge_base`)
4. Sets a `ready` flag — the `/ready` endpoint reflects this state

The frontend `ReadinessBar` polls `/ready` and blocks Q&A / risk-scan UI until the knowledge base is confirmed live.

---

### Model Selection Rationale

| Task              | Model                                 | Why                                                                                |
| ----------------- | ------------------------------------- | ---------------------------------------------------------------------------------- |
| Embeddings        | `all-MiniLM-L6-v2`                    | 384-dim, CPU-fast, strong semantic similarity for legal text, no API cost          |
| Reranking         | `CrossEncoder ms-marco-MiniLM-L-6-v2` | Joint query-document scoring eliminates false positives from bi-encoder ANN search |
| Q&A generation    | `llama-3.3-70b-versatile` (Groq)      | Best-in-class open reasoning, 128k context, ~300 tok/s on Groq infrastructure      |
| Risk verification | `llama-3.1-8b-instant` (Groq)         | Binary classification at ~10× lower latency; 14,400 RPD on Groq free tier          |
| Translation       | `nllb-200-distilled-600M` (HF API)    | 200-language model, distilled for speed, handles low-resource Indian languages     |

---

## API Reference

| Method  | Endpoint                         | Description                                |
| ------- | -------------------------------- | ------------------------------------------ |
| `GET`   | `/ready`                         | Backend readiness (model loaded, KB built) |
| `POST`  | `/upload`                        | Upload and process a PDF contract          |
| `GET`   | `/upload`                        | List contracts for the authenticated user  |
| `POST`  | `/query`                         | Ask a question about a contract            |
| `GET`   | `/query/history/{contract_id}`   | Q&A history for a contract                 |
| `GET`   | `/risk-scan/{contract_id}`       | Run (or return cached) risk scan           |
| `GET`   | `/risk-scan/flags/{contract_id}` | Retrieve stored risk flags                 |
| `PATCH` | `/me/profile`                    | Update user profile                        |
| `GET`   | `/admin/stats`                   | Platform usage stats (admin only)          |
| `GET`   | `/admin/users`                   | List all users (admin only)                |
| `GET`   | `/admin/contracts`               | List all contracts (admin only)            |

All protected endpoints require a `Authorization: Bearer <supabase_jwt>` header.

---

## Scripts

```bash
# Build / rebuild the CUAD knowledge base in ChromaDB
python scripts/build_knowledge_base.py

# Create an admin user in Supabase
python scripts/create_admin.py

# Benchmark embedding throughput
python scripts/benchmark_embeddings.py

# Evaluate risk-scan accuracy against CUAD labels
python scripts/evaluate_accuracy.py
```

---

## Development

This repo uses Husky + lint-staged for pre-commit checks:

- **Python** — `ruff check --fix` + `ruff format`
- **TypeScript** — `eslint --fix` + `prettier --write`

Commit messages follow the Conventional Commits spec via `commitizen` (`cz-git`).
