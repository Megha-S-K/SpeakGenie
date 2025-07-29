import os
from dotenv import load_dotenv
from roleplay_modes import MODES
from groq import Groq

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)

def get_ai_response(prompt, mode="default"):
    persona = MODES.get(mode, MODES["default"])

    chat_completion = client.chat.completions.create(
        model="llama3-70b-8192",
        messages=[
            {"role": "system", "content": f"{persona['system_prompt']} Please answer briefly (max 2-3 sentences)."},
            {"role": "user", "content": prompt}
        ]
    )
    return chat_completion.choices[0].message.content
