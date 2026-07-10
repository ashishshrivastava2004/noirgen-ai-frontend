import express from 'express';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// ---------------------------------------------------------
// POST /api/generate - HACKATHON DEMO ENDPOINT
// ---------------------------------------------------------
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt } = req.body;

    console.log(`Received prompt for generation: ${prompt}`);

    // Returning the simulated high-quality mock output for the demo video
    return res.status(200).json({
      success: true,
      engine: 'Gemini + Fireworks (Simulated for Demo)',
      treatment: {
        mood: {
          title: "Neon Gridlock: The Cyber-Detective",
          description: "A gritty cyber-detective navigates a claustrophobic, rain-slicked alley in Neo-Tokyo. Dense steam rolls off the wet asphalt, beautifully catching the flickering magenta and cyan glow from the towering holographic signs above.",
          tonality: "Cyberpunk Noir, isolating, gritty, and technologically overwhelming.",
          lighting: "High-contrast neon practicals. Dominant magenta and cyan rim lights piercing through dense volumetric steam, creating a chiaroscuro effect on the detective's silhouette.",
          vibeElements: ["Rain-slicked asphalt", "Flickering magenta/cyan neon", "Volumetric rising steam"]
        },
        palette: {
          reasoning: "Magenta and cyan create the classic cyberpunk dichotomy—technological coldness versus aggressive synthetic warmth.",
          colors: [
            { hex: "#FF00FF", name: "Synthetic Magenta", description: "Harsh neon glow from the signage." },
            { hex: "#00FFFF", name: "Gridlock Cyan", description: "Cool ambient light reflecting off the wet pavement." },
            { hex: "#1A1B26", name: "Asphalt Void", description: "Deep, crushing shadows in the unlit alley corners." },
            { hex: "#4A0072", name: "Deep Purple Haze", description: "The color of the steam mixing with the neon lights." }
          ]
        },
        camera: {
          format: "ARRI ALEXA Mini LF",
          lens: "Panavision Anamorphic C-Series 40mm",
          focalLength: "40mm",
          aperture: "T2.0",
          movement: "Slow, deliberate Steadicam tracking shot from behind, keeping the detective centered as the neon signs pass overhead.",
          composition: "One-point perspective focusing down the vanishing point of the narrow alley, heavy lower-third reflections.",
          directorNotes: "Emphasize the loneliness of the character. Let the neon reflections in the puddles tell the story of the city above."
        },
        vfx3d: {
          hdriSetup: "Nighttime Neo-Tokyo Alley HDRI (Wet)",
          softwareWorkflow: "Unreal Engine 5.4 Lumen with Niagara for rain and steam sims",
          vfxElements: "Dense volumetric steam particles, interactive puddle ripples, anamorphic lens flares",
          ambientSetup: "High-density height fog, raytraced screen space reflections set to 0.02 roughness for maximum puddle clarity"
        }
      },
      // Cyberpunk Neo-Tokyo Image Placeholder for Demo Video
      image: "https://drive.google.com/file/d/1iDGs-PJtMFpz6cgCync0BclVN_3_3Tl2/view?usp=drive_link"
    });

  } catch (error) {
    console.error("Error generating cinematic treatment:", error);
    return res.status(500).json({ 
        success: false, 
        error: "Internal Server Error during generation" 
    });
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`NoirGen AI Server is running smoothly at http://localhost:${port}`);
  console.log(`Ready for hackathon demo!`);
});