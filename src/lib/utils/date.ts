/**
 * Date formatting utilities (client-safe, no DICOM dependencies)
 */

/**
 * Format date to YYYY-MM-DD string (for form input)
 */
export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD string to Date
 */
export function parseDateFromInput(dateString: string): Date | null {
  try {
    const parts = dateString.split('-');
    if (parts.length !== 3) return null;

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      return null;
    }

    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }

    // Create Date object (month is 0-indexed in JavaScript)
    const date = new Date(year, month - 1, day);

    // Verify the date is valid by checking it matches what we set
    // This catches cases like February 30 which JS creates as March 2
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    // Verify date is valid
    if (isNaN(date.getTime())) {
      return null;
    }

    return date;
  } catch (error) {
    return null;
  }
}
