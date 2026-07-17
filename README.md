<div align="center">

# Prompt Enhancer + Code Generator

**An AI-powered development assistant that transforms natural language prompts into structured software specifications and generates production-quality source code using Google's Gemini API.**

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.x-000000?style=flat-square&logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-API-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2020-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)](https://developer.mozilla.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## Project Overview

Most AI code generators pass user prompts directly to a language model and return whatever it produces. The result is often unfocused, incomplete, or structurally inconsistent.

**Prompt Enhancer + Code Generator** solves this by introducing an intermediate **prompt enhancement** step. Before any code is generated, the user's natural language request is analyzed, classified by project type, and transformed into a structured software specification — complete with inferred features, architecture decisions, and implementation constraints. Only then is this enhanced specification sent to the Gemini model for code generation.

This two-stage pipeline produces significantly better output than a single-pass approach:

- Vague prompts are expanded into concrete specifications
- Project context (DSA, frontend, backend) shapes the enhancement strategy
- Language-specific idioms and conventions are enforced
- Style complexity (simple, moderate, complex) controls output depth

The result is a developer tool — not a chatbot.

---

## Features

- [x] **Intelligent Prompt Enhancement** — Transforms natural language into structured software specifications via Gemini
- [x] **Domain-Aware Project Classification** — DSA & Algorithms, Frontend Development, Backend Development
- [x] **Multi-Language Code Generation** — Python, Java, C, C++, JavaScript, TypeScript, HTML, SQL, R, Assembly, Bash, Ruby, Scala, Dart, Node.js
- [x] **Real-Time Generation Pipeline** — Live SSE-streamed stage indicators (Analyzing → Enhancing → Generating → Finalizing → Done)
- [x] **Syntax-Highlighted Code Editor** — Prism.js with dark/light themes, line numbers, and a fixed gutter
- [x] **Live Preview** — In-browser rendering of generated HTML/CSS/JS output in a sandboxed iframe
- [x] **Fullscreen Code Editor** — Dedicated modal with synchronized line numbers and syntax highlighting
- [x] **Developer Performance Metrics** — Backend-measured timing for prompt enhancement, code generation, and total execution
- [x] **Prompt History** — localStorage-backed generation history with restore, replay, and clear
- [x] **Code Continuation** — Automatic detection and continuation of truncated responses across multiple rounds
- [x] **Retry with Exponential Backoff** — Automatic retry on 503/UNAVAILABLE errors (up to 3 attempts)
- [x] **Theme Toggle** — Switch between dark and light Prism.js themes at runtime
- [x] **Copy to Clipboard** — One-click code copying
- [x] **Input Locking** — Prompt, project type, and language controls are locked during generation
- [x] **Responsive UI** — Adapts to desktop and mobile viewports
- [x] **Particle Background & Cursor Effects** — Canvas-based particle field with interactive cursor glow

---



## Technology Stack

| Layer | Technology |
|---|---|
| **Backend Framework** | Flask 3.x |
| **AI Model** | Google Gemini (via `google-genai` SDK) |
| **CORS** | Flask-CORS |
| **Streaming** | Server-Sent Events (SSE) |
| **Frontend** | Vanilla HTML5, CSS3, JavaScript (ES2020) |
| **Syntax Highlighting** | Prism.js (14 language grammars) |
| **Live Preview** | Sandboxed `<iframe>` with `srcdoc` |
| **Persistence** | Browser `localStorage` |
| **Visual Effects** | HTML5 Canvas (particle system) |

---

## Project Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                             │
│  index.html  ·  script.js  ·  style.css  ·  Prism.js       │
└──────────────────────┬──────────────────────────────────────┘
                       │  HTTP POST + SSE
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     Flask Backend                           │
│                       app.py                                │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────────────┐ │
│  │ /health    │  │ /generate   │  │ /generate-stream     │ │
│  │ GET        │  │ POST (JSON) │  │ POST (SSE)           │ │
│  └────────────┘  └──────┬──────┘  └──────────┬───────────┘ │
│                         │                    │              │
│              ┌──────────▼────────────────────▼──────────┐   │
│              │          config.py                       │   │
│              │  Settings · Temperatures · GenAI Client  │   │
│              └──────────┬──────────────────────┬────────┘   │
│                         │                      │            │
│              ┌──────────▼──────┐    ┌──────────▼──────┐     │
│              │  enhancer.py    │    │  generator.py   │     │
│              │  Prompt         │    │  Code           │     │
│              │  Enhancement    │    │  Generation     │     │
│              │  + Validation   │    │  + Continuation │     │
│              └────────┬────────┘    └────────┬────────┘     │
│                       │                      │              │
│                       ▼                      ▼              │
│              ┌─────────────────────────────────────────┐    │
│              │         Google Gemini API               │    │
│              └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Workflow

The generation pipeline follows this sequence:

```
User enters prompt
        │
        ▼
Select Project Type (DSA / Frontend / Backend)
        │
        ▼
Select Language (or auto-assigned for Frontend)
        │
        ▼
Click "Generate"
        │
        ├── Input controls lock
        ├── Pipeline UI activates
        │
        ▼
┌─ STAGE 1: ANALYZING ──────────────────────────┐
│  Validate prompt length, project type, language │
└────────────────────────────────────────────────┘
        │
        ▼
┌─ STAGE 2: ENHANCING ──────────────────────────┐
│  enhance_prompt() → Gemini API                 │
│  Transform user request into structured spec   │
│  Apply project directives + language directives │
│  Apply style policy (feature count, UI depth)  │
└────────────────────────────────────────────────┘
        │
        ▼
┌─ STAGE 3: GENERATING ─────────────────────────┐
│  generate_code() → Gemini API                  │
│  Send enhanced prompt with system instruction  │
│  Strip code fences from response               │
│  Detect truncation → auto-continue (up to 2x) │
└────────────────────────────────────────────────┘
        │
        ▼
┌─ STAGE 4: FINALIZING ─────────────────────────┐
│  Resolve final language label                  │
│  Compute timing metrics                        │
│  Bundle response payload                       │
└────────────────────────────────────────────────┘
        │
        ▼
┌─ STAGE 5: DONE ───────────────────────────────┐
│  Stream SSE "done" event with:                 │
│  • enhanced_prompt                             │
│  • generated_code                              │
│  • final_language                              │
│  • timings { enhancement, generation, total }  │
└────────────────────────────────────────────────┘
        │
        ▼
Frontend renders output
  ├── Enhanced Prompt panel (parsed into cards)
  ├── Code editor (syntax highlighted)
  ├── History entry saved
  └── Stats button populated
```

---

## Supported Project Types

### DSA & Algorithms

Generates algorithm implementations with:
- Problem goal, inputs/outputs, constraints, and edge cases
- Algorithm steps and time/space complexity analysis
- Clean function signatures and data structures
- Languages: **Python, Java, C, C++**

### Frontend Development

Generates complete single-file web applications with:
- Semantic HTML structure with inline `<style>` and `<script>`
- Responsive layout, modern UI styling, and subtle animations
- Interactive behaviors with vanilla JavaScript
- Language: **HTML + CSS + JavaScript** (auto-assigned)
- Live Preview enabled

### Backend Development

Generates server-side applications with:
- REST endpoints, data models, and validation rules
- Authentication/authorization patterns when applicable
- Error handling and HTTP status codes
- Languages: **Python** (Flask-style), **Node.js** (Express.js)

---

## Supported Programming Languages

| Language | Prism Grammar | File Label | Available For |
|---|---|---|---|
| Python | `python` | `main.py` | DSA, Backend |
| Java | `java` | `Main.java` | DSA |
| C | `c` | `main.c` | DSA |
| C++ | `cpp` | `main.cpp` | DSA |
| JavaScript | `javascript` | — | Enhancer only |
| TypeScript | `typescript` | — | Enhancer only |
| HTML + CSS + JS | `markup` | `index.html` | Frontend |
| SQL | `sql` | — | Enhancer only |
| R | `r` | — | Enhancer only |
| x86 Assembly | `nasm` | — | Enhancer only |
| Bash | `bash` | — | Enhancer only |
| Ruby | `ruby` | — | Enhancer only |
| Scala | `scala` | — | Enhancer only |
| Dart | `dart` | — | Enhancer only |
| Node.js | `javascript` | `server.js` | Backend |

> *"Enhancer only" means the language profile exists in `enhancer.py` for prompt enhancement but is not yet exposed in the frontend UI selectors.*

---

## Installation

### Prerequisites

- Python 3.10+
- A [Google Gemini API key](https://ai.google.dev)

### Setup

```bash
# Clone the repository
git clone https://github.com/your-username/prompt-enhancer-code-generator.git
cd prompt-enhancer-code-generator

# Install dependencies
pip install -r requirements.txt

# Set your Gemini API key
# Linux / macOS
export GEMINI_API_KEY="your-api-key-here"

# Windows (PowerShell)
$env:GEMINI_API_KEY = "your-api-key-here"

# Start the server
python app.py
```

The Flask server starts at `http://127.0.0.1:5000`.

### Access the Frontend

Open `index.html` directly in a browser — the frontend communicates with the Flask backend at `http://127.0.0.1:5000`.

---

## Configuration

All settings are managed in `config.py` via environment variables with sensible defaults.

| Variable | Default | Description |
|---|---|---|
| `GEMINI_API_KEY` | *(required)* | Google Gemini API key |
| `AI_MODEL` | `gemini-2.5-flash` | Gemini model name |
| `AI_TEMPERATURE` | `0.2` | Default sampling temperature |
| `AI_TEMPERATURE_DSA` | `0.1` | Temperature for DSA projects (lower = more deterministic) |
| `AI_TEMPERATURE_BACKEND` | `0.2` | Temperature for Backend projects |
| `AI_TEMPERATURE_FRONTEND` | `0.5` | Temperature for Frontend projects (higher = more creative) |
| `AI_MAX_TOKENS` | `32768` | Maximum response tokens |
| `APP_HOST` | `0.0.0.0` | Server bind address |
| `APP_PORT` | `5000` | Server port |
| `APP_DEBUG` | `true` | Flask debug mode |
| `PROMPT_MAX_CHARS` | `4000` | Maximum user prompt length |

### Temperature Strategy

Temperature is selected per project type to balance correctness and creativity:

- **DSA (0.1)** — Algorithms require deterministic, correct output
- **Backend (0.2)** — APIs need consistent structure with some flexibility
- **Frontend (0.5)** — UI generation benefits from creative variation

---

## API Endpoints

### `GET /health`

Health check endpoint.

**Response** `200`
```json
{
  "status": "ok",
  "service": "Prompt Enhancer + Code Generator"
}
```

---

### `POST /generate`

Synchronous endpoint. Enhances the prompt and generates code in a single request-response cycle.

**Request Body**
```json
{
  "prompt": "Build a student portal",
  "language": "Python",
  "project_type": "backend"
}
```

**Response** `200`
```json
{
  "success": true,
  "request_id": "uuid",
  "data": {
    "enhanced_prompt": "...",
    "generated_code": "...",
    "final_language": "Python"
  }
}
```

**Error Responses**

| Status | Condition |
|---|---|
| `400` | Empty prompt, prompt too long, missing project type, missing language |
| `502` | Enhancement or generation failed (API error, rate limit, invalid key) |
| `500` | Unhandled server error |

---

### `POST /generate-stream`

SSE streaming endpoint used by the frontend. Streams real-time pipeline stage events.

**Request Body** — Same as `/generate`.

**SSE Events**

| Stage | Payload | Description |
|---|---|---|
| `analyzing` | — | Input validation started |
| `enhancing` | — | Prompt enhancement started |
| `generating` | — | Code generation started |
| `finalizing` | — | Output assembly started |
| `done` | `{ enhanced_prompt, generated_code, final_language, timings }` | Complete result |
| `error` | `{ error: "message" }` | Pipeline failure |

**Timings Object** (included in `done`)
```json
{
  "enhancement": 2.34,
  "generation": 5.67,
  "total": 8.12
}
```

---

## Internal Working

### Prompt Enhancement (`enhancer.py`)

The enhancer transforms user input into a structured specification:

1. **Validate** — Check prompt length against `PROMPT_MAX_CHARS`
2. **Normalize** — Resolve style mode (Simple/Moderate/Complex) and project type
3. **Build Request** — Construct a detailed meta-prompt containing:
   - Project type profile (DSA/Frontend/Backend directives)
   - Language profile (idiom-specific instructions)
   - Style policy (feature count, UI depth, architecture, code tone)
   - Output format template
4. **Call Gemini** — Send the constructed prompt to the API
5. **Retry** — On 503/UNAVAILABLE errors, retry up to 3 times with exponential backoff (2s, 4s, 8s)

### Code Generation (`generator.py`)

The generator produces runnable source code:

1. **Build Prompt** — Prepend a code-only directive that forbids markdown, explanations, and fences
2. **System Instruction** — Configure the model with `"You generate complete runnable code only"`
3. **Call Gemini** — Generate code with language-specific config
4. **Strip Fences** — Remove any `` ``` `` code fences from the response
5. **Detect Truncation** — Check for:
   - `MAX_TOKENS` / `LENGTH` finish reasons
   - Unbalanced brackets `{}`, `()`, `[]`
   - Missing `</html>` closing tags
   - Trailing commas, colons, or escape characters
6. **Continue Generation** — If truncated, send the tail of the output (last 2000 chars) back to Gemini with continuation instructions, up to 2 additional rounds
7. **Merge** — Overlap-aware merge of continuation fragments to avoid duplication
8. **Retry** — Same exponential backoff strategy as the enhancer

### History (`script.js`)

- Stored in `localStorage` under the key `recentGenerations`
- Limited to the 10 most recent entries
- Each entry stores: user prompt, enhanced prompt, generated code, project type, language, timestamp
- Duplicate prompts update the existing entry (upsert)
- Restoring a history entry repopulates all input fields, output panels, and the code editor

### Developer Statistics

- Backend measures wall-clock time using `time.perf_counter()` for enhancement and generation phases
- Timings are bundled into the SSE `done` event
- Frontend displays a click-toggled popover on the Output page showing:
  - Prompt Enhancement duration
  - Code Generation duration
  - Total execution time

### Pipeline Visualization

- Five-stage SSE-synchronized indicator: Analyzing → Enhancing → Generating → Finalizing → Done
- Each stage transitions through `active` → `completed` states with animated pulse effects
- On failure, the failed stage shows a distinct error state

---

## Error Handling

| Layer | Error | Handling |
|---|---|---|
| **Validation** | Empty prompt | `400` error with message |
| **Validation** | Prompt too long | `400` with max length info |
| **Validation** | Missing project type | `400` error |
| **Validation** | Missing language (DSA/Backend) | `400` error |
| **API** | 503 / UNAVAILABLE | Retry up to 3× with exponential backoff |
| **API** | 429 / RESOURCE_EXHAUSTED | Immediate error: "API limit reached" |
| **API** | Invalid API key | Immediate error: "Invalid API key" |
| **API** | Model not found | Immediate error: "Invalid model name" |
| **API** | Empty response | `EnhancementError` / `GenerationError` |
| **Frontend** | Network failure | Error message displayed in UI |
| **Frontend** | SSE parse failure | Silently skipped, continues reading stream |

---

## Folder Structure

```
prompt-enhancer-code-generator/
├── app.py              # Flask application, routes, SSE streaming
├── config.py           # Settings, environment variables, GenAI client
├── enhancer.py         # Prompt enhancement pipeline
├── generator.py        # Code generation pipeline with continuation
├── index.html          # Frontend UI structure
├── script.js           # Frontend logic, history, pipeline, editor
├── style.css           # Styling, animations, themes, responsive layout
└── requirements.txt    # Python dependencies
```

---

## Future Scope

- **Multi-file generation** — Generate projects with separate files (e.g., `app.py` + `models.py` + `routes.py`)
- **Expose all language profiles in UI** — The backend already supports TypeScript, SQL, R, Assembly, Bash, Ruby, Scala, and Dart — connect them to frontend selectors
- **Streaming code output** — Stream generated code token-by-token to the editor instead of waiting for the full response
- **User accounts & cloud history** — Replace `localStorage` with server-side persistence
- **Code diff view** — Show side-by-side comparison when regenerating from an existing prompt
- **Export options** — Download generated code as `.zip` with proper file structure
- **Style selector** — Expose the Simple / Moderate / Complex style control in the frontend UI (backend already supports it)
- **Rate limiting** — Add Flask-Limiter for API abuse prevention in production deployments

---

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Test locally: `python app.py`
5. Commit with a clear message: `git commit -m "Add: your feature"`
6. Push to your fork: `git push origin feature/your-feature`
7. Open a Pull Request

Please ensure:
- No new dependencies are added without justification
- All existing features continue to work
- Code follows the existing patterns and conventions

---

## License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

**Built with** Flask · Google Gemini · Vanilla JS · Prism.js

</div>
