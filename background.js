console.log("[BG] Service worker initialisé.");

chrome.runtime.onInstalled.addListener(() => {
  console.log("[BG] Extension installée ou mise à jour.");
});

// 🎨 Diversifie le début pour éviter la répétition
function diversifyStart(text) {
  const banned = ["Seriously", "Really"];
  const alternatives = ["Bruh,", "Lmao,", "Yo,", "Wait,", "Fam,", "Sheesh,"];
  if (banned.some(b => text.startsWith(b))) {
    return (
      alternatives[Math.floor(Math.random() * alternatives.length)] +
      " " +
      text.split(" ").slice(1).join(" ")
    );
  }
  return text;
}

// 🎭 Styles disponibles
const STYLES = [
  "Sassy troll vibe with light provocation",
  "Like a stand-up comedian cracking a sharp, witty joke",
  "Offer a fresh, surprising perspective that challenges assumptions"
];

chrome.runtime.onMessage.addListener((request, sender) => {
  if (request.action === "askOllama") {
    console.log("[BG] Message reçu :", request);

    // Choisit un style au hasard si aucun spécifié
    const chosenStyle = request.style || STYLES[Math.floor(Math.random() * STYLES.length)];

    const prompt = `
You're a witty Twitter user. Respond to the post in ≤220 characters.
Tone: ${chosenStyle}.
Use English slang, casual grammar (~5% errors for realism).
Avoid always starting with the same openers—mix it up or dive straight in.
Use a maximum of 1 emoji, and only ~50% of the time.
Do NOT include hashtags or quotation marks.
Output ONLY the final reply—no explanations or formatting.
Original post: """${request.prompt}"""`;

    console.log(`[BG] Style choisi : ${chosenStyle}`);
    console.log("[BG] Prêt à envoyer le prompt à Ollama :", request.prompt);

    fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemma3:latest",
        prompt,
        stream: false
      })
    })
      .then(res => {
        console.log("[BG] Réponse brute Ollama status :", res.status, res.statusText);
        return res.json();
      })
      .then(data => {
        console.log("[BG] Données JSON Ollama :", data);
        let reply = data.response?.trim() || "(no reply)";

        // Nettoyage : retire guillemets accidentels
        reply = reply.replace(/["“”]/g, "").trim();

        // Diversification du début
        reply = diversifyStart(reply);

        console.log("[BG] Réponse renvoyée explicitement au content script :", reply);
        chrome.tabs.sendMessage(sender.tab.id, { reply });
      })
      .catch(err => console.error("[BG] Erreur Ollama :", err));
  }
});

chrome.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => {
  if (msg.action === "COMMENT") {
    console.log("[B] Reçu demande de commentaire :", msg);

    // Ici on lance exactement le workflow actuel (comme si le popup avait cliqué)
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "startReply", postUrl: msg.postUrl });
    });

    sendResponse({ ok: true });
  }
});
