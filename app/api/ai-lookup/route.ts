import { type NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getSystemPrompt } from "@/app/lib/utils";

/**
 * POST /api/ai-lookup
 *
 * Handles AI-powered domain lookup requests using Google's Gemini AI.
 * Takes a user description and returns AI-generated domain suggestions or information.
 *
 * @param request - NextRequest containing the user's domain description
 * @returns NextResponse with AI-generated response or error message
 */
export async function POST(request: NextRequest) {
    try {
        // Validate request content type
        const contentType = request.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
            return NextResponse.json(
                { error: "Content-Type must be application/json" },
                { status: 400 }
            );
        }

        // Parse and validate request body
        let body;
        try {
            body = await request.json();
        } catch (parseError) {
            console.error("JSON parsing error:", parseError);
            return NextResponse.json(
                { error: "Invalid JSON format in request body" },
                { status: 400 }
            );
        }

        const { description } = body;

        // Validate required fields
        if (!description) {
            return NextResponse.json(
                { error: "Description field is required" },
                { status: 400 }
            );
        }

        // Validate description is a string and has reasonable length
        if (typeof description !== "string") {
            return NextResponse.json(
                { error: "Description must be a string" },
                { status: 400 }
            );
        }

        if (description.trim().length === 0) {
            return NextResponse.json(
                { error: "Description cannot be empty" },
                { status: 400 }
            );
        }

        if (description.length > 1000) {
            return NextResponse.json(
                { error: "Description is too long (maximum 1000 characters)" },
                { status: 400 }
            );
        }

        // Validate environment variables
        const API_KEY = process.env.GEMINI_API_KEY;
        if (!API_KEY) {
            console.error("Missing GEMINI_API_KEY environment variable");
            return NextResponse.json(
                { error: "AI service is not properly configured" },
                { status: 500 }
            );
        }

        // Get system prompt with error handling
        let systemPrompt;
        try {
            systemPrompt = getSystemPrompt();
        } catch (promptError) {
            console.error("Error getting system prompt:", promptError);
            return NextResponse.json(
                { error: "Failed to initialize AI system" },
                { status: 500 }
            );
        }

        // Initialize Google AI client
        let ai;
        try {
            ai = new GoogleGenAI({ apiKey: API_KEY });
        } catch (initError) {
            console.error("Error initializing Google AI client:", initError);
            return NextResponse.json(
                { error: "Failed to initialize AI service" },
                { status: 500 }
            );
        }

        // Generate AI response with timeout and error handling
        let response;
        try {
            // Create the prompt combining system instructions with user input
            const fullPrompt = `${systemPrompt}. User Prompt: ${description.trim()}`;

            // Generate content with the AI model
            response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: fullPrompt,
            });
        } catch (aiError: any) {
            console.error("AI generation error:", aiError);

            // Handle specific AI API errors
            if (aiError?.status === 429) {
                return NextResponse.json(
                    {
                        error: "AI service is currently busy. Please try again later.",
                    },
                    { status: 429 }
                );
            }

            if (aiError?.status === 401 || aiError?.status === 403) {
                return NextResponse.json(
                    { error: "AI service authentication failed" },
                    { status: 500 }
                );
            }

            if (aiError?.status === 400) {
                return NextResponse.json(
                    { error: "Invalid request to AI service" },
                    { status: 400 }
                );
            }

            // Generic AI service error
            return NextResponse.json(
                { error: "AI service is temporarily unavailable" },
                { status: 503 }
            );
        }

        // Validate AI response
        if (!response) {
            console.error("AI service returned empty response");
            return NextResponse.json(
                { error: "AI service returned no response" },
                { status: 500 }
            );
        }

        // Extract response text with error handling
        let responseText;
        try {
            responseText = response.text;
        } catch (textError) {
            console.error("Error extracting response text:", textError);
            return NextResponse.json(
                { error: "Failed to process AI response" },
                { status: 500 }
            );
        }

        // Validate response text
        if (!responseText || typeof responseText !== "string") {
            console.error("AI service returned invalid response format");
            return NextResponse.json(
                { error: "AI service returned invalid response" },
                { status: 500 }
            );
        }

        // Trim and validate response length
        responseText = responseText.trim();
        if (responseText.length === 0) {
            console.error("AI service returned empty response text");
            return NextResponse.json(
                { error: "AI service returned empty response" },
                { status: 500 }
            );
        }

        // Return successful response
        return NextResponse.json({
            response: responseText,
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        // Log the full error for debugging
        console.error("Unexpected error in AI lookup:", {
            message: error?.message,
            stack: error?.stack,
            name: error?.name,
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
