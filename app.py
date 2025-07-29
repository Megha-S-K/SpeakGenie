from flask import Flask, request, jsonify, render_template
import subprocess
import os
import requests
from ai_response import get_ai_response
from dotenv import load_dotenv
import time

load_dotenv()

ELEVEN_API_KEY = os.getenv("ELEVENLABS_API_KEY")
VOICE_ID = "Xb7hH8MSUJpSbSDYk0k2"  # Replace with your preferred voice ID

app = Flask(__name__)

@app.after_request
def no_cache(response):
    response.headers["Cache-Control"] = "no-store"
    return response

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/chat")
def chat():
    mode = request.args.get("mode", "genie")  # fallback to genie
    return render_template("chat.html", mode=mode)

@app.route("/chat/<mode>")
def chat_mode(mode):
    return render_template("chat.html", mode=mode)

@app.route("/process_audio", methods=["POST"])
def process_audio():
    file = request.files['audio_data']
    file.save("temp.webm")

    # Convert to WAV
    subprocess.run([
        r"C:\ffmpeg-7.1.1-essentials_build\bin\ffmpeg.exe",
        "-y", "-i", "temp.webm", "temp.wav"
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Transcribe with Whisper
    result = subprocess.run(
        ["whisper.cpp/build/bin/Release/whisper-cli.exe",
         "-m", "whisper.cpp/ggml-base.en.bin",
         "-f", "temp.wav"],
        capture_output=True, text=True
    )

    whisper_output = result.stdout
    user_text = ""
    for line in whisper_output.splitlines():
        if "-->" in line:
            user_text = line.split("]")[-1].strip()
            break

    print("User said:", user_text)

    mode = request.form.get("mode", "default")
    print(f"Voice Mode received: {mode}")

    genie_reply = get_ai_response(user_text, mode) if user_text else "Sorry, I couldn’t understand."

    try:
        res = requests.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}",
            headers={
                "xi-api-key": ELEVEN_API_KEY,
                "Content-Type": "application/json"
            },
            json={
                "text": genie_reply,
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.8
                }
            }
        )
        if res.status_code == 200:
            with open("static/response.mp3", "wb") as f:
                f.write(res.content)
            time.sleep(0.1)
        else:
            print("❌ ElevenLabs TTS failed:", res.text)
    except Exception as e:
        print("❌ Error calling TTS:", e)

    return jsonify({
        "user_text": user_text,
        "genie_reply": genie_reply
    })


@app.route("/process_text", methods=["POST"])
def process_text():
    data = request.get_json()
    user_text = data.get("text", "")
    mode = data.get("mode", "default")

    print(f"Text input: {user_text} | Mode: {mode}")

    genie_reply = get_ai_response(user_text, mode)

    try:
        res = requests.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}",
            headers={
                "xi-api-key": ELEVEN_API_KEY,
                "Content-Type": "application/json"
            },
            json={
                "text": genie_reply,
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.8
                }
            }
        )
        if res.status_code == 200:
            with open("static/response.mp3", "wb") as f:
                f.write(res.content)
        else:
            print("TTS failed:", res.text)
    except Exception as e:
        print("TTS error:", e)

    return jsonify({ "genie_reply": genie_reply })


if __name__ == "__main__":
    app.run(debug=True)
