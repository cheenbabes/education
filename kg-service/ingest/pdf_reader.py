"""PDF text extraction utility using PyMuPDF."""

from __future__ import annotations

from pathlib import Path

import fitz  # PyMuPDF


def extract_text(pdf_path: Path) -> str:
    """Extract all text from a PDF file, page by page."""
    doc = fitz.open(str(pdf_path))
    pages: list[str] = []
    for page in doc:
        text = page.get_text()
        if text.strip():
            pages.append(text)
    doc.close()
    return "\n\n--- PAGE BREAK ---\n\n".join(pages)


def file_hash(pdf_path: Path) -> str:
    """Return a hex SHA-256 hash of a file's contents."""
    import hashlib

    h = hashlib.sha256()
    with open(pdf_path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()
