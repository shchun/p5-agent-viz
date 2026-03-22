import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();

// 클라우드 호스팅(Render 등 리버스 프록시) 환경에서 클라이언트의 실제 IP를 추적하기 위해 필수
app.set('trust proxy', 1);

// CORS 제한: 실제 배포된 프론트엔드 주소만 허용하려면 백엔드 환경 변수에 FRONTEND_URL을 추가하세요.
const allowedOrigins = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, 'http://localhost:5173'] : '*';
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// API 어뷰징 방지를 위한 Rate Limiter 설정 (IP당 15분에 10번 제한)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 10, // 15분 동안 1개의 IP당 최대 10번만 허용 (새로고침 남용 방지)
  message: { error: "너무 많은 요청이 감지되었습니다. 15분 후에 다시 시도해 주세요." },
});

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

app.post('/api/generate', apiLimiter, async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }
    
    // 추가 어뷰징 방지: 너무 긴 프롬프트(500자 초과)가 서버 리소스를 점유하는 것을 방지
    if (prompt.length > 500) {
      return res.status(400).json({ error: "프롬프트 길이는 최대 500자까지 허용됩니다." });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are an AI that converts user prompts into a structured visual scene specification. You will output JSON matching the exact schema provided. Use good aesthetics (dark pleasing colors, nice contrasts). CRITICAL RULES: 1. Keep the scene minimal. DO NOT generate more than 15 entities total. 2. NEVER generate individual particle shapes; you MUST use the 'flow_particles' behavior on lines instead. 3. ALWAYS add an animation behavior ('bounce', 'pulse', or 'oscillate') to the 'behaviors' array of EVERY entity so the scene is alive and moving.",
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.2,
        maxOutputTokens: 500
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
