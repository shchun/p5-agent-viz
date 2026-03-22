import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize the Google Gen AI client. 
// It will automatically use the GEMINI_API_KEY from environment variables.
const ai = new GoogleGenAI({});

const schema = {
  type: Type.OBJECT,
  properties: {
    canvas: {
      type: Type.OBJECT,
      properties: {
        background: { type: Type.STRING, description: "Hex color for background, e.g. #121212" },
        width: { type: Type.INTEGER, description: "Width of canvas" },
        height: { type: Type.INTEGER, description: "Height of canvas" }
      },
      required: ["background", "width", "height"]
    },
    entities: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          type: { type: Type.STRING, enum: ["rectangle", "circle", "line", "text"] },
          position: { 
            type: Type.OBJECT, 
            properties: { 
              x: { type: Type.INTEGER }, 
              y: { type: Type.INTEGER } 
            } 
          },
          size: { 
            type: Type.OBJECT, 
            properties: { 
              w: { type: Type.INTEGER }, 
              h: { type: Type.INTEGER } 
            } 
          },
          from: { type: Type.STRING, description: "ID of the starting entity (for lines)" },
          to: { type: Type.STRING, description: "ID of the target entity (for lines)" },
          style: {
            type: Type.OBJECT,
            properties: {
              fill: { type: Type.STRING },
              stroke: { type: Type.STRING },
              strokeWidth: { type: Type.INTEGER },
              dashed: { type: Type.BOOLEAN }
            }
          },
          text: {
            type: Type.OBJECT,
            properties: {
              content: { type: Type.STRING },
              fill: { type: Type.STRING },
              size: { type: Type.INTEGER }
            }
          },
          behaviors: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ["oscillate", "pulse", "bounce", "flow_particles"] },
                property: { type: Type.STRING, description: "e.g., position.y or size.w" },
                amplitude: { type: Type.NUMBER },
                frequency: { type: Type.NUMBER },
                speed: { type: Type.NUMBER },
                color: { type: Type.STRING }
              },
              required: ["type"]
            }
          }
        },
        required: ["id", "type", "behaviors"]
      }
    }
  },
  required: ["canvas", "entities"]
};

app.post('/api/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are an AI that converts user prompts into a structured visual scene specification. You will output JSON matching the exact schema provided. Use good aesthetics (dark pleasing colors, nice contrasts). CRITICAL RULES: 1. Keep the scene minimal. DO NOT generate more than 15 entities total. 2. NEVER generate individual particle shapes; you MUST use the 'flow_particles' behavior on lines instead. 3. ALWAYS add an animation behavior ('bounce', 'pulse', or 'oscillate') to the 'behaviors' array of EVERY entity so the scene is alive and moving.",
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.2
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response from AI");
    }
    
    const sceneSpec = JSON.parse(resultText);
    
    // In a production scenario, we could re-validate the parsed JSON using Zod from 'shared' here.
    
    res.json(sceneSpec);
  } catch (error) {
    console.error("Error generating scene:", error);
    res.status(500).json({ error: "Failed to generate scene specification" });
  }
});

// Setup some generic healthcheck
app.get('/health', (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
