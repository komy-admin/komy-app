import { OrderLine } from "~/types/order-line.types";

/**
 * Ensures an OrderLine has all payment fields with default values if missing.
 * This is useful when creating new OrderLines or receiving data from the API
 * that might not have payment fields enriched yet.
 *
 * @param line The OrderLine to normalize
 * @returns The OrderLine with guaranteed payment fields
 */
export function normalizeOrderLine(line: Partial<OrderLine>): OrderLine {
  return {
    ...line,
    // Ensure payment fields have default values
    paidAmount: line.paidAmount ?? 0,
    paidFraction: line.paidFraction ?? 0,
    paymentStatus: line.paymentStatus ?? "unpaid",
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
