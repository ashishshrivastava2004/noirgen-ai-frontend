export interface ColorSwatch {
  hex: string;
  name: string;
  description: string;
}

export interface FilmTreatment {
  mood: {
    title: string;
    description: string;
    tonality: string;
    lighting: string;
    vibeElements: string[];
  };
  palette: {
    reasoning: string;
    colors: ColorSwatch[];
  };
  camera: {
    format: string;
    lens: string;
    focalLength: string;
    aperture: string;
    movement: string;
    composition: string;
    directorNotes: string;
  };
  vfx3d: {
    hdriSetup: string;
    softwareWorkflow: string;
    vfxElements: string;
    ambientSetup: string;
  };
}

export interface PresetScene {
  id: string;
  name: string;
  genre: string;
  lighting: string;
  prompt: string;
  coverImage: string; // fallback stylized aesthetic design or unsplash/gemini-generated
  treatment: FilmTreatment;
}

export const PRESETS: PresetScene[] = [
  {
    id: "neon-cyberpunk",
    name: "Liquid Neon Shadows",
    genre: "Cyberpunk Noir",
    lighting: "Chiaroscuro Neon",
    prompt: "A gritty cyber-detective walking down a rain-slicked alley in Neo-Tokyo, under flickering magenta and cyan neon signs, steam rising from the wet asphalt pavement.",
    coverImage: "https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?q=80&w=600&auto=format&fit=crop",
    treatment: {
      mood: {
        title: "Liquid Neon Shadows",
        description: "A high-intensity color clash set in a dense, rain-slicked futuristic cityscape. The atmosphere is thick with atmospheric moisture, combining absolute darkness in deep alleys with blinding neon radiation.",
        tonality: "Existential dread, hyper-technological isolation, high-contrast urban tension",
        lighting: "Extreme chiaroscuro. Harsh 100W magenta rim lights from back-alley shop displays clashing with cold 6500K cyan key lights reflecting off wet asphalt and rising steam.",
        vibeElements: ["Reflective wet concrete", "Flickering high-voltage signage", "Rising heavy industrial steam"]
      },
      palette: {
        reasoning: "The stark contrast between neon magenta and electric cyan represents the clash between hyper-capitalist digital consumerism and the cold, wet, neglected street-level reality.",
        colors: [
          { hex: "#00E5FF", name: "Cyberpunk Cyan", description: "Primary cool light reflection on rain surfaces and metallic visors." },
          { hex: "#FF007F", name: "Synthetic Magenta", description: "Harsh rim-lighting, glowing signage, and neon spray paint markings." },
          { hex: "#1A0933", name: "Abyssal Indigo", description: "Deep, ink-like shadows masking back alleys and non-reflective textiles." },
          { hex: "#FF9E00", name: "Amber Warning", description: "Sodium streetlamp amber peeking through steam and warning warning lights." }
        ]
      },
      camera: {
        format: "ARRI ALEXA LF (Open Gate 4.5K ArriRaw)",
        lens: "Cooke Anamorphic/i SF (Special Flare) 2x Prime",
        focalLength: "40mm Anamorphic (equivalent to 20mm spherical width for wide claustrophobic scope)",
        aperture: "T2.1 to generate highly cinematic oval bokeh out of the background neon lights",
        movement: "Steadicam creeping on a low-angle slow push, mimicking a predatory, unseen observer",
        composition: "Framed using the rule of thirds, with the detective positioned in the left third, leaving massive negative space filled with colorful reflections on the right.",
        directorNotes: "Instruct the actor to walk slowly, keeping their chin down to allow the amber light to catch their eyes only intermittently. Control the steam machine to release bursts in sync with camera pans."
      },
      vfx3d: {
        hdriSetup: "Wet Shibuya Back-Alley Night - Overcast Rain 8K HDRI (Sodium & Neon accent nodes)",
        softwareWorkflow: "Unreal Engine 5.4 Nanite geometry combined with Lumen real-time global illumination and hardware raytraced reflections.",
        vfxElements: "Volumetric Niagara steam particle spawners, digital anamorphic lens flare matching Cooke SF profiles, real-time screen-space planar reflections on puddle geometry.",
        ambientSetup: "Exponential Height Fog configured with 0.18 density, colored with a soft purple ambient scattering color to catch light leakage from distant neon."
      }
    }
  },
  {
    id: "apocalypse-dune",
    name: "Obsidian Desert Dust",
    genre: "Sci-Fi Post-Apocalyptic",
    lighting: "Overcast Sandstorm",
    prompt: "An lone scavenger standing on top of a towering rust-colored sand dune looking down at a half-buried brutalist starship during an amber dust storm at dusk.",
    coverImage: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=600&auto=format&fit=crop",
    treatment: {
      mood: {
        title: "Obsidian Desert Dust",
        description: "An oppressive, monochrome ochre atmosphere that conveys extreme heat, decay, and the grand, forgotten scale of fallen civilizations. Visibility is choked by a constant screen of micro-fine silicate dust.",
        tonality: "Desolate isolation, heavy industrial decay, sublime architectural awe",
        lighting: "Completely diffused, soft sky hemisphere casting an amber-tinted ambient light. No hard shadows exist; light is scattered evenly through sand particles, making shapes loom out of the fog.",
        vibeElements: ["Monolithic brutalist silhouettes", "Whirling wind-swept micro-sand", "Distressed copper and rusted iron"]
      },
      palette: {
        reasoning: "A monochromatic, earthy palette using warm terracotta, deep rust, and clay colors to convey a world stripped of organic greens and blues, leaving only mineral decay.",
        colors: [
          { hex: "#C86432", name: "Sienna Dust", description: "Dominant atmospheric scattering color and high-altitude sand clouds." },
          { hex: "#4E2B1F", name: "Oxidized Rust", description: "Tonal value of the buried spaceship hull and volcanic metal plates." },
          { hex: "#D9A05B", name: "Sahara Gold", description: "Highlight sand crests catching the last scattered rays of the sun." },
          { hex: "#1C1512", name: "Volcanic Ash", description: "Deep valleys in the brutalist ship crevices and the scavenger's dark robes." }
        ]
      },
      camera: {
        format: "RED V-Raptor XL (8K VV)",
        lens: "Angénieux Optimo Ultra 12x Cine Zoom",
        focalLength: "135mm Telephoto (compressing the perspective to make the brutalist ship feel massive and close)",
        aperture: "T5.6 to maintain structural detail on both the scavenger and the background ship hull",
        movement: "Static camera locked on a heavy tripod, letting the swirling sand and robes create all the inner frame movement",
        composition: "Scavenger is framed as a tiny, isolated silhouette in the lower-right quadrant, emphasizing the scale of the colossal brutalist ship structure spanning the frame.",
        directorNotes: "Use a heavy wind machine from screen-left to blow sand across the crest of the dune. The actor must lean heavily into the wind to emphasize physical resistance."
      },
      vfx3d: {
        hdriSetup: "Dry Salt Flats Dust Storm - Sunset Diffused Amber 16K HDRI",
        softwareWorkflow: "Blender 4.2 Cycles engine utilizing procedural micro-displacement for sand textures and dense volumetric absorption shaders.",
        vfxElements: "Sparse particle systems for sand grains, multi-layered VDB volume clouds drifting across the midground, procedural wind distortion of scavenger cloth.",
        ambientSetup: "Principled Volume shader with Anisotropy set to 0.7 to mimic physical silicate dust light scattering, combined with a deep golden horizon fog."
      }
    }
  },
  {
    id: "folk-horror",
    name: "Desaturated Moss & Mist",
    genre: "Folk Horror / Dark Drama",
    lighting: "Overcast Nordic Noon",
    prompt: "A mysterious stone monolith circle in a rolling green Irish highland field enveloped in heavy low-hanging fog, a lone figure in a crimson wool coat standing in the center.",
    coverImage: "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?q=80&w=600&auto=format&fit=crop",
    treatment: {
      mood: {
        title: "Desaturated Moss & Mist",
        description: "An eerie, damp atmosphere that feels heavy with folklore and hidden secrets. The natural greens are damp and muted, broken only by a shocking splash of deep ritualistic crimson.",
        tonality: "Stark folklore dread, historic weight, cold naturalistic isolation",
        lighting: "Soft, flat, shadowless overhead lighting from thick, uniform highland cloud cover. Highlights are soft and metallic; shadows are gentle but fill the deep moss cracks.",
        vibeElements: ["Ancient wet stone moss", "Drifting low-altitude fog banks", "High-contrast crimson focal point"]
      },
      palette: {
        reasoning: "The dominant dull mossy greens and slate grays evoke cold ancient earth, while the single touch of ritualistic crimson red pulls the viewer's eyes instantly to the narrative focal point.",
        colors: [
          { hex: "#9E0B0B", name: "Ritual Crimson", description: "High-contrast focal point of the crimson wool coat." },
          { hex: "#555A46", name: "Nordic Moss", description: "Damp, desaturated organic green covering highlands and rocks." },
          { hex: "#3E4348", name: "Slate monolith", description: "Wet, ancient igneous rock textures of the monolithic structures." },
          { hex: "#EBEBE5", name: "Atlantic Mist", description: "Low-hanging, moisture-heavy cloud cover and creeping floor fog." }
        ]
      },
      camera: {
        format: "Panavision Millennium DXL2 8K",
        lens: "Panavision Primo Artiste Lenses (custom high-contrast coating)",
        focalLength: "24mm Ultra-Wide (exaggerating the space between the standing stones and the sky)",
        aperture: "T2.8 to provide natural falloff while keeping the heavy texture of the stone patterns readable",
        movement: "Extremely slow, deliberate vertical jib lift starting from grass level up to eye line, revealing the horizon",
        composition: "Perfect radial symmetry. The monoliths form a frame-within-a-frame enclosing the crimson figure dead-center.",
        directorNotes: "Block the actor to stand perfectly still, back to the camera, looking slightly upwards. Release cold ground fog from behind the central stone to drift forwards."
      },
      vfx3d: {
        hdriSetup: "Isle of Skye Highland Valley - Rainy Overcast Dusk 8K HDRI",
        softwareWorkflow: "Unreal Engine 5.4 Substrate materials to render hyper-realistic wet stone moss, combined with Niagara floor fog fluid simulations.",
        vfxElements: "High-density particle fog, procedural rain ripples on stone surfaces, physics-driven damp heather grass blades bending under wind.",
        ambientSetup: "Height fog with high scattering and low extinction, forcing light to pool heavily in the valleys of the landscape mesh."
      }
    }
  },
  {
    id: "retro-thriller",
    name: "Golden Hour Suspense",
    genre: "Retro 1970s Thriller",
    lighting: "Low-Sun Golden Hour",
    prompt: "Two men in vintage beige trenchcoats talking tensely inside a classic 1972 vinyl booth diner, warm 5 o'clock sun slicing through dusty window blinds.",
    coverImage: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600&auto=format&fit=crop",
    treatment: {
      mood: {
        title: "Golden Hour Suspense",
        description: "A warm, high-contrast period treatment that captures the paranoia and stylistic grit of 1970s espionage. The air is heavy with cigarette smoke, and shadows are long, geometric, and sharp.",
        tonality: "Conspiratorial paranoia, retro cinematic nostalgia, tense warmth",
        lighting: "Hard, directional low-angle sun cutting through horizontal venetian blinds, creating sharp geometric zebra-patterns of bright gold light and dark shadow across the actors and the vinyl booth.",
        vibeElements: ["Geometric window-blind shadows", "Swirling cigarette smoke dust", "Cracked burgundy leather booths"]
      },
      palette: {
        reasoning: "Warm golden yellows, deep mustards, and rich burgundy leather tones capture the classic, organic retro-film look, creating an atmosphere that feels simultaneously cozy and highly suspicious.",
        colors: [
          { hex: "#E59B3C", name: "Diner Solstice", description: "Intense, warm yellow sun slices cutting through the windows." },
          { hex: "#5C151B", name: "Burgundy Vinyl", description: "Deep, reflective red leather booths grounding the shadows." },
          { hex: "#A8946E", name: "Trenchcoat Khaki", description: "Neutral retro tone of the classic spy garments and paper menus." },
          { hex: "#29241D", name: "Espresso Paranoia", description: "Dark, warm shadows behind the diner bar and under the table." }
        ]
      },
      camera: {
        format: "Super 35mm Film (Kodak Vision3 500T 5219, pushed 1 stop)",
        lens: "Kowa Prominar Anamorphic vintage lenses",
        focalLength: "75mm Anamorphic (capturing tense double-overshoulders with vintage edge distortion)",
        aperture: "T2.0 to melt the background into warm, smeary vintage flares and horizontal streak flares",
        movement: "Handheld micro-jitters, replicating the organic, nervous breathing of an undercover stakeout",
        composition: "Tight split-diopter shot keeping both the coffee cup in the foreground and the speaker's eyes in the background in sharp, simultaneous focus.",
        directorNotes: "Light the scene with a powerful tungsten source from outside the window, passing through real wooden blinds. Ensure coffee steam is backlit to glow orange."
      },
      vfx3d: {
        hdriSetup: "Vintage Diner Interior - Sunset Low Sun 4K HDRI",
        softwareWorkflow: "Autodesk Maya combined with Arnold renderer, using custom film grain filters and anamorphic camera projection models.",
        vfxElements: "High-fidelity volumetric light beams with custom texture maps to simulate dust and smoke, procedural cigarette ember glow simulations.",
        ambientSetup: "Deep raytraced transmission through glass windows with real-world dust scratch maps applied to the glass roughness channel."
      }
    }
  }
];
