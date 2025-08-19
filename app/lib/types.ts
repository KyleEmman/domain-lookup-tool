export interface Contact {
    organization?: string;
    name?: string;
    country?: string;
    countryCode?: string;
    rawText?: string;
}

export interface NameServers {
    rawText?: string;
    hostNames?: string[];
    ips?: string[];
}

export interface WhoisRecord {
    createdDate?: string;
    updatedDate?: string;
    expiresDate?: string;
    registrant?: Contact;
    technicalContact?: Contact;
    administrativeContact?: Contact;
    domainName?: string;
    nameServers?: NameServers;
    status?: string;
    registrarName?: string;
    registrarIANAID?: string;
    contactEmail?: string;
    estimatedDomainAge?: number;
}

// API Response types
export interface DomainInformation {
    domainName: string;
    registrar: string;
    registrationDate: string;
    expirationDate: string;
    estimatedDomainAge: number;
    hostnames: string;
}

export interface ContactInformation {
    registrantName: string;
    technicalContactName: string;
    administrativeContactName: string;
    contactEmail: string;
}

export interface DomainResponse {
    domainInformation: DomainInformation;
}

export interface ContactResponse {
    contactInformation: ContactInformation;
}

export type WhoisApiResponse = DomainResponse | ContactResponse;
