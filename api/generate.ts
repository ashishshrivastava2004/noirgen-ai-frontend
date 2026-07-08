import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt, settings, isSubscribed } = req.body;

    if (!isSubscribed) {
      return res.status(402).json({
        error: 'Subscription Required: To generate custom cinematic lookbook treatments, you must purchase a subscription plan.'
      });
    }

    // Vercel Environment Variables se keys le rahe hain
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const fireworksApiKey = process.env.FIREWORKS_API_KEY;
    const geminiModelOverride = process.env.GEMINI_MODEL; // optional override like 'models/gemini-1.5'

    if (!geminiApiKey || !fireworksApiKey) {
      return res.status(500).json({ error: 'Server configuration error: API keys missing. Ensure GEMINI_API_KEY and FIREWORKS_API_KEY are set.' });
    }

    const { genre = 'Noir', lighting = 'Chiaroscuro', aspect_ratio = '16:9' } = settings || {};

    const systemPrompt = `You are NoirGen AI, an elite visual consultant, colorist, and camera director for premium pre-production cinema.
Your task is to analyze the user's scene description and generate a complete high-end production-ready visual treatment.
Always infuse a Wong Kar-wai cinematic aesthetic with rich, moody color grading, striking neon contrast, and deep shadows.
You MUST respond with a single, highly structured JSON object ONLY. Do NOT include markdown code blocks, backticks, or any conversational text before or after the JSON.

The JSON structure MUST match exactly this schema:
{
  "mood": {
    "title": "Scene visual title",
    "description": "Evocative, rich visual treatment description (2-3 sentences).",
    "tonality": "Psychological tonality and emotional visual tone",
    "lighting": "Detailed lighting breakdown including key, fill, and rim light positioning",
    "vibeElements": ["Key visual element 1", "Key visual element 2", "Key visual element 3"]
  },
  "palette": {
    "reasoning": "A brief explanation of why this specific palette is chosen.",
    "colors": [
      { "hex": "#HEXCODE1", "name": "Color 1", "description": "Purpose of color 1" },
      { "hex": "#HEXCODE2", "name": "Color 2", "description": "Purpose of color 2" },
      { "hex": "#HEXCODE3", "name": "Color 3", "description": "Purpose of color 3" },
      { "hex": "#HEXCODE4", "name": "Color 4", "description": "Purpose of color 4" }
    ]
  },
  "camera": {
    "format": "Camera sensor/film format recommendation",
    "lens": "Recommended lens system",
    "focalLength": "Ideal focal length",
    "aperture": "Recommended aperture stop",
    "movement": "Precise camera motion system",
    "composition": "Cinematic composition rules applied",
    "directorNotes": "Direct director's notebook memo"
  },
  "vfx3d": {
    "hdriSetup": "Recommended 3D dome HDRI image environment",
    "softwareWorkflow": "Recommended pipeline and 3D software setup",
    "vfxElements": "Virtual effects and digital assets breakdown",
    "ambientSetup": "Ambient rendering suggestions"
  }
}`;

    const userPrompt = `Genre: ${genre}\nLighting Base: ${lighting}\nScene Description: ${prompt}`;

    // 1. Text JSON Generate using Gemini (select a model that supports generateContent)
    // Support two auth modes: API key in query param, or Bearer token in Authorization header.
    const useBearer = geminiApiKey.trim().toLowerCase().startsWith('bearer ') || geminiApiKey.trim().startsWith('ya29.');

    const listUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
    const listOpts: any = { method: 'GET', headers: { 'Content-Type': 'application/json' } };
    if (!useBearer) {
      // API key path
      listOpts.headers = { 'Content-Type': 'application/json' };
    } else {
      // Bearer token path
      listOpts.headers = { 'Content-Type': 'application/json', Authorization: geminiApiKey.trim().startsWith('bearer ') ? geminiApiKey.trim() : `Bearer ${geminiApiKey.trim()}` };
    }

    const modelsListRes = await fetch(useBearer ? listUrl : `${listUrl}?key=${encodeURIComponent(geminiApiKey)}`, listOpts);
    if (!modelsListRes.ok) {
      const txt = await modelsListRes.text();
      throw new Error(`Failed to list Gemini models (status ${modelsListRes.status}): ${txt}. Ensure the key/token is valid and has access to the Generative Language API.`);
    }

    const modelsList = await modelsListRes.json();
    const modelsArray = Array.isArray(modelsList.models) ? modelsList.models : [];

    let modelName: string | undefined = undefined;
    if (geminiModelOverride) modelName = geminiModelOverride;

    if (!modelName) {
      const pick = modelsArray.find((m: any) => {
        const name = String(m.name || '').toLowerCase();
        const display = String(m.displayName || '').toLowerCase();
        const methods = Array.isArray(m.supportedGenerationMethods) ? m.supportedGenerationMethods : [];
        return (name.includes('gemini') || display.includes('gemini')) && methods.includes('generateContent');
      }) || modelsArray.find((m: any) => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'));

      if (!pick) {
        const available = modelsArray.map((m: any) => `${m.name || m.displayName || 'unknown'}`).join(', ');
        throw new Error(`No model found that supports generateContent. Available models: ${available}`);
      }

      modelName = pick.name || pick.displayName;
    }

    // Build request URL and headers for generateContent
    const generateUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent`;
    const genOpts: any = { method: 'POST', headers: { 'Content-Type': 'application/json' } };
    if (useBearer) genOpts.headers.Authorization = geminiApiKey.trim().startsWith('bearer ') ? geminiApiKey.trim() : `Bearer ${geminiApiKey.trim()}`;
    const finalUrl = useBearer ? generateUrl : `${generateUrl}?key=${encodeURIComponent(geminiApiKey)}`;

    const geminiResponse = await fetch(finalUrl, {
      method: 'POST',
      headers: genOpts.headers,
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }],
        generationConfig: { temperature: 0.7 }
      })
    });

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API Error: ${await geminiResponse.text()}`);
    }

    const geminiData = await geminiResponse.json();
    let jsonString = '';
    try {
      if (geminiData?.candidates?.[0]?.content?.parts?.[0]?.text) {
        jsonString = geminiData.candidates[0].content.parts[0].text.trim();
      } else if (geminiData?.candidates?.[0]?.text) {
        jsonString = geminiData.candidates[0].text.trim();
      } else if (geminiData?.output?.[0]?.content?.text) {
        jsonString = geminiData.output[0].content.text.trim();
      } else if (typeof geminiData?.content === 'string') {
        jsonString = geminiData.content.trim();
      } else if (typeof geminiData === 'string') {
        jsonString = geminiData.trim();
      }
    } catch (parseErr) {
      console.warn('Warning: unexpected Gemini response shape', parseErr, geminiData);
    }

    if (!jsonString) {
      // If we couldn't extract structured content, return raw response for debugging
      throw new Error(`Could not extract generated text from Gemini response. Raw response: ${JSON.stringify(geminiData).slice(0, 2000)}`);
    }
    
    if (jsonString.startsWith('```json')) jsonString = jsonString.substring(7);
    else if (jsonString.startsWith('```')) jsonString = jsonString.substring(3);
    if (jsonString.endsWith('```')) jsonString = jsonString.substring(0, jsonString.length - 3);

    let treatment;
    try {
      treatment = JSON.parse(jsonString.trim());
    } catch (e) {
      // If parsing fails, include the raw text for debugging
      throw new Error('Failed to parse JSON from model output. Raw output: ' + jsonString.slice(0, 2000));
    }

    // 2. Image Generate using FLUX.1 [schnell] via Fireworks
    let imageBase64 = null;
    try {
      const imagePrompt = `Cinematic film still, high-end production visual treatment, highly detailed, film grain, ${genre} genre, lighting: ${lighting}. Wong Kar-wai style cinematography. ${prompt}. All subjects must be wearing modern headphones. Strictly no red tilak or any facial markings. Shot on ${treatment.camera?.lens || 'Anamorphic lens'}, 8k resolution, photorealistic, masterpiece.`;
      
      const imageResponse = await fetch('https://api.fireworks.ai/inference/v1/image_generation/accounts/fireworks/models/flux-1-schnell', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${fireworksApiKey}`,
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
        if (imgData?.data?.[0]?.b64_json) {
          imageBase64 = `data:image/jpeg;base64,${imgData.data[0].b64_json}`;
        }
      }
    } catch (imgError) {
      console.error('Image generation failed, but text succeeded.', imgError);
    }

    res.status(200).json({
      success: true,
      treatment,
      image: imageBase64
    });

  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
}