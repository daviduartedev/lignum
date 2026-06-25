import type { Evaluation } from "@/types";

export function mapApiRowToEvaluation(row: Record<string, unknown>): Evaluation {
  const id = Number(row.id);
  const createdAt =
    row.createdAt instanceof Date
      ? row.createdAt.toISOString()
      : String(row.createdAt ?? new Date().toISOString());
  const updatedAt =
    row.updatedAt instanceof Date
      ? row.updatedAt.toISOString()
      : String(row.updatedAt ?? createdAt);

  const photoUrls = Array.isArray(row.photoUrls) ? (row.photoUrls as string[]) : [];

  return {
    id,
    documentId: (row.documentId as string) ?? undefined,
    attributes: {
      score: row.score != null ? Number(row.score) : undefined,
      observations: row.observations != null ? String(row.observations) : undefined,
      technical_notes: row.technicalNotes != null ? String(row.technicalNotes) : undefined,
      checklist_json: row.checklistJson ?? undefined,
      photo_urls: photoUrls.length ? photoUrls : undefined,
      createdAt,
      updatedAt,
    },
  };
}
