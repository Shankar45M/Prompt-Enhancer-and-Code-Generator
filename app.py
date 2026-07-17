"""Flask API for prompt enhancement and code generation.

This version uses function-based modules:
- enhancer.enhance_prompt(prompt)
- generator.generate_code(prompt)
"""

import json as _json
import time
from uuid import uuid4

from flask import Flask, Response, jsonify, request
from flask_cors import CORS

from config import get_temperature_for_project, settings
from enhancer import EnhancementError, enhance_prompt, get_final_language
from generator import GenerationError, generate_code


def _ok(data: dict, request_id: str, status_code: int = 200):
    """Build success response payload."""
    return jsonify({"success": True, "request_id": request_id, "data": data}), status_code


def _error(message: str, request_id: str, status_code: int):
    """Build error response payload."""
    return jsonify({"success": False, "request_id": request_id, "error": message}), status_code


def _sse_event(stage: str, data: dict | None = None, error: str | None = None) -> str:
    """Format a Server-Sent Event line."""
    payload = {"stage": stage}
    if data is not None:
        payload["data"] = data
    if error is not None:
        payload["error"] = error
    return f"data: {_json.dumps(payload)}\n\n"


def create_app() -> Flask:
    """Create and configure Flask app."""
    app = Flask(__name__)
    CORS(app)

    @app.get("/health")
    def health_check():
        """Basic health endpoint."""
        return jsonify({"status": "ok", "service": "Prompt Enhancer + Code Generator"})

    @app.post("/generate")
    def generate_route():
        """Accept prompt and language, enhance it, generate code, and return both values."""
        request_id = str(uuid4())
        payload = request.get_json(silent=True) or {}
        prompt = payload.get("prompt", "")
        language = payload.get("language", "")
        project_type = payload.get("project_type") or payload.get("projectType")
        style = payload.get("style") or payload.get("code_style") or payload.get("mode")

        # Validate request input early.
        if not isinstance(prompt, str) or not prompt.strip():
            return _error("Field 'prompt' must be a non-empty string.", request_id, 400)
        if len(prompt) > settings.prompt_max_chars:
            return _error(
                f"Prompt exceeds maximum length ({settings.prompt_max_chars} chars).",
                request_id,
                400,
            )

        if not isinstance(project_type, str) or not project_type.strip():
            return _error("Field 'project_type' is required.", request_id, 400)

        project_key = project_type.strip().lower()
        if project_key not in {"dsa", "frontend", "backend"}:
            return _error("Invalid project_type. Use dsa, frontend, or backend.", request_id, 400)

        if project_key in {"dsa", "backend"} and not language:
            return _error("Field 'language' is required for this project type.", request_id, 400)

        if project_key == "frontend" and not language:
            language = "HTML with inline CSS and JavaScript"

        temperature = get_temperature_for_project(project_key)
        project_label = "DSA" if project_key == "dsa" else project_key.capitalize()
        print(f"Project Type: {project_label}")
        print(f"Temperature: {temperature}")

        try:
            # 1) Enhance user prompt with selected language.
            enhanced_prompt = enhance_prompt(
                prompt,
                language,
                style,
                project_type,
                temperature=temperature,
            )

            # 2) Determine final language (after complexity override).
            final_language = get_final_language(prompt, language, project_type)

            # 3) Generate code from enhanced prompt.
            generated_code = generate_code(enhanced_prompt, temperature=temperature)

            # 4) Return response payload with final language.
            return _ok(
                {
                    "enhanced_prompt": enhanced_prompt,
                    "generated_code": generated_code,
                    "final_language": final_language,
                },
                request_id,
            )
        except ValueError as exc:
            return _error(str(exc), request_id, 400)
        except EnhancementError as exc:
            return _error(f"Prompt enhancement failed: {exc}", request_id, 502)
        except GenerationError as exc:
            return _error(f"Code generation failed: {exc}", request_id, 502)
        except Exception:
            return _error("Internal server error", request_id, 500)

    @app.post("/generate-stream")
    def generate_stream_route():
        """SSE endpoint: stream real pipeline stages, then final result."""
        payload = request.get_json(silent=True) or {}
        prompt = payload.get("prompt", "")
        language = payload.get("language", "")
        project_type = payload.get("project_type") or payload.get("projectType")
        style = payload.get("style") or payload.get("code_style") or payload.get("mode")

        def event_stream():
            # ── STAGE 1: ANALYZING ──
            yield _sse_event("analyzing")

            if not isinstance(prompt, str) or not prompt.strip():
                yield _sse_event("error", error="Field 'prompt' must be a non-empty string.")
                return
            if len(prompt) > settings.prompt_max_chars:
                yield _sse_event("error", error=f"Prompt exceeds maximum length ({settings.prompt_max_chars} chars).")
                return

            if not isinstance(project_type, str) or not project_type.strip():
                yield _sse_event("error", error="Field 'project_type' is required.")
                return

            project_key = project_type.strip().lower()
            if project_key not in {"dsa", "frontend", "backend"}:
                yield _sse_event("error", error="Invalid project_type. Use dsa, frontend, or backend.")
                return

            lang = language
            if project_key in {"dsa", "backend"} and not lang:
                yield _sse_event("error", error="Field 'language' is required for this project type.")
                return

            if project_key == "frontend" and not lang:
                lang = "HTML with inline CSS and JavaScript"

            temperature = get_temperature_for_project(project_key)
            t_total_start = time.perf_counter()

            # ── STAGE 2: ENHANCING ──
            yield _sse_event("enhancing")

            try:
                t_enh_start = time.perf_counter()
                enhanced_prompt = enhance_prompt(
                    prompt, lang, style, project_type, temperature=temperature,
                )
                t_enh = time.perf_counter() - t_enh_start
            except (ValueError, EnhancementError) as exc:
                yield _sse_event("error", error=str(exc))
                return
            except Exception:
                yield _sse_event("error", error="Prompt enhancement failed.")
                return

            # ── STAGE 3: GENERATING ──
            yield _sse_event("generating")

            try:
                t_gen_start = time.perf_counter()
                generated = generate_code(enhanced_prompt, temperature=temperature)
                t_gen = time.perf_counter() - t_gen_start
            except (ValueError, GenerationError) as exc:
                yield _sse_event("error", error=str(exc))
                return
            except Exception:
                yield _sse_event("error", error="Code generation failed.")
                return

            # ── STAGE 4: FINALIZING ──
            yield _sse_event("finalizing")

            final_language = get_final_language(prompt, lang, project_type)
            t_total = time.perf_counter() - t_total_start

            # ── STAGE 5: DONE ──
            yield _sse_event("done", data={
                "enhanced_prompt": enhanced_prompt,
                "generated_code": generated,
                "final_language": final_language,
                "timings": {
                    "enhancement": round(t_enh, 2),
                    "generation": round(t_gen, 2),
                    "total": round(t_total, 2),
                },
            })

        return Response(
            event_stream(),
            content_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            },
        )

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host=settings.app_host, port=settings.app_port, debug=settings.app_debug)
