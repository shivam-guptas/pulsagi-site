const { getToolBySlug, toolRegistry } = window.LightningStudioData;
const {
  copyText,
  downloadText,
  escapeHtml,
  formatApex,
  formatJson,
  formatSoql,
  formatXml,
  generateMarkup,
  parseHeaderLines,
  prettyResponseText,
  readStorage,
  writeStorage
} = window.LightningStudioUtils;
const {
  generateApexClassBundle,
  generateApexFromJson,
  generateApexTriggerBundle,
  generateAuraBundle,
  generateLwcBundle,
  generateMessageChannelXml,
  validateLwcName
} = window.LightningStudioGenerators;
const { analyzeGovernorRisks, diffText, inspectLog } = window.LightningStudioAnalysis;

const rootPath = document.body.dataset.root || "../..";
const toolSlug = document.body.dataset.tool;
const tool = getToolBySlug(toolSlug);
const appRoot = document.querySelector("[data-tool-root]");

function toolHref(slug) {
  return `${rootPath}/tools/${slug}/`;
}

function relatedTools(currentTool) {
  return toolRegistry
    .filter((item) => item.slug !== currentTool.slug && item.category === currentTool.category)
    .slice(0, 3);
}

function renderToolPage(toolMeta, contentHtml) {
  const related = relatedTools(toolMeta)
    .map(
      (item) => `
        <a class="tool-card" href="${toolHref(item.slug)}">
          <span class="chip secondary">${item.category}</span>
          <h3>${item.title}</h3>
          <p>${item.tagline}</p>
        </a>
      `
    )
    .join("");

  appRoot.innerHTML = `
    <section class="hero">
      <div class="chip-row">
        <span class="chip">${toolMeta.category}</span>
        <span class="chip secondary">Runs in browser</span>
        <span class="chip secondary">Static route</span>
      </div>
      <div class="split-hero" style="margin-top: 18px;">
        <div>
          <h1 class="page-title">${toolMeta.title}</h1>
          <p class="page-lead">${toolMeta.description}</p>
        </div>
        <div class="card side-panel">
          <p class="muted">${toolMeta.tagline}</p>
          <div class="toolbar" style="margin-top: 16px;">
            <a class="button secondary" href="${rootPath}/tools/">Browse all tools</a>
            <button class="button ghost" type="button" data-star-tool>Star this tool</button>
          </div>
        </div>
      </div>
    </section>

    <section class="section">${contentHtml}</section>

    ${
      related
        ? `
          <section class="section">
            <h2 class="section-title">Continue with related workflows</h2>
            <div class="card-grid">${related}</div>
          </section>
        `
        : ""
    }
  `;

  const starButton = document.querySelector("[data-star-tool]");
  const starred = new Set(readStorage("lightning-studio-stars", []));
  updateStarButton();

  starButton?.addEventListener("click", () => {
    if (starred.has(toolMeta.slug)) {
      starred.delete(toolMeta.slug);
    } else {
      starred.add(toolMeta.slug);
    }
    writeStorage("lightning-studio-stars", [...starred]);
    updateStarButton();
  });

  function updateStarButton() {
    if (starButton) {
      starButton.textContent = starred.has(toolMeta.slug) ? "Starred" : "Star this tool";
    }
  }
}

function bindFileUpload(buttonSelector, targetSelector) {
  const button = document.querySelector(buttonSelector);
  const target = document.querySelector(targetSelector);
  if (!button || !target) return;

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".txt,.log,.json,.xml,.cls,.trigger,.js,.ts,.html";
  fileInput.hidden = true;
  document.body.appendChild(fileInput);

  button.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    target.value = await file.text();
    target.dispatchEvent(new Event("input"));
  });
}

function createFormatterTool(options) {
  renderToolPage(
    tool,
    `
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2>${tool.title}</h2>
            <p class="panel-copy">${options.helperText}</p>
          </div>
          <div class="toolbar">
            ${options.secondaryAction ? `<button class="button secondary" type="button" data-secondary-action>${options.secondaryAction.label}</button>` : ""}
            <button class="button" type="button" data-run-action>${options.primaryLabel}</button>
            <button class="button ghost" type="button" data-clear-input>Clear input</button>
          </div>
        </div>
        <div class="panel-body stack">
          <div class="callout info" data-status-callout>
            <div>
              <strong>Local-first workflow</strong>
              <p class="muted">${options.callout}</p>
            </div>
          </div>
          <div class="workspace-grid">
            <div class="panel">
              <div class="panel-header">
                <h3>${options.inputLabel}</h3>
                <div class="inline-actions">
                  <button class="button ghost" type="button" data-upload-input>Upload</button>
                </div>
              </div>
              <div class="panel-body">
                <textarea class="code-editor tall" data-input-editor></textarea>
              </div>
            </div>
            <div class="panel">
              <div class="panel-header">
                <h3>${options.outputLabel}</h3>
                <div class="inline-actions">
                  <button class="button ghost" type="button" data-copy-output>Copy</button>
                  <button class="button ghost" type="button" data-download-output>Download</button>
                  <button class="button ghost" type="button" data-clear-output>Clear</button>
                </div>
              </div>
              <div class="panel-body">
                <pre class="code-output" data-output-view>No output yet.</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  );

  const inputEditor = document.querySelector("[data-input-editor]");
  const outputView = document.querySelector("[data-output-view]");
  const statusCallout = document.querySelector("[data-status-callout]");
  inputEditor.value = readStorage(options.storageKey, options.defaultValue);

  inputEditor.addEventListener("input", () => writeStorage(options.storageKey, inputEditor.value));
  bindFileUpload("[data-upload-input]", "[data-input-editor]");

  document.querySelector("[data-run-action]").addEventListener("click", () => {
    const result = options.formatter(inputEditor.value);
    if (!result.ok) {
      statusCallout.className = "callout warning";
      statusCallout.innerHTML = `<div><strong>Unable to process input</strong><p class="muted">${escapeHtml(result.error)}</p></div>`;
      outputView.textContent = "No output yet.";
      return;
    }

    const finalOutput = options.secondaryActionApplied
      ? options.secondaryActionApplied(result.output)
      : result.output;
    outputView.textContent = finalOutput;
    statusCallout.className = "callout success";
    statusCallout.innerHTML = `<div><strong>Output ready</strong><p class="muted">The result stays in your browser and is ready to copy or download.</p></div>`;
  });

  if (options.secondaryAction) {
    document.querySelector("[data-secondary-action]").addEventListener("click", () => {
      const result = options.secondaryAction.handler(inputEditor.value);
      if (!result.ok) {
        statusCallout.className = "callout warning";
        statusCallout.innerHTML = `<div><strong>Unable to process input</strong><p class="muted">${escapeHtml(result.error)}</p></div>`;
        outputView.textContent = "No output yet.";
        return;
      }
      outputView.textContent = result.output;
      statusCallout.className = "callout success";
      statusCallout.innerHTML = `<div><strong>Output ready</strong><p class="muted">The result stays in your browser and is ready to copy or download.</p></div>`;
    });
  }

  document.querySelector("[data-copy-output]").addEventListener("click", () => copyText(outputView.textContent));
  document.querySelector("[data-download-output]").addEventListener("click", () => downloadText(options.filename, outputView.textContent));
  document.querySelector("[data-clear-output]").addEventListener("click", () => {
    outputView.textContent = "No output yet.";
  });
  document.querySelector("[data-clear-input]").addEventListener("click", () => {
    inputEditor.value = "";
    writeStorage(options.storageKey, "");
  });
}

function renderBundleResult(files, languageFallback = "xml") {
  const entries = Object.entries(files);
  if (!entries.length) {
    return `<div class="empty-state"><div><h3>No generated output yet</h3><p class="muted">Generate files to preview them here.</p></div></div>`;
  }

  return `
    <div class="stack">
      <div class="bundle-tabs">
        ${entries
          .map(
            ([fileName], index) =>
              `<button class="button ${index === 0 ? "secondary" : "ghost"}" type="button" data-file-tab="${escapeHtml(fileName)}">${fileName}</button>`
          )
          .join("")}
      </div>
      <div class="panel">
        <div class="panel-header">
          <h3 data-file-title>${entries[0][0]}</h3>
          <div class="inline-actions">
            <button class="button ghost" type="button" data-copy-file>Copy</button>
            <button class="button ghost" type="button" data-download-file>Download</button>
          </div>
        </div>
        <div class="panel-body">
          <pre class="code-output" data-file-output data-language="${languageFallback}">${escapeHtml(entries[0][1])}</pre>
        </div>
      </div>
    </div>
  `;
}

function attachBundleViewer(files) {
  const output = document.querySelector("[data-file-output]");
  const title = document.querySelector("[data-file-title]");
  const tabs = document.querySelectorAll("[data-file-tab]");
  let activeFile = Object.keys(files)[0];

  function update() {
    title.textContent = activeFile;
    output.textContent = files[activeFile];
    tabs.forEach((tab) => {
      tab.className = `button ${tab.dataset.fileTab === activeFile ? "secondary" : "ghost"}`;
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      activeFile = tab.dataset.fileTab;
      update();
    });
  });

  document.querySelector("[data-copy-file]")?.addEventListener("click", () => copyText(files[activeFile]));
  document.querySelector("[data-download-file]")?.addEventListener("click", () => downloadText(activeFile, files[activeFile]));
  update();
}

function initJsonToApex() {
  renderToolPage(
    tool,
    `
      <div class="workspace-grid">
        <div class="panel">
          <div class="panel-header">
            <h3>JSON payload</h3>
            <div class="inline-actions">
              <button class="button ghost" type="button" data-upload-json>Upload</button>
            </div>
          </div>
          <div class="panel-body stack">
            <div class="field">
              <label for="apex-class-name">Root class name</label>
              <input class="input" id="apex-class-name" data-class-name value="LightningStudioResponse" />
            </div>
            <textarea class="code-editor tall" data-json-input></textarea>
            <div class="toolbar">
              <button class="button" type="button" data-generate-apex>Generate classes</button>
              <button class="button ghost" type="button" data-clear-json>Clear</button>
            </div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-header">
            <h3>Generated Apex</h3>
            <div class="inline-actions">
              <button class="button ghost" type="button" data-copy-apex>Copy</button>
              <button class="button ghost" type="button" data-download-apex>Download</button>
            </div>
          </div>
          <div class="panel-body stack">
            <div class="summary-grid">
              <article class="metric"><span class="muted">Generated classes</span><strong data-class-count>0</strong></article>
              <article class="metric"><span class="muted">Lines of Apex</span><strong data-line-count>0</strong></article>
            </div>
            <pre class="code-output" data-apex-output>No output yet.</pre>
          </div>
        </div>
      </div>
    `
  );

  const input = document.querySelector("[data-json-input]");
  const className = document.querySelector("[data-class-name]");
  const output = document.querySelector("[data-apex-output]");
  input.value = readStorage(
    "ls-static-json-to-apex",
    '{\n  "name": "Lightning Studio",\n  "active": true,\n  "account": {\n    "id": "001xx000003DGXw",\n    "industry": "Technology"\n  },\n  "contacts": [\n    {\n      "firstName": "Ada",\n      "lastName": "Lovelace"\n    }\n  ]\n}'
  );
  input.addEventListener("input", () => writeStorage("ls-static-json-to-apex", input.value));
  bindFileUpload("[data-upload-json]", "[data-json-input]");

  document.querySelector("[data-generate-apex]").addEventListener("click", () => {
    const result = generateApexFromJson(className.value, input.value);
    output.textContent = result.ok ? result.output : result.error;
    document.querySelector("[data-class-count]").textContent = result.ok
      ? String((result.output.match(/public class/g) || []).length || 1)
      : "0";
    document.querySelector("[data-line-count]").textContent = result.ok
      ? String(result.output.split("\n").length)
      : "0";
  });

  document.querySelector("[data-copy-apex]").addEventListener("click", () => copyText(output.textContent));
  document.querySelector("[data-download-apex]").addEventListener("click", () => downloadText(`${className.value || "RootResponse"}.cls`, output.textContent));
  document.querySelector("[data-clear-json]").addEventListener("click", () => {
    input.value = "";
    writeStorage("ls-static-json-to-apex", "");
  });
}

function initLwcGenerator() {
  renderToolPage(
    tool,
    `
      <div class="workspace-grid">
        <div class="panel">
          <div class="panel-header"><h3>LWC settings</h3></div>
          <div class="panel-body stack">
            <div class="field"><label>Component name</label><input class="input" data-lwc-name value="studioSummary" /></div>
            <div class="field"><label>Description</label><input class="input" data-lwc-description value="Summary card for Lightning Studio" /></div>
            <div class="stack">
              <span class="helper-text">Targets</span>
              <label><input type="checkbox" data-lwc-target value="lightning__AppPage" checked /> lightning__AppPage</label>
              <label><input type="checkbox" data-lwc-target value="lightning__RecordPage" checked /> lightning__RecordPage</label>
              <label><input type="checkbox" data-lwc-target value="lightning__HomePage" /> lightning__HomePage</label>
              <label><input type="checkbox" data-lwc-target value="lightning__UtilityBar" /> lightning__UtilityBar</label>
            </div>
            <label><input type="checkbox" data-lwc-expose checked /> Expose component</label>
            <label><input type="checkbox" data-lwc-css checked /> Include CSS scaffold</label>
            <label><input type="checkbox" data-lwc-test /> Include test scaffold</label>
            <div class="error-text" data-lwc-error></div>
            <button class="button" type="button" data-generate-lwc>Generate bundle</button>
          </div>
        </div>
        <div class="panel">
          <div class="panel-header"><h3>Generated bundle</h3></div>
          <div class="panel-body" data-bundle-root>
            <div class="empty-state"><div><h3>No generated output yet</h3><p class="muted">Generate files to preview them here.</p></div></div>
          </div>
        </div>
      </div>
    `
  );

  document.querySelector("[data-generate-lwc]").addEventListener("click", () => {
    const componentName = document.querySelector("[data-lwc-name]").value.trim();
    const errorTarget = document.querySelector("[data-lwc-error]");
    if (!validateLwcName(componentName)) {
      errorTarget.textContent = "Use lowerCamelCase without spaces or symbols.";
      return;
    }
    errorTarget.textContent = "";
    const files = generateLwcBundle({
      componentName,
      description: document.querySelector("[data-lwc-description]").value.trim(),
      targets: [...document.querySelectorAll("[data-lwc-target]:checked")].map((item) => item.value),
      expose: document.querySelector("[data-lwc-expose]").checked,
      includeCss: document.querySelector("[data-lwc-css]").checked,
      includeTest: document.querySelector("[data-lwc-test]").checked
    });
    document.querySelector("[data-bundle-root]").innerHTML = renderBundleResult(files, "html");
    attachBundleViewer(files);
  });
}

function initAuraGenerator() {
  renderToolPage(
    tool,
    `
      <div class="workspace-grid">
        <div class="panel">
          <div class="panel-header"><h3>Aura bundle settings</h3></div>
          <div class="panel-body stack">
            <div class="field"><label>Bundle name</label><input class="input" data-aura-name value="StudioAuraPanel" /></div>
            <div class="field"><label>Description</label><textarea class="textarea" data-aura-description>Aura bundle generated with Lightning Studio.</textarea></div>
            <label><input type="checkbox" data-aura-controller checked /> Include controller</label>
            <label><input type="checkbox" data-aura-helper checked /> Include helper</label>
            <label><input type="checkbox" data-aura-style checked /> Include style</label>
            <label><input type="checkbox" data-aura-renderer /> Include renderer</label>
            <label><input type="checkbox" data-aura-docs checked /> Include documentation</label>
            <button class="button" type="button" data-generate-aura>Generate bundle</button>
          </div>
        </div>
        <div class="panel">
          <div class="panel-header"><h3>Generated bundle</h3></div>
          <div class="panel-body" data-bundle-root>
            <div class="empty-state"><div><h3>No generated output yet</h3><p class="muted">Generate files to preview them here.</p></div></div>
          </div>
        </div>
      </div>
    `
  );

  document.querySelector("[data-generate-aura]").addEventListener("click", () => {
    const files = generateAuraBundle({
      bundleName: document.querySelector("[data-aura-name]").value.trim(),
      description: document.querySelector("[data-aura-description]").value.trim(),
      includeController: document.querySelector("[data-aura-controller]").checked,
      includeHelper: document.querySelector("[data-aura-helper]").checked,
      includeStyle: document.querySelector("[data-aura-style]").checked,
      includeRenderer: document.querySelector("[data-aura-renderer]").checked,
      includeDocumentation: document.querySelector("[data-aura-docs]").checked
    });
    document.querySelector("[data-bundle-root]").innerHTML = renderBundleResult(files, "javascript");
    attachBundleViewer(files);
  });
}

function initApexClassGenerator() {
  renderToolPage(
    tool,
    `
      <div class="workspace-grid">
        <div class="panel">
          <div class="panel-header"><h3>Apex class settings</h3></div>
          <div class="panel-body stack">
            <div class="field"><label>Class name</label><input class="input" data-class-generator-name value="InvoiceService" /></div>
            <div class="form-grid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;">
              <div class="field"><label>Access</label><select class="select" data-class-access><option>public</option><option>global</option></select></div>
              <div class="field"><label>Sharing</label><select class="select" data-class-sharing><option>with sharing</option><option>without sharing</option><option>inherited sharing</option></select></div>
            </div>
            <div class="field"><label>Purpose</label><textarea class="textarea" data-class-purpose>Coordinates invoice generation and persistence.</textarea></div>
            <div class="field"><label>Methods, one per line</label><textarea class="textarea" data-class-methods>buildInvoices
syncPayments</textarea></div>
            <label><input type="checkbox" data-class-test checked /> Include test class</label>
            <button class="button" type="button" data-generate-class>Generate class</button>
          </div>
        </div>
        <div class="panel">
          <div class="panel-header"><h3>Generated files</h3></div>
          <div class="panel-body" data-bundle-root>
            <div class="empty-state"><div><h3>No generated output yet</h3><p class="muted">Generate files to preview them here.</p></div></div>
          </div>
        </div>
      </div>
    `
  );

  document.querySelector("[data-generate-class]").addEventListener("click", () => {
    const files = generateApexClassBundle({
      className: document.querySelector("[data-class-generator-name]").value.trim(),
      accessModifier: document.querySelector("[data-class-access]").value,
      sharingModel: document.querySelector("[data-class-sharing]").value,
      purpose: document.querySelector("[data-class-purpose]").value.trim(),
      methods: document.querySelector("[data-class-methods]").value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
      includeTest: document.querySelector("[data-class-test]").checked
    });
    document.querySelector("[data-bundle-root]").innerHTML = renderBundleResult(files, "apex");
    attachBundleViewer(files);
  });
}

function initApexTriggerGenerator() {
  renderToolPage(
    tool,
    `
      <div class="workspace-grid">
        <div class="panel">
          <div class="panel-header"><h3>Trigger settings</h3></div>
          <div class="panel-body stack">
            <div class="field"><label>SObject API name</label><input class="input" data-trigger-object value="Account" /></div>
            <div class="field"><label>Trigger name</label><input class="input" data-trigger-name value="AccountTrigger" /></div>
            <div class="stack">
              <span class="helper-text">Events</span>
              ${["before insert","before update","before delete","after insert","after update","after delete","after undelete"].map((eventName, index) => `<label><input type="checkbox" data-trigger-event value="${eventName}" ${index < 2 ? "checked" : ""} /> ${eventName}</label>`).join("")}
            </div>
            <label><input type="checkbox" data-trigger-handler checked /> Include handler class</label>
            <button class="button" type="button" data-generate-trigger>Generate trigger</button>
          </div>
        </div>
        <div class="panel">
          <div class="panel-header"><h3>Generated files</h3></div>
          <div class="panel-body" data-bundle-root>
            <div class="empty-state"><div><h3>No generated output yet</h3><p class="muted">Generate files to preview them here.</p></div></div>
          </div>
        </div>
      </div>
    `
  );

  document.querySelector("[data-generate-trigger]").addEventListener("click", () => {
    const files = generateApexTriggerBundle({
      objectName: document.querySelector("[data-trigger-object]").value.trim(),
      triggerName: document.querySelector("[data-trigger-name]").value.trim(),
      events: [...document.querySelectorAll("[data-trigger-event]:checked")].map((item) => item.value),
      includeHandler: document.querySelector("[data-trigger-handler]").checked
    });
    document.querySelector("[data-bundle-root]").innerHTML = renderBundleResult(files, "apex");
    attachBundleViewer(files);
  });
}

function initMessageChannelGenerator() {
  renderToolPage(
    tool,
    `
      <div class="workspace-grid">
        <div class="panel">
          <div class="panel-header"><h3>Channel settings</h3></div>
          <div class="panel-body stack">
            <div class="field"><label>Channel name</label><input class="input" data-channel-name value="StudioMessage" /></div>
            <div class="field"><label>Description</label><textarea class="textarea" data-channel-description>Message channel for Lightning Studio components.</textarea></div>
            <div class="field"><label>Fields, one per line as name:description</label><textarea class="textarea" data-channel-fields>recordId:Primary record id
status:Status change payload</textarea></div>
            <button class="button" type="button" data-generate-channel>Generate XML</button>
          </div>
        </div>
        <div class="panel">
          <div class="panel-header"><h3>Generated file</h3></div>
          <div class="panel-body" data-bundle-root>
            <div class="empty-state"><div><h3>No generated output yet</h3><p class="muted">Generate XML to preview it here.</p></div></div>
          </div>
        </div>
      </div>
    `
  );

  document.querySelector("[data-generate-channel]").addEventListener("click", () => {
    const name = document.querySelector("[data-channel-name]").value.trim();
    const description = document.querySelector("[data-channel-description]").value.trim();
    const fields = document.querySelector("[data-channel-fields]").value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [fieldName, fieldDescription] = line.split(":");
        return { name: fieldName.trim(), description: (fieldDescription || fieldName).trim() };
      });
    const files = { [`${name}.messageChannel-meta.xml`]: generateMessageChannelXml(name, description, fields) };
    document.querySelector("[data-bundle-root]").innerHTML = renderBundleResult(files, "xml");
    attachBundleViewer(files);
  });
}

function initLogInspector() {
  renderToolPage(
    tool,
    `
      <div class="stack">
        <div class="panel">
          <div class="panel-header">
            <h3>Debug log input</h3>
            <div class="inline-actions">
              <button class="button ghost" type="button" data-upload-log>Upload</button>
              <button class="button ghost" type="button" data-export-filtered>Export filtered</button>
            </div>
          </div>
          <div class="panel-body stack">
            <div class="field"><label>Filter lines</label><input class="input" data-log-filter placeholder="Filter by exception, object, method, token..." /></div>
            <textarea class="code-editor tall" data-log-input></textarea>
          </div>
        </div>
        <div class="summary-grid" data-log-metrics></div>
        <div class="workspace-grid">
          <div class="panel">
            <div class="panel-header"><h3>Suspicious events</h3></div>
            <div class="panel-body stack" data-suspicious-events></div>
          </div>
          <div class="panel">
            <div class="panel-header"><h3>Filtered lines</h3></div>
            <div class="panel-body"><pre class="code-output" data-filtered-lines></pre></div>
          </div>
        </div>
      </div>
    `
  );

  const logInput = document.querySelector("[data-log-input]");
  const filterInput = document.querySelector("[data-log-filter]");
  const metricsRoot = document.querySelector("[data-log-metrics]");
  const suspiciousRoot = document.querySelector("[data-suspicious-events]");
  const filteredLines = document.querySelector("[data-filtered-lines]");
  logInput.value = readStorage(
    "ls-static-log-input",
    "09:00:00.0 (100000)|EXECUTION_STARTED\n09:00:00.0 (200000)|SOQL_EXECUTE_BEGIN|[14]|Aggregations:0|SELECT Id, Name FROM Account\n09:00:00.0 (300000)|DML_BEGIN|[25]|Op:Update|Type:Account|Rows:1\n09:00:00.0 (450000)|EXCEPTION_THROWN|[31]|System.NullPointerException: Attempt to de-reference a null object"
  );

  function update() {
    writeStorage("ls-static-log-input", logInput.value);
    const summary = inspectLog(logInput.value, filterInput.value);
    metricsRoot.innerHTML = [
      ["Lines", summary.lineCount],
      ["SOQL", summary.soqlCount],
      ["DML", summary.dmlCount],
      ["Exceptions", summary.exceptionCount],
      ["Limit signals", summary.limitSignals]
    ]
      .map(([label, value]) => `<article class="metric"><span class="muted">${label}</span><strong>${value}</strong></article>`)
      .join("");
    suspiciousRoot.innerHTML = summary.suspiciousEvents.length
      ? summary.suspiciousEvents.slice(0, 20).map((line) => `<div class="callout warning"><div><p class="muted">${escapeHtml(line)}</p></div></div>`).join("")
      : `<div class="empty-state"><div><h3>No suspicious events surfaced</h3><p class="muted">Paste a fuller log or search for a specific token to narrow down the lines you care about.</p></div></div>`;
    filteredLines.textContent = summary.filteredLines.join("\n");

    document.querySelector("[data-export-filtered]").onclick = () => {
      downloadText("log-summary.txt", summary.filteredLines.join("\n"));
    };
  }

  bindFileUpload("[data-upload-log]", "[data-log-input]");
  logInput.addEventListener("input", update);
  filterInput.addEventListener("input", update);
  update();
}

function initGovernorAnalyzer() {
  renderToolPage(
    tool,
    `
      <div class="workspace-grid">
        <div class="panel">
          <div class="panel-header"><h3>Apex or log input</h3></div>
          <div class="panel-body">
            <textarea class="code-editor tall" data-governor-input></textarea>
          </div>
        </div>
        <div class="panel">
          <div class="panel-header"><h3>Findings</h3></div>
          <div class="panel-body stack" data-governor-findings></div>
        </div>
      </div>
    `
  );

  const input = document.querySelector("[data-governor-input]");
  const findingsRoot = document.querySelector("[data-governor-findings]");
  input.value = readStorage(
    "ls-static-governor-input",
    "trigger AccountTrigger on Account (before insert, before update) {\n  for (Account account : Trigger.new) {\n    List<Contact> contacts = [SELECT Id FROM Contact WHERE AccountId = :account.Id];\n    update contacts;\n  }\n}"
  );

  function update() {
    writeStorage("ls-static-governor-input", input.value);
    const findings = analyzeGovernorRisks(input.value);
    findingsRoot.innerHTML = findings
      .map(
        (finding) => `
          <article class="card">
            <span class="chip ${finding.severity === "high" ? "" : "secondary"}">${finding.severity}</span>
            <h3>${finding.category}</h3>
            <p>${finding.message}</p>
            <div class="stack" style="margin-top: 14px;">
              <div><strong>Evidence</strong><p class="muted">${finding.evidence}</p></div>
              <div><strong>Suggestion</strong><p class="muted">${finding.suggestion}</p></div>
            </div>
          </article>
        `
      )
      .join("");
  }

  input.addEventListener("input", update);
  update();
}

function initMetadataDiff() {
  renderToolPage(
    tool,
    `
      <div class="workspace-grid">
        <div class="panel">
          <div class="panel-header"><h3>Original</h3></div>
          <div class="panel-body"><textarea class="code-editor tall" data-diff-left></textarea></div>
        </div>
        <div class="panel">
          <div class="panel-header"><h3>Updated</h3></div>
          <div class="panel-body"><textarea class="code-editor tall" data-diff-right></textarea></div>
        </div>
      </div>
      <div class="panel" style="margin-top: 24px;">
        <div class="panel-header">
          <h3>Diff view</h3>
          <div class="inline-actions">
            <button class="button secondary" type="button" data-diff-mode="inline">Inline</button>
            <button class="button ghost" type="button" data-diff-mode="split">Split</button>
          </div>
        </div>
        <div class="panel-body" data-diff-output></div>
      </div>
    `
  );

  const left = document.querySelector("[data-diff-left]");
  const right = document.querySelector("[data-diff-right]");
  const output = document.querySelector("[data-diff-output]");
  let mode = "inline";
  left.value = readStorage("ls-static-diff-left", "<CustomObject>\n  <label>Invoice</label>\n  <deploymentStatus>Deployed</deploymentStatus>\n</CustomObject>");
  right.value = readStorage("ls-static-diff-right", "<CustomObject>\n  <label>Invoices</label>\n  <deploymentStatus>InDevelopment</deploymentStatus>\n</CustomObject>");

  function update() {
    writeStorage("ls-static-diff-left", left.value);
    writeStorage("ls-static-diff-right", right.value);
    const parts = diffText(left.value, right.value);
    output.innerHTML =
      mode === "inline"
        ? `<div class="diff-grid">${parts
            .map((part) => `<div class="diff-inline-row ${part.type}"><pre>${escapeHtml(part.left || part.right || " ")}</pre></div>`)
            .join("")}</div>`
        : `<div class="diff-grid diff-side">
            <div class="diff-side-column">${parts.map((part) => `<div class="diff-side-cell ${part.type === "removed" ? "removed" : ""}">${escapeHtml(part.left || " ")}</div>`).join("")}</div>
            <div class="diff-side-column">${parts.map((part) => `<div class="diff-side-cell ${part.type === "added" ? "added" : ""}">${escapeHtml(part.right || " ")}</div>`).join("")}</div>
          </div>`;
  }

  left.addEventListener("input", update);
  right.addEventListener("input", update);
  document.querySelectorAll("[data-diff-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      mode = button.dataset.diffMode;
      document.querySelectorAll("[data-diff-mode]").forEach((item) => {
        item.className = `button ${item.dataset.diffMode === mode ? "secondary" : "ghost"}`;
      });
      update();
    });
  });
  update();
}

function initRestExplorer() {
  renderToolPage(
    tool,
    `
      <div class="stack">
        <div class="panel">
          <div class="panel-header"><h3>Request builder</h3></div>
          <div class="panel-body stack">
            <div class="form-grid" style="display:grid;grid-template-columns:140px minmax(0,1fr);gap:12px;">
              <div class="field"><label>Method</label><select class="select" data-rest-method><option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option></select></div>
              <div class="field"><label>Endpoint</label><input class="input" data-rest-endpoint value="https://example.my.salesforce.com/services/data/v61.0/query?q=SELECT+Id+FROM+Account" /></div>
            </div>
            <div class="workspace-grid">
              <div class="panel"><div class="panel-header"><h3>Headers</h3></div><div class="panel-body"><textarea class="code-editor" data-rest-headers>Authorization: Bearer YOUR_TOKEN
Content-Type: application/json</textarea></div></div>
              <div class="panel"><div class="panel-header"><h3>Body</h3></div><div class="panel-body"><textarea class="code-editor" data-rest-body>{
  "Name": "Lightning Studio"
}</textarea></div></div>
            </div>
            <div class="toolbar">
              <button class="button" type="button" data-send-rest>Send request</button>
              <button class="button ghost" type="button" data-clear-rest-response>Clear response</button>
            </div>
            <div class="callout info"><div><strong>Browser request model</strong><p class="muted" data-rest-status>Requests are sent from your browser, so endpoint CORS rules still apply.</p></div></div>
          </div>
        </div>
        <div class="workspace-grid">
          <div class="panel"><div class="panel-header"><h3>Response</h3><div class="inline-actions"><button class="button ghost" type="button" data-copy-rest-response>Copy</button></div></div><div class="panel-body"><pre class="code-output" data-rest-response>No response yet.</pre></div></div>
          <div class="panel"><div class="panel-header"><h3>Request history</h3></div><div class="panel-body stack" data-rest-history></div></div>
        </div>
      </div>
    `
  );

  const historyKey = "ls-static-rest-history";
  const historyRoot = document.querySelector("[data-rest-history]");
  const responseOutput = document.querySelector("[data-rest-response]");
  const statusOutput = document.querySelector("[data-rest-status]");

  function renderHistory() {
    const items = readStorage(historyKey, []);
    historyRoot.innerHTML = items.length
      ? items
          .map(
            (item) => `<button class="history-item" type="button" data-history-rest="${item.id}"><strong>${escapeHtml(item.label)}</strong><p class="muted">${escapeHtml(item.endpoint)}</p></button>`
          )
          .join("")
      : `<div class="empty-state"><div><h3>No request history yet</h3><p class="muted">Sent requests are stored locally so you can replay common endpoints quickly.</p></div></div>`;

    historyRoot.querySelectorAll("[data-history-rest]").forEach((button) => {
      button.addEventListener("click", () => {
        const items = readStorage(historyKey, []);
        const match = items.find((item) => item.id === button.dataset.historyRest);
        if (!match) return;
        document.querySelector("[data-rest-method]").value = match.method;
        document.querySelector("[data-rest-endpoint]").value = match.endpoint;
        document.querySelector("[data-rest-headers]").value = match.headers;
        document.querySelector("[data-rest-body]").value = match.body;
      });
    });
  }

  document.querySelector("[data-send-rest]").addEventListener("click", async () => {
    statusOutput.textContent = "Sending request...";
    try {
      const method = document.querySelector("[data-rest-method]").value;
      const endpoint = document.querySelector("[data-rest-endpoint]").value.trim();
      const headersText = document.querySelector("[data-rest-headers]").value;
      const body = document.querySelector("[data-rest-body]").value;
      const init = { method, headers: parseHeaderLines(headersText) };
      if (!["GET", "HEAD"].includes(method) && body.trim()) {
        init.body = body;
      }
      const response = await fetch(endpoint, init);
      const responseText = await response.text();
      responseOutput.textContent = prettyResponseText(responseText);
      statusOutput.textContent = `${response.status} ${response.statusText}`;
      const history = readStorage(historyKey, []);
      writeStorage(historyKey, [{ id: `${Date.now()}`, label: `${method} ${endpoint}`, method, endpoint, headers: headersText, body }, ...history].slice(0, 10));
      renderHistory();
    } catch (error) {
      responseOutput.textContent = "No response yet.";
      statusOutput.textContent = `${error.message}. This can happen when the target endpoint blocks browser CORS requests.`;
    }
  });

  document.querySelector("[data-copy-rest-response]").addEventListener("click", () => copyText(responseOutput.textContent));
  document.querySelector("[data-clear-rest-response]").addEventListener("click", () => (responseOutput.textContent = "No response yet."));
  renderHistory();
}

function initGraphqlExplorer() {
  renderToolPage(
    tool,
    `
      <div class="stack">
        <div class="panel">
          <div class="panel-header"><h3>GraphQL request</h3></div>
          <div class="panel-body stack">
            <div class="field"><label>Endpoint</label><input class="input" data-graphql-endpoint value="https://example.com/graphql" /></div>
            <div class="workspace-grid">
              <div class="panel"><div class="panel-header"><h3>Headers</h3></div><div class="panel-body"><textarea class="code-editor" data-graphql-headers>Authorization: Bearer YOUR_TOKEN
Content-Type: application/json</textarea></div></div>
              <div class="panel"><div class="panel-header"><h3>Query</h3></div><div class="panel-body"><textarea class="code-editor" data-graphql-query>query Accounts {
  uiapi {
    query {
      Account(first: 5) {
        edges {
          node {
            Id
            Name {
              value
            }
          }
        }
      }
    }
  }
}</textarea></div></div>
              <div class="panel"><div class="panel-header"><h3>Variables</h3></div><div class="panel-body"><textarea class="code-editor" data-graphql-variables>{
  "limit": 5
}</textarea></div></div>
            </div>
            <div class="toolbar">
              <button class="button" type="button" data-send-graphql>Run query</button>
            </div>
            <div class="callout info"><div><strong>Client-side GraphQL</strong><p class="muted" data-graphql-status>Query responses stay in the browser and request history is stored locally.</p></div></div>
          </div>
        </div>
        <div class="workspace-grid">
          <div class="panel"><div class="panel-header"><h3>Response</h3><div class="inline-actions"><button class="button ghost" type="button" data-copy-graphql-response>Copy</button></div></div><div class="panel-body"><pre class="code-output" data-graphql-response>No response yet.</pre></div></div>
          <div class="panel"><div class="panel-header"><h3>Query history</h3></div><div class="panel-body stack" data-graphql-history></div></div>
        </div>
      </div>
    `
  );

  const historyKey = "ls-static-graphql-history";
  const historyRoot = document.querySelector("[data-graphql-history]");
  const responseOutput = document.querySelector("[data-graphql-response]");
  const statusOutput = document.querySelector("[data-graphql-status]");

  function renderHistory() {
    const items = readStorage(historyKey, []);
    historyRoot.innerHTML = items.length
      ? items
          .map(
            (item) => `<button class="history-item" type="button" data-history-graphql="${item.id}"><strong>${escapeHtml(item.label)}</strong><p class="muted">${escapeHtml(item.endpoint)}</p></button>`
          )
          .join("")
      : `<div class="empty-state"><div><h3>No query history yet</h3><p class="muted">Executed queries are stored locally so you can replay them quickly.</p></div></div>`;

    historyRoot.querySelectorAll("[data-history-graphql]").forEach((button) => {
      button.addEventListener("click", () => {
        const items = readStorage(historyKey, []);
        const match = items.find((item) => item.id === button.dataset.historyGraphql);
        if (!match) return;
        document.querySelector("[data-graphql-endpoint]").value = match.endpoint;
        document.querySelector("[data-graphql-headers]").value = match.headers;
        document.querySelector("[data-graphql-query]").value = match.query;
        document.querySelector("[data-graphql-variables]").value = match.variables;
      });
    });
  }

  document.querySelector("[data-send-graphql]").addEventListener("click", async () => {
    statusOutput.textContent = "Running query...";
    try {
      const endpoint = document.querySelector("[data-graphql-endpoint]").value.trim();
      const headersText = document.querySelector("[data-graphql-headers]").value;
      const query = document.querySelector("[data-graphql-query]").value;
      const variables = document.querySelector("[data-graphql-variables]").value || "{}";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: parseHeaderLines(headersText),
        body: JSON.stringify({ query, variables: JSON.parse(variables) })
      });
      const responseText = await response.text();
      responseOutput.textContent = prettyResponseText(responseText);
      statusOutput.textContent = `${response.status} ${response.statusText}`;
      const history = readStorage(historyKey, []);
      writeStorage(historyKey, [{ id: `${Date.now()}`, label: `GraphQL ${endpoint}`, endpoint, headers: headersText, query, variables }, ...history].slice(0, 10));
      renderHistory();
    } catch (error) {
      responseOutput.textContent = "No response yet.";
      statusOutput.textContent = `${error.message}. Check CORS rules and JSON variables.`;
    }
  });

  document.querySelector("[data-copy-graphql-response]").addEventListener("click", () => copyText(responseOutput.textContent));
  renderHistory();
}

function initMarkupBuilder() {
  renderToolPage(
    tool,
    `
      <div class="workspace-grid">
        <div class="panel">
          <div class="panel-header"><h3>Visual builder</h3></div>
          <div class="panel-body stack">
            <div class="field"><label>Card title</label><input class="input" data-markup-title value="Account Workspace" /></div>
            <label><input type="checkbox" data-markup-card checked /> Wrap content in a lightning-card</label>
            <label><input type="checkbox" data-markup-grid checked /> Add a responsive grid section</label>
            <label><input type="checkbox" data-markup-input checked /> Include a lightning-input</label>
            <label><input type="checkbox" data-markup-button checked /> Include a primary button</label>
            <label><input type="checkbox" data-markup-table /> Include a lightning-datatable</label>
            <div class="toolbar">
              <button class="button" type="button" data-copy-markup>Copy markup</button>
              <button class="button secondary" type="button" data-download-markup>Download snippet</button>
            </div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-header"><h3>Generated LWC markup</h3></div>
          <div class="panel-body"><pre class="code-output" data-markup-output></pre></div>
        </div>
      </div>
    `
  );

  const output = document.querySelector("[data-markup-output]");
  const fields = [...document.querySelectorAll("[data-markup-title], [data-markup-card], [data-markup-grid], [data-markup-input], [data-markup-button], [data-markup-table]")];

  function update() {
    output.textContent = generateMarkup({
      title: document.querySelector("[data-markup-title]").value.trim(),
      includeCard: document.querySelector("[data-markup-card]").checked,
      includeGrid: document.querySelector("[data-markup-grid]").checked,
      includeInput: document.querySelector("[data-markup-input]").checked,
      includeButton: document.querySelector("[data-markup-button]").checked,
      includeDatatable: document.querySelector("[data-markup-table]").checked
    });
  }

  fields.forEach((field) => field.addEventListener("input", update));
  document.querySelector("[data-copy-markup]").addEventListener("click", () => copyText(output.textContent));
  document.querySelector("[data-download-markup]").addEventListener("click", () => downloadText("markup-builder-output.html", output.textContent));
  update();
}

function initTool() {
  if (!tool || !appRoot) {
    return;
  }

  switch (tool.slug) {
    case "apex-formatter":
      createFormatterTool({
        storageKey: "ls-static-apex-input",
        defaultValue:
          "public with sharing class InvoiceService {public static void sync(List<Account> accounts){for(Account account:accounts){System.debug(account.Name);}}}",
        formatter: formatApex,
        primaryLabel: "Format Apex",
        helperText: "Paste Apex code, clean indentation, and safely handle malformed snippets without a page refresh.",
        callout: "Formatting runs in the browser so classes, triggers, and snippets stay on the current device by default.",
        inputLabel: "Apex input",
        outputLabel: "Formatted output",
        filename: "formatted-apex.cls"
      });
      break;
    case "soql-formatter":
      createFormatterTool({
        storageKey: "ls-static-soql-input",
        defaultValue:
          "select Id, Name, (select Id, LastName from Contacts) from Account where Industry = 'Technology' and CreatedDate = LAST_N_DAYS:30 order by Name desc limit 50",
        formatter: formatSoql,
        primaryLabel: "Format SOQL",
        helperText: "Make long queries readable, split clauses cleanly, and improve review quality for nested subqueries and filters.",
        callout: "The formatter expands major clauses and keeps nested query blocks easier to scan.",
        inputLabel: "SOQL input",
        outputLabel: "Formatted query",
        filename: "formatted-query.soql"
      });
      break;
    case "json-formatter":
      createFormatterTool({
        storageKey: "ls-static-json-input",
        defaultValue:
          '{\n  "accountId": "001xx000003DGXw",\n  "features": ["formatter", "generator"],\n  "active": true\n}',
        formatter: (value) => formatJson(value, false),
        primaryLabel: "Prettify",
        secondaryAction: { label: "Minify", handler: (value) => formatJson(value, true) },
        helperText: "Prettify, minify, validate, and copy JSON with clear parser errors for malformed payloads.",
        callout: "Every format action parses the payload first, so you get a real error message instead of broken output.",
        inputLabel: "JSON input",
        outputLabel: "JSON output",
        filename: "payload.json"
      });
      break;
    case "xml-formatter":
      createFormatterTool({
        storageKey: "ls-static-xml-input",
        defaultValue:
          '<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata"><label>Invoice</label><pluralLabel>Invoices</pluralLabel></CustomObject>',
        formatter: formatXml,
        primaryLabel: "Format XML",
        helperText: "Beautify metadata XML, integration payloads, and config files while catching malformed XML safely in the browser.",
        callout: "Use this for custom metadata, object XML, Lightning bundles, and other Salesforce XML artifacts.",
        inputLabel: "XML input",
        outputLabel: "Formatted XML",
        filename: "formatted.xml"
      });
      break;
    case "json-to-apex":
      initJsonToApex();
      break;
    case "lwc-generator":
      initLwcGenerator();
      break;
    case "aura-generator":
      initAuraGenerator();
      break;
    case "apex-class-generator":
      initApexClassGenerator();
      break;
    case "apex-trigger-generator":
      initApexTriggerGenerator();
      break;
    case "lightning-message-channel-generator":
      initMessageChannelGenerator();
      break;
    case "log-inspector":
      initLogInspector();
      break;
    case "governor-limit-analyzer":
      initGovernorAnalyzer();
      break;
    case "metadata-diff":
      initMetadataDiff();
      break;
    case "rest-api-explorer":
      initRestExplorer();
      break;
    case "graphql-explorer":
      initGraphqlExplorer();
      break;
    case "salesforce-markup-builder":
      initMarkupBuilder();
      break;
    default:
      renderToolPage(tool, `<div class="empty-state"><div><h3>Tool not implemented</h3><p class="muted">This tool route exists, but the page renderer has not been connected yet.</p></div></div>`);
  }
}

initTool();
