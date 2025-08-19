import {
    formatDate,
    formatHostnames,
    getAdministrativeContactName,
    getRegistrantName,
    getTechnicalContactName,
} from "@/app/lib/utils";
import { type NextRequest, NextResponse } from "next/server";

const WHOIS_BASE_URL = "https://www.whoisxmlapi.com/whoisserver/WhoisService";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const domain = searchParams.get("domain");
    const type = searchParams.get("type");
    const WHOIS_API_KEY = process.env.WHOIS_API_KEY;

    if (!domain) {
        return NextResponse.json(
            { error: "Domain parameter is required" },
            { status: 400 }
        );
    }

    if (!type || !["domain", "contact"].includes(type)) {
        return NextResponse.json(
            {
                error: "Type parameter is required and must be 'domain' or 'contact'",
            },
            { status: 400 }
        );
    }

    try {
        // Clean domain name - remove protocol if present
        const cleanDomain = domain.replace(/^https?:\/\//, "").split("/")[0];

        const body = {
            domainName: cleanDomain,
            apiKey: WHOIS_API_KEY,
            outputFormat: "JSON",
        };

        const response = await fetch(WHOIS_BASE_URL, {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        });

        if (!response.ok) throw new Error(response.statusText);

        const data = await response.json();
        const whoisRecord = data.WhoisRecord;

        if (type === "domain") {
            return NextResponse.json({
                domainInformation: {
                    domainName: whoisRecord.domainName || cleanDomain,
                    registrar: whoisRecord.registrarName || "N/A",
                    registrationDate: formatDate(whoisRecord.createdDate),
                    expirationDate: formatDate(whoisRecord.expiresDate),
                    estimatedDomainAge: whoisRecord.estimatedDomainAge || 0,
                    hostnames: formatHostnames(
                        whoisRecord.nameServers?.hostNames || []
                    ),
                },
            });
        }

        if (type === "contact") {
            return NextResponse.json({
                contactInformation: {
                    registrantName: getRegistrantName(whoisRecord.registrant),
                    technicalContactName: getTechnicalContactName(
                        whoisRecord.technicalContact
                    ),
                    administrativeContactName: getAdministrativeContactName(
                        whoisRecord.administrativeContact
                    ),
                    contactEmail: whoisRecord.contactEmail || "N/A",
                },
            });
        }
    } catch (error) {
        console.log({ error });
        return NextResponse.json(
            { error: "Failed to lookup domain information" },
            { status: 500 }
        );
    }
}
