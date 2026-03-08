
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT } from '../constants';
import { FilterCriteria, Doctor, GroundingChunk } from "../types";

const textModel = "gemini-3-flash-preview";
const imageModel = "gemini-3-pro-image-preview";
const searchModel = "gemini-2.5-flash"; // Maps grounding requires 2.5 series models

const DOCTOR_SEARCH_SYSTEM_PROMPT = `
You are an expert medical data retrieval assistant. Your goal is to find highly specific and accurate information about doctors and hospitals.
Use Google Search and Google Maps to find current data.
CRITICAL: You MUST provide your answer as a JSON block containing an array of doctor objects.
Each doctor object MUST have: name, specialty, hospitalName, address, phone, and rating.
If rating is unknown, provide a realistic estimate based on search sentiment or 4.0 as a default.
Always try to find a contact phone number for booking.
Return ONLY the JSON if possible, but if you must provide text, ensure the JSON block is clearly delimited by \`\`\`json and \`\`\`.
`;

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const getApiKey = () => {
  // Use globalThis to avoid build-time replacement issues
  return (globalThis as any).process?.env?.API_KEY || (globalThis as any).process?.env?.GEMINI_API_KEY || '';
};

export const runQuery = async (prompt: string, file: File | null) => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const contents: any[] = [];
  if (file) {
    const imagePart = await fileToGenerativePart(file);
    contents.push(imagePart);
  }
  contents.push({ text: prompt });

  return await ai.models.generateContentStream({
    model: textModel,
    contents: { parts: contents },
    config: { systemInstruction: SYSTEM_PROMPT }
  });
};

export const findDoctors = async (latitude: number | null, longitude: number | null, filters: FilterCriteria): Promise<{ doctors: Doctor[] | null, groundingChunks: GroundingChunk[] | undefined }> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  const locationText = filters.location || (latitude ? `coordinates ${latitude}, ${longitude}` : "my current location");
  
  const specificFilters = [
    filters.specialty ? `specializing in ${filters.specialty}` : "",
    filters.doctorName ? `named ${filters.doctorName}` : "",
    filters.hospitalName ? `at ${filters.hospitalName}` : ""
  ].filter(Boolean).join(" ");

  const searchQuery = `Find top rated doctors ${specificFilters} near ${locationText}. Include their clinic address, hospital affiliation, contact phone number, and user ratings.`;

  const prompt = `Perform a comprehensive search for: "${searchQuery}". 
  Provide the results in this JSON format:
  {
    "doctors": [
      {
        "name": "Dr. Name",
        "specialty": "Specialty",
        "hospitalName": "Hospital Name",
        "address": "Full Address",
        "phone": "Phone Number",
        "rating": 4.5
      }
    ]
  }`;

  try {
    const tools: any[] = [{ googleSearch: {} }, { googleMaps: {} }];
    const toolConfig: any = {};

    if (latitude && longitude) {
      toolConfig.retrievalConfig = {
        latLng: {
          latitude,
          longitude
        }
      };
    }

    const response = await ai.models.generateContent({
      model: searchModel,
      contents: prompt,
      config: {
        systemInstruction: DOCTOR_SEARCH_SYSTEM_PROMPT,
        tools,
        toolConfig
      }
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] | undefined;
    
    // Extract JSON from the response text
    const text = response.text || "";
    // Robust extraction: find the first { and last }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      console.warn("No JSON structure found in response text:", text);
      return { doctors: null, groundingChunks };
    }

    const jsonStr = text.substring(firstBrace, lastBrace + 1);

    try {
      const parsed = JSON.parse(jsonStr);
      return { doctors: parsed.doctors || [], groundingChunks };
    } catch (parseError) {
      console.error("Failed to parse extracted JSON block:", jsonStr);
      return { doctors: null, groundingChunks };
    }
  } catch (e) {
    console.error("Doctor search API error:", e);
    throw e;
  }
};

export const translateToAssamese = async (text: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    try {
        const response = await ai.models.generateContent({ 
          model: textModel, 
          contents: `Translate the following medical text to Assamese accurately and reassuringly: "${text}"` 
        });
        return response.text?.trim() || "Translation unavailable.";
    } catch (error) {
        return "Translation failed.";
    }
};

export const generateComparisonImage = async (query: string): Promise<{ image: string | null, error: string | null }> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const prompt = `Ultra-high-resolution medical comparison infographic: ${query}. Modern medical UI, detailed tables, 3D pill visuals, clear technical text. Ensure clinical accuracy and professional design.`;

  try {
    const response = await ai.models.generateContent({
      model: imageModel,
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: "3:4", imageSize: "1K" }
      },
    });

    for (const part of response.candidates?.[0].content.parts ?? []) {
      if (part.inlineData) return { image: part.inlineData.data, error: null };
    }
    return { image: null, error: "Image part missing." };
  } catch (error: any) {
    throw error;
  }
};
