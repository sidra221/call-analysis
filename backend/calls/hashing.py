from typing import Optional
import hashlib


def hash_file_obj(file_obj) -> str:
    """Return SHA-256 hex digest of an uploaded or storage file object."""
    hasher = hashlib.sha256()
    pos = None
    if hasattr(file_obj, 'tell'):
        try:
            pos = file_obj.tell()
        except Exception:
            pos = None

    if hasattr(file_obj, 'chunks'):
        for chunk in file_obj.chunks():
            hasher.update(chunk)
    else:
        while True:
            chunk = file_obj.read(65536)
            if not chunk:
                break
            hasher.update(chunk)

    if pos is not None and hasattr(file_obj, 'seek'):
        file_obj.seek(pos)
    elif hasattr(file_obj, 'seek'):
        file_obj.seek(0)

    return hasher.hexdigest()


def hash_call_audio(call) -> Optional[str]:
    if not call.audio_file:
        return None
    try:
        with call.audio_file.open('rb') as handle:
            return hash_file_obj(handle)
    except Exception:
        return None
