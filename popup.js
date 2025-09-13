document.getElementById('start').addEventListener('click', () => {
  console.log("[POPUP] Bouton cliqué : envoi de startReply au content script.");
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    // ✅ Vérifie qu’on est bien sur X/Twitter
    if (!tabs[0].url.includes("x.com") && !tabs[0].url.includes("twitter.com")) {
      console.warn("[POPUP] L’onglet actif n’est pas un post X/Twitter :", tabs[0].url);
      // ➕ Affiche un message non bloquant dans la console au lieu d'un alert
      chrome.notifications?.create({
        type: "basic",
        iconUrl: "icon.png",
        title: "X Auto-Reply Bot",
        message: "⚠️ Ouvre un post X/Twitter avant de cliquer sur l’extension."
      });
      return;
    }

    try {
      chrome.tabs.sendMessage(tabs[0].id, { action: "startReply" });
      console.log("[POPUP] Message envoyé au content script.");
    } catch (e) {
      console.error("[POPUP] Erreur lors de l'envoi :", e);
      chrome.notifications?.create({
        type: "basic",
        iconUrl: "icon.png",
        title: "X Auto-Reply Bot",
        message: "⚠️ Recharge la page du tweet (Ctrl+F5) avant de cliquer sur l’extension."
      });
    }
  });
});
