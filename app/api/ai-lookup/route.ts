import { type NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getSystemPrompt } from "@/app/lib/utils";

export async function POST(request: NextRequest) {
    try {
        const { description } = await request.json();
        if (!description) {
            return NextResponse.json(
                { error: "Description is required" },
                { status: 400 }
            );
        }
        const systemPrompt = getSystemPrompt();
        const API_KEY = process.env.GEMINI_API_KEY;
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `${systemPrompt}. User Prompt: ${description}`,
        });

        const responseText = response.text;

        return NextResponse.json({ response: responseText });
    } catch (error) {
        console.error("AI lookup error:", error);
        return NextResponse.json(
            { error: "Failed to process AI lookup request" },
            { status: 500 }
        );
    }
}
