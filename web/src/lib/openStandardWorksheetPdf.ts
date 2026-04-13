interface OpenStandardWorksheetPdfInput {
  worksheetId: string;
  lessonId?: string | null;
  filename?: string;
}

async function getErrorMessage(res: Response) {
  try {
    const body = (await res.json()) as {
      error?: string;
      used?: number;
      limit?: number;
    };

    if (res.status === 401) return "Sign in to open worksheets.";
    if (res.status === 402) return "Worksheets are available on paid plans.";
    if (res.status === 429) {
      if (typeof body.used === "number" && typeof body.limit === "number") {
        return `Worksheet limit reached (${body.used}/${body.limit} this month).`;
      }
      return "Worksheet limit reached for this billing period.";
    }
    if (body.error === "Not found" || res.status === 404) {
      return "Worksheet not found.";
    }
  } catch {
    // fall through to generic error
  }

  return "Failed to open worksheet.";
}

export async function openStandardWorksheetPdf({
  worksheetId,
  lessonId,
  filename,
}: OpenStandardWorksheetPdfInput) {
  const previewWindow = window.open("", "_blank");
  if (previewWindow) {
    previewWindow.document.title = "Opening worksheet...";
    previewWindow.document.body.innerHTML =
      '<div style="font-family: Georgia, serif; padding: 24px; color: #0B2E4A;">Opening worksheet…</div>';
  }

  const url = new URL(
    `/api/worksheets/standard/${worksheetId}/pdf`,
    window.location.origin,
  );
  if (lessonId) {
    url.searchParams.set("lessonId", lessonId);
  }

  const res = await fetch(url.toString(), {
    cache: "no-store",
  });

  if (!res.ok) {
    if (previewWindow) previewWindow.close();
    throw new Error(await getErrorMessage(res));
  }

  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);

  if (previewWindow) {
    previewWindow.location.href = blobUrl;
  } else {
    const link = document.createElement("a");
    link.href = blobUrl;
    link.target = "_blank";
    if (filename) link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}
