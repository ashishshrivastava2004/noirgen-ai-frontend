import streamlit as st
import time
import base64
import os

# ==========================================
# Helper Function: Read Font File
# ==========================================
@st.cache_data
def get_font_as_base64(font_path):
    with open(font_path, "rb") as f:
        data = f.read()
    return base64.b64encode(data).decode()

# ==========================================
# 1. UI Configuration & Page Setup
# ==========================================
st.set_page_config(
    page_title="NoirGen AI - The Art Director", 
    page_icon="✨", 
    layout="wide"
)

# ==========================================
# 2. Custom CSS (Talina Font + Midjourney Aesthetic)
# ==========================================
# Font file ka naam - ensure it matches exactly!
font_file_name = "ARCADECLASSIC.ttf"

try:
    font_base64 = get_font_as_base64(font_file_name)
    
    st.markdown(f"""
        <style>
        /* Embed Custom Font */
        @font-face {{
            font-family: 'Talina';
            src: url(data:font/opentype;charset=utf-8;base64,{font_base64}) format('opentype');
            font-weight: normal;
            font-style: normal;
        }}

        /* Apply the font to the entire Streamlit app */
        html, body, [class*="css"], .stApp, .st-emotion-cache-16idsys p, p, h1, h2, h3, h4, h5, h6 {{
            font-family: 'Talina', sans-serif !important;
        }}

        /* Discord/Midjourney Dark Theme */
        .stApp {{
            background-color: #313338; 
            color: #DBDEE1;
        }}
        
        /* Hide Streamlit Headers/Footers */
        header {{visibility: hidden;}}
        #MainMenu {{visibility: hidden;}}
        footer {{visibility: hidden;}}
        
        /* Sleek Sidebar mimicking server channels */
        [data-testid="stSidebar"] {{
            background-color: #2B2D31;
            border-right: 1px solid #1E1F22;
        }}
        
        /* Chat Input Styling */
        [data-testid="stChatInput"] {{
            background-color: #383A40;
            border: none;
            border-radius: 8px;
            font-family: 'Talina', sans-serif !important;
        }}
        
        /* Bot Message Styling */
        .bot-message {{
            background-color: #2B2D31;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #F59E0B; /* Amber accent */
            margin-top: 10px;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }}
        
        /* Premium Color Swatches */
        .color-swatch {{
            display: inline-block;
            width: 30px; 
            height: 30px; 
            border-radius: 50%; 
            margin-right: 8px;
            border: 2px solid #1E1F22;
            box-shadow: 0 0 5px rgba(0,0,0,0.5);
        }}
        
        /* Subtle text for prompts */
        .prompt-text {{
            color: #B5BAC1;
            font-size: 0.95em;
        }}
        </style>
    """, unsafe_allow_html=True)

except FileNotFoundError:
    st.error(f"⚠️ Font file '{font_file_name}' not found. Please make sure it is in the same folder as app.py.")

# ==========================================
# 3. Sidebar (Professional Settings Panel)
# ==========================================
with st.sidebar:
    st.markdown("### ⚙️ NoirGen Settings")
    st.caption("Adjust generation parameters.")
    
    st.selectbox("Model Version", ["V6 (Alpha) - Gemma 7B", "V5.2 - Fast"])
    st.selectbox("Aspect Ratio", ["--ar 16:9 (Cinematic)", "--ar 4:5 (Portrait)", "--ar 1:1 (Square)"])
    st.selectbox("Stylize", ["--s 1000 (High Fashion)", "--s 250 (Default)", "--s 50 (Raw)"])
    
    st.markdown("---")
    st.caption("Developed by **Velyron Studios**")
    st.caption("Powered by Fireworks AI & AMD")

# ==========================================
# 4. Chat History State Management
# ==========================================
if "messages" not in st.session_state:
    st.session_state.messages = []

# Show welcome header only if chat is empty
if not st.session_state.messages:
    st.markdown("<h2 style='text-align: center; color: #F59E0B; margin-top: 50px;'>NoirGen AI</h2>", unsafe_allow_html=True)
    st.markdown("<p style='text-align: center; color: #80848E;'>The Autonomous Cinematic Art Director. Type your scene to begin.</p>", unsafe_allow_html=True)

# Display previous chat history
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"], unsafe_allow_html=True)

# ==========================================
# 5. Chat Input & AI Generation Logic
# ==========================================
if prompt := st.chat_input("Start with a prompt (e.g., A modern character wearing headphones, drinking coffee in a neon-lit diner...)"):
    
    # Add user prompt to chat history and display it
    user_html = f"**Prompt:** <span class='prompt-text'>{prompt}</span>"
    st.session_state.messages.append({"role": "user", "content": user_html})
    
    with st.chat_message("user"):
        st.markdown(user_html, unsafe_allow_html=True)

    # AI Processing & Output Generation
    with st.chat_message("assistant"):
        with st.spinner("Generating NoirGen job... (Waiting to start)"):
            time.sleep(2) 
            
            dummy_response = {
                "visual_mood": "Cinematic Noir. Heavy Wong Kar-wai influence. Smudged neon lights reflecting off wet pavement, melancholic atmosphere, and deep, saturated shadows. The modern accessories contrast beautifully with the vintage lighting.",
                "color_palette": ["#020617", "#9F1239", "#F59E0B"],
                "camera_lens": "Shot on 35mm spherical lens, f/1.4 for a highly isolated subject.",
                "blender_3d_setup": "HDRI: 'Midnight City Street' (low intensity). Key Light: Red neon tube light (Emission strength 50)."
            }
            
            color_html = ""
            for color in dummy_response["color_palette"]:
                color_html += f'<div class="color-swatch" style="background-color:{color};" title="{color}"></div>'
            
            bot_reply = f"""
            <div class="bot-message">
                <h4 style="margin-top: 0; color: #F59E0B;">✨ Generation Complete</h4>
                <p><strong>Mood:</strong> {dummy_response['visual_mood']}</p>
                <hr style="border-color: #383A40; margin: 12px 0;">
                <p><strong>Camera:</strong> {dummy_response['camera_lens']}</p>
                <p><strong>3D Setup:</strong> {dummy_response['blender_3d_setup']}</p>
                <div style="margin-top: 15px;">
                    {color_html}
                </div>
            </div>
            """
            
            st.markdown(bot_reply, unsafe_allow_html=True)
            st.session_state.messages.append({"role": "assistant", "content": bot_reply})