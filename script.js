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

// NAYA FUNCTION: API se connect karne ke liye
async function generateNoirGenResponse(prompt) {
    // config.js se API key uthana
    const apiKey = config.FIREWORKS_API_KEY; 
    const url = "https://api.fireworks.ai/inference/v1/chat/completions";

    // System prompt setup to define the AI's persona (Wong Kar-wai style added here)
    const systemPrompt = `You are an elite, autonomous Art Director for NoirGen AI. 
    Translate the user's scene description into a high-end, production-ready director's treatment. 
    Respond with exact hex color palettes (provide 4 hex codes), specific 35mm lens recommendations, and precise 3D HDRI lighting setups. 
    Maintain a cinematic, Wong Kar-wai inspired tone. Keep the response concise. Format the response strictly as a JSON object with these keys: visual_mood, color_palette (array of strings), camera_lens, blender_3d_setup.`;

    const data = {
        model: "accounts/fireworks/models/gemma-7b-it",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7,
        response_format: { type: "json_object" } // Asking the API to return JSON for easy formatting
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        const aiOutputString = result.choices[0].message.content;
        
        // Parse the JSON string returned by the AI
        return JSON.parse(aiOutputString);

    } catch (error) {
        console.error("Error generating response:", error);
        return null;
    }
}


// 4. Main Generation Function (AB ASALI API USE KAREGA)
async function handleGeneration() {
    const promptValue = promptInput.value.trim();
    
    // Agar input khali hai, toh kuch mat karo
    if (!promptValue) return;

    // Loading State dikhana
    outputContainer.classList.remove('hidden');
    outputContainer.innerHTML = '<div class="loader">🎬 Visualizing scene & calculating 3D nodes...</div>';
    generateBtn.disabled = true; // Button disable karna taaki multiple clicks na hon

    // AI API ko call karna aur wait karna
    const aiResponse = await generateNoirGenResponse(promptValue);

    if (aiResponse) {
        // Colors ke liye HTML generate karna
        let colorsHtml = '';
        if (aiResponse.color_palette && Array.isArray(aiResponse.color_palette)) {
            aiResponse.color_palette.forEach(color => {
                colorsHtml += `<div class="color-swatch" style="background-color: ${color};" title="${color}"></div>`;
            });
        }

        // Output Card mein asali AI Result inject karna
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
                    <p>${aiResponse.visual_mood || 'Data unavailable'}</p>
                </div>
                
                <div>
                    <p style="color: rgba(255,255,255,0.5); font-size: 0.85rem; margin-bottom: 5px;">CAMERA & LENS</p>
                    <p>${aiResponse.camera_lens || 'Data unavailable'}</p>
                </div>
                
                <div>
                    <p style="color: rgba(255,255,255,0.5); font-size: 0.85rem; margin-bottom: 5px;">BLENDER 3D SETUP</p>
                    <p>${aiResponse.blender_3d_setup || 'Data unavailable'}</p>
                </div>
                
                <div>
                    <p style="color: rgba(255,255,255,0.5); font-size: 0.85rem; margin-bottom: 5px;">COLOR PALETTE</p>
                    <div>${colorsHtml}</div>
                </div>
            </div>
        `;
    } else {
        // Agar API error de, toh user ko message dikhana
        outputContainer.innerHTML = `
             <div style="color: #ef4444; padding: 20px; border: 1px solid #ef4444; border-radius: 8px;">
                 <h4 style="margin-bottom: 10px;">Connection Error</h4>
                 <p>Unable to connect to the creative core. Please check your API key and connection.</p>
             </div>
        `;
    }
        
    // Input ko clear kar dena taaki user naya prompt daal sake
    promptInput.value = '';
    generateBtn.disabled = false; // Button wapas enable karna
}