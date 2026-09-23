/**
 * Utility functions for extracting, normalizing, and validating customer phone numbers.
 * Enforces strict single-phone-number storage with zero duplication, concatenation, or appending.
 */

/**
 * Extracts the 10-digit core of a mobile number for exact comparison.
 */
export function getPhoneCore(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length === 10) {
    return digits;
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  if (digits.length > 10) {
    return digits.slice(-10);
  }
  return null;
}

/**
 * Validates whether a given string is strictly ONE valid phone number.
 * Ensures the string is not duplicated, comma-separated, or concatenated.
 */
export function isValidSinglePhoneNumber(phone?: string | null): boolean {
  if (!phone) return false;
  const trimmed = String(phone).trim();

  // Reject strings that clearly concatenate multiple phone numbers or contain separators
  if (/[,;/|&+]/.test(trimmed.replace(/^\+91/, ""))) {
    // If there's another separator or plus sign inside, it's concatenated
    return false;
  }

  // Count total digits
  const digits = trimmed.replace(/\D/g, "");
  // A single valid phone number has either 10 digits (mobile) or 11 (with leading 0) or 12 (with 91)
  if (digits.length < 10 || digits.length > 12) {
    return false;
  }

  const core = getPhoneCore(trimmed);
  if (!core || core.length !== 10) return false;

  // Indian mobile numbers must start with 6, 7, 8, or 9
  // (or standard 10-digit numbers)
  if (!/^[6-9]\d{9}$/.test(core) && !/^\d{10}$/.test(core)) {
    return false;
  }

  // Check valid normalized patterns
  // Either 10 digits or "+91 " followed by 10 digits or "+91" followed by 10 digits
  const isValidFormat =
    /^\+91\s?[6-9]\d{9}$/.test(trimmed) ||
    /^[6-9]\d{9}$/.test(trimmed) ||
    /^\d{10}$/.test(trimmed);

  return isValidFormat;
}

/**
 * Extracts ONLY the first actual phone number from customer text or payload.
 * Normalizes Indian numbers to valid 10-digit format or optionally +91 format.
 * Never concatenates or duplicates numbers.
 */
export function extractSinglePhoneNumber(text?: string | null): string | null {
  if (!text) return null;
  const str = String(text).trim();
  if (!str) return null;

  // 1. Look for explicit +91 Indian formatted numbers first:
  // e.g. +91 9876543210, +91-98765-43210, +919876543210, +91 98765 43210
  const plus91Match = str.match(/(?:\+91)[\s.-]?([6-9]\d{2,4})[\s.-]?(\d{3,4})[\s.-]?(\d{3,4})|(?:\+91)[\s.-]?([6-9]\d{9})/);
  if (plus91Match) {
    const rawMatch = plus91Match[0];
    const digits = rawMatch.replace(/\D/g, "");
    const core = digits.startsWith("91") ? digits.slice(2) : digits.slice(-10);
    if (core.length === 10 && /^[6-9]\d{9}$/.test(core)) {
      return `+91 ${core}`;
    }
  }

  // 2. Look for 91 prefix without plus (12 digits starting with 91 followed by 6-9)
  const nineOneMatch = str.match(/\b91([6-9]\d{9})\b/);
  if (nineOneMatch && nineOneMatch[1]) {
    return `+91 ${nineOneMatch[1]}`;
  }

  // 3. Look for 0 trunk prefix (11 digits starting with 0 followed by 6-9)
  const zeroPrefixMatch = str.match(/\b0([6-9]\d{9})\b/);
  if (zeroPrefixMatch && zeroPrefixMatch[1]) {
    return zeroPrefixMatch[1];
  }

  // 4. Look for standard Indian 10-digit mobile numbers (starting with 6, 7, 8, or 9)
  // handles space or dash separated numbers like 98765 43210 or 98765-43210
  const indian10Match = str.match(/\b([6-9]\d{4})[\s.-]?(\d{5})\b|\b([6-9]\d{2})[\s.-]?(\d{3})[\s.-]?(\d{4})\b|\b([6-9]\d{9})\b/);
  if (indian10Match) {
    const rawMatch = indian10Match[0];
    const core = rawMatch.replace(/\D/g, "");
    if (core.length === 10 && /^[6-9]\d{9}$/.test(core)) {
      return core;
    }
  }

  // 5. General fallback: look for any valid 10-digit number
  const generalMatch = str.match(/\b\d{5}[\s.-]?\d{5}\b|\b\d{3}[\s.-]?\d{3}[\s.-]?\d{4}\b|\b\d{10}\b/);
  if (generalMatch) {
    const core = generalMatch[0].replace(/\D/g, "");
    if (core.length === 10) {
      return core;
    }
  }

  return null;
}

/**
 * Normalizes a stored phone number value to one valid phone number.
 * If multiple numbers or duplicates are detected, extracts only the first valid one.
 */
export function normalizePhoneNumber(val?: string | null): string | null {
  if (!val) return null;
  const singlePhone = extractSinglePhoneNumber(val);
  return singlePhone;
}

/**
 * Merges an existing phone number with newly incoming phone information.
 * - If the customer already provided a phone number and the new number matches the core digits,
 *   retains the existing number (NEVER duplicates or appends).
 * - If the customer provides a new distinct number, updates to the new single valid number.
 * - Never returns a concatenated or comma-separated string.
 */
export function mergePhoneNumber(
  existingPhone?: string | null,
  newPhoneInput?: string | null
): string | null {
  const normalizedExisting = normalizePhoneNumber(existingPhone);
  const normalizedNew = normalizePhoneNumber(newPhoneInput);

  if (normalizedExisting && !normalizedNew) {
    return normalizedExisting;
  }
  if (!normalizedExisting && normalizedNew) {
    return normalizedNew;
  }
  if (normalizedExisting && normalizedNew) {
    // If they represent the same core 10 digits, keep the existing one exactly once
    if (getPhoneCore(normalizedExisting) === getPhoneCore(normalizedNew)) {
      return normalizedExisting;
    }
    // If the customer provided a new/different phone number, store the new single number
    return normalizedNew;
  }
  return null;
}
