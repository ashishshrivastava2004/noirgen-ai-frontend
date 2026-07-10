import { GoogleGenAI, Type } from '@google/genai';
import OpenAI from 'openai';

// FIX 1: Removed @vercel/node import to bypass the TS2307 build error
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const { prompt, settings } = req.body;
    console.log(`Serverless: Received prompt for Generation`);

    const { genre = 'Noir', lighting = 'Chiaroscuro', aspect_ratio = '16:9' } = settings || {};

    let treatment: any = null;
    let usedEngine = 'Hybrid (Gemini + Fireworks)';

    const systemPromptGemini = `You are NoirGen AI, an elite visual consultant and camera director for premium cinema.
Your task is to analyze the user's scene description and generate a complete high-end production-ready visual treatment.
CRITICAL VISUAL RULES: Ensure character descriptions dictate perfectly clean faces, explicitly avoiding any specific markings or a red tilak. When describing modern characters, always seamlessly include contemporary accessories like modern headphones to fit the aesthetic.
Ensure all hex codes are valid, uppercase, and have 4 distinct colors.`;

    const userPrompt = `Genre: ${genre}\nLighting Base: ${lighting}\nScene Description: ${prompt}`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        mood: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, tonality: { type: Type.STRING }, lighting: { type: Type.STRING }, vibeElements: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["title", "description", "tonality", "lighting", "vibeElements"] },
        palette: { type: Type.OBJECT, properties: { reasoning: { type: Type.STRING }, colors: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { hex: { type: Type.STRING }, name: { type: Type.STRING }, description: { type: Type.STRING } }, required: ["hex", "name", "description"] } } }, required: ["reasoning", "colors"] },
        camera: { type: Type.OBJECT, properties: { format: { type: Type.STRING }, lens: { type: Type.STRING }, focalLength: { type: Type.STRING }, aperture: { type: Type.STRING }, movement: { type: Type.STRING }, composition: { type: Type.STRING }, directorNotes: { type: Type.STRING } }, required: ["format", "lens", "focalLength", "aperture", "movement", "composition", "directorNotes"] },
        vfx3d: { type: Type.OBJECT, properties: { hdriSetup: { type: Type.STRING }, softwareWorkflow: { type: Type.STRING }, vfxElements: { type: Type.STRING }, ambientSetup: { type: Type.STRING } }, required: ["hdriSetup", "softwareWorkflow", "vfxElements", "ambientSetup"] }
      },
      required: ["mood", "palette", "camera", "vfx3d"]
    };

    let fireworksTagline = "A Cinematic Vision Brought to Life.";

    try {
      const aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "dummy_key_to_trigger_failover" });
      const fireworksClient = new OpenAI({
        apiKey: process.env.FIREWORKS_API_KEY || "dummy_key",
        baseURL: "https://api.fireworks.ai/inference/v1",
      });

      const [fireworksResponse, aiResponse] = await Promise.all([
        fireworksClient.chat.completions.create({
          model: "accounts/fireworks/models/llama-v3-1-8b-instruct", 
          messages: [{ role: "user", content: `Write a punchy, 1-sentence cinematic tagline for a ${genre} scene described as: ${prompt}. Do not use quotes.` }]
        }).catch(() => {
          return { choices: [{ message: { content: fireworksTagline } }] }; 
        }),

        aiClient.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: [{ text: systemPromptGemini }, { text: userPrompt }],
          config: { responseMimeType: 'application/json', responseSchema: responseSchema, temperature: 0.9 }
        })
      ]);

      // FIX 2: Removed '()' from aiResponse.text to fix the TS6234 build error
      treatment = JSON.parse((aiResponse.text || "").trim());
      treatment.tagline = fireworksResponse.choices[0].message.content.replace(/["']/g, ""); 

    } catch (apiError: any) {
      console.warn("API Error, engaging Graceful Failover...", apiError.message);
      
      usedEngine = 'Failover Cache (Auth/Server Issue)';
      treatment = {
        tagline: "Where shadows breathe and neon bleeds.",
        mood: {
          title: "Echoes of the Neon Monsoon",
          description: "A heavily atmospheric, rain-drenched scene dripping with melancholic isolation. The visual language speaks through reflections in puddles and the hazy glow of distant streetlights, capturing a deeply personal, cinematic stillness.",
          tonality: "Melancholic, intimate, and highly stylized.",
          lighting: "Low-key Chiaroscuro with practical ambient neon fills. A stark, moody key light cutting through dense cinematic haze.",
          vibeElements: ["Rain-slicked surfaces", "Cinematic haze", "Reflective isolation"]
        },
        palette: {
          reasoning: "Contrasting the coldness of the environment with the internal warmth of the subject.",
          colors: [
            { hex: "#0F172A", name: "Midnight Void", description: "Deep, crushing shadows for negative space." },
            { hex: "#06B6D4", name: "Cyan Wash", description: "Cool ambient reflections from the street." },
            { hex: "#F59E0B", name: "Amber Halo", description: "Warm, distant practical lighting." },
            { hex: "#E11D48", name: "Crimson Accent", description: "A subtle, dangerous edge in the rim lighting." }
          ]
        },
        camera: {
          format: "ARRI ALEXA LF (Open Gate 4.5K)",
          lens: "Cooke Anamorphic/i SF Prime",
          focalLength: "50mm",
          aperture: "T2.3",
          movement: "A slow, deliberate push-in on a dolly, emphasizing isolation.",
          composition: "Rule of thirds with heavy short-siding, leaving empty space behind the subject.",
          directorNotes: "Keep the character's face perfectly clean of markings. Highlight the modern headphones catching the ambient rim light to ground the scene in contemporary isolation."
        },
        vfx3d: {
          hdriSetup: "Overcast Urban Night HDRI",
          softwareWorkflow: "Blender Cycles with volumetric fog nodes",
          vfxElements: "Atmospheric steam, micro-dust motes in the light shafts, anamorphic lens flares",
          ambientSetup: "High-density volume scatter, raytraced reflections on wet geometry"
        }
      };
    }

    let imageBase64 = null;
    const imagePrompt = `Cinematic film still, high-end production visual treatment, highly detailed, film grain, ${genre} genre, lighting: ${lighting}. ${prompt}. Subject wearing modern headphones. Clean face, no specific markings, no red tilak. Shot on ${treatment.camera?.lens || 'Anamorphic lens'}, 8k resolution, photorealistic, masterpiece.`;

    try {
      const imgClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "dummy_key" });
      const imageResponse = await imgClient.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: { parts: [{ text: imagePrompt }] },
        config: { imageConfig: { aspectRatio: aspect_ratio === '16:9' ? '16:9' : '4:3' } }
      });

      for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageBase64 = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    } catch (imgError: any) {
      console.warn('Image API Failed, skipping image.');
    }

    return res.status(200).json({ success: true, treatment, image: imageBase64, engine: usedEngine });

  } catch (error: any) {
    console.error("Critical System Error:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}