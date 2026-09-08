import logging
import os

logger = logging.getLogger(__name__)


def resolve_device() -> str:
    requested = os.getenv("AI_DEVICE", "cuda").strip().lower()
    if requested == "cpu":
        return "cpu"

    try:
        import torch

        if torch.cuda.is_available():
            logger.info("Using GPU: %s", torch.cuda.get_device_name(0))
            return "cuda"
    except Exception as exc:
        logger.warning("CUDA check failed (%s)", exc)

    if requested == "cuda":
        logger.warning("AI_DEVICE=cuda but no GPU is available; falling back to CPU")
    return "cpu"


def compute_type(device: str) -> str:
    return "float16" if device == "cuda" else "float32"


def hf_device(device: str) -> int:
    return 0 if device == "cuda" else -1
