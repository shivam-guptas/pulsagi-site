(function () {
  if (document.body.dataset.page !== "home") return;

  const lightningStudioData = window.LightningStudioData || {};
  const siteConfig = lightningStudioData.siteConfig || {};
  const salesforceConfig = window.LightningStudioSalesforceConfig || {};
  const { copyText, downloadText, escapeHtml, readStorage, writeStorage } =
    window.LightningStudioUtils;

  const KEYS = {
    auth: "ls-static-salesforce-auth",
    drafts: "ls-static-salesforce-drafts",
    tree: "ls-static-salesforce-tree",
    oauthForm: "ls-static-salesforce-oauth-form",
    manualForm: "ls-static-salesforce-manual-form",
    pending: "ls-static-salesforce-oauth-pending"
  };

  const sections = [
    { key: "lwc", label: "LIGHTNING WEB COMPONENTS", grouped: true },
    { key: "aura", label: "AURA COMPONENTS", grouped: true },
    { key: "apex-class", label: "APEX CLASSES", grouped: false },
    { key: "apex-trigger", label: "APEX TRIGGERS", grouped: false }
  ];

  const labels = {
    "apex-class": "Apex Class",
    "apex-trigger": "Apex Trigger",
    aura: "Aura Definition",
    lwc: "LWC Resource"
  };

  const dom = {
    authModal: document.querySelector("[data-auth-modal]"),
    authFeedback: document.querySelector("[data-auth-feedback]"),
    oauthLoginDomain: document.querySelector("[data-oauth-login-domain]"),
    oauthCustomDomainField: document.querySelector("[data-oauth-custom-domain-field]"),
    oauthCustomDomain: document.querySelector("[data-oauth-custom-domain]"),
    oauthRedirectUri: document.querySelector("[data-oauth-redirect-uri]"),
    manualInstanceUrl: document.querySelector("[data-manual-instance-url]"),
    manualAccessToken: document.querySelector("[data-manual-access-token]"),
    sidebarSearch: document.querySelector("[data-sidebar-search]"),
    sidebarList: document.querySelector("[data-sidebar-list]"),
    sidebarEmpty: document.querySelector("[data-sidebar-empty]"),
    sidebarCaption: document.querySelector("[data-sidebar-caption]"),
    workspaceHeading: document.querySelector("[data-workspace-heading]"),
    workspaceCopy: document.querySelector("[data-workspace-copy]"),
    orgStatusCallout: document.querySelector("[data-org-status-callout]"),
    orgMeta: document.querySelector("[data-org-meta]"),
    syncLog: document.querySelector("[data-sync-log]"),
    metricConnection: document.querySelector("[data-metric-connection]"),
    metricApex: document.querySelector("[data-metric-apex]"),
    metricAura: document.querySelector("[data-metric-aura]"),
    metricLwc: document.querySelector("[data-metric-lwc]"),
    editorTitle: document.querySelector("[data-editor-title]"),
    editorSubtitle: document.querySelector("[data-editor-subtitle]"),
    editorTags: document.querySelector("[data-editor-tags]"),
    editorShell: document.querySelector("[data-editor-shell]"),
    editorEmpty: document.querySelector("[data-editor-empty]"),
    editorStatus: document.querySelector("[data-editor-status]"),
    sourceEditor: document.querySelector("[data-source-editor]"),
    openConnectButtons: document.querySelectorAll("[data-open-connect]"),
    closeAuthButtons: document.querySelectorAll("[data-close-auth]"),
    retryAuthButton: document.querySelector("[data-retry-auth]"),
    syncOrgButton: document.querySelector("[data-sync-org]"),
    downloadSnapshotButton: document.querySelector("[data-download-snapshot]"),
    disconnectOrgButton: document.querySelector("[data-disconnect-org]"),
    retrieveSelectedButton: document.querySelector("[data-retrieve-selected]"),
    saveDraftButton: document.querySelector("[data-save-draft]"),
    copySelectedButton: document.querySelector("[data-copy-selected]"),
    downloadSelectedButton: document.querySelector("[data-download-selected]"),
    deploySelectedButton: document.querySelector("[data-deploy-selected]"),
    startOauthButton: document.querySelector("[data-start-oauth]"),
    saveManualAuthButton: document.querySelector("[data-save-manual-auth]")
  };

  const state = {
    auth: readStorage(KEYS.auth, null),
    drafts: readStorage(KEYS.drafts, {}),
    tree: readStorage(KEYS.tree, { expanded: {} }),
    files: [],
    selectedFileId: null,
    search: "",
    syncState: "idle",
    syncMessage: "",
    orgInfo: null,
    pendingAuthMessage: null,
    log: [
      {
        type: "info",
        title: "Workspace ready",
        message:
          "Add your GitHub Pages origin to Salesforce CORS and use this page URL as an allowed callback in your Connected App."
      }
    ]
  };

  function redirectUri() {
    if (salesforceConfig.redirectUri) {
      return String(salesforceConfig.redirectUri).trim().replace(/\/+$/, "");
    }

    if (siteConfig.baseUrl) {
      return String(siteConfig.baseUrl).trim().replace(/\/+$/, "");
    }

    return `${window.location.origin}${window.location.pathname}`.replace(/\/+$/, "");
  }

  function configuredClientId() {
    const configured =
      window.LIGHTNING_STUDIO_SALESFORCE_CLIENT_ID || salesforceConfig.clientId || "";
    return configured.trim();
  }

  function hasConfiguredClientId() {
    return !!configuredClientId();
  }

  function nowLabel(value) {
    return value ? new Date(value).toLocaleString() : "Not available";
  }

  function cleanUrl(value) {
    return String(value || "").trim().replace(/\/+$/, "");
  }

  function activeFile() {
    return state.files.find((file) => file.id === state.selectedFileId) || null;
  }

  function currentSource(file) {
    return file && Object.prototype.hasOwnProperty.call(state.drafts, file.id)
      ? state.drafts[file.id]
      : file?.source || "";
  }

  function isDirty(file) {
    return !!file && currentSource(file) !== file.source;
  }

  function setAuth(auth) {
    state.auth = auth;
    writeStorage(KEYS.auth, auth);
  }

  function clearAuth() {
    state.auth = null;
    localStorage.removeItem(KEYS.auth);
  }

  function setDraft(fileId, value) {
    state.drafts[fileId] = value;
    writeStorage(KEYS.drafts, state.drafts);
  }

  function clearDraft(fileId) {
    delete state.drafts[fileId];
    writeStorage(KEYS.drafts, state.drafts);
  }

  function setExpanded(key, value) {
    state.tree.expanded[key] = value;
    writeStorage(KEYS.tree, state.tree);
  }

  function expanded(key, fallback) {
    return Object.prototype.hasOwnProperty.call(state.tree.expanded, key)
      ? state.tree.expanded[key]
      : fallback;
  }

  function addLog(type, title, message) {
    state.log = [{ type, title, message }, ...state.log].slice(0, 14);
    renderLog();
  }

  function counts() {
    return {
      apex: state.files.filter((file) => file.family.startsWith("apex")).length,
      aura: state.files.filter((file) => file.family === "aura").length,
      lwc: state.files.filter((file) => file.family === "lwc").length
    };
  }

  function feedback(type, title, message) {
    const tone = type === "error" ? "error" : type === "success" ? "success" : "info";
    dom.authFeedback.innerHTML = `
      <div class="callout ${tone}">
        <div>
          <strong>${escapeHtml(title)}</strong>
          <p class="muted">${escapeHtml(message)}</p>
        </div>
      </div>
    `;
  }

  function normalizeSalesforceError(message) {
    const raw = String(message || "");
    if (/redirect_uri.*must match configuration/i.test(raw)) {
      return `${raw} Allowed Callback URL in Salesforce must exactly equal: ${redirectUri()}`;
    }
    if (
      /not approved|approve this consumer|remote access application|admin approved users are pre-authorized/i.test(
        raw
      )
    ) {
      return `${raw} Ask a Salesforce admin to pre-approve the Lightning Studio Connected App for this org.`;
    }

    return raw;
  }

  function updateOauthAvailability() {
    if (!dom.startOauthButton) return;
    const ready = hasConfiguredClientId();
    dom.startOauthButton.disabled = !ready;
    dom.startOauthButton.textContent = ready
      ? "Login with Salesforce"
      : "Login with Salesforce (Owner setup required)";
  }

  function renderLog() {
    dom.syncLog.innerHTML = state.log
      .map(
        (entry) => `
          <div class="sync-log-item ${escapeHtml(entry.type)}">
            <strong>${escapeHtml(entry.title)}</strong>
            <p>${escapeHtml(entry.message)}</p>
          </div>
        `
      )
      .join("");
  }

  function renderMetrics() {
    const metric = counts();
    dom.metricConnection.textContent = !state.auth
      ? "Offline"
      : state.syncState === "syncing"
        ? "Syncing"
        : "Connected";
    dom.metricApex.textContent = String(metric.apex);
    dom.metricAura.textContent = String(metric.aura);
    dom.metricLwc.textContent = String(metric.lwc);
  }

  function renderSummary() {
    if (!state.auth) {
      dom.workspaceHeading.textContent = "Connect a Salesforce org";
      dom.workspaceCopy.textContent =
        "Sign in with Salesforce and Lightning Studio will retrieve Apex, Aura, and LWC by default.";
      dom.sidebarCaption.textContent =
        "Connect a Salesforce org to retrieve Apex classes, Aura bundles, and Lightning Web Components.";
      dom.orgStatusCallout.className = "callout info";
      dom.orgStatusCallout.innerHTML = `
        <div>
          <strong>Waiting for authentication</strong>
          <p class="muted">Sign in with Salesforce or use the advanced manual token option to begin.</p>
        </div>
      `;
      dom.orgMeta.innerHTML = `
        <div class="studio-org-meta-empty">
          <p>No active Salesforce org is connected yet.</p>
        </div>
      `;
      return;
    }

    dom.workspaceHeading.textContent = state.orgInfo?.displayName || state.auth.instanceUrl;
    dom.workspaceCopy.textContent =
      state.syncState === "syncing"
        ? "Retrieving Apex, Aura, and Lightning Web Components from Salesforce."
        : "Browse source files from the explorer, edit them locally, and deploy targeted changes.";
    dom.sidebarCaption.textContent =
      "Search synced metadata, open source files, and deploy changes back to your connected org.";
    dom.orgStatusCallout.className = `callout ${
      state.syncState === "error" ? "error" : state.syncState === "syncing" ? "warning" : "success"
    }`;
    dom.orgStatusCallout.innerHTML = `
      <div>
        <strong>${escapeHtml(
          state.syncState === "syncing" ? "Sync in progress" : state.syncState === "error" ? "Sync needs attention" : "Org connected"
        )}</strong>
        <p class="muted">${escapeHtml(state.syncMessage || "Connected and ready for metadata retrieval.")}</p>
      </div>
    `;
    dom.orgMeta.innerHTML = `
      <article class="org-meta-item">
        <span>Instance</span>
        <strong>${escapeHtml(state.auth.instanceUrl)}</strong>
      </article>
      <article class="org-meta-item">
        <span>Auth mode</span>
        <strong>${escapeHtml(state.auth.authType === "manual" ? "Manual session token" : "OAuth browser flow")}</strong>
      </article>
      <article class="org-meta-item">
        <span>API version</span>
        <strong>${escapeHtml(state.auth.apiVersion || "Resolving...")}</strong>
      </article>
      <article class="org-meta-item">
        <span>Last sync</span>
        <strong>${escapeHtml(nowLabel(state.auth.lastSyncedAt))}</strong>
      </article>
    `;
  }

  function fileIconClass(file) {
    return file.family === "lwc" ? "lwc" : file.family === "aura" ? "aura" : "apex";
  }

  function fileIconLabel(file) {
    const extension = (file.extension || "").replace(".", "");
    return extension ? extension.slice(0, 3).toUpperCase() : file.family.slice(0, 3).toUpperCase();
  }

  function fileButton(file) {
    return `
      <button class="tree-file ${file.id === state.selectedFileId ? "active" : ""}" type="button" data-file-id="${escapeHtml(file.id)}">
        <span class="file-icon ${fileIconClass(file)}">${escapeHtml(fileIconLabel(file))}</span>
        <span>${escapeHtml(file.fileName)}</span>
      </button>
    `;
  }

  function visibleSections() {
    const query = state.search.trim().toLowerCase();
    return sections
      .map((section) => {
        const files = state.files.filter((file) => file.family === section.key);
        if (!section.grouped) {
          const matched = files
            .filter(
              (file) =>
                !query ||
                file.fileName.toLowerCase().includes(query) ||
                file.label.toLowerCase().includes(query)
            )
            .sort((a, b) => a.fileName.localeCompare(b.fileName));
          return { ...section, count: matched.length, files: matched };
        }

        const bundles = [...new Set(files.map((file) => file.bundleName))]
          .map((bundleName) => ({
            bundleName,
            files: files
              .filter((file) => file.bundleName === bundleName)
              .sort((a, b) => a.fileName.localeCompare(b.fileName))
          }))
          .filter(
            (bundle) =>
              !query ||
              bundle.bundleName.toLowerCase().includes(query) ||
              bundle.files.some(
                (file) =>
                  file.fileName.toLowerCase().includes(query) ||
                  file.label.toLowerCase().includes(query)
              )
          )
          .sort((a, b) => a.bundleName.localeCompare(b.bundleName));
        return {
          ...section,
          bundles,
          count: bundles.reduce((sum, bundle) => sum + bundle.files.length, 0)
        };
      })
      .filter((section) => (section.grouped ? section.bundles.length : section.files.length));
  }

  function renderSidebar() {
    if (!state.auth || !state.files.length) {
      dom.sidebarEmpty.hidden = false;
      dom.sidebarList.hidden = true;
      if (state.auth && state.syncState === "syncing") {
        dom.sidebarEmpty.innerHTML = `
          <h3>Retrieving metadata</h3>
          <p>Lightning Studio is downloading Apex, Aura, and LWC from your org now.</p>
        `;
      }
      return;
    }

    const data = visibleSections();
    if (!data.length) {
      dom.sidebarEmpty.hidden = false;
      dom.sidebarList.hidden = true;
      dom.sidebarEmpty.innerHTML = `
        <h3>No files match this search</h3>
        <p>Try a broader component name or clear the explorer filter.</p>
      `;
      return;
    }

    dom.sidebarEmpty.hidden = true;
    dom.sidebarList.hidden = false;
    dom.sidebarList.innerHTML = data
      .map((section) => {
        const sectionKey = `section:${section.key}`;
        const sectionOpen = expanded(sectionKey, true);
        const content = section.grouped
          ? section.bundles
              .map((bundle) => {
                const bundleKey = `bundle:${section.key}:${bundle.bundleName}`;
                const bundleOpen = expanded(bundleKey, true);
                return `
                  <div class="tree-bundle">
                    <button class="tree-toggle" type="button" data-tree-key="${escapeHtml(bundleKey)}">
                      <span class="tree-caret">${bundleOpen ? "&#9662;" : "&#9656;"}</span>
                      <span class="folder-icon"></span>
                      <span>${escapeHtml(bundle.bundleName)}</span>
                      <span class="tree-count">${bundle.files.length}</span>
                    </button>
                    <div class="tree-children" ${bundleOpen ? "" : "hidden"}>
                      ${bundle.files.map(fileButton).join("")}
                    </div>
                  </div>
                `;
              })
              .join("")
          : section.files.map(fileButton).join("");
        return `
          <div class="tree-section">
            <button class="tree-toggle" type="button" data-tree-key="${escapeHtml(sectionKey)}">
              <span class="tree-caret">${sectionOpen ? "&#9662;" : "&#9656;"}</span>
              <span class="folder-icon"></span>
              <span>${escapeHtml(section.label)}</span>
              <span class="tree-count">${section.count}</span>
            </button>
            <div class="tree-children" ${sectionOpen ? "" : "hidden"}>
              ${content}
            </div>
          </div>
        `;
      })
      .join("");
  }

  function renderEditor() {
    const file = activeFile();
    if (!file) {
      dom.editorTitle.textContent = "Workspace editor";
      dom.editorSubtitle.textContent = "Select a file from the left explorer after connecting your org.";
      dom.editorTags.innerHTML = "";
      dom.editorEmpty.hidden = false;
      dom.editorShell.hidden = true;
      dom.sourceEditor.value = "";
      dom.editorStatus.className = "callout info";
      dom.editorStatus.innerHTML = `
        <div>
          <strong>Draft ready</strong>
          <p class="muted">Edits stay local until you deploy them back to Salesforce.</p>
        </div>
      `;
      return;
    }

    dom.editorTitle.textContent = file.fileName;
    dom.editorSubtitle.textContent = `${labels[file.family]} / ${file.bundleName || file.label}`;
    dom.editorTags.innerHTML = `
      <span class="chip secondary">${escapeHtml(labels[file.family])}</span>
      ${file.bundleName ? `<span class="chip secondary">${escapeHtml(file.bundleName)}</span>` : ""}
      <span class="chip secondary">${escapeHtml(file.recordId)}</span>
    `;
    dom.editorEmpty.hidden = true;
    dom.editorShell.hidden = false;
    if (dom.sourceEditor.value !== currentSource(file)) dom.sourceEditor.value = currentSource(file);
    dom.editorStatus.className = `callout ${isDirty(file) ? "warning" : "success"}`;
    dom.editorStatus.innerHTML = `
      <div>
        <strong>${escapeHtml(isDirty(file) ? "Unsaved local draft" : "In sync with org")}</strong>
        <p class="muted">${escapeHtml(
          isDirty(file)
            ? "Your current changes are stored in this browser and have not been deployed yet."
            : "This editor matches the most recently retrieved Salesforce version."
        )}</p>
      </div>
    `;
  }

  function renderActions() {
    const file = activeFile();
    dom.syncOrgButton.disabled = !state.auth || state.syncState === "syncing";
    dom.downloadSnapshotButton.disabled = !state.auth || !state.files.length;
    dom.disconnectOrgButton.disabled = !state.auth;
    dom.retrieveSelectedButton.disabled = !file || state.syncState === "syncing";
    dom.saveDraftButton.disabled = !file;
    dom.copySelectedButton.disabled = !file;
    dom.downloadSelectedButton.disabled = !file;
    dom.deploySelectedButton.disabled = !file || state.syncState === "syncing";
  }

  function render() {
    renderMetrics();
    renderSummary();
    renderLog();
    renderSidebar();
    renderEditor();
    renderActions();
  }

  async function fetchJson(url, init) {
    const response = await fetch(url, init);
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (error) {
      data = null;
    }
    if (!response.ok) {
      const message =
        (Array.isArray(data) && data[0]?.message) ||
        data?.message ||
        text ||
        `${response.status} ${response.statusText}`;
      throw new Error(message);
    }
    return { data, text };
  }

  async function sf(path, init) {
    const headers = new Headers(init?.headers || {});
    headers.set("Authorization", `Bearer ${state.auth.accessToken}`);
    headers.set("Accept", "application/json");
    if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    return fetchJson(`${state.auth.instanceUrl}${path}`, { ...init, headers });
  }

  async function ensureApiVersion() {
    if (state.auth.apiVersion) return state.auth.apiVersion;
    const { data } = await sf("/services/data/");
    const version = [...data].sort((a, b) => Number(b.version) - Number(a.version))[0]?.version;
    state.auth.apiVersion = `v${version}`;
    setAuth(state.auth);
    return state.auth.apiVersion;
  }

  async function toolingQuery(soql) {
    const apiVersion = await ensureApiVersion();
    let url = `${state.auth.instanceUrl}/services/data/${apiVersion}/tooling/query?q=${encodeURIComponent(soql)}`;
    const all = [];
    while (url) {
      const { data } = await fetchJson(url, {
        headers: {
          Authorization: `Bearer ${state.auth.accessToken}`,
          Accept: "application/json"
        }
      });
      all.push(...(data.records || []));
      url = data.nextRecordsUrl ? `${state.auth.instanceUrl}${data.nextRecordsUrl}` : null;
    }
    return all;
  }

  function chunk(values, size) {
    const result = [];
    for (let i = 0; i < values.length; i += size) result.push(values.slice(i, i + size));
    return result;
  }

  function auraFileName(bundleName, defType) {
    const map = {
      COMPONENT: `${bundleName}.cmp`,
      APPLICATION: `${bundleName}.app`,
      EVENT: `${bundleName}.evt`,
      INTERFACE: `${bundleName}.intf`,
      TOKENS: `${bundleName}.tokens`,
      STYLE: `${bundleName}.css`,
      CONTROLLER: `${bundleName}Controller.js`,
      HELPER: `${bundleName}Helper.js`,
      RENDERER: `${bundleName}Renderer.js`,
      DESIGN: `${bundleName}.design`,
      SVG: `${bundleName}.svg`,
      DOCUMENTATION: `${bundleName}.auradoc`
    };
    return map[defType] || `${bundleName}.${String(defType || "resource").toLowerCase()}`;
  }

  function lwcFileName(bundleName, filePath, format) {
    if (filePath) {
      const parts = filePath.split("/");
      return parts[parts.length - 1];
    }
    return `${bundleName}.${String(format || "txt").toLowerCase()}`;
  }

  async function resolveOrgInfo() {
    const apiVersion = await ensureApiVersion();
    await sf(`/services/data/${apiVersion}/`);
    return {
      displayName: state.auth.instanceUrl.replace(/^https?:\/\//, ""),
      apiVersion
    };
  }

  async function syncOrg(options) {
    const config = { autoDownload: false, ...options };
    state.syncState = "syncing";
    state.syncMessage = "Retrieving Apex, Aura, and Lightning Web Components from Salesforce.";
    render();
    addLog("info", "Sync started", "Downloading Apex classes, Apex triggers, Aura bundles, and LWC resources.");

    try {
      state.orgInfo = await resolveOrgInfo();
      const files = [];

      const apexClasses = await toolingQuery(
        "SELECT Id, Name, Body FROM ApexClass ORDER BY Name"
      );
      apexClasses.forEach((record) => {
        files.push({
          id: `apex-class:${record.Id}`,
          recordId: record.Id,
          family: "apex-class",
          label: record.Name,
          fileName: `${record.Name}.cls`,
          extension: ".cls",
          source: record.Body || "",
          bundleName: null
        });
      });
      addLog("success", "Apex classes synced", `Retrieved ${apexClasses.length} Apex classes.`);

      const apexTriggers = await toolingQuery(
        "SELECT Id, Name, Body FROM ApexTrigger ORDER BY Name"
      );
      apexTriggers.forEach((record) => {
        files.push({
          id: `apex-trigger:${record.Id}`,
          recordId: record.Id,
          family: "apex-trigger",
          label: record.Name,
          fileName: `${record.Name}.trigger`,
          extension: ".trigger",
          source: record.Body || "",
          bundleName: null
        });
      });
      addLog("success", "Apex triggers synced", `Retrieved ${apexTriggers.length} Apex triggers.`);

      const auraBundles = await toolingQuery(
        "SELECT Id, DeveloperName FROM AuraDefinitionBundle ORDER BY DeveloperName"
      );
      const auraMap = new Map(auraBundles.map((bundle) => [bundle.Id, bundle.DeveloperName]));
      for (const ids of chunk(auraBundles.map((bundle) => bundle.Id), 40)) {
        if (!ids.length) continue;
        const rows = await toolingQuery(
          `SELECT Id, AuraDefinitionBundleId, DefType, Source FROM AuraDefinition WHERE AuraDefinitionBundleId IN ('${ids.join(
            "','"
          )}')`
        );
        rows.forEach((record) => {
          const bundleName = auraMap.get(record.AuraDefinitionBundleId) || "AuraBundle";
          files.push({
            id: `aura:${record.Id}`,
            recordId: record.Id,
            family: "aura",
            label: record.DefType || "Aura Resource",
            fileName: auraFileName(bundleName, record.DefType),
            extension: "",
            source: record.Source || "",
            bundleName
          });
        });
      }
      addLog("success", "Aura bundles synced", `Retrieved ${auraBundles.length} Aura bundles.`);

      const lwcBundles = await toolingQuery(
        "SELECT Id, DeveloperName FROM LightningComponentBundle ORDER BY DeveloperName"
      );
      const lwcMap = new Map(lwcBundles.map((bundle) => [bundle.Id, bundle.DeveloperName]));
      for (const ids of chunk(lwcBundles.map((bundle) => bundle.Id), 40)) {
        if (!ids.length) continue;
        const rows = await toolingQuery(
          `SELECT Id, LightningComponentBundleId, FilePath, Format, Source FROM LightningComponentResource WHERE LightningComponentBundleId IN ('${ids.join(
            "','"
          )}')`
        );
        rows.forEach((record) => {
          const bundleName = lwcMap.get(record.LightningComponentBundleId) || "lwcBundle";
          const fileName = lwcFileName(bundleName, record.FilePath, record.Format);
          const ext = /\.[^.]+$/.exec(fileName);
          files.push({
            id: `lwc:${record.Id}`,
            recordId: record.Id,
            family: "lwc",
            label: record.Format || "resource",
            fileName,
            extension: ext ? ext[0] : "",
            source: record.Source || "",
            bundleName
          });
        });
      }
      addLog("success", "LWC bundles synced", `Retrieved ${lwcBundles.length} LWC bundles.`);

      state.files = files;
      if (!files.some((file) => file.id === state.selectedFileId)) {
        state.selectedFileId = files[0]?.id || null;
      }
      state.syncState = "ready";
      state.syncMessage = `Connected to ${state.orgInfo.displayName}. Synced ${files.length} source files.`;
      state.auth.lastSyncedAt = new Date().toISOString();
      setAuth(state.auth);
      render();
      if (config.autoDownload) downloadSnapshot(true);
    } catch (error) {
      state.syncState = "error";
      state.syncMessage = normalizeSalesforceError(
        error.message || "Unable to sync from Salesforce."
      );
      addLog(
        "error",
        "Sync failed",
        `${state.syncMessage} Check token validity, Connected App setup, and Salesforce CORS.`
      );
      if (/INVALID_SESSION_ID|401/.test(state.syncMessage)) {
        clearAuth();
        state.orgInfo = null;
        state.files = [];
        state.selectedFileId = null;
      }
      render();
    }
  }

  async function testConnection(auth) {
    const { data } = await fetchJson(`${auth.instanceUrl}/services/data/`, {
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        Accept: "application/json"
      }
    });
    const version = [...data].sort((a, b) => Number(b.version) - Number(a.version))[0]?.version;
    return `v${version}`;
  }

  function consumeOauthHash() {
    if (!window.location.hash.startsWith("#")) return;
    const params = new URLSearchParams(window.location.hash.slice(1));
    if (params.get("error")) {
      state.pendingAuthMessage = {
        type: "error",
        title: "Salesforce authentication failed",
        message: normalizeSalesforceError(
          params.get("error_description") || params.get("error")
        )
      };
      history.replaceState({}, document.title, window.location.pathname + window.location.search);
      return;
    }
    if (!params.get("access_token") || !params.get("instance_url")) return;
    const pending = readStorage(KEYS.pending, null);
    setAuth({
      authType: "oauth",
      accessToken: params.get("access_token"),
      instanceUrl: params.get("instance_url"),
      loginDomain: pending?.loginDomain || "https://login.salesforce.com",
      clientId: pending?.clientId || "",
      apiVersion: state.auth?.apiVersion || null,
      lastSyncedAt: null
    });
    localStorage.removeItem(KEYS.pending);
    state.pendingAuthMessage = {
      type: "success",
      title: "Authentication complete",
      message: "Salesforce returned a browser access token. Lightning Studio can sync your metadata now."
    };
    history.replaceState({}, document.title, window.location.pathname + window.location.search);
  }

  function startOauthFlow() {
    const form = {
      loginDomain:
        dom.oauthLoginDomain.value === "custom"
          ? cleanUrl(dom.oauthCustomDomain.value)
          : cleanUrl(dom.oauthLoginDomain.value),
      clientId: configuredClientId()
    };
    writeStorage(KEYS.oauthForm, form);
    if (!hasConfiguredClientId()) {
      feedback(
        "error",
        "Lightning Studio is not configured yet",
        "Add your Salesforce Connected App consumer key to Lightning Studio before enabling one-click Salesforce sign-in."
      );
      return;
    }
    if (!form.loginDomain) {
      feedback(
        "error",
        "Missing login domain",
        "Choose a Salesforce login domain before starting the browser flow."
      );
      return;
    }
    if (window.location.protocol === "file:") {
      feedback(
        "error",
        "OAuth needs a hosted URL",
        "Browser OAuth callbacks cannot return to a local file path. Host Lightning Studio on GitHub Pages or use the manual token option."
      );
      return;
    }
    const oauthState = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    writeStorage(KEYS.pending, { ...form, state: oauthState });
    const url = new URL(`${form.loginDomain}/services/oauth2/authorize`);
    url.searchParams.set("response_type", "token");
    url.searchParams.set("client_id", form.clientId);
    url.searchParams.set("redirect_uri", redirectUri());
    url.searchParams.set(
      "scope",
      Array.isArray(salesforceConfig.scopes) && salesforceConfig.scopes.length
        ? salesforceConfig.scopes.join(" ")
        : "api"
    );
    url.searchParams.set("state", oauthState);
    url.searchParams.set("prompt", "login");
    window.location.assign(url.toString());
  }

  async function connectManualToken() {
    const form = {
      instanceUrl: cleanUrl(dom.manualInstanceUrl.value),
      accessToken: dom.manualAccessToken.value.trim()
    };
    writeStorage(KEYS.manualForm, form);
    if (!form.instanceUrl || !form.accessToken) {
      feedback(
        "error",
        "Missing token details",
        "Paste both the Salesforce instance URL and a valid session/access token."
      );
      return;
    }
    feedback(
      "info",
      "Testing Salesforce connection",
      "Lightning Studio is verifying the provided token and instance URL."
    );
    try {
      const apiVersion = await testConnection(form);
      setAuth({
        authType: "manual",
        instanceUrl: form.instanceUrl,
        accessToken: form.accessToken,
        loginDomain: form.instanceUrl,
        apiVersion,
        lastSyncedAt: null
      });
      dom.authModal.hidden = true;
      addLog(
        "success",
        "Manual token accepted",
        "Salesforce connection verified. Retrieving Apex, Aura, and LWC now."
      );
      await syncOrg({ autoDownload: true });
    } catch (error) {
      feedback(
        "error",
        "Unable to validate token",
        `${normalizeSalesforceError(error.message)} If this is a browser CORS issue, add your site origin in Salesforce Setup > CORS.`
      );
    }
  }

  function downloadSnapshot(isAutomatic) {
    if (!state.auth || !state.files.length) return;
    const hostLabel = state.auth.instanceUrl.replace(/^https?:\/\//, "").replace(/[^\w.-]+/g, "-");
    downloadText(
      `lightning-studio-${hostLabel}-snapshot.json`,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          instanceUrl: state.auth.instanceUrl,
          apiVersion: state.auth.apiVersion,
          counts: counts(),
          files: state.files.map((file) => ({
            family: file.family,
            bundleName: file.bundleName,
            fileName: file.fileName,
            recordId: file.recordId,
            source: currentSource(file)
          }))
        },
        null,
        2
      )
    );
    addLog(
      "success",
      isAutomatic ? "Default metadata snapshot downloaded" : "Snapshot downloaded",
      "Apex, Aura, and LWC source were exported as a browser-side JSON snapshot."
    );
  }

  async function retrieveSelected() {
    const file = activeFile();
    if (!file) return;
    state.syncState = "syncing";
    state.syncMessage = `Retrieving latest ${file.fileName} from Salesforce.`;
    render();
    try {
      const objectName =
        file.family === "apex-class"
          ? "ApexClass"
          : file.family === "apex-trigger"
            ? "ApexTrigger"
            : file.family === "aura"
              ? "AuraDefinition"
              : "LightningComponentResource";
      const fieldName = file.family.startsWith("apex") ? "Body" : "Source";
      const rows = await toolingQuery(
        `SELECT Id, ${fieldName} FROM ${objectName} WHERE Id = '${file.recordId}'`
      );
      const latest = rows[0]?.[fieldName] || "";
      state.files = state.files.map((item) =>
        item.id === file.id ? { ...item, source: latest } : item
      );
      clearDraft(file.id);
      state.syncState = "ready";
      state.syncMessage = `${file.fileName} was refreshed from Salesforce.`;
      addLog("success", "File retrieved", `${file.fileName} was refreshed from the org.`);
      render();
    } catch (error) {
      state.syncState = "error";
      state.syncMessage = normalizeSalesforceError(error.message);
      addLog("error", "Retrieve failed", state.syncMessage);
      render();
    }
  }

  function deployRequest(file, source) {
    const objectName =
      file.family === "apex-class"
        ? "ApexClass"
        : file.family === "apex-trigger"
          ? "ApexTrigger"
          : file.family === "aura"
            ? "AuraDefinition"
            : "LightningComponentResource";
    const fieldName = file.family.startsWith("apex") ? "Body" : "Source";
    return {
      path: `/services/data/${state.auth.apiVersion}/tooling/sobjects/${objectName}/${file.recordId}`,
      body: { [fieldName]: source }
    };
  }

  async function deploySelected() {
    const file = activeFile();
    if (!file) return;
    state.syncState = "syncing";
    state.syncMessage = `Deploying ${file.fileName} to Salesforce.`;
    render();
    try {
      const request = deployRequest(file, currentSource(file));
      await sf(request.path, {
        method: "PATCH",
        body: JSON.stringify(request.body)
      });
      state.files = state.files.map((item) =>
        item.id === file.id ? { ...item, source: currentSource(file) } : item
      );
      clearDraft(file.id);
      state.syncState = "ready";
      state.syncMessage = `${file.fileName} deployed successfully.`;
      addLog(
        "success",
        "Deploy complete",
        `${file.fileName} was updated in Salesforce through the Tooling API.`
      );
      render();
    } catch (error) {
      state.syncState = "error";
      state.syncMessage = normalizeSalesforceError(error.message);
      addLog("error", "Deploy failed", state.syncMessage);
      render();
    }
  }

  function hydrateForms() {
    const oauthForm = readStorage(KEYS.oauthForm, {
      loginDomain: "https://login.salesforce.com"
    });
    const manualForm = readStorage(KEYS.manualForm, {
      instanceUrl: "",
      accessToken: ""
    });
    const custom =
      oauthForm.loginDomain !== "https://login.salesforce.com" &&
      oauthForm.loginDomain !== "https://test.salesforce.com";
    dom.oauthLoginDomain.value = custom ? "custom" : oauthForm.loginDomain;
    dom.oauthCustomDomain.value = custom ? oauthForm.loginDomain : "";
    dom.oauthCustomDomainField.hidden = !custom;
    dom.oauthRedirectUri.value = redirectUri();
    dom.manualInstanceUrl.value = manualForm.instanceUrl || "";
    dom.manualAccessToken.value = manualForm.accessToken || "";
    updateOauthAvailability();
  }

  function bind() {
    dom.openConnectButtons.forEach((button) =>
      button.addEventListener("click", () => (dom.authModal.hidden = false))
    );
    dom.closeAuthButtons.forEach((button) =>
      button.addEventListener("click", () => (dom.authModal.hidden = true))
    );
    dom.retryAuthButton.addEventListener("click", () => (dom.authModal.hidden = false));
    dom.syncOrgButton.addEventListener("click", () => syncOrg({ autoDownload: false }));
    dom.downloadSnapshotButton.addEventListener("click", () => downloadSnapshot(false));
    dom.disconnectOrgButton.addEventListener("click", () => {
      clearAuth();
      state.orgInfo = null;
      state.files = [];
      state.selectedFileId = null;
      state.syncState = "idle";
      state.syncMessage = "";
      addLog("info", "Disconnected", "Salesforce credentials were cleared from this browser.");
      render();
      dom.authModal.hidden = false;
    });
    dom.retrieveSelectedButton.addEventListener("click", retrieveSelected);
    dom.saveDraftButton.addEventListener("click", () => {
      const file = activeFile();
      if (!file) return;
      setDraft(file.id, dom.sourceEditor.value);
      addLog("success", "Draft saved locally", `${file.fileName} was saved to browser local storage.`);
      renderEditor();
    });
    dom.copySelectedButton.addEventListener("click", async () => {
      const file = activeFile();
      if (!file) return;
      await copyText(currentSource(file));
      addLog("success", "Copied to clipboard", `${file.fileName} was copied.`);
    });
    dom.downloadSelectedButton.addEventListener("click", () => {
      const file = activeFile();
      if (!file) return;
      downloadText(file.fileName, currentSource(file));
      addLog("success", "File downloaded", `${file.fileName} was downloaded locally.`);
    });
    dom.deploySelectedButton.addEventListener("click", deploySelected);
    dom.oauthLoginDomain.addEventListener("change", () => {
      dom.oauthCustomDomainField.hidden = dom.oauthLoginDomain.value !== "custom";
    });
    dom.startOauthButton.addEventListener("click", startOauthFlow);
    dom.saveManualAuthButton.addEventListener("click", connectManualToken);
    dom.sidebarSearch.addEventListener("input", () => {
      state.search = dom.sidebarSearch.value;
      renderSidebar();
    });
    dom.sidebarList.addEventListener("click", (event) => {
      const toggle = event.target.closest("[data-tree-key]");
      if (toggle) {
        const key = toggle.dataset.treeKey;
        setExpanded(key, !expanded(key, true));
        renderSidebar();
        return;
      }
      const fileButton = event.target.closest("[data-file-id]");
      if (fileButton) {
        state.selectedFileId = fileButton.dataset.fileId;
        render();
      }
    });
    dom.sourceEditor.addEventListener("input", () => {
      const file = activeFile();
      if (!file) return;
      setDraft(file.id, dom.sourceEditor.value);
      renderEditor();
      renderActions();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !dom.authModal.hidden) dom.authModal.hidden = true;
    });
  }

  async function boot() {
    consumeOauthHash();
    hydrateForms();
    bind();
    if (state.pendingAuthMessage) {
      feedback(
        state.pendingAuthMessage.type,
        state.pendingAuthMessage.title,
        state.pendingAuthMessage.message
      );
    } else if (!hasConfiguredClientId()) {
      feedback(
        "error",
        "One-click Salesforce sign-in is not configured yet",
        "Add your Salesforce Connected App consumer key to assets/salesforce-config.js to enable the Login with Salesforce button."
      );
    } else {
      feedback(
        "info",
        "Before you start",
        "Add this site origin to Salesforce CORS and register this page URL as an allowed callback in your Connected App."
      );
    }
    render();
    if (!state.auth) {
      dom.authModal.hidden = false;
      return;
    }
    await syncOrg({ autoDownload: !state.auth.lastSyncedAt });
    dom.authModal.hidden = !(!state.auth || state.syncState === "error");
  }

  boot();
})();
