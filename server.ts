import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

// --- GEMINI CLIENT INITIALIZATION ---
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured.');
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  app.post('/api/generate', async (req, res) => {
    try {
      const { prompt, settings, isSubscribed, subscriberEmail } = req.body;

      if (!isSubscribed) {
        return res.status(402).json({
          error: 'Subscription Required: To generate custom cinematic lookbook treatments, you must purchase a subscription plan.'
        });
      }

      // --- STABLE GENERATION: GEMINI ENGINE ---
      console.log('Initiating Stable Generation via Gemini...');
      
      const { genre = 'Noir', lighting = 'Chiaroscuro', aspect_ratio = '16:9' } = settings || {};

      const systemPrompt = `You are NoirGen AI, an elite visual consultant, colorist, and camera director for premium pre-production cinema.
Your task is to analyze the user's scene description and generate a complete high-end production-ready visual treatment.
CRITICAL VISUAL RULES: Ensure character descriptions dictate perfectly clean faces, explicitly avoiding any specific markings or a red tilak. When describing modern characters, always seamlessly include contemporary accessories like modern headphones to fit the aesthetic.`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          mood: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              tonality: { type: Type.STRING },
              lighting: { type: Type.STRING },
              vibeElements: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["title", "description", "tonality", "lighting", "vibeElements"]
          },
          palette: {
            type: Type.OBJECT,
            properties: {
              reasoning: { type: Type.STRING },
              colors: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { hex: { type: Type.STRING }, name: { type: Type.STRING }, description: { type: Type.STRING } },
                  required: ["hex", "name", "description"]
                }
              }
            },
            required: ["reasoning", "colors"]
          },
          camera: {
            type: Type.OBJECT,
            properties: {
              format: { type: Type.STRING },
              lens: { type: Type.STRING },
              focalLength: { type: Type.STRING },
              aperture: { type: Type.STRING },
              movement: { type: Type.STRING },
              composition: { type: Type.STRING },
              directorNotes: { type: Type.STRING }
            },
            required: ["format", "lens", "focalLength", "aperture", "movement", "composition", "directorNotes"]
          },
          vfx3d: {
            type: Type.OBJECT,
            properties: {
              hdriSetup: { type: Type.STRING },
              softwareWorkflow: { type: Type.STRING },
              vfxElements: { type: Type.STRING },
              ambientSetup: { type: Type.STRING }
            },
            required: ["hdriSetup", "softwareWorkflow", "vfxElements", "ambientSetup"]
          }
        },
        required: ["mood", "palette", "camera", "vfx3d"]
      };

      const gemini = getGeminiClient();
      const aiResponse = await gemini.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [{ text: systemPrompt }, { text: `Genre: ${genre}\nLighting: ${lighting}\nScript: ${prompt}` }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
          temperature: 0.7
        }
      });

      const treatment = JSON.parse(aiResponse.text()!.trim());
      treatment.tagline = "A Cinematic Vision Brought to Life."; // Stable tagline

      // --- IMAGE GENERATION (GEMINI) ---
      let imageBase64 = null;
      const imagePrompt = `Cinematic film still, high-end ${genre} production, lighting: ${lighting}. ${prompt}. Subject with modern headphones. Clean face, no markings. 8k resolution, masterpiece.`;
      
      const imageResponse = await gemini.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: { parts: [{ text: imagePrompt }] },
        config: { imageConfig: { aspectRatio: aspect_ratio === '16:9' ? '16:9' : '4:3' } }
      });

      for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) { imageBase64 = `data:image/png;base64,${part.inlineData.data}`; }
      }

      res.json({ success: true, treatment, image: imageBase64, engine: 'Gemini (Stable)' });

    } catch (error: any) {
      console.error('Generation Error:', error);
      res.status(500).json({ error: 'Generation failed. Please ensure API keys are set in Vercel settings.' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => { res.sendFile(path.join(distPath, 'index.html')); });
  }

  app.listen(PORT, '0.0.0.0', () => console.log(`NoirGen AI running on http://localhost:${PORT}`));
}

startServer();