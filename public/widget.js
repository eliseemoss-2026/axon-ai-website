/**
 * Axon AI Chat Widget — embeddable chat agent.
 *
 * Install on any website with one line:
 *   <script src="https://YOUR-SERVER/widget.js" data-client="CLIENT_ID"
 *           data-name="Assistant name" data-color="#6c5ce7" defer></script>
 *
 * Optional attributes:
 *   data-server  — API base URL (defaults to the script's own origin)
 *   data-greeting — first message shown when the chat opens
 */
(function () {
  "use strict";

  var script = document.currentScript;
  if (!script) return;

  var CLIENT_ID = script.getAttribute("data-client");
  if (!CLIENT_ID) return;

  var SERVER = script.getAttribute("data-server") || new URL(script.src).origin;
  var BOT_NAME = script.getAttribute("data-name") || "Assistant";
  var COLOR = script.getAttribute("data-color") || "#6c5ce7";
  var DEFAULT_GREETING =
    script.getAttribute("data-greeting") ||
    "Hi! How can I help you today?";
  var STORAGE_KEY = "axon-chat-" + CLIENT_ID;
  var MAX_HISTORY = 28; // server caps at 30; leave room for the new message

  // ── language ──
  // The widget mirrors the site-wide EN/FR toggle (see i18n.js). When FR is
  // active we use French UI strings and ask the backend to reply in French.
  function lang() {
    return (window.AxonI18n && window.AxonI18n.getLang()) || "en";
  }
  // Localised UI string, falling back to the widget's English defaults (and
  // the data-greeting attribute for the opening message) when i18n isn't loaded.
  function tr(key, fallback) {
    if (window.AxonI18n) {
      var v = window.AxonI18n.t(key);
      if (v && v !== key) return v;
    }
    return fallback;
  }
  function greeting() {
    return lang() === "fr" ? tr("widget_greeting", DEFAULT_GREETING) : DEFAULT_GREETING;
  }

  var history = loadHistory();
  var open = false;
  var busy = false;

  injectStyles();
  var ui = buildUi();
  document.body.appendChild(ui.root);
  renderHistory();

  /* ---------- persistence ---------- */

  function loadHistory() {
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveHistory() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-MAX_HISTORY)));
    } catch (e) {
      /* storage unavailable — chat still works in-memory */
    }
  }

  /* ---------- UI ---------- */

  function injectStyles() {
    var css =
      ".axon-w *{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}" +
      ".axon-bubble{position:fixed;bottom:20px;right:20px;width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.25);z-index:99999;display:flex;align-items:center;justify-content:center;transition:transform .15s}" +
      ".axon-bubble:hover{transform:scale(1.07)}" +
      ".axon-bubble svg{width:26px;height:26px;fill:#fff}" +
      ".axon-panel{position:fixed;bottom:90px;right:20px;width:min(360px,calc(100vw - 32px));height:min(520px,calc(100vh - 120px));background:#fff;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,.28);z-index:99999;display:none;flex-direction:column;overflow:hidden}" +
      ".axon-panel.axon-open{display:flex}" +
      ".axon-head{padding:14px 16px;color:#fff;font-weight:600;font-size:15px;display:flex;align-items:center;gap:8px}" +
      ".axon-head .axon-dot{width:8px;height:8px;border-radius:50%;background:#2ecc71;flex:none}" +
      ".axon-close{margin-left:auto;background:none;border:none;color:#fff;font-size:22px;line-height:1;cursor:pointer;padding:0 2px;opacity:.85}" +
      ".axon-close:hover{opacity:1}" +
      ".axon-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px;background:#f7f7fb}" +
      ".axon-msg{max-width:85%;padding:9px 12px;border-radius:14px;font-size:14px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word}" +
      ".axon-msg.axon-user{align-self:flex-end;color:#fff;border-bottom-right-radius:4px}" +
      ".axon-msg.axon-bot{align-self:flex-start;background:#fff;color:#222;border:1px solid #e8e8ef;border-bottom-left-radius:4px}" +
      ".axon-typing{align-self:flex-start;padding:11px 14px;background:#fff;border:1px solid #e8e8ef;border-radius:14px;display:flex;gap:4px}" +
      ".axon-typing i{width:6px;height:6px;border-radius:50%;background:#bbb;animation:axonB 1s infinite}" +
      ".axon-typing i:nth-child(2){animation-delay:.15s}.axon-typing i:nth-child(3){animation-delay:.3s}" +
      "@keyframes axonB{0%,60%,100%{opacity:.3}30%{opacity:1}}" +
      ".axon-form{display:flex;border-top:1px solid #e8e8ef;background:#fff}" +
      // 16px input prevents iOS Safari from auto-zooming the page on focus.
      ".axon-input{flex:1;border:none;outline:none;padding:13px 14px;font-size:16px}" +
      ".axon-send{border:none;background:none;cursor:pointer;padding:0 14px;font-weight:600;font-size:14px}" +
      ".axon-powered{text-align:center;font-size:10px;color:#aab;padding:4px 0 6px;background:#fff}" +
      ".axon-powered a{color:inherit}" +
      // Phones: full-screen panel. dvh tracks the visible viewport when the
      // on-screen keyboard opens (100vh does not on iOS), and the form gets
      // safe-area padding so the home indicator never covers the input.
      "@media (max-width:480px){" +
      ".axon-panel{top:0;left:0;right:0;bottom:0;width:100%;height:100%;height:100dvh;border-radius:0}" +
      ".axon-panel.axon-open~.axon-bubble{display:none}" +
      ".axon-form{padding-bottom:env(safe-area-inset-bottom)}" +
      "}";
    var style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
  }

  function buildUi() {
    var root = document.createElement("div");
    root.className = "axon-w";

    var bubble = document.createElement("button");
    bubble.className = "axon-bubble";
    bubble.style.background = COLOR;
    bubble.setAttribute("aria-label", tr("widget_open_aria", "Open chat with ") + BOT_NAME);
    bubble.innerHTML =
      '<svg viewBox="0 0 24 24"><path d="M12 3C6.5 3 2 6.9 2 11.7c0 2.7 1.4 5.1 3.6 6.7-.1 1.1-.6 2.4-1.5 3.6 1.9-.2 3.5-.9 4.7-1.7 1 .3 2.1.4 3.2.4 5.5 0 10-3.9 10-8.7S17.5 3 12 3z"/></svg>';

    var panel = document.createElement("div");
    panel.className = "axon-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", BOT_NAME + " chat");

    var head = document.createElement("div");
    head.className = "axon-head";
    head.style.background = COLOR;
    head.innerHTML = '<span class="axon-dot"></span>';
    head.appendChild(document.createTextNode(BOT_NAME));

    var close = document.createElement("button");
    close.className = "axon-close";
    close.type = "button";
    close.setAttribute("aria-label", tr("widget_close_aria", "Close chat"));
    close.innerHTML = "&times;";
    head.appendChild(close);

    var msgs = document.createElement("div");
    msgs.className = "axon-msgs";

    var form = document.createElement("form");
    form.className = "axon-form";
    var input = document.createElement("input");
    input.className = "axon-input";
    input.type = "text";
    input.maxLength = 2000;
    input.placeholder = tr("widget_placeholder", "Type a message…");
    input.setAttribute("aria-label", "Message");
    var send = document.createElement("button");
    send.className = "axon-send";
    send.type = "submit";
    send.style.color = COLOR;
    send.textContent = tr("widget_send", "Send");
    form.appendChild(input);
    form.appendChild(send);

    var powered = document.createElement("div");
    powered.className = "axon-powered";
    powered.innerHTML = 'Powered by <a href="https://axonaitech.uk" target="_blank" rel="noopener">Axon AI</a>';

    panel.appendChild(head);
    panel.appendChild(msgs);
    panel.appendChild(form);
    panel.appendChild(powered);
    root.appendChild(panel);
    root.appendChild(bubble);

    bubble.addEventListener("click", function () {
      open = !open;
      panel.classList.toggle("axon-open", open);
      if (open) {
        if (history.length === 0) addBotMessage(greeting(), false);
        input.focus();
      }
    });

    close.addEventListener("click", function () {
      open = false;
      panel.classList.remove("axon-open");
    });

    function handleSend(e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text || busy) return;
      input.value = "";
      sendMessage(text);
    }

    form.addEventListener("submit", handleSend); // Enter key
    send.addEventListener("click", handleSend); // button click

    return { root: root, msgs: msgs, input: input, send: send, bubble: bubble, close: close };
  }

  // Re-localise the static UI when the visitor flips the site language. We
  // don't touch already-sent messages — only the chrome and the opening
  // greeting (the latter only while the conversation is still empty).
  function relocalize() {
    ui.input.placeholder = tr("widget_placeholder", "Type a message…");
    ui.send.textContent = tr("widget_send", "Send");
    ui.bubble.setAttribute("aria-label", tr("widget_open_aria", "Open chat with ") + BOT_NAME);
    ui.close.setAttribute("aria-label", tr("widget_close_aria", "Close chat"));
    if (history.length === 1 && history[0].role === "assistant") {
      history[0].content = greeting();
      var first = ui.msgs.querySelector(".axon-msg.axon-bot");
      if (first) first.textContent = greeting();
    }
  }

  window.addEventListener("axon:langchange", relocalize);

  function appendMessage(role, text) {
    var el = document.createElement("div");
    el.className = "axon-msg " + (role === "user" ? "axon-user" : "axon-bot");
    if (role === "user") el.style.background = COLOR;
    el.textContent = text;
    ui.msgs.appendChild(el);
    ui.msgs.scrollTop = ui.msgs.scrollHeight;
  }

  function addBotMessage(text, save) {
    history.push({ role: "assistant", content: text });
    if (save !== false) saveHistory();
    appendMessage("assistant", text);
  }

  function renderHistory() {
    history.forEach(function (m) {
      appendMessage(m.role, m.content);
    });
  }

  function showTyping() {
    var el = document.createElement("div");
    el.className = "axon-typing";
    el.innerHTML = "<i></i><i></i><i></i>";
    ui.msgs.appendChild(el);
    ui.msgs.scrollTop = ui.msgs.scrollHeight;
    return el;
  }

  /* ---------- API ---------- */

  function sendMessage(text) {
    busy = true;
    history.push({ role: "user", content: text });
    saveHistory();
    appendMessage("user", text);
    var typing = showTyping();

    fetch(SERVER + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // `lang` tells the Worker which language to answer in (en | fr).
      body: JSON.stringify({ clientId: CLIENT_ID, lang: lang(), messages: history.slice(-MAX_HISTORY) }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        typing.remove();
        busy = false;
        if (data.success) {
          addBotMessage(data.reply);
        } else {
          addBotMessage(data.error || tr("widget_error", "Sorry, something went wrong. Please try again."), false);
        }
      })
      .catch(function () {
        typing.remove();
        busy = false;
        addBotMessage(tr("widget_offline", "Sorry, I couldn't connect. Please try again in a moment."), false);
      });
  }
})();
