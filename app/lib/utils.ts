import { Contact } from "./types";

/**
 * System prompt configuration for AI domain suggestions
 */
const SYSTEM_PROMPT =
    "You are a helpful assistant that specializes in domains. When the user provides a description, you must return only a list of domain names that match the description. Do not include explanations, commentary, or extra formatting—just the domains themselves, one per line.";

/**
 * Maximum length for hostname display before truncation
 */
const MAX_HOSTNAME_DISPLAY_LENGTH = 25;

/**
 * Truncation suffix for long hostname strings
 */
const HOSTNAME_TRUNCATION_SUFFIX = "...";

/**
 * Default fallback value for missing or invalid data
 */
const DEFAULT_FALLBACK_VALUE = "N/A";

/**
 * Returns the system prompt for AI domain suggestions.
 *
 * This prompt instructs the AI to return only domain names without
 * additional formatting or explanations when given a description.
 *
 * @returns {string} The system prompt string for AI interactions
 *
 * @example
 * ```typescript
 * const prompt = getSystemPrompt();
 * console.log(prompt); // "You are a helpful assistant..."
 * ```
 */
export function getSystemPrompt(): string {
    return SYSTEM_PROMPT;
}

/**
 * Formats a date string into YYYY-MM-DD format with comprehensive error handling.
 *
 * Handles various edge cases including:
 * - Undefined or null input
 * - Invalid date strings
 * - Malformed date objects
 * - Empty strings
 *
 * @param {string | undefined} dateString - The date string to format
 * @returns {string} Formatted date in YYYY-MM-DD format or "N/A" if invalid
 *
 * @example
 * ```typescript
 * formatDate("2023-12-25T10:30:00Z"); // "2023-12-25"
 * formatDate("invalid-date");         // "N/A"
 * formatDate(undefined);              // "N/A"
 * formatDate("");                     // "N/A"
 * ```
 */
export function formatDate(dateString: string | undefined): string {
    // Handle null, undefined, or empty string cases
    if (
        !dateString ||
        typeof dateString !== "string" ||
        dateString.trim() === ""
    ) {
        return DEFAULT_FALLBACK_VALUE;
    }

    try {
        const date = new Date(dateString.trim());

        // Check if the date is valid
        if (isNaN(date.getTime())) {
            console.warn(`Invalid date string provided: "${dateString}"`);
            return DEFAULT_FALLBACK_VALUE;
        }

        // Extract date part and validate format
        const isoString = date.toISOString();
        const datePart = isoString.split("T")[0];

        // Additional validation to ensure we have a proper date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
            console.warn(
                `Unexpected date format after conversion: "${datePart}"`
            );
            return DEFAULT_FALLBACK_VALUE;
        }

        return datePart;
    } catch (error) {
        console.error(`Error formatting date "${dateString}":`, error);
        return DEFAULT_FALLBACK_VALUE;
    }
}

/**
 * Formats an array of hostnames into a display-friendly string with truncation.
 *
 * Features:
 * - Handles undefined, null, or non-array inputs
 * - Joins multiple hostnames with commas
 * - Truncates long strings with ellipsis
 * - Validates array contents
 *
 * @param {string[] | undefined} hostnames - Array of hostname strings
 * @returns {string} Formatted hostname string or "N/A" if invalid/empty
 *
 * @example
 * ```typescript
 * formatHostnames(["example.com", "www.example.com"]); // "example.com, www.example.com"
 * formatHostnames(["very-long-hostname.example.com", "another-long-hostname.example.com"]); // "very-long-hostname.exam..."
 * formatHostnames([]);        // "N/A"
 * formatHostnames(undefined); // "N/A"
 * ```
 */
export function formatHostnames(hostnames: string[] | undefined): string {
    // Handle null, undefined, or non-array cases
    if (!hostnames) {
        return DEFAULT_FALLBACK_VALUE;
    }

    if (!Array.isArray(hostnames)) {
        console.warn(
            "formatHostnames received non-array input:",
            typeof hostnames
        );
        return DEFAULT_FALLBACK_VALUE;
    }

    if (hostnames.length === 0) {
        return DEFAULT_FALLBACK_VALUE;
    }

    try {
        // Filter out invalid entries and validate hostname strings
        const validHostnames = hostnames.filter((hostname) => {
            if (typeof hostname !== "string") {
                console.warn("Non-string hostname found:", hostname);
                return false;
            }
            return hostname.trim().length > 0;
        });

        if (validHostnames.length === 0) {
            console.warn("No valid hostnames found in array");
            return DEFAULT_FALLBACK_VALUE;
        }

        // Join hostnames with proper spacing
        const hostnameString = validHostnames.join(", ");

        // Apply truncation if necessary
        if (hostnameString.length > MAX_HOSTNAME_DISPLAY_LENGTH) {
            const truncatedLength =
                MAX_HOSTNAME_DISPLAY_LENGTH - HOSTNAME_TRUNCATION_SUFFIX.length;
            return (
                hostnameString.substring(0, truncatedLength) +
                HOSTNAME_TRUNCATION_SUFFIX
            );
        }

        return hostnameString;
    } catch (error) {
        console.error("Error formatting hostnames:", error);
        return DEFAULT_FALLBACK_VALUE;
    }
}

/**
 * Extracts and returns the registrant name from a Contact object.
 *
 * Priority order:
 * 1. Organization name (if available)
 * 2. Individual name (if available)
 * 3. Fallback to "N/A"
 *
 * @param {Contact | undefined} registrant - The registrant contact information
 * @returns {string} The registrant name or "N/A" if unavailable
 *
 * @example
 * ```typescript
 * getRegistrantName({ organization: "ACME Corp", name: "John Doe" }); // "ACME Corp"
 * getRegistrantName({ name: "John Doe" });                           // "John Doe"
 * getRegistrantName({});                                             // "N/A"
 * getRegistrantName(undefined);                                      // "N/A"
 * ```
 */
export function getRegistrantName(registrant: Contact | undefined): string {
    if (!registrant || typeof registrant !== "object") {
        return DEFAULT_FALLBACK_VALUE;
    }

    try {
        // Prioritize organization name over individual name
        const organizationName = registrant.organization?.trim();
        if (organizationName && organizationName.length > 0) {
            return organizationName;
        }

        const individualName = registrant.name?.trim();
        if (individualName && individualName.length > 0) {
            return individualName;
        }

        return DEFAULT_FALLBACK_VALUE;
    } catch (error) {
        console.error("Error extracting registrant name:", error);
        return DEFAULT_FALLBACK_VALUE;
    }
}

/**
 * Extracts and returns the technical contact name from a Contact object.
 *
 * Priority order:
 * 1. Organization name (if available)
 * 2. Individual name (if available)
 * 3. Fallback to "N/A"
 *
 * @param {Contact | undefined} technicalContact - The technical contact information
 * @returns {string} The technical contact name or "N/A" if unavailable
 *
 * @example
 * ```typescript
 * getTechnicalContactName({ organization: "Tech Support Inc", name: "Jane Smith" }); // "Tech Support Inc"
 * getTechnicalContactName({ name: "Jane Smith" });                                   // "Jane Smith"
 * getTechnicalContactName({});                                                       // "N/A"
 * getTechnicalContactName(undefined);                                                // "N/A"
 * ```
 */
export function getTechnicalContactName(
    technicalContact: Contact | undefined
): string {
    if (!technicalContact || typeof technicalContact !== "object") {
        return DEFAULT_FALLBACK_VALUE;
    }

    try {
        // Prioritize organization name over individual name
        const organizationName = technicalContact.organization?.trim();
        if (organizationName && organizationName.length > 0) {
            return organizationName;
        }

        const individualName = technicalContact.name?.trim();
        if (individualName && individualName.length > 0) {
            return individualName;
        }

        return DEFAULT_FALLBACK_VALUE;
    } catch (error) {
        console.error("Error extracting technical contact name:", error);
        return DEFAULT_FALLBACK_VALUE;
    }
}

/**
 * Extracts and returns the administrative contact name from a Contact object.
 *
 * Priority order:
 * 1. Organization name (if available)
 * 2. Individual name (if available)
 * 3. Fallback to "N/A"
 *
 * @param {Contact | undefined} administrativeContact - The administrative contact information
 * @returns {string} The administrative contact name or "N/A" if unavailable
 *
 * @example
 * ```typescript
 * getAdministrativeContactName({ organization: "Admin Corp", name: "Bob Johnson" }); // "Admin Corp"
 * getAdministrativeContactName({ name: "Bob Johnson" });                             // "Bob Johnson"
 * getAdministrativeContactName({});                                                  // "N/A"
 * getAdministrativeContactName(undefined);                                           // "N/A"
 * ```
 */
export function getAdministrativeContactName(
    administrativeContact: Contact | undefined
): string {
    if (!administrativeContact || typeof administrativeContact !== "object") {
        return DEFAULT_FALLBACK_VALUE;
    }

    try {
        // Prioritize organization name over individual name
        const organizationName = administrativeContact.organization?.trim();
        if (organizationName && organizationName.length > 0) {
            return organizationName;
        }

        const individualName = administrativeContact.name?.trim();
        if (individualName && individualName.length > 0) {
            return individualName;
        }

        return DEFAULT_FALLBACK_VALUE;
    } catch (error) {
        console.error("Error extracting administrative contact name:", error);
        return DEFAULT_FALLBACK_VALUE;
    }
}
