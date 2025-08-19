import { Contact } from "./types";

export function getSystemPrompt() {
    return "You are a helpful assistant that specializes in domains. When the user provides a description, you must return only a list of domain names that match the description. Do not include explanations, commentary, or extra formatting—just the domains themselves, one per line.";
}

// Helper function types
export function formatDate(dateString: string | undefined): string {
    if (!dateString) return "N/A";
    try {
        const date = new Date(dateString);
        return date.toISOString().split("T")[0]; // Returns YYYY-MM-DD format
    } catch {
        return "N/A";
    }
}

export function formatHostnames(hostnames: string[] | undefined): string {
    if (!Array.isArray(hostnames) || hostnames.length === 0) return "N/A";

    const hostnameString = hostnames.join(", ");
    return hostnameString.length > 25
        ? hostnameString.substring(0, 22) + "..."
        : hostnameString;
}

export function getRegistrantName(registrant: Contact | undefined): string {
    if (!registrant) return "N/A";
    return registrant.organization || registrant.name || "N/A";
}

export function getTechnicalContactName(
    technicalContact: Contact | undefined
): string {
    if (!technicalContact) return "N/A";
    return technicalContact.organization || technicalContact.name || "N/A";
}

export function getAdministrativeContactName(
    administrativeContact: Contact | undefined
): string {
    if (!administrativeContact) return "N/A";
    return (
        administrativeContact.organization ||
        administrativeContact.name ||
        "N/A"
    );
}
