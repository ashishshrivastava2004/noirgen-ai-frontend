import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import OpenAI from 'openai';

dotenv.config();

// --- 1. GEMINI CLIENT INITIALIZATION ---
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

// --- 2. FIREWORKS CLIENT INITIALIZATION ---
let fireworksClient: OpenAI | null = null;
function getFireworksClient(): OpenAI {
  const apiKey = process.env.FIREWORKS_API_KEY;
  if (!apiKey) {
    throw new Error('Fireworks API key is not configured.');
  }
  if (!fireworksClient) {
    fireworksClient = new OpenAI({
      apiKey: apiKey,
      baseURL: "accounts/fireworks/models/llama-v3-1-8b-instruct",
    });
  }
  return fireworksClient;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON requests with increased limit for base64 responses
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API endpoint for generating film treatment
  app.post('/api/generate', async (req, res) => {
    try {
      const { prompt, settings, isSubscribed, subscriberEmail } = req.body;

      // Check access permission
      if (!isSubscribed) {
        return res.status(402).json({
          error: 'Subscription Required: To generate custom cinematic lookbook treatments, you must purchase a subscription plan.'
        });
      }

      // Prohibited keywords list for content safety
      const BLOCKED_KEYWORDS = [
        'sex', 'sexual', 'sensual play', 'nude', 'naked', 'erotic', 'porn', 'xxx', 'intercourse', 'striptease',
        'genital', 'penis', 'vagina', 'clitoris', 'blowjob', 'handjob', 'orgasm', 'masturbate', 'penetration',
        'sensual massage', 'escort', 'incest', 'bestiality', 'pedophilia', 'rape', 'harassment', 'sensual touch',
        'make love', 'making love', 'foreplay', 'lustful', 'sensuous body', 'nakedness', 'nudity', 'stripper',
        'bondage', 'fetish', 'sensual scene', 'coitus', 'ejaculation', 'orgasmic', 'panties', 'underwear', 'lingerie model'
      ];

      const textToCheck = (prompt || '').toLowerCase();
      let hasViolation = false;

      for (const keyword of BLOCKED_KEYWORDS) {
        if (textToCheck.includes(keyword)) {
          hasViolation = true;
          break;
        }
      }

      if (hasViolation || /\b(sexy|naked|erotic|pornographic|bedroom action|heavy petting)\b/i.test(textToCheck)) {
        return res.status(400).json({
          error: 'Policy Violation: This prompt contains restricted sexual or highly sensual content.'
        });
      }

      console.log(`Processing hybrid generation for active subscriber: ${subscriberEmail || 'Unknown'}`);

      const geminiApiKey = process.env.GEMINI_API_KEY;
      const fireworksApiKey = process.env.FIREWORKS_API_KEY;

      if (!geminiApiKey || !fireworksApiKey) {
        return res.status(500).json({
          error: 'API Configuration Error: Both GEMINI_API_KEY and FIREWORKS_API_KEY must be configured for the Dual-Engine Architecture.'
        });
      }

      const { genre = 'Noir', lighting = 'Chiaroscuro', aspect_ratio = '16:9' } = settings || {};

      let treatment: any = null;
      let usedEngine = '';

      // --- 3. HYBRID GENERATION: LOOKBOOK (Gemini) + TAGLINE (Fireworks) ---
      console.log('Initiating Dual-Engine (Hybrid) Generation...');
      
      const systemPromptGemini = `You are NoirGen AI, an elite visual consultant, colorist, and camera director for premium pre-production cinema.
Your task is to analyze the user's scene description and generate a complete high-end production-ready visual treatment.
Ensure all hex codes are valid, uppercase, and have 4 distinct colors tailored specifically to the scene. Be incredibly professional, specific, and detailed in your cinematic jargon.
CRITICAL VISUAL RULES: Ensure character descriptions dictate perfectly clean faces, explicitly avoiding any specific markings or a red tilak. When describing modern characters, always seamlessly include contemporary accessories like modern headphones to fit the aesthetic.`;

      const userPrompt = `Genre: ${genre}\nLighting Base: ${lighting}\nScene Description: ${prompt}`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          mood: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Scene visual title (e.g., 'Liquid Neon Shadows')" },
              description: { type: Type.STRING, description: "Evocative, rich visual treatment description (2-3 sentences) detailing the atmosphere, weather, textures, and cinematic references." },
              tonality: { type: Type.STRING, description: "Psychological tonality and emotional visual tone (e.g., 'Melancholic suspense, high contrast paranoia')" },
              lighting: { type: Type.STRING, description: "Detailed lighting breakdown including key, fill, and rim light positioning, color temperature, and texture" },
              vibeElements: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of exactly 3 key visual element strings"
              }
            },
            required: ["title", "description", "tonality", "lighting", "vibeElements"]
          },
          palette: {
            type: Type.OBJECT,
            properties: {
              reasoning: { type: Type.STRING, description: "A brief explanation of why this specific palette is chosen." },
              colors: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    hex: { type: Type.STRING, description: "Valid hex code starting with #" },
                    name: { type: Type.STRING, description: "Cinematic name for the color" },
                    description: { type: Type.STRING, description: "Narrative purpose/presence of this color" }
                  },
                  required: ["hex", "name", "description"]
                }
              }
            },
            required: ["reasoning", "colors"]
          },
          camera: {
            type: Type.OBJECT,
            properties: {
              format: { type: Type.STRING, description: "Camera sensor/film format recommendation" },
              lens: { type: Type.STRING, description: "Recommended lens system" },
              focalLength: { type: Type.STRING, description: "Ideal focal length for this setup" },
              aperture: { type: Type.STRING, description: "Recommended aperture stop" },
              movement: { type: Type.STRING, description: "Precise camera motion system and choreography" },
              composition: { type: Type.STRING, description: "Cinematic composition rules applied" },
              directorNotes: { type: Type.STRING, description: "Direct director's notebook memo on how to block the scene." }
            },
            required: ["format", "lens", "focalLength", "aperture", "movement", "composition", "directorNotes"]
          },
          vfx3d: {
            type: Type.OBJECT,
            properties: {
              hdriSetup: { type: Type.STRING, description: "Recommended 3D dome HDRI image environment" },
              softwareWorkflow: { type: Type.STRING, description: "Recommended pipeline and 3D software setup" },
              vfxElements: { type: Type.STRING, description: "Virtual effects and digital assets breakdown" },
              ambientSetup: { type: Type.STRING, description: "Ambient rendering suggestions" }
            },
            required: ["hdriSetup", "softwareWorkflow", "vfxElements", "ambientSetup"]
          }
        },
        required: ["mood", "palette", "camera", "vfx3d"]
      };

      try {
        const gemini = getGeminiClient();
        const fireworks = getFireworksClient();

        // The Hybrid Magic: Firing both AI models concurrently
        const [fireworksResponse, aiResponse] = await Promise.all([
          
          // TASK 1: Fireworks (Gemma 8B) - Fast Tagline Generation
          fireworks.chat.completions.create({
            model: "accounts/fireworks/models/llama-v3p1-8b-instruct", 
            messages: [{
              role: "user",
              content: `Write a punchy, 1-sentence cinematic tagline for a ${genre} scene described as: ${prompt}. Do not use quotes.`
            }]
          }).catch(err => {
            console.error("Fireworks tagline failed, using fallback:", err);
            return { choices: [{ message: { content: "A Cinematic Vision Brought to Life." } }] }; 
          }),

          // TASK 2: Gemini 3.5 Flash - Heavy JSON Parsing
          gemini.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: [
              { text: systemPromptGemini },
              { text: userPrompt }
            ],
            config: {
              responseMimeType: 'application/json',
              responseSchema: responseSchema, 
              temperature: 0.7
            }
          })
        ]);

        const responseText = aiResponse.text || '';
        treatment = JSON.parse(responseText.trim());
        
        // Inject the Fireworks tagline into the final treatment object
        treatment.tagline = fireworksResponse.choices[0].message.content.replace(/["']/g, ""); 
        
        usedEngine = 'Hybrid (Gemini + Fireworks)';
        console.log('Successfully generated hybrid lookbook structure & tagline!');

      } catch (hybridError: any) {
        console.error('Hybrid generation failed:', hybridError.message || hybridError);
        return res.status(500).json({
          error: 'AI Hybrid Generation Failed: Could not process the cinematic data.'
        });
      }

      // --- 4. GENERATE VISUALIZATION FRAME IMAGE ---
      let imageBase64 = null;
      // Image prompt also respects the strict aesthetic guidelines
      const imagePrompt = `Cinematic film still, high-end production visual treatment, highly detailed, film grain, ${genre} genre, lighting: ${lighting}. ${prompt}. Subject wearing modern headphones. Clean face, no specific markings, no red tilak. Shot on ${treatment.camera?.lens || 'Anamorphic lens'}, 8k resolution, photorealistic, masterpiece.`;

      // Try Gemini first for image
      if (geminiApiKey) {
        try {
          console.log('Attempting to generate lookbook visualization frame via Gemini...');
          const ai = getGeminiClient();
          const imageResponse = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-image',
            contents: {
              parts: [
                { text: imagePrompt }
              ]
            },
            config: {
              imageConfig: {
                aspectRatio: aspect_ratio === '16:9' ? '16:9' : '4:3'
              }
            }
          });

          for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              imageBase64 = `data:image/png;base64,${part.inlineData.data}`;
              break;
            }
          }
          if (imageBase64) {
            console.log('Successfully generated lookbook image via Gemini!');
          }
        } catch (imgError: any) {
          console.error('Failed to generate image via Gemini (checking if Fireworks is available as fallback):', imgError.message || imgError);
        }
      }

      // Fallback to Fireworks FLUX for image if Gemini fails
      if (!imageBase64 && fireworksApiKey) {
        try {
          console.log('Attempting to generate lookbook visualization frame via Fireworks AI (flux-1-schnell)...');
          const imageResponse = await fetch('https://api.fireworks.ai/inference/v1/image_generation/accounts/fireworks/models/flux-1-schnell', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${fireworksApiKey}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              prompt: imagePrompt,
              aspect_ratio: aspect_ratio === '16:9' ? '16:9' : '4:3',
              steps: 4,
              cfg_scale: 1,
              seed: Math.floor(Math.random() * 100000)
            })
          });

          if (imageResponse.ok) {
            const imgData = await imageResponse.json();
            if (imgData?.data?.[0]?.b64_json) {
              imageBase64 = `data:image/jpeg;base64,${imgData.data[0].b64_json}`;
            } else if (imgData?.data?.[0]?.url) {
              imageBase64 = imgData.data[0].url;
            }
            if (imageBase64) {
              console.log('Successfully generated lookbook image via Fireworks!');
            }
          } else {
            const imgErr = await imageResponse.text();
            console.error('Fireworks Image API error:', imgErr);
          }
        } catch (imgError: any) {
          console.error('Failed to generate image via Fireworks:', imgError.message || imgError);
        }
      }

      // --- 5. SEND FINAL PAYLOAD ---
      res.json({
        success: true,
        treatment,
        image: imageBase64,
        engine: usedEngine
      });

    } catch (error: any) {
      console.error('Server processing error:', error);
      res.status(500).json({
        error: error.message || 'An unexpected error occurred during film treatment generation.'
      });
    }
  });

  // Serve static assets in production, otherwise mount Vite in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NoirGen AI Server running on http://localhost:${PORT}`);
  });
}

startServer();