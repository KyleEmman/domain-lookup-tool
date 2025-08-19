import {
    formatDate,
    formatHostnames,
    getAdministrativeContactName,
    getRegistrantName,
    getTechnicalContactName,
} from "@/app/lib/utils";
import { type NextRequest, NextResponse } from "next/server";

// WHOIS API endpoint URL
const WHOIS_BASE_URL = "https://www.whoisxmlapi.com/whoisserver/WhoisService";

// Request timeout in milliseconds (30 seconds)
const REQUEST_TIMEOUT = 30000;

/**
 * GET /api/domain-lookup
 *
 * Retrieves domain information or contact information for a given domain
 * using the WHOIS XML API service.
 *
 * Query Parameters:
 * - domain: The domain name to lookup (required)
 * - type: Type of information to retrieve - 'domain' or 'contact' (required)
 *
 * @param request - NextRequest containing query parameters
 * @returns NextResponse with domain/contact information or error message
 */
export async function GET(request: NextRequest) {
    try {
        // Extract and validate query parameters
        const searchParams = request.nextUrl.searchParams;
        const domain = searchParams.get("domain");
        const type = searchParams.get("type");

        // Validate required environment variables
        const WHOIS_API_KEY = process.env.WHOIS_API_KEY;
        if (!WHOIS_API_KEY) {
            console.error("Missing WHOIS_API_KEY environment variable");
            return NextResponse.json(
                { error: "WHOIS service is not properly configured" },
                { status: 500 }
            );
        }

        // Validate domain parameter
        if (!domain) {
            return NextResponse.json(
                { error: "Domain parameter is required" },
                { status: 400 }
            );
        }

        // Validate domain format and length
        if (typeof domain !== "string" || domain.trim().length === 0) {
            return NextResponse.json(
                { error: "Domain parameter must be a non-empty string" },
                { status: 400 }
            );
        }

        if (domain.length > 253) {
            // RFC 1035 domain name length limit
            return NextResponse.json(
                { error: "Domain name is too long (maximum 253 characters)" },
                { status: 400 }
            );
        }

        // Validate type parameter
        if (!type) {
            return NextResponse.json(
                { error: "Type parameter is required" },
                { status: 400 }
            );
        }

        if (!["domain", "contact"].includes(type)) {
            return NextResponse.json(
                {
                    error: "Type parameter must be 'domain' or 'contact'",
                },
                { status: 400 }
            );
        }

        // Clean and validate domain name
        let cleanDomain;
        try {
            // Remove protocol and path if present
            cleanDomain = domain
                .replace(/^https?:\/\//, "")
                .split("/")[0]
                .toLowerCase()
                .trim();

            // Basic domain validation
            if (!cleanDomain || cleanDomain.length === 0) {
                throw new Error("Invalid domain format");
            }

            // Check for basic domain format (contains at least one dot)
            if (
                !cleanDomain.includes(".") ||
                cleanDomain.startsWith(".") ||
                cleanDomain.endsWith(".")
            ) {
                throw new Error("Invalid domain format");
            }

            // Check for invalid characters
            const domainRegex = /^[a-z0-9.-]+$/;
            if (!domainRegex.test(cleanDomain)) {
                throw new Error("Domain contains invalid characters");
            }
        } catch (domainError) {
            console.error("Domain validation error:", domainError);
            return NextResponse.json(
                { error: "Invalid domain format" },
                { status: 400 }
            );
        }

        // Prepare WHOIS API request body
        const requestBody = {
            domainName: cleanDomain,
            apiKey: WHOIS_API_KEY,
            outputFormat: "JSON",
        };

        // Create AbortController for request timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

        let response;
        try {
            // Make request to WHOIS API
            response = await fetch(WHOIS_BASE_URL, {
                method: "POST",
                body: JSON.stringify(requestBody),
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "User-Agent": "Domain-Lookup-Service/1.0",
                },
                signal: controller.signal,
            });

            // Clear timeout on successful response
            clearTimeout(timeoutId);
        } catch (fetchError: any) {
            clearTimeout(timeoutId);
            console.error("WHOIS API fetch error:", fetchError);

            // Handle specific fetch errors
            if (fetchError.name === "AbortError") {
                return NextResponse.json(
                    {
                        error: "Request timeout - WHOIS service took too long to respond",
                    },
                    { status: 504 }
                );
            }

            if (
                fetchError.code === "ENOTFOUND" ||
                fetchError.code === "ECONNREFUSED"
            ) {
                return NextResponse.json(
                    { error: "WHOIS service is currently unavailable" },
                    { status: 503 }
                );
            }

            return NextResponse.json(
                { error: "Failed to connect to WHOIS service" },
                { status: 503 }
            );
        }

        // Validate HTTP response status
        if (!response.ok) {
            console.error(
                `WHOIS API HTTP error: ${response.status} ${response.statusText}`
            );

            // Handle specific HTTP status codes
            switch (response.status) {
                case 400:
                    return NextResponse.json(
                        { error: "Invalid domain name or request format" },
                        { status: 400 }
                    );
                case 401:
                    return NextResponse.json(
                        { error: "WHOIS API authentication failed" },
                        { status: 500 }
                    );
                case 403:
                    return NextResponse.json(
                        { error: "WHOIS API access forbidden" },
                        { status: 500 }
                    );
                case 429:
                    return NextResponse.json(
                        {
                            error: "WHOIS API rate limit exceeded. Please try again later.",
                        },
                        { status: 429 }
                    );
                case 500:
                case 502:
                case 503:
                    return NextResponse.json(
                        { error: "WHOIS service is temporarily unavailable" },
                        { status: 503 }
                    );
                default:
                    return NextResponse.json(
                        {
                            error: `WHOIS service error: ${response.statusText}`,
                        },
                        { status: 500 }
                    );
            }
        }

        // Parse JSON response with error handling
        let data;
        try {
            data = await response.json();
        } catch (parseError) {
            console.error("JSON parsing error:", parseError);
            return NextResponse.json(
                { error: "Invalid response format from WHOIS service" },
                { status: 500 }
            );
        }

        // Validate response structure
        if (!data || typeof data !== "object") {
            console.error("Invalid WHOIS response structure:", data);
            return NextResponse.json(
                { error: "Invalid response from WHOIS service" },
                { status: 500 }
            );
        }

        const whoisRecord = data.WhoisRecord;
        if (!whoisRecord) {
            // Check for API error messages
            if (data.ErrorMessage) {
                console.error("WHOIS API error:", data.ErrorMessage);
                return NextResponse.json(
                    { error: `WHOIS lookup failed: ${data.ErrorMessage}` },
                    { status: 400 }
                );
            }

            return NextResponse.json(
                { error: "No WHOIS record found for this domain" },
                { status: 404 }
            );
        }

        // Process domain information request
        if (type === "domain") {
            try {
                const domainInfo = {
                    domainName: whoisRecord.domainName || cleanDomain,
                    registrar: whoisRecord.registrarName || "N/A",
                    registrationDate: formatDate(whoisRecord.createdDate),
                    expirationDate: formatDate(whoisRecord.expiresDate),
                    estimatedDomainAge: whoisRecord.estimatedDomainAge || 0,
                    hostnames: formatHostnames(
                        whoisRecord.nameServers?.hostNames || []
                    ),
                };

                return NextResponse.json({
                    domainInformation: domainInfo,
                    timestamp: new Date().toISOString(),
                });
            } catch (processingError) {
                console.error(
                    "Error processing domain information:",
                    processingError
                );
                return NextResponse.json(
                    { error: "Failed to process domain information" },
                    { status: 500 }
                );
            }
        }

        // Process contact information request
        if (type === "contact") {
            try {
                const contactInfo = {
                    registrantName: getRegistrantName(whoisRecord.registrant),
                    technicalContactName: getTechnicalContactName(
                        whoisRecord.technicalContact
                    ),
                    administrativeContactName: getAdministrativeContactName(
                        whoisRecord.administrativeContact
                    ),
                    contactEmail: whoisRecord.contactEmail || "N/A",
                };

                return NextResponse.json({
                    contactInformation: contactInfo,
                    timestamp: new Date().toISOString(),
                });
            } catch (processingError) {
                console.error(
                    "Error processing contact information:",
                    processingError
                );
                return NextResponse.json(
                    { error: "Failed to process contact information" },
                    { status: 500 }
                );
            }
        }
    } catch (error: any) {
        // Log unexpected errors with full context
        console.error("Unexpected error in domain lookup:", {
            message: error?.message,
            stack: error?.stack,
            name: error?.name,
            url: request.url,
        });

        // Return generic error response
        return NextResponse.json(
            {
                error: "An unexpected error occurred while processing your request",
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}
