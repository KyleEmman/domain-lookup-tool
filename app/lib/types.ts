export type CountryCode =
    | "US"
    | "CA"
    | "GB"
    | "DE"
    | "FR"
    | "JP"
    | "AU"
    | "NL"
    | "CH"
    | "SE"
    | "NO"
    | "DK"
    | "FI"
    | "IT"
    | "ES"
    | "BR"
    | "IN"
    | "CN"
    | "KR"
    | "SG"
    | string;

export type DomainStatus =
    | "clientDeleteProhibited"
    | "clientHold"
    | "clientRenewProhibited"
    | "clientTransferProhibited"
    | "clientUpdateProhibited"
    | "inactive"
    | "ok"
    | "pendingCreate"
    | "pendingDelete"
    | "pendingRenew"
    | "pendingRestore"
    | "pendingTransfer"
    | "pendingUpdate"
    | "redemptionPeriod"
    | "renewPeriod"
    | "serverDeleteProhibited"
    | "serverHold"
    | "serverRenewProhibited"
    | "serverTransferProhibited"
    | "serverUpdateProhibited"
    | string;

export interface Contact {
    organization?: string;
    name?: string;
    country?: string;
    countryCode?: CountryCode;
    rawText?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
}

export interface NameServers {
    rawText?: string;
    hostNames?: string[];
    ips?: string[];
}

export interface WhoisRecord {
    /** ISO 8601 format */
    createdDate?: string;
    /** ISO 8601 format */
    updatedDate?: string;
    /** ISO 8601 format */
    expiresDate?: string;
    registrant?: Contact;
    technicalContact?: Contact;
    administrativeContact?: Contact;
    domainName?: string;
    nameServers?: NameServers;
    status?: DomainStatus | DomainStatus[];
    registrarName?: string;
    registrarIANAID?: string;
    contactEmail?: string;
    /** Age in days */
    estimatedDomainAge?: number;
    dnssec?: boolean;
    rawText?: string;
}

export interface DomainInformation {
    domainName: string;
    registrar: string;
    /** YYYY-MM-DD format */
    registrationDate: string;
    /** YYYY-MM-DD format */
    expirationDate: string;
    /** Age in days */
    estimatedDomainAge: number;
    hostnames: string;
    status?: string;
    /** YYYY-MM-DD format */
    lastUpdated?: string;
}

export interface ContactInformation {
    registrantName: string;
    technicalContactName: string;
    administrativeContactName: string;
    contactEmail: string;
    registrantCountry?: string;
    technicalContactEmail?: string;
    administrativeContactEmail?: string;
}

export interface DomainResponse {
    domainInformation: DomainInformation;
}

export interface ContactResponse {
    contactInformation: ContactInformation;
}

export type WhoisApiResponse = DomainResponse | ContactResponse;

export interface ApiErrorResponse {
    error: string;
    statusCode?: number;
    /** For programmatic handling */
    errorCode?: string;
    details?: Record<string, unknown>;
    timestamp?: string;
}

export interface AiLookupRequest {
    description: string;
    maxSuggestions?: number;
    preferredTlds?: string[];
}

export interface AiLookupResponse {
    response: string;
    /** Processing time in milliseconds */
    processingTime?: number;
    /** Confidence score (0-1) */
    confidence?: number;
}

export interface DomainLookupRequest {
    domain: string;
    type: "domain" | "contact";
    includeRaw?: boolean;
}

export interface ValidationResult {
    isValid: boolean;
    error?: string;
    warnings?: string[];
    /** Sanitized/normalized value */
    sanitizedValue?: string;
}

export function isDomainResponse(
    response: WhoisApiResponse
): response is DomainResponse {
    return "domainInformation" in response;
}

export function isContactResponse(
    response: WhoisApiResponse
): response is ContactResponse {
    return "contactInformation" in response;
}

export function isApiErrorResponse(
    response: unknown
): response is ApiErrorResponse {
    return (
        typeof response === "object" &&
        response !== null &&
        "error" in response &&
        typeof (response as ApiErrorResponse).error === "string"
    );
}

export type PartialDomainInformation = Partial<DomainInformation>;

export type PartialContactInformation = Partial<ContactInformation>;

export interface FormatOptions {
    dateFormat?: "ISO" | "US" | "EU";
    maxLength?: number;
    truncationSuffix?: string;
    fallbackValue?: string;
}

export const VALIDATION_CONSTANTS = {
    /** RFC 1035 limit */
    MAX_DOMAIN_LENGTH: 253,
    MAX_AI_DESCRIPTION_LENGTH: 1000,
    /** Milliseconds */
    REQUEST_TIMEOUT: 30000,
    MAX_HOSTNAME_DISPLAY_LENGTH: 25,
    DEFAULT_FALLBACK_VALUE: "N/A",
} as const;

export const VALIDATION_REGEX = {
    DOMAIN: /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.([a-zA-Z]{2,}|[a-zA-Z]{2,}\.[a-zA-Z]{2,})$/,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    IP_ADDRESS:
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    /** YYYY-MM-DD */
    DATE_FORMAT: /^\d{4}-\d{2}-\d{2}$/,
} as const;
