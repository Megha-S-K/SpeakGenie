export function appendMessage(text, sender) {
    const chatWindow = document.getElementById("chat-window");
    const bubble = document.createElement("div");
    bubble.className = `bubble ${sender}`;
    bubble.innerText = text;
    bubble.style.animation = "fadeIn 0.5s ease";
    chatWindow.appendChild(bubble);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

export function clearChatWithIntro(role) {
    const chatWindow = document.getElementById("chat-window");
    chatWindow.innerHTML = "";

    const greetings = {
        genie: "🧞‍♂️ Hello! I'm your Genie. You’ve unlocked me from my lamp. Ask for your wish!",
        teacher: "👩‍🏫 Hi! I'm your friendly teacher. Need help with anything?",
        storyteller: "📖 I'm your storyteller! Ready to hear something fun?",
    };

    appendMessage(greetings[role] || "Hi there! I'm your assistant.", "genie");
}
