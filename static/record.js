import { appendMessage, clearChatWithIntro } from "./ui.js";

let mediaRecorder;
let audioChunks = [];

// Get DOM elements

const recordBtn = document.getElementById("record-btn");
const sendBtn = document.getElementById("send-btn");
const textInput = document.getElementById("text-input");
const chatWindow = document.getElementById("chat-window");
const modeSelect = document.getElementById("mode");
const scenarioSelect = document.getElementById("scenario");

// ✅ Only attach event listeners if the dropdowns exist (safe for chat.html)
if (modeSelect && scenarioSelect) {
    modeSelect.addEventListener("change", () => {
        scenarioSelect.style.display = modeSelect.value === "roleplay" ? "block" : "none";
        clearChatWithIntro(getCurrentRole());
    });

    scenarioSelect.addEventListener("change", () => {
        if (modeSelect.value === "roleplay") {
            clearChatWithIntro(getCurrentRole());
        }
    });
}

// 🧠 Helper: Get selected role (mode)
function getCurrentRole() {
     // ✅ Priority: check localStorage (set from Flask/chat.html)
    const stored = localStorage.getItem("selectedMode");
    if (stored) return stored;

    // ✅ Fallback: check dropdowns if on index.html
    if (modeSelect && scenarioSelect) {
        return modeSelect.value === "roleplay" ? scenarioSelect.value : "genie";
    }

    return "genie"; // default
}
// ✅ Send message on Enter
textInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendBtn.click();
});

// 📨 Send typed message to backend
sendBtn.onclick = async () => {
    const message = textInput.value.trim();
    if (!message) return;

    const mode = getCurrentRole();
    appendMessage(message, "user");
    textInput.value = "";

    const res = await fetch("/process_text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message, mode })
    });

    const data = await res.json();
    appendMessage(data.genie_reply, "genie");

    playAudio();
};

// 🎤 Start voice recording
recordBtn.onclick = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    mediaRecorder.start();

    appendMessage("🎤 Listening...", "genie");

    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);

    mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunks, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio_data", blob, "temp.webm");
        formData.append("mode", getCurrentRole());

        const res = await fetch("/process_audio", {
            method: "POST",
            body: formData
        });

        const data = await res.json();
        if (data.user_text) appendMessage(data.user_text, "user");
        if (data.genie_reply) appendMessage(data.genie_reply, "genie");

        playAudio();
    };

    setTimeout(() => mediaRecorder.stop(), 4000); // 4 seconds max
};

// 🔊 Audio playback helper with cleanup
function playAudio() {
    const audio = new Audio(`/static/response.mp3?cb=${Date.now()}`);
    audio.onended = () => audio.remove();
    setTimeout(() => audio.play(), 200);
}

// 🧞 Show default greeting when page loads
window.addEventListener("DOMContentLoaded", () => {
    clearChatWithIntro(getCurrentRole());
});
