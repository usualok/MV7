console.log("[CT] Content script loaded");

// ⏳ Attendre un élément visible et actif
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const interval = 150;
    let elapsed = 0;
    const timer = setInterval(() => {
      const el = typeof selector === "function" ? selector() : document.querySelector(selector);
      if (el && el.offsetParent !== null && !el.disabled) {
        clearInterval(timer);
        resolve(el);
      }
      elapsed += interval;
      if (elapsed >= timeout) {
        clearInterval(timer);
        reject(new Error(`Timeout: ${selector} introuvable ou inactif`));
      }
    }, interval);
  });
}

// 🧑‍💻 Frappe humaine améliorée : pauses, typos et pauses longues
async function typeLikeHuman(el, text) {
  el.focus();
  el.click();
  el.innerHTML = "";

  let i = 0;
  while (i < text.length) {
    const char = text[i];
    el.setRangeText(char, el.selectionStart, el.selectionEnd, 'end');
    el.dispatchEvent(new InputEvent("input", { bubbles: true }));

    const delay = 50 + Math.random() * 100;
    await new Promise(r => setTimeout(r, delay));

    // ⏸ Pause aléatoire comme si on réfléchissait (~5 %)
    if (Math.random() < 0.05) {
      const pause = 500 + Math.random() * 1000;
      console.log(`[CT] Pause de réflexion ${pause.toFixed(0)}ms`);
      await new Promise(r => setTimeout(r, pause));
    }

    // 🛑 Pauses longues supplémentaires (~2 %) pour réalisme
    if (Math.random() < 0.02) {
      const longPause = 1500 + Math.random() * 1500;
      console.log(`[CT] Longue pause ${longPause.toFixed(0)}ms`);
      await new Promise(r => setTimeout(r, longPause));
    }

    // ❌ Fautes de frappe simulées (~5 %)
    if (Math.random() < 0.05 && i < text.length - 2) {
      const typoChar = String.fromCharCode(97 + Math.floor(Math.random() * 26));
      el.setRangeText(typoChar, el.selectionStart, el.selectionEnd, 'end');
      el.dispatchEvent(new InputEvent("input", { bubbles: true }));
      await new Promise(r => setTimeout(r, 150));
      el.setRangeText('', el.selectionStart - 1, el.selectionStart, 'end'); // Backspace
      el.dispatchEvent(new InputEvent("input", { bubbles: true }));
      console.log("[CT] Correction d'une faute simulée.");
    }

    i++;
  }
  console.log("[CT] Texte tapé avec pauses et fautes simulées.");
}

// 🔍 Trouver zone et bouton « Répondre »
function findReplyZone() {
  return (
    document.querySelector('div[aria-label="Postez votre réponse"]') ||
    document.querySelector('div[role="textbox"]') ||
    document.querySelector('textarea[role="textbox"]') ||
    document.querySelector('textarea')
  );
}

function findReplyButton() {
  const buttons = [...document.querySelectorAll('button')];
  return buttons.find(
    btn => btn.innerText.trim() === "Répondre" && !btn.disabled
  );
}

// 📰 Récupération du texte du post
function getPostText() {
  const article = document.querySelector("article");
  if (!article) return "(Aucun texte trouvé)";
  return Array.from(article.querySelectorAll("div[lang]"))
    .map(span => span.innerText)
    .join(" ");
}

// 📩 Gestion des messages
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "startReply") {
    console.log("[CT] Démarrage du processus de réponse.");
    const postText = getPostText();
    console.log("[CT] Texte du post extrait :", postText);
    chrome.runtime.sendMessage({ action: "askOllama", prompt: postText });
  }

  if (msg.reply) {
    console.log("[CT] Réponse reçue BG :", msg.reply);

    waitForElement(findReplyZone, 5000)
      .then(zone => {
        console.log("[CT] 1️⃣ Clic sur la zone de réponse.");
        zone.click();
        return waitForElement('textarea, div[role="textbox"]', 5000);
      })
      .then(async textarea => {
        console.log("[CT] 2️⃣ Activation du curseur et saisie.");
        textarea.click();
        textarea.focus();
        // ⏳ Petite pause avant saisie
        await new Promise(r => setTimeout(r, 400 + Math.random() * 400));
        await typeLikeHuman(textarea, msg.reply);

        console.log("[CT] 3️⃣ Recherche du bouton Répondre.");
        await new Promise(r => setTimeout(r, 600 + Math.random() * 800)); // délai supplémentaire
        const replyButton = await waitForElement(findReplyButton, 5000);
        console.log("[CT] Bouton trouvé :", replyButton?.innerText);
        replyButton.click();
        console.log("[CT] 4️⃣ Clic final sur Répondre.");
      })
      .catch(err => {
        console.error("[CT] Erreur pendant le processus :", err.message);
      });
  }
});
