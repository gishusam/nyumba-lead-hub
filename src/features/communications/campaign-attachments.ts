const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
]);

export function validateCampaignAttachmentFile(
  file: File,
): string | null {
  if (file.size > MAX_ATTACHMENT_SIZE) {
    return "Attachment must be 5 MB or smaller.";
  }

  const lowerName = file.name.toLowerCase();
  const extensionIndex = lowerName.lastIndexOf(".");
  const extension =
    extensionIndex >= 0
      ? lowerName.slice(extensionIndex)
      : "";

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return "Attach a PDF, DOC, DOCX, PNG, JPG, GIF or WEBP file.";
  }

  return null;
}

export function formatCampaignAttachmentSize(
  bytes: number,
): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kilobytes = bytes / 1024;

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} KB`;
  }

  return `${(kilobytes / 1024).toFixed(1)} MB`;
}
