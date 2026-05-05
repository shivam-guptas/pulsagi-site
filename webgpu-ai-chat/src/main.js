import "./style.css";
import * as webllm from "@mlc-ai/web-llm";

const MODELS = [
  {
    key: "qwen35",
    label: "Qwen 3.5 (0.8B)",
    id: "Qwen3.5-0.8B-q4f16_1-MLC",
    detail: "Default balanced model with stronger responses than the smallest options.",
  },
  {
    key: "qwen25",
    label: "Qwen 2.5 (0.5B)",
    id: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
    detail: "Lightweight Qwen model with quick startup and lower memory use.",
  },
  {
    key: "smollm360",
    label: "SmolLM2 (360M)",
    id: "SmolLM2-360M-Instruct-q4f16_1-MLC",
    detail: "Smallest download here and the safest fallback for lower-memory devices.",
  },
];

const DEFAULT_MODEL_ID = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";
const RECOVERY_MODEL_ID = "SmolLM2-360M-Instruct-q4f16_1-MLC";
const SYSTEM_PROMPT =
  "You are a helpful, concise AI assistant running entirely in the browser.";

const state = {
  engine: null,
  engineReady: false,
  hasStarted: false,
  isLoading: false,
  isGenerating: false,
  drawerOpen: false,
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
          <p class="hero-text">
            First load downloads the selected model into your browser cache, and
            later loads usually reuse that cache.
          </p>
        </div>

        <div class="session-toolbar">
          <button
            id="drawerToggle"
            class="toolbar-button"
            type="button"
            aria-expanded="false"
            aria-controls="sessionPanel"
          >
            <span>Model & status</span>
            <span class="drawer-chevron" aria-hidden="true">▾</span>
          </button>
        </div>
      </header>

      <section
        id="sessionPanel"
        class="session-panel"
        hidden
        aria-hidden="true"
      >
        <div
          class="session-meta"
          role="dialog"
          aria-modal="true"
          aria-label="Model and status"
        >
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
                The default model will load automatically when this page opens.
              </p>
              <div class="progress-wrap">
                <progress id="progressBar" max="100" value="0"></progress>
                <span id="progressValue" class="progress-value">0%</span>
              </div>
            </article>
          </div>

          <div class="panel-actions">
            <button id="startButton" class="toolbar-button toolbar-button-primary" type="button">
              Start AI Chat
            </button>
            <button id="clearButton" class="toolbar-button" type="button">
              Clear chat
            </button>
          </div>
        </div>
      </section>

      <section id="chatView" class="chat-view">
        <div id="chatLog" class="chat-log" aria-live="polite">
          <div class="empty-hero">
            <h2>Ask anything</h2>
            <p class="empty-subtext">
              Run a local WebGPU chat model in the browser with no backend.
            </p>
          </div>

          <div class="empty-state">
            <p>
              The default model loads automatically. Chat history stays in memory
              until you refresh or clear it.
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
                  <span class="send-button-icon">↑</span>
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
  drawerToggle: document.querySelector("#drawerToggle"),
  startButton: document.querySelector("#startButton"),
  clearButton: document.querySelector("#clearButton"),
  sessionPanel: document.querySelector("#sessionPanel"),
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

function getRecoveryModel() {
  return MODELS.find((model) => model.id === RECOVERY_MODEL_ID) || MODELS[0];
}

function getVisibleMessages() {
  return state.messages
    .map((message, actualIndex) => ({ ...message, actualIndex }))
    .filter((message) => message.role !== "system");
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

function toggleDrawer(forceValue) {
  state.drawerOpen = typeof forceValue === "boolean" ? forceValue : !state.drawerOpen;
  elements.sessionPanel.hidden = !state.drawerOpen;
  elements.drawerToggle.setAttribute("aria-expanded", String(state.drawerOpen));
  elements.sessionPanel.setAttribute("aria-hidden", String(!state.drawerOpen));
}

function autoResizeComposer() {
  elements.promptInput.style.height = "0px";
  const nextHeight = Math.min(elements.promptInput.scrollHeight, 180);
  elements.promptInput.style.height = `${Math.max(30, nextHeight)}px`;
}

function updateLayoutState() {
  const hasMessages = getVisibleMessages().length > 0;
  elements.appShell.dataset.chatState = hasMessages ? "active" : "idle";
}

function updateControls() {
  const isBusy = state.isLoading || state.isGenerating;
  const selectedModelId = elements.modelSelect.value;
  const switchingModel =
    state.engineReady &&
    state.activeModelId &&
    state.activeModelId !== selectedModelId;

  elements.drawerToggle.disabled = isBusy;
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

  elements.sendButton.innerHTML = state.isGenerating
    ? '<span class="send-button-icon">...</span>'
    : '<span class="send-button-icon">↑</span>';
}

function scrollChatToBottom() {
  elements.chatLog.scrollTop = elements.chatLog.scrollHeight;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function formatInlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function renderRichMessage(body, content) {
  const normalized = content.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    body.textContent = "";
    return;
  }

  const blocks = normalized.split(/\n{2,}/);
  const fragment = document.createDocumentFragment();

  blocks.forEach((block) => {
    const lines = block.split("\n").map((line) => line.trimEnd());
    const compactLines = lines.map((line) => line.trim()).filter(Boolean);
    const isBulletList =
      compactLines.length > 0 && compactLines.every((line) => /^[-*]\s+/.test(line));
    const isNumberList =
      compactLines.length > 0 && compactLines.every((line) => /^\d+\.\s+/.test(line));

    if (isBulletList || isNumberList) {
      const list = document.createElement(isNumberList ? "ol" : "ul");
      list.className = "message-list";
      compactLines.forEach((line) => {
        const item = document.createElement("li");
        item.innerHTML = formatInlineMarkdown(
          line.replace(isNumberList ? /^\d+\.\s+/ : /^[-*]\s+/, ""),
        );
        list.appendChild(item);
      });
      fragment.appendChild(list);
      return;
    }

    if (compactLines.length === 1 && /^#{1,3}\s+/.test(compactLines[0])) {
      const level = Math.min(3, compactLines[0].match(/^#+/)[0].length);
      const heading = document.createElement(`h${level + 1}`);
      heading.className = `message-heading message-heading-${level}`;
      heading.innerHTML = formatInlineMarkdown(compactLines[0].replace(/^#{1,3}\s+/, ""));
      fragment.appendChild(heading);
      return;
    }

    const paragraph = document.createElement("p");
    paragraph.className = "message-paragraph";
    paragraph.innerHTML = lines.map((line) => formatInlineMarkdown(line)).join("<br />");
    fragment.appendChild(paragraph);
  });

  body.replaceChildren(fragment);
}

function createAssistantActions(actualIndex) {
  const actions = document.createElement("div");
  actions.className = "message-actions";

  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.className = "message-action-button";
  copyButton.dataset.action = "copy";
  copyButton.dataset.messageIndex = String(actualIndex);
  copyButton.setAttribute("aria-label", "Copy assistant message");
  copyButton.textContent = "⧉";

  const retryButton = document.createElement("button");
  retryButton.type = "button";
  retryButton.className = "message-action-button";
  retryButton.dataset.action = "retry";
  retryButton.dataset.messageIndex = String(actualIndex);
  retryButton.setAttribute("aria-label", "Retry assistant response");
  retryButton.textContent = "↻";

  const isLastAssistant =
    actualIndex === state.messages.length - 1 && state.messages[actualIndex]?.role === "assistant";
  retryButton.disabled = !isLastAssistant || state.isGenerating || state.isLoading;

  actions.append(copyButton, retryButton);
  return actions;
}

function createMessageNode(role, content, actualIndex) {
  const wrapper = document.createElement("article");
  wrapper.className = `message message-${role}`;

  const roleLabel = document.createElement("p");
  roleLabel.className = "message-role";
  roleLabel.textContent = role === "user" ? "You" : "Pulsagi";

  const body = document.createElement("div");
  body.className = "message-body";
  if (role === "assistant") {
    renderRichMessage(body, content);
  } else {
    body.textContent = content;
  }

  wrapper.append(roleLabel, body);

  if (role === "assistant" && Number.isInteger(actualIndex)) {
    wrapper.appendChild(createAssistantActions(actualIndex));
  }

  return wrapper;
}

function renderMessages() {
  const visibleMessages = getVisibleMessages();
  elements.chatLog.innerHTML = "";

  if (!visibleMessages.length) {
    elements.chatLog.innerHTML = `
      <div class="empty-hero">
        <h2>Ask anything</h2>
        <p class="empty-subtext">
          Run a local WebGPU chat model in the browser with no backend.
        </p>
      </div>

      <div class="empty-state">
        <p>
          The default model loads automatically. Chat history stays in memory
          until you refresh or clear it.
        </p>
      </div>
    `;
    updateLayoutState();
    return;
  }

  const fragment = document.createDocumentFragment();
  visibleMessages.forEach((message) => {
    fragment.appendChild(
      createMessageNode(message.role, message.content, message.actualIndex),
    );
  });
  elements.chatLog.appendChild(fragment);
  updateLayoutState();
  scrollChatToBottom();
}

function appendStreamingAssistantMessage() {
  const node = createMessageNode("assistant", "");
  elements.chatLog.appendChild(node);
  scrollChatToBottom();
  return {
    wrapper: node,
    body: node.querySelector(".message-body"),
  };
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
  return /mapAsync|Buffer was unmapped before mapping was resolved|GPUBuffer/i.test(message);
}

function isGpuMemoryOrDeviceError(message) {
  return /Model not loaded|device was lost|insufficient memory|out of memory|device lost|DXGI_ERROR_DEVICE_REMOVED|requestDevice.*D3D12|create command queue failed|mapAsync|Buffer was unmapped before mapping was resolved|GPUBuffer/i.test(
    message,
  );
}

function getRecoveryStatus(message, selectedModelLabel) {
  const recoveryModelLabel = getRecoveryModel().label;

  if (isGpuDeviceRemovedError(message)) {
    return `Model load failed: ${message} The browser's WebGPU device was removed by the graphics stack while starting ${selectedModelLabel}. Refresh this tab, close other GPU-heavy tabs or apps, and try ${recoveryModelLabel} first.`;
  }

  if (/device was lost|insufficient memory|out of memory|device lost/i.test(message)) {
    return `Model load failed: ${message} This device may not have enough available GPU memory for ${selectedModelLabel}. Try ${recoveryModelLabel}.`;
  }

  if (isGpuRuntimeMappingError(message)) {
    return `Model load failed: ${message} The browser hit a WebGPU runtime error while using ${selectedModelLabel}. Refresh this tab and retry with ${recoveryModelLabel} first.`;
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
    setStatus("Loading the default model automatically...");
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
      await wait(200);
    }

    state.engine = await webllm.CreateMLCEngine(modelId, {
      initProgressCallback,
    });

    state.activeModelId = modelId;
    state.hasStarted = true;
    state.engineReady = true;
    toggleDrawer(false);
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
    const recoveryModelLabel = getRecoveryModel().label;
    if (isGpuDeviceRemovedError(message)) {
      elements.compatibilityText.textContent =
        `WebGPU is present, but the GPU device was removed while starting the selected model. Refresh this tab, close other GPU-intensive apps or browser tabs, and retry with ${recoveryModelLabel} first.`;
    } else if (isGpuRuntimeMappingError(message)) {
      elements.compatibilityText.textContent =
        `WebGPU is available, but the browser hit a GPU runtime mapping error while running the selected model. Refresh this tab and retry with ${recoveryModelLabel} first.`;
    }
  } finally {
    state.isLoading = false;
    updateControls();
  }
}

async function generateAssistantResponse() {
  const assistantNode = appendStreamingAssistantMessage();
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
      renderRichMessage(assistantNode.body, assistantText);
      scrollChatToBottom();
    }

    if (!assistantText && typeof state.engine.getMessage === "function") {
      assistantText = await state.engine.getMessage();
      renderRichMessage(assistantNode.body, assistantText);
    }

    state.messages.push({
      role: "assistant",
      content: assistantText || "No response was generated.",
    });
    renderMessages();
    setStatus("Response complete.");
  } catch (error) {
    const message = getFriendlyErrorMessage(error);
    const recoveryModelLabel = getRecoveryModel().label;
    if (isGpuMemoryOrDeviceError(message)) {
      await resetEngineAfterGpuFailure();
      if (isGpuDeviceRemovedError(message)) {
        renderRichMessage(
          assistantNode.body,
          `Sorry, the browser lost its WebGPU device while running that model. Refresh the tab, then retry with ${recoveryModelLabel} first.`,
        );
        setStatus(
          `Generation failed: ${message} The browser lost its WebGPU device. Refresh this tab, then retry with ${recoveryModelLabel} or reduce GPU load from other apps.`,
        );
        elements.compatibilityText.textContent =
          `WebGPU is present, but the GPU device was removed during generation. Refresh this tab, close other GPU-intensive apps or browser tabs, and retry with ${recoveryModelLabel} first.`;
      } else if (isGpuRuntimeMappingError(message)) {
        renderRichMessage(
          assistantNode.body,
          `Sorry, the browser hit a WebGPU runtime error while generating that reply. Refresh the tab, then retry with ${recoveryModelLabel} first.`,
        );
        setStatus(
          `Generation failed: ${message} The browser hit a WebGPU runtime mapping error. Refresh this tab, then retry with ${recoveryModelLabel} or reduce GPU load from other apps.`,
        );
        elements.compatibilityText.textContent =
          `WebGPU is available, but the browser hit a GPU runtime mapping error during generation. Refresh this tab and retry with ${recoveryModelLabel} first.`;
      } else {
        renderRichMessage(
          assistantNode.body,
          `Sorry, that model could not stay loaded on this device. Try clicking Start AI Chat again with ${recoveryModelLabel} selected.`,
        );
        setStatus(
          `Generation failed: ${message} The selected model likely exceeded available GPU memory. Try ${recoveryModelLabel} or reload this model again.`,
        );
      }
    } else {
      renderRichMessage(assistantNode.body, `Sorry, the response failed: ${message}`);
      setStatus(`Generation failed: ${message}`);
    }
  } finally {
    state.isGenerating = false;
    updateControls();
    scrollChatToBottom();
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

  await generateAssistantResponse();
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

async function copyMessageContent(messageIndex) {
  const message = state.messages[messageIndex];
  if (!message?.content) {
    return;
  }

  try {
    await navigator.clipboard.writeText(message.content);
    setStatus("Assistant message copied to clipboard.");
  } catch {
    setStatus("Copy failed in this browser session.");
  }
}

async function retryAssistantMessage(messageIndex) {
  const targetMessage = state.messages[messageIndex];
  if (!targetMessage || targetMessage.role !== "assistant") {
    return;
  }

  if (messageIndex !== state.messages.length - 1 || state.isGenerating || state.isLoading) {
    return;
  }

  state.messages.pop();
  renderMessages();
  state.isGenerating = true;
  updateControls();
  await generateAssistantResponse();
}

elements.startButton.addEventListener("click", async () => {
  await loadModel(elements.modelSelect.value);
});

elements.drawerToggle.addEventListener("click", () => {
  toggleDrawer();
});

document.addEventListener("click", (event) => {
  if (!state.drawerOpen) {
    return;
  }

  const clickedInsideDrawer = elements.sessionPanel.contains(event.target);
  const clickedToggle = elements.drawerToggle.contains(event.target);

  if (!clickedInsideDrawer && !clickedToggle) {
    toggleDrawer(false);
  }
});

elements.sessionPanel.addEventListener("click", (event) => {
  if (event.target === elements.sessionPanel) {
    toggleDrawer(false);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state.drawerOpen) {
    toggleDrawer(false);
  }
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

elements.chatLog.addEventListener("click", async (event) => {
  const button = event.target.closest(".message-action-button");
  if (!button) {
    return;
  }

  const messageIndex = Number(button.dataset.messageIndex);
  if (!Number.isInteger(messageIndex)) {
    return;
  }

  if (button.dataset.action === "copy") {
    await copyMessageContent(messageIndex);
  } else if (button.dataset.action === "retry") {
    await retryAssistantMessage(messageIndex);
  }
});

async function initializeApp() {
  setModelHelp();
  toggleDrawer(false);
  updateControls();
  renderMessages();
  autoResizeComposer();
  await checkWebGPU();

  if (state.webgpuAvailable) {
    await loadModel(DEFAULT_MODEL_ID);
  }
}

initializeApp();
