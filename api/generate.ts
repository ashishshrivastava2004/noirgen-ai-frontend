import { GoogleGenAI, Type } from '@google/genai';
import OpenAI from 'openai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Initialize clients outside the handler for warm starts
const aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const fireworksClient = new OpenAI({
  apiKey: process.env.FIREWORKS_API_KEY!,
  baseURL: "https://api.fireworks.ai/inference/v1",
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const { prompt, settings } = req.body;
    console.log(`Serverless: Received prompt for Hybrid Generation`);

    const { genre = 'Noir', lighting = 'Chiaroscuro', aspect_ratio = '16:9' } = settings || {};

    let treatment: any = null;

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

    // Hybrid execution
    const [fireworksResponse, aiResponse] = await Promise.all([
      fireworksClient.chat.completions.create({
        model: "accounts/fireworks/models/llama-v3-1-8b-instruct", 
        messages: [{ role: "user", content: `Write a punchy, 1-sentence cinematic tagline for a ${genre} scene described as: ${prompt}. Do not use quotes.` }]
      }).catch(err => {
        console.error("Fireworks tagline failed:", err);
        return { choices: [{ message: { content: "A Cinematic Vision Brought to Life." } }] }; 
      }),

      aiClient.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [{ text: systemPromptGemini }, { text: userPrompt }],
        config: { responseMimeType: 'application/json', responseSchema: responseSchema, temperature: 0.9 }
      })
    ]);

    treatment = JSON.parse(aiResponse.text()!.trim());
    treatment.tagline = fireworksResponse.choices[0].message.content.replace(/["']/g, ""); 

    // Image generation
    let imageBase64 = null;
    const imagePrompt = `Cinematic film still, high-end production visual treatment, highly detailed, film grain, ${genre} genre, lighting: ${lighting}. ${prompt}. Subject wearing modern headphones. Clean face, no specific markings, no red tilak. Shot on ${treatment.camera?.lens || 'Anamorphic lens'}, 8k resolution, photorealistic, masterpiece.`;

    try {
      const imageResponse = await aiClient.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
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
      console.error('Failed to generate image:', imgError.message || imgError);
    }

    return res.status(200).json({ success: true, treatment, image: imageBase64, engine: 'Hybrid (Gemini + Fireworks)' });

  } catch (error: any) {
    console.error("API Error:", error);
    return res.status(500).json({ success: false, error: error.message || "Internal Server Error" });
  }
}