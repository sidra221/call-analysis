#!/usr/bin/env python3
"""Fix production .env keys without overwriting prod-specific settings."""
from pathlib import Path

path = Path(".env")
if not path.is_file():
    raise SystemExit(".env not found")

lines = path.read_text(encoding="utf-8").splitlines()

hf = ""
for line in lines:
    s = line.strip()
    if not s or s.startswith("#") or "=" not in s:
        continue
    k, _, v = s.partition("=")
    k, v = k.strip(), v.strip().strip("\"'")
    if k in ("HUGGINGFACE_TOKEN", "HF_TOKEN") and v:
        hf = v

updates = {
    "HUGGINGFACE_TOKEN": hf,
    "HF_TOKEN": hf,
    "ENABLE_LLM_REFINEMENT": "true",
    "LLM_REFINEMENT_MODE": "all",
    "LLM_MODEL": "gpt-4o-mini",
    "AI_SERVICE_URL": "http://ai_service:9000/analyze-call",
    "AI_SERVICE_TIMEOUT": "700",
    "DEBUG": "False",
    "ALLOWED_HOSTS": "localhost,127.0.0.1,web,0.0.0.0,63.141.255.154",
}

out = []
seen = set()
for line in lines:
    s = line.strip()
    if not s or s.startswith("#") or "=" not in s:
        out.append(line)
        continue
    k, _, _ = s.partition("=")
    k = k.strip()
    if k in updates:
        out.append(f"{k}={updates[k]}")
        seen.add(k)
    else:
        out.append(line)

for k, v in updates.items():
    if k not in seen:
        out.append(f"{k}={v}")

path.write_text("\n".join(out) + "\n", encoding="utf-8")
print("HUGGINGFACE_TOKEN set:", bool(hf))
