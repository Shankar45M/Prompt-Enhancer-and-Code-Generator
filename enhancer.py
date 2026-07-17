"""Prompt enhancement helpers for code generation."""

import time
from typing import Optional

from google import genai

from config import get_genai_client, log_genai, settings


class EnhancementError(Exception):
    """Raised when prompt enhancement fails."""


STYLE_ALIASES = {
    "simple": "SIMPLE",
    "basic": "SIMPLE",
    "beginner": "SIMPLE",
    "moderate": "MODERATE",
    "medium": "MODERATE",
    "balanced": "MODERATE",
    "complex": "COMPLEX",
    "advanced": "COMPLEX",
    "expert": "COMPLEX",
}

STYLE_POLICY = {
    "SIMPLE": {
        "feature_count": "4-6",
        "total_bullets": "8-12",
        "ui_depth": "simple and clear",
        "architecture": "single file or minimal modules",
        "code_tone": "beginner-friendly clarity",
    },
    "MODERATE": {
        "feature_count": "6-8",
        "total_bullets": "10-14",
        "ui_depth": "polished and modern",
        "architecture": "modular functions and clean separation",
        "code_tone": "balanced readability and efficiency",
    },
    "COMPLEX": {
        "feature_count": "8-12",
        "total_bullets": "12-18",
        "ui_depth": "advanced UI with animations",
        "architecture": "modular, production-like structure",
        "code_tone": "optimized and scalable",
    },
}

PROJECT_TYPE_ALIASES = {
    "dsa": "DSA",
    "algorithms": "DSA",
    "dsa & algorithms": "DSA",
    "frontend": "FRONTEND",
    "frontend development": "FRONTEND",
    "backend": "BACKEND",
    "backend development": "BACKEND",
}

PROJECT_TYPE_PROFILES = {
    "DSA": {
        "label": "DSA & Algorithms",
        "directives": (
            "Focus on algorithms, data structures, and problem-solving steps",
            "Include clear input/output expectations and edge cases",
            "Require time and space complexity in the spec",
        ),
        "format": (
            "Algorithm Spec:\n"
            "- Problem goal\n"
            "- Inputs and outputs\n"
            "- Constraints and edge cases\n"
            "- Algorithm steps\n"
            "- Time/space complexity\n"
            "Implementation:\n"
            "- Function signatures and data structures\n"
        ),
    },
    "FRONTEND": {
        "label": "Frontend Development",
        "directives": (
            "Infer UI sections, navigation, cards, and forms where relevant",
            "Require responsive layout and modern styling",
            "Include interactive behaviors and subtle animations",
            "Return a single HTML file with inline CSS and JavaScript",
        ),
        "format": (
            "App Spec:\n"
            "- Page goal and primary sections\n"
            "- Components (cards, tables, forms, nav)\n"
            "UI/UX:\n"
            "- Layout, typography, color palette\n"
            "- Responsive behavior and animations\n"
            "Interactions:\n"
            "- UI behaviors and state handling\n"
        ),
    },
    "BACKEND": {
        "label": "Backend Development",
        "directives": (
            "Define REST endpoints, data models, and validation rules",
            "Include authentication/authorization when applicable",
            "Specify error handling and status codes",
            "If language is Python use Flask-style APIs; if Node.js use Express.js",
        ),
        "format": (
            "Service Spec:\n"
            "- API purpose and core resources\n"
            "- Endpoints and HTTP methods\n"
            "Data Model:\n"
            "- Entities, fields, and relationships\n"
            "Implementation:\n"
            "- Middleware, auth, validation, error handling\n"
        ),
    },
}

LANGUAGE_PROFILES = {
    "python": {
        "prompt_name": "Python",
        "category": "Programming Languages",
        "kind": "general",
        "directives": (
            "Use Pythonic conventions and standard library",
            "Prefer clear function structure and naming",
        ),
    },
    "c": {
        "prompt_name": "C",
        "category": "System Programming",
        "kind": "systems",
        "directives": (
            "Use standard C (C11) with required headers",
            "Avoid nonportable extensions unless requested",
        ),
    },
    "cpp": {
        "prompt_name": "C++",
        "category": "System Programming",
        "kind": "systems",
        "directives": (
            "Use modern C++ (C++17) and STL containers",
            "Prefer RAII and clear ownership",
        ),
    },
    "java": {
        "prompt_name": "Java",
        "category": "Programming Languages",
        "kind": "general",
        "directives": (
            "Use standard JDK APIs and clean class structure",
            "Include a main method when runnable output is expected",
        ),
    },
    "javascript": {
        "prompt_name": "JavaScript",
        "category": "Web Development",
        "kind": "web",
        "directives": (
            "Use modern ES2020 syntax and browser-safe APIs",
            "Keep DOM logic straightforward if UI is requested",
        ),
    },
    "typescript": {
        "prompt_name": "TypeScript",
        "category": "Web Development",
        "kind": "web",
        "directives": (
            "Use explicit types where they add clarity",
            "Keep DOM logic straightforward if UI is requested",
        ),
    },
    "html": {
        "prompt_name": "HTML with inline CSS and JavaScript",
        "category": "Web Development",
        "kind": "web_inline",
        "directives": (
            "Return a complete HTML document with inline <style> and <script>",
            "Use responsive layout and modern UI styling",
            "Include interactive behavior with vanilla JavaScript",
        ),
    },
    "sql": {
        "prompt_name": "SQL",
        "category": "Data/Scientific",
        "kind": "data",
        "directives": (
            "Use ANSI SQL where possible",
            "State schema assumptions if needed",
        ),
    },
    "r": {
        "prompt_name": "R",
        "category": "Data/Scientific",
        "kind": "data",
        "directives": (
            "Prioritize statistical or data-oriented workflows",
            "Use data frames and idiomatic R functions",
        ),
    },
    "assembly": {
        "prompt_name": "x86 Assembly",
        "category": "System Programming",
        "kind": "assembly",
        "directives": (
            "Use readable x86-style assembly (NASM-like syntax)",
            "Include labels and comments for clarity",
        ),
    },
    "bash": {
        "prompt_name": "Bash",
        "category": "System Programming",
        "kind": "systems",
        "directives": (
            "Use POSIX-friendly shell patterns where possible",
            "Use safe defaults when appropriate",
        ),
    },
    "ruby": {
        "prompt_name": "Ruby",
        "category": "Programming Languages",
        "kind": "general",
        "directives": (
            "Use idiomatic Ruby style and conventions",
            "Keep code clean and expressive",
        ),
    },
    "scala": {
        "prompt_name": "Scala",
        "category": "Programming Languages",
        "kind": "general",
        "directives": (
            "Use idiomatic Scala with emphasis on immutability",
            "Favor readable functional constructs",
        ),
    },
    "dart": {
        "prompt_name": "Dart",
        "category": "Programming Languages",
        "kind": "general",
        "directives": (
            "Use idiomatic Dart style and conventions",
            "Include a main entrypoint when runnable output is expected",
        ),
    },
    "node": {
        "prompt_name": "Node.js",
        "category": "Backend Development",
        "kind": "backend_node",
        "directives": (
            "Use Express.js style routing and middleware",
            "Prefer async/await and clear error handling",
        ),
    },
}

LANGUAGE_ALIASES = {
    "python": "python",
    "py": "python",
    "c": "c",
    "c++": "cpp",
    "cpp": "cpp",
    "cxx": "cpp",
    "java": "java",
    "javascript": "javascript",
    "js": "javascript",
    "typescript": "typescript",
    "ts": "typescript",
    "html": "html",
    "html with inline css and javascript": "html",
    "sql": "sql",
    "r": "r",
    "assembly": "assembly",
    "x86 assembly": "assembly",
    "nasm": "assembly",
    "bash": "bash",
    "shell": "bash",
    "ruby": "ruby",
    "scala": "scala",
    "dart": "dart",
    "node.js": "node",
    "nodejs": "node",
    "node": "node",
}


def _normalize_style(style: Optional[str]) -> str:
    if style is None:
        return "MODERATE"
    key = str(style).strip().lower()
    if not key:
        return "MODERATE"
    if key in STYLE_ALIASES:
        return STYLE_ALIASES[key]
    raise ValueError("Style must be Simple, Moderate, or Complex.")


def _validate_prompt(prompt: str) -> str:
    cleaned = (prompt or "").strip()
    if not cleaned:
        raise ValueError("Prompt cannot be empty.")
    if len(cleaned) > settings.prompt_max_chars:
        raise ValueError(
            f"Prompt exceeds maximum length ({settings.prompt_max_chars} chars)."
        )
    return cleaned


def _normalize_language_key(language: str) -> str:
    cleaned = (language or "").strip().lower()
    if not cleaned:
        return ""
    return LANGUAGE_ALIASES.get(cleaned, cleaned)


def _normalize_project_type(project_type: Optional[str]) -> str:
    if project_type is None:
        return ""
    cleaned = str(project_type).strip().lower()
    if not cleaned:
        return ""
    return PROJECT_TYPE_ALIASES.get(cleaned, "")


def _get_project_profile(project_type: Optional[str]):
    key = _normalize_project_type(project_type)
    if not key:
        return None
    return PROJECT_TYPE_PROFILES.get(key)


def _get_language_profile(language: str):
    key = _normalize_language_key(language)
    if not key:
        return None
    return LANGUAGE_PROFILES.get(key)


def _normalize_model_name(model_name: str) -> str:
    cleaned = (model_name or "").strip()
    if cleaned.startswith("models/"):
        cleaned = cleaned.split("/", 1)[1]
    return cleaned or "gemini-pro"


def _build_generation_config(temperature: Optional[float] = None):
    resolved_temp = settings.temperature if temperature is None else float(temperature)
    config_payload = {
        "temperature": resolved_temp,
        "max_output_tokens": settings.max_tokens,
    }
    try:
        return genai.types.GenerateContentConfig(**config_payload)
    except Exception:
        return config_payload


def _build_language_directives(profile) -> str:
    if not profile:
        return "- Use idiomatic conventions for the chosen language"

    lines = list(profile.get("directives", ()))
    kind = profile.get("kind", "general")

    if kind == "web_inline":
        lines.extend(
            [
                "Include semantic sectioning, cards, forms, and navigation when relevant",
                "Add subtle transitions or hover effects for modern feel",
            ]
        )
    elif kind == "web":
        lines.extend(
            [
                "If UI is implied, outline required DOM structure and interactions",
                "Prefer clean component-like sections",
            ]
        )
    elif kind == "data":
        lines.extend(
            [
                "Focus on data flow, analysis steps, and outputs",
                "Include plots or summaries only if relevant",
            ]
        )
    elif kind == "assembly":
        lines.extend(
            [
                "Specify target architecture and calling convention if needed",
                "Keep code readable with labels and comments",
            ]
        )
    elif kind == "backend_node":
        lines.extend(
            [
                "Use Express app setup with routers and middleware",
                "Prefer async handlers and consistent error responses",
            ]
        )

    return "\n".join(f"- {line}" for line in lines)


def _build_enhancement_request(
    user_prompt: str,
    language: str,
    style_mode: str,
    project_type: Optional[str],
) -> str:
    profile = _get_language_profile(language)
    language_name = profile["prompt_name"] if profile else language
    language_name = (language_name or "").strip() or "Python"
    language_category = profile["category"] if profile else "General"

    style = STYLE_POLICY[style_mode]
    language_directives = _build_language_directives(profile)
    project_profile = _get_project_profile(project_type)
    project_label = project_profile["label"] if project_profile else "General"
    project_directives = (
        "\n".join(f"- {line}" for line in project_profile["directives"])
        if project_profile
        else "- Match the project intent and expected architecture"
    )
    project_format = project_profile["format"] if project_profile else "".join(
        [
            "App Spec:\n",
            "- Primary goals and features\n",
            "Implementation:\n",
            "- Core components and structure\n",
        ]
    )

    return (
        "You are a senior software architect and prompt engineer. "
        "Transform the user request into a compact, feature-oriented software "
        "specification for code generation.\n"
        "No essays. No filler. No explanations. No markdown.\n"
        "Use short bullet points and section headers only.\n"
        "If the request is short or ambiguous, infer a reasonable app type and "
        "core features.\n\n"
        f"Project type: {project_label}\n"
        f"Target language: {language_name}\n"
        f"Language category: {language_category}\n"
        f"Style mode: {style_mode}\n"
        "Style targets:\n"
        f"- Feature count: {style['feature_count']}\n"
        f"- Total bullets: {style['total_bullets']}\n"
        f"- UI depth: {style['ui_depth']}\n"
        f"- Architecture: {style['architecture']}\n"
        f"- Code tone: {style['code_tone']}\n\n"
        "Project directives:\n"
        f"{project_directives}\n\n"
        "Language directives:\n"
        f"{language_directives}\n\n"
        "Output format (strict):\n"
        "Build a <app> in <language>.\n"
        f"{project_format}"
        "Constraints:\n"
        "- Return complete runnable code only.\n"
        "- No markdown or explanations.\n\n"
        f"User request:\n{user_prompt}"
    )


def _get_response_text(response) -> str:
    text = getattr(response, "text", None)
    if text:
        return str(text).strip()

    try:
        candidates = getattr(response, "candidates", None) or []
        if not candidates:
            return ""
        content = getattr(candidates[0], "content", None)
        parts = getattr(content, "parts", None) or []
        collected = []
        for part in parts:
            part_text = getattr(part, "text", None)
            if part_text:
                collected.append(str(part_text))
        return "".join(collected).strip()
    except Exception:
        return ""


def _request_generation(client, model_name: str, prompt_text: str, config):
    if config is None:
        return client.models.generate_content(model=model_name, contents=prompt_text)
    return client.models.generate_content(
        model=model_name,
        contents=prompt_text,
        config=config,
    )


def _call_gemini(prompt_text: str, temperature: Optional[float] = None) -> str:
    client = get_genai_client()
    model_name = _normalize_model_name(settings.model_name)
    log_genai(f"Using model: {model_name}")
    config = _build_generation_config(temperature)

    max_attempts = 3
    delay = 2

    for attempt in range(1, max_attempts + 1):
        try:
            response = _request_generation(client, model_name, prompt_text, config)
            response_text = _get_response_text(response)
            if not response_text:
                raise EnhancementError("Empty response from AI service.")

            response_text = str(response_text).strip()
            if not response_text:
                raise EnhancementError("Empty response from AI service.")

            log_genai("Generation successful")
            return response_text

        except EnhancementError:
            raise
        except Exception as exc:
            error_msg = str(exc)
            upper_error = error_msg.upper()

            if "503" in error_msg or "UNAVAILABLE" in upper_error:
                if attempt < max_attempts:
                    log_genai(f"Retry attempt {attempt + 1}")
                    time.sleep(delay)
                    delay *= 2
                    continue
                raise EnhancementError("Enhancement service is busy. Try again later.")

            if "429" in error_msg or "RESOURCE_EXHAUSTED" in upper_error:
                raise EnhancementError("API limit reached. Try again later.")

            if "API key" in error_msg or "invalid" in error_msg.lower():
                raise EnhancementError("Invalid API key. Check your configuration.")

            if "model" in error_msg.lower() and "not found" in error_msg.lower():
                raise EnhancementError(
                    "Invalid model name. Check AI_MODEL configuration."
                )

            raise EnhancementError(f"Enhancement failed: {error_msg}")

    raise EnhancementError("Enhancement failed after retries.")


def get_final_language(
    prompt: str,
    user_language: str = "Python",
    project_type: Optional[str] = None,
) -> str:
    """Return the user-selected language (no keyword overrides)."""
    _ = prompt
    cleaned = (user_language or "").strip()
    project_key = _normalize_project_type(project_type)

    if not cleaned:
        if project_key == "FRONTEND":
            cleaned = "HTML with inline CSS and JavaScript"
        elif project_key == "BACKEND":
            cleaned = "Python"
        elif project_key == "DSA":
            cleaned = "Python"

    profile = _get_language_profile(cleaned)
    if profile:
        return profile["prompt_name"]
    return cleaned or "Python"


def enhance_prompt(
    user_prompt: str,
    language: str = "Python",
    style: Optional[str] = "Moderate",
    project_type: Optional[str] = None,
    temperature: Optional[float] = None,
) -> str:
    """Convert a user request into a Gemini-enhanced prompt."""
    prompt = _validate_prompt(user_prompt)
    style_mode = _normalize_style(style)
    target_language = get_final_language(prompt, language, project_type)
    if project_type and not _normalize_project_type(project_type):
        raise ValueError("Project type must be DSA, Frontend, or Backend.")

    request_text = _build_enhancement_request(
        prompt,
        target_language,
        style_mode,
        project_type,
    )
    return _call_gemini(request_text, temperature)