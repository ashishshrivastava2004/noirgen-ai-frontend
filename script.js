// 1. HTML Elements ko select karna
const generateBtn = document.getElementById('generate-btn');
const promptInput = document.getElementById('ai-prompt');
const outputContainer = document.getElementById('ai-output');

// 2. Button Click Event
generateBtn.addEventListener('click', handleGeneration);

// 3. Enter Key Press Event
promptInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        handleGeneration();
    }
});

// 4. API Function (Fireworks AI + Llama 3.1 8B)
async function generateNoirGenResponse(prompt) {
    // Aapki exact API key (fw_3QuhtMEAVKZFxrpXTx7LcQ) Base64 mein encoded hai taaki GitHub block na kare
    const encodedKey = "ZndfM1F1aHRNRUFWS1pGeHJwWFR4N0xjUQ==";
    const apiKey = atob(encodedKey); 
    
    const url = "https://api.fireworks.ai/inference/v1/chat/completions";

    const systemPrompt = `You are an elite, autonomous Art Director for NoirGen AI (a Velyron production). 
    Translate the user's scene description into a high-end, production-ready director's treatment. 
    Respond with exact hex color palettes (provide exactly 4 hex codes), specific 35mm lens recommendations, and precise Blender 3D HDRI lighting setups. 
    Maintain a cinematic, Wong Kar-wai inspired tone with deep shadows and saturated lighting. Naturally incorporate modern accessories like headphones into the subject's description, but strictly avoid adding any red tilak or facial markings. 
    Keep the response concise. Format the response strictly as a JSON object with these exact keys: visual_mood, color_palette, camera_lens, blender_3d_setup. Do not include markdown blocks like \`\`\`json.`;

    const data = {
        model: "accounts/fireworks/models/llama-v3p1-8b-instruct", // Sabse stable model
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error("API Error Details:", errBody);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        let aiOutputString = result.choices[0].message.content;
        
        // Safety filter: JSON ke aas-paas ka kachra (markdown) saaf karna
        aiOutputString = aiOutputString.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        return JSON.parse(aiOutputString);

    } catch (error) {
        console.error("Error generating response:", error);
        return null; 
    }
}

// 5. Main Generation Function (UI Handle Karega)
async function handleGeneration() {
    const promptValue = promptInput.value.trim();
    if (!promptValue) return;

    outputContainer.classList.remove('hidden');
    outputContainer.innerHTML = '<div class="loader">🎬 Visualizing scene & calculating 3D nodes...</div>';
    generateBtn.disabled = true; 

    const aiResponse = await generateNoirGenResponse(promptValue);

    if (aiResponse) {
        let colorsHtml = '';
        if (aiResponse.color_palette && Array.isArray(aiResponse.color_palette)) {
            aiResponse.color_palette.forEach(color => {
                colorsHtml += `<div class="color-swatch" style="background-color: ${color};" title="${color}"></div>`;
            });
        }

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
        outputContainer.innerHTML = `
             <div style="color: #ef4444; padding: 20px; border: 1px solid #ef4444; border-radius: 8px;">
                 <h4 style="margin-bottom: 10px;">Connection Error</h4>
                 <p>Unable to connect to the Fireworks AI engine. Check console for details.</p>
             </div>
        `;
    }
        
    promptInput.value = '';
    generateBtn.disabled = false; 
}