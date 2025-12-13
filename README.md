# MBA Copilot 🎓

Your personal AI assistant for MBA coursework. Upload your course materials and chat with them using RAG (Retrieval-Augmented Generation).

**Stack:** Python (FastAPI) backend + TypeScript/React frontend + Tailwind CSS

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FYOUR_USERNAME%2Fmba-copilot&env=OPENAI_API_KEY,PINECONE_API_KEY&envDescription=API%20keys%20for%20OpenAI%20and%20Pinecone&envLink=https%3A%2F%2Fgithub.com%2FYOUR_USERNAME%2Fmba-copilot%23-quick-start-for-students&project-name=mba-copilot&repository-name=mba-copilot)

---

## 📚 Table of Contents

- [For Students: Quick Start](#-quick-start-for-students)
- [For Instructors: Setup & GitHub](#-for-instructors-complete-setup)
- [Local Development](#-local-development)
- [Project Structure](#-project-structure)
- [Customization](#-customization)
- [Troubleshooting](#-troubleshooting)

---

## 🚀 Quick Start (For Students)

### Step 1: Get API Keys (5 minutes)

**OpenAI API Key:**
1. Go to [platform.openai.com](https://platform.openai.com/api-keys)
2. Sign in or create account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)

**Pinecone API Key:**
1. Go to [app.pinecone.io](https://app.pinecone.io/)
2. Create a free account
3. Click "API Keys" in the sidebar
4. Copy your API key

### Step 2: Create Pinecone Index (2 minutes)

In the Pinecone console:
1. Click **"Create Index"**
2. **Name:** `mba-copilot`
3. **Dimensions:** `1536`
4. **Metric:** `cosine`
5. Click **"Create Index"**

### Step 3: Deploy (3 minutes)

1. Click the **"Deploy with Vercel"** button above
2. Connect your GitHub account
3. Enter your API keys when prompted
4. Click **Deploy**

**Done!** Your app will be live at `https://your-project.vercel.app`

---

## 👨‍🏫 For Instructors: Complete Setup

This section walks you through setting up the template on GitHub so students can deploy it.

### Prerequisites

- [Git](https://git-scm.com/downloads) installed
- [pyenv](https://github.com/pyenv/pyenv#installation) installed
- [Node.js 18+](https://nodejs.org/) installed
- Make (comes with macOS/Linux, or install via `choco install make` on Windows)
- A [GitHub](https://github.com/) account
- A code editor (VS Code recommended)

### Step 1: Create GitHub Repository

**Option A: Via GitHub Website (Easier)**

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `mba-copilot`
3. Description: "Personal AI copilot for MBA students"
4. Choose **Public** (so students can fork it)
5. **Don't** initialize with README (we'll push our own)
6. Click **Create repository**
7. Keep this page open - you'll need the URL

**Option B: Via Terminal**

```bash
# Install GitHub CLI if you haven't
brew install gh  # macOS
# or visit https://cli.github.com/

# Login to GitHub
gh auth login

# Create repo
gh repo create mba-copilot --public --description "Personal AI copilot for MBA students"
```

### Step 2: Clone and Set Up Locally

```bash
# Navigate to where you want the project
cd ~/Projects  # or wherever you keep code

# Clone your empty repo
git clone https://github.com/YOUR_USERNAME/mba-copilot.git
cd mba-copilot

# Copy the template files into this directory
# (Unzip the template you downloaded and copy all files here)
```

Or if starting fresh:

```bash
# Initialize the project in an existing directory
cd mba-copilot
git init
git remote add origin https://github.com/YOUR_USERNAME/mba-copilot.git
```

### Step 3: Install Dependencies

```bash
# This installs Python (via pyenv), creates venv, installs Python + Node deps
make setup
```

This will:
- Install Python 3.11.9 via pyenv (if not present)
- Create a virtualenv named `mba-copilot-3.11.9`
- Install Poetry and all Python dependencies
- Install Node.js dependencies

### Step 4: Set Up Environment Variables

```bash
# Copy the example env file
cp .env.example .env.local

# Edit with your editor
code .env.local  # VS Code
# or
nano .env.local  # Terminal
```

Add your keys:
```
OPENAI_API_KEY=sk-your-actual-key
PINECONE_API_KEY=your-actual-pinecone-key
```

### Step 5: Test Locally

```bash
# Start both frontend and backend
make dev-all
```

You should see:
```
*** Starting both frontend and backend
Frontend: http://localhost:3000
Backend:  http://localhost:8000
```

**Open http://localhost:3000** in your browser.

**Test it:**
1. Upload a PDF or text file
2. Wait for "X chunks indexed" message
3. Ask a question about the document

(Press Ctrl+C to stop both servers)

### Step 6: Push to GitHub

Once everything works locally:

```bash
# Add all files
git add .

# Commit
git commit -m "Initial commit: MBA Copilot template"

# Push to GitHub
git push -u origin main
```

### Step 7: Update the Deploy Button

Edit `README.md` and replace `YOUR_USERNAME` with your actual GitHub username in the deploy button URL:

```markdown
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FYOUR_ACTUAL_USERNAME%2Fmba-copilot&env=OPENAI_API_KEY,PINECONE_API_KEY&envDescription=API%20keys%20for%20OpenAI%20and%20Pinecone&envLink=https%3A%2F%2Fgithub.com%2FYOUR_ACTUAL_USERNAME%2Fmba-copilot%23-quick-start-for-students&project-name=mba-copilot&repository-name=mba-copilot)
```

Commit and push:
```bash
git add README.md
git commit -m "Update deploy button URL"
git push
```

### Step 8: Test the Deploy Flow

1. Open your repo in a **private/incognito browser window**
2. Click the "Deploy with Vercel" button
3. Walk through the flow as a student would
4. Verify the deployed app works

---

## 💻 Local Development

### Prerequisites

- [pyenv](https://github.com/pyenv/pyenv) - Python version management
- [Node.js 18+](https://nodejs.org/)
- Make (comes with macOS/Linux)

### Quick Start

```bash
# One-time setup (installs Python 3.11, creates venv, installs all deps)
make setup

# Start both servers
make dev-all
```

Or run them separately:
```bash
# Terminal 1: Backend
make dev-api

# Terminal 2: Frontend  
make dev
```

### Available Make Commands

```bash
make help        # Show all commands
make setup       # Install everything
make dev-all     # Start both servers
make dev         # Frontend only
make dev-api     # Backend only
make format      # Format Python code
make lint        # Lint all code
make clean       # Remove build artifacts
make nuke        # Full reset (removes venv + node_modules)
```

### How Local Development Works

```
┌─────────────────────────────────────────┐
│         http://localhost:3000           │
│              (Next.js)                  │
│                                         │
│  Your browser talks to Next.js          │
│  Next.js proxies /api/* requests        │
│                                         │
└─────────────────────────────────────────┘
                    │
                    │ /api/* requests
                    ▼
┌─────────────────────────────────────────┐
│         http://localhost:8000           │
│            (FastAPI/Python)             │
│                                         │
│  Handles all backend logic:             │
│  • Document processing                  │
│  • Embeddings                           │
│  • Pinecone operations                  │
│  • Chat completions                     │
└─────────────────────────────────────────┘
```

The `next.config.js` file proxies `/api/*` requests to the Python backend during development.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | Your OpenAI API key |
| `PINECONE_API_KEY` | Yes | Your Pinecone API key |
| `OPENAI_BASE_URL` | No | Custom OpenAI endpoint (for school access) |
| `PINECONE_INDEX` | No | Index name (default: `mba-copilot`) |

### Useful Commands

```bash
# Start frontend only
npm run dev

# Start backend only
npm run dev:api

# Start both (requires concurrently)
npm run dev:all

# Build for production
npm run build

# Lint code
npm run lint

# Create Python venv
npm run setup
```

---

## 📁 Project Structure

```
mba-copilot/
├── api/
│   └── index.py              # Python backend (FastAPI)
├── app/
│   ├── layout.tsx            # Next.js layout
│   ├── page.tsx              # Main UI component
│   ├── globals.css           # Tailwind + custom styles
│   └── types.ts              # TypeScript types
├── Makefile                  # Development commands
├── pyproject.toml            # Python dependencies (Poetry)
├── package.json              # Node dependencies
├── next.config.js            # Next.js config (API proxy)
├── tailwind.config.ts        # Tailwind configuration
├── tsconfig.json             # TypeScript configuration
├── vercel.json               # Vercel deployment config
├── .env.example              # Environment template
└── README.md
```

---

## ⚙️ Customization

### Change the AI Model

In `api/index.py`, find the `Config` class:

```python
CHAT_MODEL = "gpt-4o-mini"    # Default: good balance
# CHAT_MODEL = "gpt-4o"       # More capable, higher cost
# CHAT_MODEL = "gpt-3.5-turbo"  # Fastest, lowest cost
```

### Customize the System Prompt

Edit `SYSTEM_PROMPT` in `api/index.py`:

```python
SYSTEM_PROMPT = """You are an intelligent assistant for MBA students...
```

### Adjust RAG Settings

```python
CHUNK_SIZE = 1000      # Characters per chunk
CHUNK_OVERLAP = 200    # Overlap between chunks  
TOP_K = 5              # Chunks to retrieve
MIN_SCORE = 0.7        # Minimum similarity (0-1)
```

### Change Colors

Edit `tailwind.config.ts` to change the Columbia Blue palette:

```typescript
colors: {
  columbia: {
    500: '#0c87f2',  // Primary
    600: '#006fcf',  // Darker
    // ...
  },
},
```

---

## 🔧 Troubleshooting

### Local Development Issues

**"pyenv: command not found"**
```bash
# macOS
brew install pyenv pyenv-virtualenv

# Add to ~/.zshrc or ~/.bashrc:
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"
eval "$(pyenv virtualenv-init -)"
```

**"Cannot connect to backend"**
- Make sure you ran `make dev-all` or `make dev-api`
- Check that port 8000 is not in use: `lsof -i :8000`
- Verify `.env.local` exists with valid API keys

**"Module not found" in Python**
```bash
make nuke
make setup
```

**"CORS error"**
- Access via `localhost:3000`, not `127.0.0.1:3000`

### Deployment Issues

**"No relevant documents found"**
- Upload documents first
- Check Pinecone console to verify index exists
- Ensure index has dimension 1536

**"Upload failed"**
- Check file size (max ~10MB)
- Try a different file format
- Check Vercel function logs

**"API errors"**
- Verify API keys in Vercel environment settings
- Check Vercel function logs for details

### Getting Help

1. Check the Vercel function logs for error details
2. Open an issue on this repository
3. Ask in the course discussion forum

---

## 💰 Cost Estimates

| Service | Free Tier | Typical Usage |
|---------|-----------|---------------|
| **Pinecone** | 2GB storage, 1M reads/month | $0 |
| **OpenAI** | Pay-as-you-go | $1-5/semester |
| **Vercel** | Hobby plan free | $0 |

---

## 📝 License

MIT - Use and modify freely for your own learning!

---

*Built for Columbia Business School's "Generative AI for Business" course.*
