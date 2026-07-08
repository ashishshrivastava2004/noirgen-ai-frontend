import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Yeh mock response hai taaki aap demo video bana sakein
  return res.status(200).json({
    success: true,
    treatment: {
      mood: {
        title: "Midnight Reflections",
        description: "The scene captures the solitude of a protagonist in a bustling city. The wet pavement reflects the vibrant neon lights.",
        tonality: "Melancholic and visually arresting.",
        lighting: "Low-key lighting with high contrast between deep shadows and saturated neon highlights.",
        vibeElements: ["Rainy streets", "Reflective surfaces", "Urban isolation"]
      },
      camera: {
        lens: "35mm Anamorphic",
        focalLength: "35mm",
        aperture: "f/2.0"
      }
    },
    image: "data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
  });
}