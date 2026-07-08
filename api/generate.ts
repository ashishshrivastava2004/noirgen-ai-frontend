import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

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

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt, settings, isSubscribed, subscriberEmail } = req.body;

    // Check access permission:
    // Users must have paid for a subscription plan to access the cinematic engine.
    if (!isSubscribed) {
      return res.status(402).json({
        error: 'Subscription Required: To generate custom cinematic lookbook treatments, you must purchase a subscription plan. Subscribing instantly unlocks high-fidelity custom visual generation.'
      });
    }

    // Prohibited keywords list for content safety (allows romantic/kissing, blocks explicit sexual/sensual)
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
        error: 'Policy Violation: This prompt contains restricted sexual or highly sensual content. Romantic and kissing set designs are fully permitted, but sexually explicit or highly sensual descriptions violate our Creative Guidelines.'
      });
    }

    console.log(`Processing subscription-based generation for active subscriber: ${subscriberEmail || 'Unknown'}`);

    const geminiApiKey = process.env.GEMINI_API_KEY;
    const fireworksApiKey = process.env.FIREWORKS_API_KEY;

    if (!geminiApiKey && !fireworksApiKey) {
      return res.status(500).json({
        error: 'API Configuration Error: No AI generation keys are configured on the server. Please ensure either GEMINI_API_KEY or FIREWORKS_API_KEY is configured in the Secrets panel of the Settings menu to enable live AI generation.'
      });
    }

    const { genre = 'Noir', lighting = 'Chiaroscuro', aspect_ratio = '16:9' } = settings || {};

    let treatment = null;
    let usedEngine = '';

    // --- 1. GENERATE LOOKBOOK STRUCTURE ---
    if (geminiApiKey) {
      try {
        console.log('Attempting lookbook generation via Gemini API (gemini-3.5-flash)...');
        const ai = getGeminiClient();

        const systemPrompt = `You are NoirGen AI, an elite visual consultant, colorist, and camera director for premium pre-production cinema.
Your task is to analyze the user's scene description and generate a complete high-end production-ready visual treatment.
Ensure all hex codes are valid, uppercase, and have 4 distinct colors tailored specifically to the scene. Be incredibly professional, specific, and detailed in your cinematic jargon.`;

        const userPrompt = `Genre: ${genre}
Lighting Base: ${lighting}
Scene Description: ${prompt}`;

        const responseSchema = {
          type: Type.OBJECT,
          properties: {
            mood: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Scene visual title (e.g., 'Liquid Neon Shadows')" },
                description: { type: Type.STRING, description: "Evocative, rich visual treatment description (2-3 sentences) detailing the atmosphere, weather, textures, and cinematic references." },
                tonality: { type: Type.STRING, description: "Psychological tonality and emotional visual tone (e.g., 'Melancholic suspense, high contrast paranoia')" },
                lighting: { type: Type.STRING, description: "Detailed lighting breakdown including key, fill, and rim light positioning, color temperature, and texture (e.g., 'High-contrast chiaroscuro, amber-orange street glow contrasting cool 6500K teal fills')" },
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
                reasoning: { type: Type.STRING, description: "A brief explanation of why this specific palette is chosen and how it supports the narrative emotion." },
                colors: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      hex: { type: Type.STRING, description: "Valid hex code starting with # (e.g. #FF007F)" },
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
                format: { type: Type.STRING, description: "Camera sensor/film format recommendation (e.g., 'ARRI ALEXA LF (Open Gate 4.5K)')" },
                lens: { type: Type.STRING, description: "Recommended lens system (e.g., 'Cooke Anamorphic/i SF (Special Flare) Prime')" },
                focalLength: { type: Type.STRING, description: "Ideal focal length for this setup (e.g., '40mm anamorphic for intimate claustrophobia')" },
                aperture: { type: Type.STRING, description: "Recommended aperture stop (e.g., 'T2.3 for shallow depth and soft background bokeh')" },
                movement: { type: Type.STRING, description: "Precise camera motion system and choreography (e.g., 'Low-angle slow creep on a Dana Dolly, replicating mechanical dread')" },
                composition: { type: Type.STRING, description: "Cinematic composition rules applied (e.g., 'Lower third lead-room framing, heavy negative space with reflections')" },
                directorNotes: { type: Type.STRING, description: "Direct director's notebook memo on how to block and capture the emotional core of this scene." }
              },
              required: ["format", "lens", "focalLength", "aperture", "movement", "composition", "directorNotes"]
            },
            vfx3d: {
              type: Type.OBJECT,
              properties: {
                hdriSetup: { type: Type.STRING, description: "Recommended 3D dome HDRI image environment for matches (e.g., 'Wet Industrial Asphalt - Overcast Golden Hour HDRI')" },
                softwareWorkflow: { type: Type.STRING, description: "Recommended pipeline and 3D software setup (e.g., 'Unreal Engine 5.4 Nanite geometry combined with Lumen real-time global illumination')" },
                vfxElements: { type: Type.STRING, description: "Virtual effects and digital assets breakdown (e.g., 'Volumetric Niagara steam particles, digital anamorphic lens flare matching Cookes, micro-dust particle simulation')" },
                ambientSetup: { type: Type.STRING, description: "Ambient rendering suggestions (e.g., 'High-density height fog with 0.15 scattering coefficient, raytraced reflection roughness threshold set to 0.05')" }
              },
              required: ["hdriSetup", "softwareWorkflow", "vfxElements", "ambientSetup"]
            }
          },
          required: ["mood", "palette", "camera", "vfx3d"]
        };

        const aiResponse = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: [
            { text: systemPrompt },
            { text: userPrompt }
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
            temperature: 0.7
          }
        });

        const responseText = aiResponse.text || '';
        treatment = JSON.parse(responseText.trim());
        usedEngine = 'Gemini';
        console.log('Successfully generated lookbook structure via Gemini!');
      } catch (geminiError: any) {
        console.error('Gemini text generation failed, checking if Fireworks AI is configured as a fallback:', geminiError.message || geminiError);
      }
    }

    // If Gemini failed or was not configured, try Fireworks AI
    if (!treatment && fireworksApiKey) {
      try {
        console.log('Attempting lookbook generation via Fireworks AI (Llama-3)...');
        const systemPromptFireworks = `You are NoirGen AI, an elite visual consultant, colorist, and camera director for premium pre-production cinema.
Your task is to analyze the user's scene description and generate a complete high-end production-ready visual treatment.
You MUST respond with a single, highly structured JSON object ONLY. Do NOT include markdown code blocks, backticks, or any conversational text before or after the JSON.

The JSON structure MUST match exactly this schema:
{
  "mood": {
    "title": "Scene visual title (e.g., 'Liquid Neon Shadows')",
    "description": "Evocative, rich visual treatment description (2-3 sentences) detailing the atmosphere, weather, textures, and cinematic references.",
    "tonality": "Psychological tonality and emotional visual tone (e.g., 'Melancholic suspense, high contrast paranoia')",
    "lighting": "Detailed lighting breakdown including key, fill, and rim light positioning, color temperature, and texture (e.g., 'High-contrast chiaroscuro, amber-orange street glow contrasting cool 6500K teal fills')",
    "vibeElements": ["Key visual element 1", "Key visual element 2", "Key visual element 3"]
  },
  "palette": {
    "reasoning": "A brief explanation of why this specific palette is chosen and how it supports the narrative emotion.",
    "colors": [
      { "hex": "#HEXCODE1", "name": "Cinematic name for color 1", "description": "Narrative purpose/presence of color 1" },
      { "hex": "#HEXCODE2", "name": "Cinematic name for color 2", "description": "Narrative purpose/presence of color 2" },
      { "hex": "#HEXCODE3", "name": "Cinematic name for color 3", "description": "Narrative purpose/presence of color 3" },
      { "hex": "#HEXCODE4", "name": "Cinematic name for color 4", "description": "Narrative purpose/presence of color 4" }
    ]
  },
  "camera": {
    "format": "Camera sensor/film format recommendation (e.g., 'ARRI ALEXA LF (Open Gate 4.5K)')",
    "lens": "Recommended lens system (e.g., 'Cooke Anamorphic/i SF (Special Flare) Prime')",
    "focalLength": "Ideal focal length for this setup (e.g., '40mm anamorphic for intimate claustrophobia')",
    "aperture": "Recommended aperture stop (e.g., 'T2.3 for shallow depth and soft background bokeh')",
    "movement": "Precise camera motion system and choreography (e.g., 'Low-angle slow creep on a Dana Dolly, replicating mechanical dread')",
    "composition": "Cinematic composition rules applied (e.g., 'Lower third lead-room framing, heavy negative space with reflections')",
    "directorNotes": "Direct director's notebook memo on how to block and capture the emotional core of this scene."
  },
  "vfx3d": {
    "hdriSetup": "Recommended 3D dome HDRI image environment for matches (e.g., 'Wet Industrial Asphalt - Overcast Golden Hour HDRI')",
    "softwareWorkflow": "Recommended pipeline and 3D software setup (e.g., 'Unreal Engine 5.4 Nanite geometry combined with Lumen real-time global illumination')",
    "vfxElements": "Virtual effects and digital assets breakdown (e.g., 'Volumetric Niagara steam particles, digital anamorphic lens flare matching Cookes, micro-dust particle simulation')",
    "ambientSetup": "Ambient rendering suggestions (e.g., 'High-density height fog with 0.15 scattering coefficient, raytraced reflection roughness threshold set to 0.05')"
  }
}

Ensure all hex codes are valid, uppercase, and have 4 distinct colors tailored specifically to the scene. Be incredibly professional, specific, and detailed in your cinematic jargon.`;

        const userPrompt = `Genre: ${genre}
Lighting Base: ${lighting}
Scene Description: ${prompt}`;

        const modelCandidates = [
          'accounts/fireworks/models/llama-v3-3-70b-instruct',
          'accounts/fireworks/models/llama-v3-1-70b-instruct',
          'accounts/fireworks/models/llama-v3-1-8b-instruct',
          'accounts/fireworks/models/llama-v3p3-70b-instruct',
          'accounts/fireworks/models/llama-v3p1-70b-instruct',
          'accounts/fireworks/models/llama-v3p1-8b-instruct',
          'accounts/fireworks/models/llama-v3-70b-instruct',
          'accounts/fireworks/models/llama-v3-8b-instruct'
        ];

        let chatResponse = null;
        let lastError = null;

        for (const model of modelCandidates) {
          try {
            const res = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${fireworksApiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model,
                messages: [
                  { role: 'system', content: systemPromptFireworks },
                  { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 1500
              })
            });

            if (res.ok) {
              chatResponse = res;
              break;
            } else {
              const errText = await res.text();
              lastError = new Error(`Fireworks Chat API returned status ${res.status} for model ${model}: ${errText}`);
            }
          } catch (err: any) {
            lastError = err;
          }
        }

        if (!chatResponse) {
          throw lastError || new Error('All Fireworks Chat API model candidates failed.');
        }

        const chatData = await chatResponse.json();
        const content = chatData.choices?.[0]?.message?.content?.trim() || '';

        // Clean response of backticks
        let jsonString = content;
        if (jsonString.startsWith('```json')) {
          jsonString = jsonString.substring(7);
        } else if (jsonString.startsWith('```')) {
          jsonString = jsonString.substring(3);
        }
        if (jsonString.endsWith('```')) {
          jsonString = jsonString.substring(0, jsonString.length - 3);
        }
        jsonString = jsonString.trim();

        const firstBrace = jsonString.indexOf('{');
        const lastBrace = jsonString.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          treatment = JSON.parse(jsonString.substring(firstBrace, lastBrace + 1));
        } else {
          treatment = JSON.parse(jsonString);
        }
        usedEngine = 'Fireworks';
        console.log('Successfully generated lookbook structure via Fireworks!');
      } catch (fireworksError: any) {
        console.error('Fireworks text generation failed:', fireworksError.message || fireworksError);
      }
    }

    if (!treatment) {
      return res.status(500).json({
        error: 'AI Lookbook Generation Failed: Both Gemini and Fireworks AI services failed to generate the lookbook content. Please verify your API keys are correct and active.'
      });
    }

    // --- 2. GENERATE VISUALIZATION FRAME IMAGE ---
    let imageBase64 = null;
    const imagePrompt = `Cinematic film still, high-end production visual treatment, highly detailed, film grain, ${genre} genre, lighting: ${lighting}. ${prompt}. Shot on ${treatment.camera?.lens || 'Anamorphic lens'}, 8k resolution, photorealistic, masterpiece.`;

    // Try Gemini first if available
    if (geminiApiKey) {
      try {
        console.log('Attempting to generate lookbook visualization frame via Gemini (gemini-3.1-flash-lite-image)...');
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

    // Try Fireworks FLUX if Gemini image failed or was not configured
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

    res.status(200).json({
      success: true,
      treatment,
      image: imageBase64,
      engine: usedEngine
    });

  } catch (error: any) {
    console.error('Serverless processing error:', error);
    res.status(500).json({
      error: error.message || 'An unexpected error occurred during film treatment generation.'
    });
  }
}
