// 1. HTML Elements ko select karna
const generateBtn = document.getElementById('generate-btn');
const promptInput = document.getElementById('ai-prompt');
const outputContainer = document.getElementById('ai-output');

// 2. Button Click Event
generateBtn.addEventListener('click', handleGeneration);

// 3. Enter Key Press Event (Taaki user Enter dabaye toh bhi generate ho)
promptInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        handleGeneration();
    }
});

// 4. Main Generation Function
function handleGeneration() {
    const promptValue = promptInput.value.trim();
    
    // Agar input khali hai, toh kuch mat karo
    if (!promptValue) return;

    // Loading State dikhana
    outputContainer.classList.remove('hidden');
    outputContainer.innerHTML = '<div class="loader">🎬 Visualizing scene & calculating 3D nodes...</div>';

    // 2 Second ka Fake Delay (API ki tarah simulate karne ke liye)
    setTimeout(() => {
        
        // 7 July ko yahan asli Fireworks API ka fetch() function aayega
        // Abhi ke liye humara cinematic dummy data (Wong Kar-wai style with modern touch)
        const dummyResponse = {
            visual_mood: "Cinematic Noir. Heavy influence of Wong Kar-wai. Smudged neon lights reflecting off wet pavement, melancholic atmosphere, and deep, saturated shadows. The modern accessories (headphones) contrast beautifully with the vintage lighting.",
            color_palette: ["#020617", "#9F1239", "#F59E0B", "#1E3A8A"],
            camera_lens: "Shot on 35mm spherical lens, f/1.4 for a highly isolated subject and buttery bokeh.",
            blender_3d_setup: "HDRI: 'Midnight City Street' (low intensity). Key Light: Red neon tube light (Emission strength 50). Volumetric scattering set to 0.05."
        };

        // Colors ke liye HTML generate karna
        let colorsHtml = '';
        dummyResponse.color_palette.forEach(color => {
            colorsHtml += `<div class="color-swatch" style="background-color: ${color};" title="${color}"></div>`;
        });

        // Output Card mein Result inject karna
        outputContainer.innerHTML = `
            <h3 style="color: #F59E0B; margin-bottom: 20px;">✨ Director's Treatment</h3>
            
            <div style="margin-bottom: 15px;">
                <p style="color: rgba(255,255,255,0.5); font-size: 0.85rem; margin-bottom: 5px;">PROMPT</p>
                <p style="font-style: italic;">"${promptValue}"</p>
            </div>
            
            <hr style="border-color: rgba(255,255,255,0.1); margin: 20px 0;">
            
            <div style="display: grid; grid-template-columns: 1fr; gap: 20px;">
                <div>
                    <p style="color: rgba(255,255,255,0.5); font-size: 0.85rem; margin-bottom: 5px;">VISUAL MOOD</p>
                    <p>${dummyResponse.visual_mood}</p>
                </div>
                
                <div>
                    <p style="color: rgba(255,255,255,0.5); font-size: 0.85rem; margin-bottom: 5px;">CAMERA & LENS</p>
                    <p>${dummyResponse.camera_lens}</p>
                </div>
                
                <div>
                    <p style="color: rgba(255,255,255,0.5); font-size: 0.85rem; margin-bottom: 5px;">BLENDER 3D SETUP</p>
                    <p>${dummyResponse.blender_3d_setup}</p>
                </div>
                
                <div>
                    <p style="color: rgba(255,255,255,0.5); font-size: 0.85rem; margin-bottom: 5px;">COLOR PALETTE</p>
                    <div>${colorsHtml}</div>
                </div>
            </div>
        `;
        
        // Input ko clear kar dena taaki user naya prompt daal sake
        promptInput.value = '';

    }, 2000); 
}