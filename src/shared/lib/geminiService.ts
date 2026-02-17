
import { GoogleGenAI, Type } from "@google/genai";
import { Product, Order, PermitForm } from '@/shared/types/prototype.types';

const getAI = () => {
  if (!process.env.API_KEY) return null;
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const findPermitFormsAI = async (cemeteryName: string) => {
  const ai = getAI();
  if (!ai) return null;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Search for official memorial or headstone permit application forms for "${cemeteryName}". Identify the governing council or authority.`,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

export const prefillPermitDataAI = async (order: Order, product: Product) => {
  const ai = getAI();
  if (!ai) return null;
  
  const prompt = `You are a permit agent for a masonry business. Extract the data needed to fill a permit form for:
  Order: ${order.id}
  Customer: ${order.customerName}
  Cemetery: ${order.cemetery}
  Deceased: ${order.deceasedName}
  Stone Dimensions: ${product.dimensions.width}x${product.dimensions.height}x${product.dimensions.thickness}mm
  Inscription: ${order.inscription?.rawText}
  
  Format as a JSON object of form fields.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          applicant_name: { type: Type.STRING },
          deceased_name: { type: Type.STRING },
          grave_number: { type: Type.STRING },
          stone_material: { type: Type.STRING },
          inscription_content: { type: Type.STRING },
          overall_height: { type: Type.NUMBER },
          overall_width: { type: Type.NUMBER }
        }
      }
    }
  });

  try {
    return JSON.parse(response.text.trim());
  } catch (e) {
    return null;
  }
};

export const parseInscriptionAI = async (rawText: string) => {
  const ai = getAI();
  if (!ai) return null;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Parse the following memorial inscription. Extract the main text and return a JSON object with: 
    1. inscriptionText (string)
    2. characterCount (integer - alphanumeric only, no spaces or punctuation)
    3. symbols (array of strings)
    4. summary (brief note for the mason)
    
    Text: "${rawText}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          inscriptionText: { type: Type.STRING },
          characterCount: { type: Type.INTEGER },
          symbols: { type: Type.ARRAY, items: { type: Type.STRING } },
          summary: { type: Type.STRING }
        },
        required: ["inscriptionText", "characterCount"]
      }
    }
  });

  try {
    return JSON.parse(response.text.trim());
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return null;
  }
};

export const generateVisualProofAI = async (rawText: string, product: Product) => {
  const ai = getAI();
  if (!ai) return null;
  
  const prompt = `Create a spatial layout for a memorial headstone.
  Stone Shape: ${product.shape}
  Stone Dimensions: ${product.dimensions.width}mm width x ${product.dimensions.height}mm height.
  Inscription Text: "${rawText}"
  Return a JSON object with an array called "lines".`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          lines: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                y: { type: Type.NUMBER },
                fontSize: { type: Type.NUMBER }
              },
              required: ["text", "y", "fontSize"]
            }
          }
        },
        required: ["lines"]
      }
    }
  });

  try {
    return JSON.parse(response.text.trim());
  } catch (e) {
    return null;
  }
};

export const matchCemeteryEmailToOrderAI = async (emailContent: string, orders: Order[]) => {
  const ai = getAI();
  if (!ai) return null;

  const orderContext = orders.map(o => ({
    id: o.id,
    deceased: o.deceasedName,
    cemetery: o.cemetery,
    customer: o.customerName
  }));

  const prompt = `Identify which order this email refers to.
  Email Content: "${emailContent}"
  Active Orders: ${JSON.stringify(orderContext)}
  Return a JSON object with matchFound, orderId, confidence, reasoning.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          matchFound: { type: Type.BOOLEAN },
          orderId: { type: Type.STRING, nullable: true },
          confidence: { type: Type.NUMBER },
          reasoning: { type: Type.STRING }
        },
        required: ["matchFound", "confidence", "reasoning"]
      }
    }
  });

  try {
    return JSON.parse(response.text.trim());
  } catch (e) {
    return null;
  }
};
