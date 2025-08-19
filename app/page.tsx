"use client";

import type React from "react";
import { useState } from "react";

// Updated interfaces to match API response
interface DomainInfo {
    domainName: string;
    registrar: string;
    registrationDate: string;
    expirationDate: string;
    estimatedDomainAge: number;
    hostnames: string;
}

interface ContactInfo {
    registrantName: string;
    technicalContactName: string;
    administrativeContactName: string;
    contactEmail: string;
}

type InfoType = "domain" | "contact";

export default function DomainLookup() {
    const [domain, setDomain] = useState("");
    const [infoType, setInfoType] = useState<InfoType>("domain");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [domainInfo, setDomainInfo] = useState<DomainInfo | null>(null);
    const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);

    const [aiDescription, setAiDescription] = useState("");
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState("");
    const [aiResponse, setAiResponse] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!domain.trim()) {
            setError("Please enter a domain name");
            return;
        }

        setLoading(true);
        setError("");
        setDomainInfo(null);
        setContactInfo(null);

        try {
            const response = await fetch(
                `/api/domain-lookup?domain=${encodeURIComponent(
                    domain
                )}&type=${infoType}`
            );

            if (!response.ok) {
                throw new Error(
                    `Failed to lookup domain: ${response.statusText}`
                );
            }

            const data = await response.json();

            console.log({ data });

            if (infoType === "domain") {
                setDomainInfo(data.domainInformation);
            } else {
                setContactInfo(data.contactInformation);
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "An error occurred during domain lookup"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleAiLookup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!aiDescription.trim()) {
            setAiError("Please enter a domain description");
            return;
        }

        setAiLoading(true);
        setAiError("");
        setAiResponse("");

        try {
            const response = await fetch("/api/ai-lookup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ description: aiDescription }),
            });

            if (!response.ok) {
                throw new Error(
                    `Failed to get AI response: ${response.statusText}`
                );
            }

            const data = await response.json();
            setAiResponse(data.response);
        } catch (err) {
            setAiError(
                err instanceof Error
                    ? err.message
                    : "An error occurred during AI lookup"
            );
        } finally {
            setAiLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        Domain Lookup Tool
                    </h1>
                    <p className="text-muted-foreground">
                        Enter a domain name to retrieve detailed information or
                        describe a domain for AI suggestions
                    </p>
                </header>

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
                            </label>
                            <textarea
                                id="aiDescription"
                                value={aiDescription}
                                onChange={(e) =>
                                    setAiDescription(e.target.value)
                                }
                                placeholder="e.g., A popular social media platform for professionals, or an e-commerce site that sells books..."
                                rows={3}
                                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={aiLoading}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {aiLoading ? (
                                <div className="flex items-center justify-center">
                                    <svg
                                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
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

                    {aiError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                            <div className="flex items-center">
                                <svg
                                    className="w-5 h-5 text-red-500 mr-2"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
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

                    {aiResponse && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                            <h3 className="text-lg font-semibold text-green-800 mb-2">
                                AI Response
                            </h3>
                            <div className="text-green-700 whitespace-pre-wrap">
                                {aiResponse}
                            </div>
                        </div>
                    )}
                </div>

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
                            </label>
                            <input
                                type="text"
                                id="domain"
                                value={domain}
                                onChange={(e) => setDomain(e.target.value)}
                                placeholder="example.com"
                                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Information Type
                            </label>
                            <div className="flex gap-4">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="infoType"
                                        value="domain"
                                        checked={infoType === "domain"}
                                        onChange={(e) =>
                                            setInfoType(
                                                e.target.value as InfoType
                                            )
                                        }
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
                                        onChange={(e) =>
                                            setInfoType(
                                                e.target.value as InfoType
                                            )
                                        }
                                        className="mr-2 text-primary focus:ring-ring"
                                    />
                                    <span className="text-foreground">
                                        Contact Information
                                    </span>
                                </label>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? "Looking up..." : "Lookup Domain"}
                        </button>
                    </form>
                </div>

                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-8">
                        <div className="flex items-center">
                            <svg
                                className="w-5 h-5 text-destructive mr-2"
                                fill="currentColor"
                                viewBox="0 0 20 20"
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

                {domainInfo && infoType === "domain" && (
                    <div className="bg-card border border-border rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-foreground mb-4">
                            Domain Information
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <tbody>
                                    <tr className="border-b border-border">
                                        <td className="py-3 px-4 font-medium text-foreground bg-muted/50">
                                            Domain Name
                                        </td>
                                        <td className="py-3 px-4 text-foreground">
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
                                            {domainInfo.estimatedDomainAge}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 px-4 font-medium text-foreground bg-muted/50">
                                            Hostnames
                                        </td>
                                        <td className="py-3 px-4 text-foreground">
                                            {domainInfo.hostnames}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {contactInfo && infoType === "contact" && (
                    <div className="bg-card border border-border rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-foreground mb-4">
                            Contact Information
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <tbody>
                                    <tr className="border-b border-border">
                                        <td className="py-3 px-4 font-medium text-foreground bg-muted/50">
                                            Registrant Name
                                        </td>
                                        <td className="py-3 px-4 text-foreground">
                                            {contactInfo.registrantName}
                                        </td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="py-3 px-4 font-medium text-foreground bg-muted/50">
                                            Technical Contact Name
                                        </td>
                                        <td className="py-3 px-4 text-foreground">
                                            {contactInfo.technicalContactName}
                                        </td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="py-3 px-4 font-medium text-foreground bg-muted/50">
                                            Administrative Contact Name
                                        </td>
                                        <td className="py-3 px-4 text-foreground">
                                            {
                                                contactInfo.administrativeContactName
                                            }
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 px-4 font-medium text-foreground bg-muted/50">
                                            Contact Email
                                        </td>
                                        <td className="py-3 px-4 text-foreground">
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
