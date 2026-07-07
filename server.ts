import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

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
      const { prompt, settings, customApiKey, isSubscribed, subscriberEmail } = req.body;

      // Check access permission:
      // If no custom API key is provided, the user wants to use the developer's server-side key.
      // In this case, they MUST have paid for a subscription plan.
      if (!customApiKey) {
        if (!isSubscribed) {
          return res.status(402).json({
            error: 'Subscription Required: To use the developer\'s shared Fireworks AI engine, you must purchase a subscription plan. Alternatively, you can configure your own Fireworks API Key in the API Sandbox for free developer use.'
          });
        }
        console.log(`Processing subscription-based generation for active subscriber: ${subscriberEmail || 'Unknown'}`);
      } else {
        console.log('Processing developer-based generation using custom API key.');
      }

      const apiKey = customApiKey || process.env.FIREWORKS_API_KEY;

      if (!apiKey) {
        return res.status(400).json({
          error: 'Fireworks API key is not configured on the server. Please add your own custom key in the Developer Sandbox to enable live AI generation.'
        });
      }

      const { genre = 'Noir', lighting = 'Chiaroscuro', aspect_ratio = '16:9' } = settings || {};

      // Structure our prompt for the Llama-3.1 model to produce high-fidelity structured pre-production output
      const systemPrompt = `You are NoirGen AI, an elite visual consultant, colorist, and camera director for premium pre-production cinema.
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

      // Call Fireworks AI Chat Completion with robust model fallback
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
      let chosenModel = '';

      for (const model of modelCandidates) {
        try {
          console.log(`Attempting to generate lookbook with model candidate: ${model}`);
          const res = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
              ],
              temperature: 0.7,
              max_tokens: 1500
            })
          });

          if (res.ok) {
            chatResponse = res;
            chosenModel = model;
            break;
          } else {
            const errText = await res.text();
            console.warn(`Model ${model} failed with status ${res.status}: ${errText}`);
            lastError = new Error(`Fireworks Chat API returned status ${res.status} for model ${model}: ${errText}`);
          }
        } catch (err: any) {
          console.warn(`Model ${model} request threw error:`, err);
          lastError = err;
        }
      }

      if (!chatResponse) {
        throw lastError || new Error('All Fireworks Chat API model candidates failed.');
      }

      console.log(`Successfully generated lookbook using model: ${chosenModel}`);
      const chatData = await chatResponse.json();
      const content = chatData.choices?.[0]?.message?.content?.trim() || '';

      // Clean the response from potential markdown wrappers
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

      let treatment;
      try {
        treatment = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('Failed to parse model response as JSON. Content:', content);
        // Fallback parser: if the model returned some text outside, find the first '{' and last '}'
        const firstBrace = jsonString.indexOf('{');
        const lastBrace = jsonString.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          try {
            treatment = JSON.parse(jsonString.substring(firstBrace, lastBrace + 1));
          } catch (e) {
            throw new Error('AI returned an invalid JSON response structure. Please try again.');
          }
        } else {
          throw new Error('AI failed to format response as JSON. Please try again.');
        }
      }

      // Generate a high-end visualization image using FLUX-1-Schnell on Fireworks AI
      let imageBase64 = null;
      try {
        const imagePrompt = `Cinematic film still, high-end production visual treatment, highly detailed, film grain, ${genre} genre, lighting: ${lighting}. ${prompt}. Shot on ${treatment.camera?.lens || 'Anamorphic lens'}, 8k resolution, photorealistic, masterpiece.`;
        
        const imageResponse = await fetch('https://api.fireworks.ai/inference/v1/image_generation/accounts/fireworks/models/flux-1-schnell', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            prompt: imagePrompt,
            aspect_ratio: aspect_ratio,
            steps: 4,
            cfg_scale: 1,
            seed: Math.floor(Math.random() * 100000)
          })
        });

        if (imageResponse.ok) {
          const imgData = await imageResponse.json();
          // Extract the generated image. Fireworks returns an array in data with base64 data
          if (imgData?.data?.[0]?.b64_json) {
            imageBase64 = `data:image/jpeg;base64,${imgData.data[0].b64_json}`;
          } else if (imgData?.data?.[0]?.url) {
            imageBase64 = imgData.data[0].url;
          }
        } else {
          const imgErr = await imageResponse.text();
          console.error('Fireworks Image API Warning (Non-fatal, falling back):', imgErr);
        }
      } catch (imgError) {
        console.error('Failed to generate image (non-fatal):', imgError);
      }

      res.json({
        success: true,
        treatment,
        image: imageBase64
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
