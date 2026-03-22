# AI Agent + p5.js Visualizer

An extensible, dynamic visualization engine that uses an LLM (Gemini) to convert user prompts or data into a declarative JSON specification, which is then beautifully rendered by a generic p5.js engine.

## Architecture
- **Backend**: Express + `@google/genai` sdk. Uses structured outputs to guarantee JSON formatting.
- **Frontend**: Vite + Vanilla HTML/CSS/JS + p5.js. Features a glassmorphic dark-mode UI.
- **Shared**: Zod schemas defining the contract.

## Getting Started

### 1. Backend Setup
```bash
cd backend
npm install
copy .env.example .env
# Edit .env and insert your GEMINI_API_KEY
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open the Vite local server link in your browser and try a prompt like:
*"Draw a red pulsing node connected to a blue bouncing node. Add particles flowing along the line."*
