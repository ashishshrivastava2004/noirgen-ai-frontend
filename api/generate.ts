import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Sirf POST requests allow karenge
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt, settings, isSubscribed, subscriberEmail } = req.body;

    if (!isSubscribed) {
      return res.status(402).json({
        error: 'Subscription Required: To generate custom cinematic lookbook treatments, you must purchase a subscription plan.'
      });
    }

    const apiKey = process.env.FIREWORKS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Server configuration error: API key missing.' });
    }

    const { genre = 'Noir', lighting = 'Chiaroscuro', aspect_ratio = '16:9' } = settings || {};

    // System Prompt for high-end Velyron-style output
    const systemPrompt = `You are NoirGen AI, an elite visual consultant, colorist, and camera director for premium pre-production cinema.
Your task is to analyze the user's scene description and generate a complete high-end production-ready visual treatment.
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

    // 1. Fetch Text Treatment (Llama 3.1 70B)
    const chatResponse = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'accounts/fireworks/models/llama-v3p1-70b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!chatResponse.ok) {
      throw new Error(`Fireworks API Error: ${await chatResponse.text()}`);
    }

    const chatData = await chatResponse.json();
    let jsonString = chatData.choices[0].message.content.trim();
    
    // Clean up markdown formatting if AI adds it
    if (jsonString.startsWith('```json')) jsonString = jsonString.substring(7);
    else if (jsonString.startsWith('```')) jsonString = jsonString.substring(3);
    if (jsonString.endsWith('```')) jsonString = jsonString.substring(0, jsonString.length - 3);

    const treatment = JSON.parse(jsonString.trim());

    // 2. Fetch Image (Flux 1 Schnell) with customized signature aesthetic
    let imageBase64 = null;
    try {
      const imagePrompt = `Cinematic film still, high-end production visual treatment, highly detailed, film grain, ${genre} genre, lighting: ${lighting}. ${prompt}. Subjects wearing modern headphones, strictly no red tilak or facial markings. Shot on ${treatment.camera?.lens || 'Anamorphic lens'}, 8k resolution, photorealistic, masterpiece.`;
      
      const imageResponse = await fetch('[https://api.fireworks.ai/inference/v1/image_generation/accounts/fireworks/models/flux-1-schnell](https://api.fireworks.ai/inference/v1/image_generation/accounts/fireworks/models/flux-1-schnell)', {
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
        if (imgData?.data?.[0]?.b64_json) {
          imageBase64 = `data:image/jpeg;base64,${imgData.data[0].b64_json}`;
        }
      }
    } catch (imgError) {
      console.error('Image generation failed, but continuing with text.', imgError);
    }

    // 3. Send final response back to frontend
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