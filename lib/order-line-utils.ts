import { OrderLine, SelectedTag } from "~/types/order-line.types";

/**
 * Normalize tags from backend: OrderLineTag has no `tagId` column,
 * the tag id lives in `tagSnapshot.id`. This ensures every SelectedTag
 * has a `tagId` so the rest of the frontend can rely on it.
 */
function normalizeTags(tags?: SelectedTag[]): SelectedTag[] | undefined {
  if (!tags || tags.length === 0) return tags;
  return tags.map(t => ({
    ...t,
    tagId: t.tagId || t.tagSnapshot?.id,
  }));
}

/**
 * Ensures an OrderLine has all payment fields with default values if missing
 * and normalizes tags from backend format (tagSnapshot.id → tagId).
 *
 * This is the single entry point for all OrderLines entering the store,
 * whether from API responses or WebSocket events.
 *
 * @param line The OrderLine to normalize
 * @returns The OrderLine with guaranteed payment fields and normalized tags
 */
export function normalizeOrderLine(line: Partial<OrderLine>): OrderLine {
  return {
    ...line,
    // Ensure payment fields have default values
    paidAmount: line.paidAmount ?? 0,
    paidFraction: line.paidFraction ?? 0,
    paymentStatus: line.paymentStatus ?? "unpaid",
    // Normalize tags: backend OrderLineTag has no tagId, only tagSnapshot.id
    tags: normalizeTags(line.tags),
  } as OrderLine;
}

/**
 * Normalizes an array of OrderLines to ensure all payment fields are present
 *
 * @param lines Array of OrderLines to normalize
 * @returns Array of normalized OrderLines
 */
export function normalizeOrderLines(lines: Partial<OrderLine>[]): OrderLine[] {
  return lines.map(normalizeOrderLine);
}
