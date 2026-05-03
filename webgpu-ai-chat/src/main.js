import "./style.css";
import * as webllm from "@mlc-ai/web-llm";

const MODELS = [
  {
    key: "fast",
    label: "Fast",
    id: "SmolLM2-360M-Instruct-q4f16_1-MLC",
    detail: "Smallest download and quickest first response.",
  },
  {
    key: "better",
    label: "Better",
    id: "SmolLM2-1.7B-Instruct-q4f16_1-MLC",
    detail: "Stronger responses with a larger download.",
  },
  {
    key: "best",
    label: "Best",
    id: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
    detail: "Highest quality here, but the heaviest model for the browser.",
  },
];

const DEFAULT_MODEL_ID = "SmolLM2-360M-Instruct-q4f16_1-MLC";
const SYSTEM_PROMPT =
  "You are a helpful, concise AI assistant running entirely in the browser.";

const state = {
  engine: null,
  engineReady: false,
  hasStarted: false,
  isLoading: false,
  isGenerating: false,
  compatibilityChecked: false,
  webgpuAvailable: false,
  activeModelId: null,
  messages: [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
  ],
};

document.querySelector("#app").innerHTML = `
  <main class="app-shell">
    <section class="hero-card">
      <div class="hero-copy">
        <p class="eyebrow">Browser-only AI chat</p>
        <h1>Run AI chat locally with WebGPU and WebLLM</h1>
        <p class="hero-text">
          This beta test never sends prompts to a server. The first launch
          downloads the selected model into your browser cache, and later
          launches usually reuse that cached model for a faster start.
        </p>
      </div>
      <div class="hero-actions">
        <button id="startButton" class="primary-button" type="button">
          Start AI Chat
        </button>
        <button id="clearButton" class="secondary-button" type="button">
          Clear chat
        </button>
      </div>
    </section>

    <section class="control-card">
      <div class="control-row">
        <label class="field-label" for="modelSelect">Model</label>
        <select id="modelSelect" class="select-field">
          ${MODELS.map(
            (model) => `
              <option value="${model.id}" ${
                model.id === DEFAULT_MODEL_ID ? "selected" : ""
              }>
                ${model.label}: ${model.id}
              </option>
            `,
          ).join("")}
        </select>
      </div>
      <p id="modelHelp" class="field-help"></p>

      <div class="status-grid">
        <article class="status-card">
          <p class="status-label">Compatibility</p>
          <p id="compatibilityText" class="status-text">Checking browser support...</p>
        </article>
        <article class="status-card">
          <p class="status-label">Model status</p>
          <p id="statusText" class="status-text">
            Choose a model, then start the chat when you're ready.
          </p>
          <div class="progress-wrap">
            <progress id="progressBar" max="100" value="0"></progress>
            <span id="progressValue" class="progress-value">0%</span>
          </div>
        </article>
      </div>
    </section>

    <section class="chat-card">
      <div id="chatLog" class="chat-log" aria-live="polite">
        <div class="empty-state">
          <h2>Ready when you are</h2>
          <p>
            Start the model first, then send a message. Chat history stays in
            memory until you refresh or clear it.
          </p>
        </div>
      </div>

      <form id="composerForm" class="composer">
        <label class="sr-only" for="promptInput">Message</label>
        <textarea
          id="promptInput"
          rows="3"
          placeholder="Ask something once the model is ready..."
        ></textarea>
        <div class="composer-actions">
          <p class="composer-hint">
            First load may take time because the model downloads into the browser.
          </p>
          <button id="sendButton" class="primary-button" type="submit">
            Send
          </button>
        </div>
      </form>
    </section>
  </main>
`;

const elements = {
  startButton: document.querySelector("#startButton"),
  clearButton: document.querySelector("#clearButton"),
  modelSelect: document.querySelector("#modelSelect"),
  modelHelp: document.querySelector("#modelHelp"),
  compatibilityText: document.querySelector("#compatibilityText"),
  statusText: document.querySelector("#statusText"),
  progressBar: document.querySelector("#progressBar"),
  progressValue: document.querySelector("#progressValue"),
  chatLog: document.querySelector("#chatLog"),
  composerForm: document.querySelector("#composerForm"),
  promptInput: document.querySelector("#promptInput"),
  sendButton: document.querySelector("#sendButton"),
};

function getSelectedModel() {
  return MODELS.find((model) => model.id === elements.modelSelect.value) || MODELS[0];
}

function setModelHelp() {
  const selectedModel = getSelectedModel();
  elements.modelHelp.textContent = `${selectedModel.label}: ${selectedModel.detail}`;
}

function setProgress(value, text) {
  if (typeof value === "number" && Number.isFinite(value)) {
    const normalized = Math.max(0, Math.min(100, Math.round(value)));
    elements.progressBar.value = normalized;
    elements.progressBar.removeAttribute("data-indeterminate");
    elements.progressValue.textContent = `${normalized}%`;
  } else {
    elements.progressBar.removeAttribute("value");
    elements.progressBar.dataset.indeterminate = "true";
    elements.progressValue.textContent = text || "Working...";
  }
}

function setStatus(text) {
  elements.statusText.textContent = text;
}

function updateControls() {
  const isBusy = state.isLoading || state.isGenerating;
  const selectedModelId = elements.modelSelect.value;
  const switchingModel =
    state.engineReady &&
    state.activeModelId &&
    state.activeModelId !== selectedModelId;

  elements.startButton.disabled = !state.webgpuAvailable || isBusy;
  elements.clearButton.disabled = isBusy;
  elements.modelSelect.disabled = !state.webgpuAvailable || isBusy;
  elements.promptInput.disabled = !state.engineReady || isBusy || switchingModel;
  elements.sendButton.disabled = !state.engineReady || isBusy || switchingModel;

  if (state.isLoading) {
    elements.startButton.textContent = state.hasStarted ? "Switching model..." : "Starting AI Chat...";
  } else if (state.engineReady) {
    elements.startButton.textContent = switchingModel
      ? "Switch to selected model"
      : "Reload current model";
  } else {
    elements.startButton.textContent = "Start AI Chat";
  }

  if (state.isGenerating) {
    elements.sendButton.textContent = "Generating...";
  } else {
    elements.sendButton.textContent = "Send";
  }
}

function scrollChatToBottom() {
  elements.chatLog.scrollTop = elements.chatLog.scrollHeight;
}

function createMessageNode(role, content) {
  const wrapper = document.createElement("article");
  wrapper.className = `message message-${role}`;

  const roleLabel = document.createElement("p");
  roleLabel.className = "message-role";
  roleLabel.textContent = role === "user" ? "You" : "AI";

  const body = document.createElement("div");
  body.className = "message-body";
  body.textContent = content;

  wrapper.append(roleLabel, body);
  return wrapper;
}

function renderMessages() {
  const visibleMessages = state.messages.filter((message) => message.role !== "system");
  elements.chatLog.innerHTML = "";

  if (!visibleMessages.length) {
    elements.chatLog.innerHTML = `
      <div class="empty-state">
        <h2>Ready when you are</h2>
        <p>
          Start the model first, then send a message. Chat history stays in
          memory until you refresh or clear it.
        </p>
      </div>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();
  visibleMessages.forEach((message) => {
    fragment.appendChild(createMessageNode(message.role, message.content));
  });
  elements.chatLog.appendChild(fragment);
  scrollChatToBottom();
}

function appendStreamingAssistantMessage() {
  const node = createMessageNode("assistant", "");
  elements.chatLog.appendChild(node);
  scrollChatToBottom();
  return node.querySelector(".message-body");
}

function getFriendlyErrorMessage(error) {
  const raw = error instanceof Error ? error.message : String(error);
  if (!raw) {
    return "Something went wrong while talking to the model.";
  }
  return raw.replace(/\s+/g, " ").trim();
}

async function checkWebGPU() {
  state.compatibilityChecked = true;

  if (!("gpu" in navigator)) {
    state.webgpuAvailable = false;
    elements.compatibilityText.textContent =
      "WebGPU was not found. Try a recent Chromium-based browser such as Chrome or Edge, and make sure hardware acceleration is enabled.";
    setStatus("This browser cannot run the local AI model because WebGPU is unavailable.");
    setProgress(0, "Unavailable");
    updateControls();
    return;
  }

  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      state.webgpuAvailable = false;
      elements.compatibilityText.textContent =
        "WebGPU exists, but no compatible GPU adapter was available in this browser session.";
      setStatus("A compatible GPU adapter could not be started.");
      setProgress(0, "Unavailable");
      updateControls();
      return;
    }

    state.webgpuAvailable = true;
    elements.compatibilityText.textContent =
      "WebGPU is available. You can start the chat when you're ready. If a model fails to load, try updating your browser or graphics drivers.";
    setStatus("Choose a model, then click Start AI Chat.");
    updateControls();
  } catch (error) {
    state.webgpuAvailable = false;
    elements.compatibilityText.textContent = `WebGPU check failed: ${getFriendlyErrorMessage(error)}`;
    setStatus("WebGPU could not be initialized in this browser session.");
    setProgress(0, "Unavailable");
    updateControls();
  }
}

async function loadModel(modelId) {
  const selectedModel = MODELS.find((model) => model.id === modelId) || MODELS[0];

  if (!state.webgpuAvailable || state.isLoading || state.isGenerating) {
    return;
  }

  state.isLoading = true;
  state.engineReady = false;
  updateControls();
  setStatus(
    `Loading ${selectedModel.label}. First load downloads the model into browser storage; later loads usually reuse the browser cache.`,
  );
  setProgress(0, "Starting...");

  const initProgressCallback = (report) => {
    const percent =
      typeof report?.progress === "number"
        ? report.progress <= 1
          ? report.progress * 100
          : report.progress
        : undefined;
    const label = report?.text || "Loading model files...";
    setProgress(percent, label);
    setStatus(label);
  };

  try {
    if (state.engine && typeof state.engine.unload === "function") {
      await state.engine.unload();
    }

    state.engine = await webllm.CreateMLCEngine(modelId, {
      initProgressCallback,
    });

    state.activeModelId = modelId;
    state.hasStarted = true;
    state.engineReady = true;
    setProgress(100, "Ready");
    setStatus(
      `${selectedModel.label} is ready. Cached model files can make future loads much faster on this browser.`,
    );
    elements.promptInput.focus();
  } catch (error) {
    state.engineReady = false;
    state.engine = null;
    state.activeModelId = null;
    setProgress(0, "Failed");
    const message = getFriendlyErrorMessage(error);
    if (/device was lost|insufficient memory|out of memory|device lost/i.test(message)) {
      setStatus(
        `Model load failed: ${message} This device may not have enough available GPU memory for ${selectedModel.label}. Try the Fast model.`,
      );
    } else {
      setStatus(`Model load failed: ${message}`);
    }
  } finally {
    state.isLoading = false;
    updateControls();
  }
}

async function sendMessage(userText) {
  const trimmed = userText.trim();
  if (!trimmed || !state.engineReady || state.isLoading || state.isGenerating) {
    return;
  }

  state.isGenerating = true;
  updateControls();

  state.messages.push({
    role: "user",
    content: trimmed,
  });
  renderMessages();

  elements.promptInput.value = "";
  const assistantBody = appendStreamingAssistantMessage();
  let assistantText = "";

  setStatus("Generating response...");

  try {
    const stream = await state.engine.chat.completions.create({
      messages: state.messages,
      model: state.activeModelId || undefined,
      temperature: 0.7,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content || "";
      if (!delta) {
        continue;
      }
      assistantText += delta;
      assistantBody.textContent = assistantText;
      scrollChatToBottom();
    }

    if (!assistantText && typeof state.engine.getMessage === "function") {
      assistantText = await state.engine.getMessage();
      assistantBody.textContent = assistantText;
    }

    state.messages.push({
      role: "assistant",
      content: assistantText || "No response was generated.",
    });
    setStatus("Response complete.");
  } catch (error) {
    const message = getFriendlyErrorMessage(error);
    if (/Model not loaded|device was lost|insufficient memory|out of memory|device lost/i.test(message)) {
      state.engineReady = false;
      state.engine = null;
      state.activeModelId = null;
      assistantBody.textContent =
        "Sorry, that model could not stay loaded on this device. Try clicking Start AI Chat again with the Fast model selected.";
      setStatus(
        `Generation failed: ${message} The selected model likely exceeded available GPU memory. Try the Fast model or reload this model again.`,
      );
    } else {
      assistantBody.textContent = `Sorry, the response failed: ${message}`;
      setStatus(`Generation failed: ${message}`);
    }
  } finally {
    state.isGenerating = false;
    updateControls();
    scrollChatToBottom();
  }
}

function clearChat() {
  if (state.isLoading || state.isGenerating) {
    return;
  }
  state.messages = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
  ];
  renderMessages();
  setStatus(
    state.engineReady
      ? "Chat cleared. The current model is still ready."
      : "Chat cleared. Start the model when you're ready.",
  );
}

elements.startButton.addEventListener("click", async () => {
  await loadModel(elements.modelSelect.value);
});

elements.modelSelect.addEventListener("change", () => {
  setModelHelp();
  if (!state.engineReady) {
    setStatus("Choose a model, then click Start AI Chat.");
  } else if (state.activeModelId === elements.modelSelect.value) {
    setStatus("This model is already loaded and ready.");
  } else {
    const currentModel = MODELS.find((model) => model.id === state.activeModelId);
    const nextModel = getSelectedModel();
    setStatus(
      `${nextModel.label} is selected. Click Start AI Chat to switch from ${currentModel?.label || "the current model"}.`,
    );
  }
  updateControls();
});

elements.clearButton.addEventListener("click", () => {
  clearChat();
});

elements.composerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await sendMessage(elements.promptInput.value);
});

elements.promptInput.addEventListener("keydown", async (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    await sendMessage(elements.promptInput.value);
  }
});

async function initializeApp() {
  setModelHelp();
  updateControls();
  renderMessages();
  await checkWebGPU();
}

initializeApp();
