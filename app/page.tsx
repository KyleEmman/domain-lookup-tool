"use client";

import type React from "react";
import { useState, useCallback, useEffect } from "react";

/**
 * Interface for domain information returned by the API
 */
interface DomainInfo {
    domainName: string;
    registrar: string;
    registrationDate: string;
    expirationDate: string;
    estimatedDomainAge: number;
    hostnames: string;
}

/**
 * Interface for contact information returned by the API
 */
interface ContactInfo {
    registrantName: string;
    technicalContactName: string;
    administrativeContactName: string;
    contactEmail: string;
}

/**
 * Type definition for information lookup types
 */
type InfoType = "domain" | "contact";

/**
 * Maximum character limits for input validation
 */
const MAX_DOMAIN_LENGTH = 253; // RFC 1035 limit
const MAX_AI_DESCRIPTION_LENGTH = 1000;

/**
 * Request timeout in milliseconds
 */
const REQUEST_TIMEOUT = 30000;

/**
 * Domain Lookup Tool Component
 *
 * A comprehensive domain lookup application that provides:
 * - Traditional WHOIS domain and contact information lookup
 * - AI-powered domain suggestions based on descriptions
 * - Error handling and user feedback
 * - Responsive design with accessibility features
 */
export default function DomainLookup() {
    // Traditional domain lookup state
    const [domain, setDomain] = useState("");
    const [infoType, setInfoType] = useState<InfoType>("domain");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [domainInfo, setDomainInfo] = useState<DomainInfo | null>(null);
    const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);

    // AI lookup state
    const [aiDescription, setAiDescription] = useState("");
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState("");
    const [aiResponse, setAiResponse] = useState("");

    /**
     * Validates domain name format and length
     * @param domainName - The domain name to validate
     * @returns Object with isValid boolean and error message
     */
    const validateDomain = useCallback((domainName: string) => {
        const trimmedDomain = domainName.trim();

        if (!trimmedDomain) {
            return { isValid: false, error: "Please enter a domain name" };
        }

        if (trimmedDomain.length > MAX_DOMAIN_LENGTH) {
            return {
                isValid: false,
                error: `Domain name is too long (maximum ${MAX_DOMAIN_LENGTH} characters)`,
            };
        }

        // Basic domain format validation
        const domainRegex =
            /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.([a-zA-Z]{2,}|[a-zA-Z]{2,}\.[a-zA-Z]{2,})$/;
        if (!domainRegex.test(trimmedDomain)) {
            return {
                isValid: false,
                error: "Please enter a valid domain name (e.g., example.com)",
            };
        }

        return { isValid: true, error: "" };
    }, []);

    /**
     * Validates AI description input
     * @param description - The AI description to validate
     * @returns Object with isValid boolean and error message
     */
    const validateAiDescription = useCallback((description: string) => {
        const trimmedDescription = description.trim();

        if (!trimmedDescription) {
            return {
                isValid: false,
                error: "Please enter a domain description",
            };
        }

        if (trimmedDescription.length > MAX_AI_DESCRIPTION_LENGTH) {
            return {
                isValid: false,
                error: `Description is too long (maximum ${MAX_AI_DESCRIPTION_LENGTH} characters)`,
            };
        }

        return { isValid: true, error: "" };
    }, []);

    /**
     * Creates an AbortController with timeout for API requests
     * @param timeoutMs - Timeout in milliseconds
     * @returns AbortController instance
     */
    const createTimeoutController = useCallback((timeoutMs: number) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, timeoutMs);

        // Store timeout ID for cleanup
        (controller as any).timeoutId = timeoutId;
        return controller;
    }, []);

    /**
     * Cleans up AbortController timeout
     * @param controller - AbortController to clean up
     */
    const cleanupController = useCallback((controller: AbortController) => {
        if ((controller as any).timeoutId) {
            clearTimeout((controller as any).timeoutId);
        }
    }, []);

    /**
     * Handles traditional domain lookup form submission
     * @param e - Form submission event
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate domain input
        const validation = validateDomain(domain);
        if (!validation.isValid) {
            setError(validation.error);
            return;
        }

        // Reset state
        setLoading(true);
        setError("");
        setDomainInfo(null);
        setContactInfo(null);

        // Create timeout controller
        const controller = createTimeoutController(REQUEST_TIMEOUT);

        try {
            const response = await fetch(
                `/api/domain-lookup?domain=${encodeURIComponent(
                    domain.trim()
                )}&type=${infoType}`,
                {
                    signal: controller.signal,
                    headers: {
                        Accept: "application/json",
                    },
                }
            );

            // Clean up timeout
            cleanupController(controller);

            // Handle HTTP errors
            if (!response.ok) {
                let errorMessage = "Failed to lookup domain information";

                try {
                    const errorData = await response.json();
                    if (errorData.error) {
                        errorMessage = errorData.error;
                    }
                } catch {
                    // Use status text if JSON parsing fails
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }

                throw new Error(errorMessage);
            }

            // Parse response
            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                throw new Error("Invalid response format from server");
            }

            // Validate response structure
            if (!data || typeof data !== "object") {
                throw new Error("Invalid response from server");
            }

            // Set appropriate state based on lookup type
            if (infoType === "domain") {
                if (!data.domainInformation) {
                    throw new Error("No domain information received");
                }
                setDomainInfo(data.domainInformation);
            } else {
                if (!data.contactInformation) {
                    throw new Error("No contact information received");
                }
                setContactInfo(data.contactInformation);
            }
        } catch (err: any) {
            cleanupController(controller);

            // Handle specific error types
            if (err.name === "AbortError") {
                setError("Request timed out. Please try again.");
            } else if (
                err instanceof TypeError &&
                err.message.includes("fetch")
            ) {
                setError(
                    "Network error. Please check your connection and try again."
                );
            } else {
                setError(
                    err instanceof Error
                        ? err.message
                        : "An unexpected error occurred during domain lookup"
                );
            }
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handles AI lookup form submission
     * @param e - Form submission event
     */
    const handleAiLookup = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate AI description input
        const validation = validateAiDescription(aiDescription);
        if (!validation.isValid) {
            setAiError(validation.error);
            return;
        }

        // Reset state
        setAiLoading(true);
        setAiError("");
        setAiResponse("");

        // Create timeout controller
        const controller = createTimeoutController(REQUEST_TIMEOUT);

        try {
            const response = await fetch("/api/ai-lookup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({ description: aiDescription.trim() }),
                signal: controller.signal,
            });

            // Clean up timeout
            cleanupController(controller);

            // Handle HTTP errors
            if (!response.ok) {
                let errorMessage = "Failed to get AI response";

                try {
                    const errorData = await response.json();
                    if (errorData.error) {
                        errorMessage = errorData.error;
                    }
                } catch {
                    // Use status text if JSON parsing fails
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }

                throw new Error(errorMessage);
            }

            // Parse response
            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                throw new Error("Invalid response format from server");
            }

            // Validate response structure
            if (!data || typeof data !== "object" || !data.response) {
                throw new Error("Invalid response from AI service");
            }

            setAiResponse(data.response);
        } catch (err: any) {
            cleanupController(controller);

            // Handle specific error types
            if (err.name === "AbortError") {
                setAiError("Request timed out. Please try again.");
            } else if (
                err instanceof TypeError &&
                err.message.includes("fetch")
            ) {
                setAiError(
                    "Network error. Please check your connection and try again."
                );
            } else {
                setAiError(
                    err instanceof Error
                        ? err.message
                        : "An unexpected error occurred during AI lookup"
                );
            }
        } finally {
            setAiLoading(false);
        }
    };

    /**
     * Handles domain input changes with validation
     * @param e - Input change event
     */
    const handleDomainChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            setDomain(value);

            // Clear error when user starts typing
            if (error) {
                setError("");
            }
        },
        [error]
    );

    /**
     * Handles AI description input changes with validation
     * @param e - Textarea change event
     */
    const handleAiDescriptionChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            const value = e.target.value;
            setAiDescription(value);

            // Clear error when user starts typing
            if (aiError) {
                setAiError("");
            }
        },
        [aiError]
    );

    /**
     * Handles info type radio button changes
     * @param e - Input change event
     */
    const handleInfoTypeChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setInfoType(e.target.value as InfoType);

            // Clear previous results when changing type
            setDomainInfo(null);
            setContactInfo(null);
            setError("");
        },
        []
    );

    // Clear results when component unmounts
    useEffect(() => {
        return () => {
            setDomainInfo(null);
            setContactInfo(null);
            setAiResponse("");
        };
    }, []);

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header Section */}
                <header className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        Domain Lookup Tool
                    </h1>
                    <p className="text-muted-foreground">
                        Enter a domain name to retrieve detailed information or
                        describe a domain for AI suggestions
                    </p>
                </header>

                {/* AI Domain Lookup Section */}
                <div className="bg-card border border-border rounded-lg p-6 mb-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4">
                        AI Domain Lookup
                    </h2>
                    <form onSubmit={handleAiLookup} className="space-y-4">
                        <div>
                            <label
                                htmlFor="aiDescription"
                                className="block text-sm font-medium text-foreground mb-2"
                            >
                                Describe the domain you're looking for
                                <span className="text-muted-foreground ml-1">
                                    ({aiDescription.length}/
                                    {MAX_AI_DESCRIPTION_LENGTH})
                                </span>
                            </label>
                            <textarea
                                id="aiDescription"
                                value={aiDescription}
                                onChange={handleAiDescriptionChange}
                                placeholder="e.g., A popular social media platform for professionals, or an e-commerce site that sells books..."
                                rows={3}
                                maxLength={MAX_AI_DESCRIPTION_LENGTH}
                                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                                aria-describedby={
                                    aiError ? "ai-error" : undefined
                                }
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={aiLoading || !aiDescription.trim()}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            aria-describedby={
                                aiLoading ? "ai-loading" : undefined
                            }
                        >
                            {aiLoading ? (
                                <div
                                    className="flex items-center justify-center"
                                    id="ai-loading"
                                >
                                    <svg
                                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    AI is thinking...
                                </div>
                            ) : (
                                "Lookup with AI"
                            )}
                        </button>
                    </form>

                    {/* AI Error Display */}
                    {aiError && (
                        <div
                            className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4"
                            role="alert"
                            id="ai-error"
                        >
                            <div className="flex items-center">
                                <svg
                                    className="w-5 h-5 text-red-500 mr-2 flex-shrink-0"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                    aria-hidden="true"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <span className="text-red-700 font-medium">
                                    Error: {aiError}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* AI Response Display */}
                    {aiResponse && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                            <h3 className="text-lg font-semibold text-green-800 mb-2">
                                AI Response
                            </h3>
                            <div className="text-green-700 whitespace-pre-wrap break-words">
                                {aiResponse}
                            </div>
                        </div>
                    )}
                </div>

                {/* Traditional Domain Lookup Section */}
                <div className="bg-card border border-border rounded-lg p-6 mb-8">
                    <h2 className="text-lg font-semibold text-foreground mb-4">
                        Traditional Domain Lookup
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label
                                htmlFor="domain"
                                className="block text-sm font-medium text-foreground mb-2"
                            >
                                Domain Name
                                <span className="text-muted-foreground ml-1">
                                    ({domain.length}/{MAX_DOMAIN_LENGTH})
                                </span>
                            </label>
                            <input
                                type="text"
                                id="domain"
                                value={domain}
                                onChange={handleDomainChange}
                                placeholder="example.com"
                                maxLength={MAX_DOMAIN_LENGTH}
                                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                                aria-describedby={
                                    error ? "domain-error" : undefined
                                }
                            />
                        </div>

                        <div>
                            <fieldset>
                                <legend className="block text-sm font-medium text-foreground mb-2">
                                    Information Type
                                </legend>
                                <div className="flex gap-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="infoType"
                                            value="domain"
                                            checked={infoType === "domain"}
                                            onChange={handleInfoTypeChange}
                                            className="mr-2 text-primary focus:ring-ring"
                                        />
                                        <span className="text-foreground">
                                            Domain Information
                                        </span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="infoType"
                                            value="contact"
                                            checked={infoType === "contact"}
                                            onChange={handleInfoTypeChange}
                                            className="mr-2 text-primary focus:ring-ring"
                                        />
                                        <span className="text-foreground">
                                            Contact Information
                                        </span>
                                    </label>
                                </div>
                            </fieldset>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !domain.trim()}
                            className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            aria-describedby={
                                loading ? "domain-loading" : undefined
                            }
                        >
                            {loading ? (
                                <span id="domain-loading">Looking up...</span>
                            ) : (
                                "Lookup Domain"
                            )}
                        </button>
                    </form>
                </div>

                {/* Error Display */}
                {error && (
                    <div
                        className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-8"
                        role="alert"
                        id="domain-error"
                    >
                        <div className="flex items-center">
                            <svg
                                className="w-5 h-5 text-destructive mr-2 flex-shrink-0"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                aria-hidden="true"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span className="text-destructive font-medium">
                                Error: {error}
                            </span>
                        </div>
                    </div>
                )}

                {/* Domain Information Display */}
                {domainInfo && infoType === "domain" && (
                    <div className="bg-card border border-border rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-foreground mb-4">
                            Domain Information
                        </h2>
                        <div className="overflow-x-auto">
                            <table
                                className="w-full border-collapse"
                                role="table"
                            >
                                <tbody>
                                    <tr className="border-b border-border">
                                        <td className="py-3 px-4 font-medium text-foreground bg-muted/50">
                                            Domain Name
                                        </td>
                                        <td className="py-3 px-4 text-foreground break-all">
                                            {domainInfo.domainName}
                                        </td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="py-3 px-4 font-medium text-foreground bg-muted/50">
                                            Registrar
                                        </td>
                                        <td className="py-3 px-4 text-foreground">
                                            {domainInfo.registrar}
                                        </td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="py-3 px-4 font-medium text-foreground bg-muted/50">
                                            Registration Date
                                        </td>
                                        <td className="py-3 px-4 text-foreground">
                                            {domainInfo.registrationDate}
                                        </td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="py-3 px-4 font-medium text-foreground bg-muted/50">
                                            Expiration Date
                                        </td>
                                        <td className="py-3 px-4 text-foreground">
                                            {domainInfo.expirationDate}
                                        </td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="py-3 px-4 font-medium text-foreground bg-muted/50">
                                            Estimated Domain Age (days)
                                        </td>
                                        <td className="py-3 px-4 text-foreground">
                                            {domainInfo.estimatedDomainAge.toLocaleString()}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 px-4 font-medium text-foreground bg-muted/50">
                                            Hostnames
                                        </td>
                                        <td className="py-3 px-4 text-foreground break-all">
                                            {domainInfo.hostnames}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Contact Information Display */}
                {contactInfo && infoType === "contact" && (
                    <div className="bg-card border border-border rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-foreground mb-4">
                            Contact Information
                        </h2>
                        <div className="overflow-x-auto">
                            <table
                                className="w-full border-collapse"
                                role="table"
                            >
                                <tbody>
                                    <tr className="border-b border-border">
                                        <td className="py-3 px-4 font-medium text-foreground bg-muted/50">
                                            Registrant Name
                                        </td>
                                        <td className="py-3 px-4 text-foreground break-words">
                                            {contactInfo.registrantName}
                                        </td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="py-3 px-4 font-medium text-foreground bg-muted/50">
                                            Technical Contact Name
                                        </td>
                                        <td className="py-3 px-4 text-foreground break-words">
                                            {contactInfo.technicalContactName}
                                        </td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="py-3 px-4 font-medium text-foreground bg-muted/50">
                                            Administrative Contact Name
                                        </td>
                                        <td className="py-3 px-4 text-foreground break-words">
                                            {
                                                contactInfo.administrativeContactName
                                            }
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 px-4 font-medium text-foreground bg-muted/50">
                                            Contact Email
                                        </td>
                                        <td className="py-3 px-4 text-foreground break-all">
                                            {contactInfo.contactEmail}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
