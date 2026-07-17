import time
from typing import Optional

from google import genai

from config import get_genai_client, log_genai, settings


class GenerationError(Exception):
    """Raised when code generation fails."""


SYSTEM_INSTRUCTION = (
    "You generate complete runnable code only. "
    "Never include markdown, explanations, or preface text."
)

CODE_ONLY_DIRECTIVE = (
    "Return only complete runnable code. No markdown. No explanations. No preface.\n"
    "Do not include code fences or language labels.\n"
    "If the request is for HTML with inline CSS and JavaScript, return a full HTML "
    "document.\n"
)

CONTINUATION_INSTRUCTION = (
    "Continue the code output from the exact point it cut off.\n"
    "Return only the remaining code. Do not repeat earlier content.\n"
    "No markdown or explanations.\n"
)

MAX_CONTINUATION_ROUNDS = 2
CONTINUATION_TAIL_CHARS = 2000


def _normalize_model_name(model_name: str) -> str:
    cleaned = (model_name or "").strip()
    if cleaned.startswith("models/"):
        cleaned = cleaned.split("/", 1)[1]
    return cleaned or "gemini-pro"


def _compact_prompt(text: str) -> str:
    lines = [line.strip() for line in text.splitlines()]
    return "\n".join(line for line in lines if line)


def _build_generation_config(
    temperature: Optional[float] = None,
    system_instruction: Optional[str] = None,
):
    resolved_temp = settings.temperature if temperature is None else float(temperature)
    base_config = {
        "temperature": resolved_temp,
        "max_output_tokens": settings.max_tokens,
        "candidate_count": 1,
        "response_mime_type": "text/plain",
    }
    if system_instruction:
        base_config["system_instruction"] = system_instruction

    try:
        return genai.types.GenerateContentConfig(**base_config)
    except Exception:
        reduced = dict(base_config)
        for key in ("response_mime_type", "candidate_count", "system_instruction"):
            reduced.pop(key, None)
            try:
                return genai.types.GenerateContentConfig(**reduced)
            except Exception:
                continue
        return reduced


def _build_generation_prompt(user_prompt: str) -> str:
    compact_prompt = _compact_prompt(user_prompt)
    return f"{CODE_ONLY_DIRECTIVE}{compact_prompt}"


def _strip_code_fences(text: str) -> str:
    stripped = text.strip()
    if not stripped.startswith("```"):
        return stripped

    lines = stripped.splitlines()
    if lines and lines[0].startswith("```"):
        lines = lines[1:]
    if lines and lines[-1].strip().startswith("```"):
        lines = lines[:-1]
    return "\n".join(lines).strip()


def _get_finish_reason(response) -> str:
    try:
        candidates = getattr(response, "candidates", None) or []
        if not candidates:
            return ""
        reason = getattr(candidates[0], "finish_reason", "")
        if hasattr(reason, "name"):
            return str(reason.name).upper()
        return str(reason).upper()
    except Exception:
        return ""


def _response_truncated(response) -> bool:
    reason = _get_finish_reason(response)
    return "MAX_TOKENS" in reason or "LENGTH" in reason


def _last_non_whitespace(text: str) -> str:
    for char in reversed(text):
        if not char.isspace():
            return char
    return ""


def _looks_truncated(text: str) -> bool:
    if not text:
        return True

    lower = text.lower()
    if ("<html" in lower or "<!doctype" in lower) and "</html>" not in lower:
        return True

    if text.count("{") > text.count("}"):
        return True
    if text.count("(") > text.count(")"):
        return True
    if text.count("[") > text.count("]"):
        return True

    last_char = _last_non_whitespace(text)
    if last_char in {"{", "(", "[", ",", ":", "\\", "\"", "'"}:
        return True

    return False


def _merge_continuation(existing: str, continuation: str) -> str:
    if not continuation:
        return existing

    max_overlap = min(len(existing), 400)
    for size in range(max_overlap, 0, -1):
        if existing[-size:] == continuation[:size]:
            return existing + continuation[size:]
    return existing + continuation


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


def _continue_generation(
    client,
    model_name: str,
    config,
    base_prompt: str,
    partial_text: str,
) -> str:
    combined = partial_text
    prompt_summary = _compact_prompt(base_prompt)
    if len(prompt_summary) > 1200:
        prompt_summary = prompt_summary[:1200]

    for _ in range(MAX_CONTINUATION_ROUNDS):
        if not _looks_truncated(combined):
            break

        tail = combined[-CONTINUATION_TAIL_CHARS:]
        continuation_prompt = (
            f"{CONTINUATION_INSTRUCTION}"
            "Original requirements (summary):\n"
            f"{prompt_summary}\n\n"
            "Truncated tail:\n"
            f"{tail}\n\n"
            "Continue:\n"
        )

        response = _request_generation(client, model_name, continuation_prompt, config)
        continuation_text = _get_response_text(response)
        if not continuation_text:
            break

        continuation_text = _strip_code_fences(str(continuation_text).strip())
        if not continuation_text:
            break

        combined = _merge_continuation(combined, continuation_text)
        if not _response_truncated(response) and not _looks_truncated(combined):
            break

    return combined


def generate_code(prompt: str, temperature: Optional[float] = None) -> str:
    if not prompt.strip():
        raise ValueError("Prompt empty")

    client = get_genai_client()
    model_name = _normalize_model_name(settings.model_name)
    log_genai(f"Using model: {model_name}")
    config = _build_generation_config(temperature, system_instruction=SYSTEM_INSTRUCTION)
    generation_prompt = _build_generation_prompt(prompt)
    max_attempts = 3
    delay = 2

    for attempt in range(1, max_attempts + 1):
        try:
            response = _request_generation(client, model_name, generation_prompt, config)
            response_text = _get_response_text(response)
            if not response_text:
                raise GenerationError("Empty response from AI service.")

            response_text = _strip_code_fences(str(response_text).strip())
            if not response_text:
                raise GenerationError("Empty response from AI service.")

            truncated = _response_truncated(response) or _looks_truncated(response_text)
            if truncated:
                response_text = _continue_generation(
                    client,
                    model_name,
                    config,
                    generation_prompt,
                    response_text,
                )
            log_genai("Generation successful")
            return response_text

        except GenerationError:
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
                raise GenerationError("Server busy. Please try again later.")

            if "429" in error_msg or "RESOURCE_EXHAUSTED" in upper_error:
                raise GenerationError("API limit reached. Please try again later.")

            if "API key" in error_msg or "invalid" in error_msg.lower():
                raise GenerationError("Invalid API key. Please check your configuration.")

            if "model" in error_msg.lower() and "not found" in error_msg.lower():
                raise GenerationError(
                    "Invalid model name. Check AI_MODEL configuration."
                )

            raise GenerationError(f"Generation failed: {error_msg}")