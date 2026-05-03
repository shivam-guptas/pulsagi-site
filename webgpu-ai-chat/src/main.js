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
    <section class="app-stage">
      <header class="session-header">
        <div class="header-copy">
          <p class="eyebrow">Developer mode</p>
          <h1>Developer mode</h1>
          <p class="hero-text">
            Memory is not used for this chat. First load downloads the selected
            model into your browser cache, and later loads usually reuse that cache.
          </p>
        </div>

        <div class="session-toolbar">
          <button id="startButton" class="toolbar-button toolbar-button-primary" type="button">
            Start AI Chat
          </button>
          <button id="clearButton" class="toolbar-button" type="button">
            Clear chat
          </button>
        </div>
      </header>

      <section class="session-panel">
        <div class="session-meta">
          <div class="meta-block">
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
            <p id="modelHelp" class="field-help"></p>
          </div>

          <div class="status-row">
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
        </div>
      </section>

      <section id="chatView" class="chat-view">
        <div id="chatLog" class="chat-log" aria-live="polite">
          <div class="empty-hero">
            <p class="eyebrow">Pulsagi local AI</p>
            <h2>Ask anything</h2>
            <p class="empty-subtext">
              Run a local WebGPU chat model in the browser with no backend.
            </p>
          </div>

          <div class="empty-state">
            <div class="tip-row">
              <span class="tip-chip">Create an image</span>
              <span class="tip-chip">Write or edit</span>
              <span class="tip-chip">Look something up</span>
            </div>
            <p>
              Start the model first, then send a message. Chat history stays in
              memory until you refresh or clear it.
            </p>
          </div>
        </div>

        <div class="composer-shell">
          <form id="composerForm" class="composer">
            <label class="sr-only" for="promptInput">Message</label>
            <div class="composer-bar">
              <div class="composer-leading" aria-hidden="true">+</div>
              <textarea
                id="promptInput"
                rows="1"
                placeholder="Ask anything"
              ></textarea>
              <div class="composer-trailing">
                <span class="composer-mode">Instant</span>
                <button id="sendButton" class="send-button" type="submit" aria-label="Send message">
                  <span class="send-button-icon">◉</span>
                </button>
              </div>
            </div>
            <div class="composer-footer">
              <p class="composer-hint">
                First load may take time because the model downloads into the browser.
              </p>
            </div>
          </form>
        </div>
      </section>
    </section>
  </main>
`;

const elements = {
  appShell: document.querySelector(".app-shell"),
  chatView: document.querySelector("#chatView"),
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

function autoResizeComposer() {
  elements.promptInput.style.height = "0px";
  const nextHeight = Math.min(elements.promptInput.scrollHeight, 180);
  elements.promptInput.style.height = `${Math.max(30, nextHeight)}px`;
}

function updateLayoutState() {
  const visibleMessages = state.messages.filter((message) => message.role !== "system");
  const hasMessages = visibleMessages.length > 0;
  elements.appShell.dataset.chatState = hasMessages ? "active" : "idle";
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
    elements.sendButton.innerHTML = '<span class="send-button-icon">...</span>';
  } else {
    elements.sendButton.innerHTML = '<span class="send-button-icon">◉</span>';
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
      <div class="empty-hero">
        <p class="eyebrow">Pulsagi local AI</p>
        <h2>Ask anything</h2>
        <p class="empty-subtext">
          Run a local WebGPU chat model in the browser with no backend.
        </p>
      </div>

      <div class="empty-state">
        <div class="tip-row">
          <span class="tip-chip">Create an image</span>
          <span class="tip-chip">Write or edit</span>
          <span class="tip-chip">Look something up</span>
        </div>
        <p>
          Start the model first, then send a message. Chat history stays in
          memory until you refresh or clear it.
        </p>
      </div>
    `;
    updateLayoutState();
    return;
  }

  const fragment = document.createDocumentFragment();
  visibleMessages.forEach((message) => {
    fragment.appendChild(createMessageNode(message.role, message.content));
  });
  elements.chatLog.appendChild(fragment);
  updateLayoutState();
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

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function isGpuDeviceRemovedError(message) {
  return /DXGI_ERROR_DEVICE_REMOVED|requestDevice.*D3D12|create command queue failed|DeviceLostError/i.test(
    message,
  );
}

function isGpuRuntimeMappingError(message) {
  return /mapAsync|Buffer was unmapped before mapping was resolved|GPUBuffer/i.test(
    message,
  );
}

function isGpuMemoryOrDeviceError(message) {
  return /Model not loaded|device was lost|insufficient memory|out of memory|device lost|DXGI_ERROR_DEVICE_REMOVED|requestDevice.*D3D12|create command queue failed|mapAsync|Buffer was unmapped before mapping was resolved|GPUBuffer/i.test(
    message,
  );
}

function getRecoveryStatus(message, selectedModelLabel) {
  if (isGpuDeviceRemovedError(message)) {
    return `Model load failed: ${message} The browser's WebGPU device was removed by the graphics stack while starting ${selectedModelLabel}. Refresh this tab, close other GPU-heavy tabs or apps, and try the Fast model first.`;
  }

  if (/device was lost|insufficient memory|out of memory|device lost/i.test(message)) {
    return `Model load failed: ${message} This device may not have enough available GPU memory for ${selectedModelLabel}. Try the Fast model.`;
  }

  if (isGpuRuntimeMappingError(message)) {
    return `Model load failed: ${message} The browser hit a WebGPU runtime error while using ${selectedModelLabel}. Refresh this tab and retry with the Fast model first.`;
  }

  return `Model load failed: ${message}`;
}

async function resetEngineAfterGpuFailure() {
  const currentEngine = state.engine;
  state.engineReady = false;
  state.engine = null;
  state.activeModelId = null;

  if (currentEngine && typeof currentEngine.unload === "function") {
    try {
      await currentEngine.unload();
    } catch {
      // Ignore cleanup failures after GPU/runtime loss; the main goal is to reset app state.
    }
  }
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
      // Give the browser a short moment to release GPU resources before requesting a new device.
      await wait(200);
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
    await resetEngineAfterGpuFailure();
    setProgress(0, "Failed");
    const message = getFriendlyErrorMessage(error);
    setStatus(getRecoveryStatus(message, selectedModel.label));
    if (isGpuDeviceRemovedError(message)) {
      elements.compatibilityText.textContent =
        "WebGPU is present, but the GPU device was removed while starting the selected model. Refresh the tab, close other GPU-intensive apps or browser tabs, and retry with the Fast model first.";
    } else if (isGpuRuntimeMappingError(message)) {
      elements.compatibilityText.textContent =
        "WebGPU is available, but the browser hit a GPU runtime mapping error while running the selected model. Refresh this tab and retry with the Fast model first.";
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
  autoResizeComposer();
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
    if (isGpuMemoryOrDeviceError(message)) {
      await resetEngineAfterGpuFailure();
      if (isGpuDeviceRemovedError(message)) {
        assistantBody.textContent =
          "Sorry, the browser lost its WebGPU device while running that model. Refresh the tab, then retry with the Fast model first.";
        setStatus(
          `Generation failed: ${message} The browser lost its WebGPU device. Refresh this tab, then retry with the Fast model or reduce GPU load from other apps.`,
        );
        elements.compatibilityText.textContent =
          "WebGPU is present, but the GPU device was removed during generation. Refresh this tab, close other GPU-intensive apps or browser tabs, and retry with the Fast model first.";
      } else if (isGpuRuntimeMappingError(message)) {
        assistantBody.textContent =
          "Sorry, the browser hit a WebGPU runtime error while generating that reply. Refresh the tab, then retry with the Fast model first.";
        setStatus(
          `Generation failed: ${message} The browser hit a WebGPU runtime mapping error. Refresh this tab, then retry with the Fast model or reduce GPU load from other apps.`,
        );
        elements.compatibilityText.textContent =
          "WebGPU is available, but the browser hit a GPU runtime mapping error during generation. Refresh this tab and retry with the Fast model first.";
      } else {
        assistantBody.textContent =
          "Sorry, that model could not stay loaded on this device. Try clicking Start AI Chat again with the Fast model selected.";
        setStatus(
          `Generation failed: ${message} The selected model likely exceeded available GPU memory. Try the Fast model or reload this model again.`,
        );
      }
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

elements.promptInput.addEventListener("input", () => {
  autoResizeComposer();
});

async function initializeApp() {
  setModelHelp();
  updateControls();
  renderMessages();
  autoResizeComposer();
  await checkWebGPU();
}

initializeApp();
