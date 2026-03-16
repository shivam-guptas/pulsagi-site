(function () {
  const { featureCards, homeFaqs, siteConfig, toolCategories, toolRegistry } =
    window.LightningStudioData;

  const rootPath = document.body.dataset.root || ".";
  const page = document.body.dataset.page || "home";

  function hrefFor(path) {
    return `${rootPath}${path}`;
  }

  function toolHref(slug) {
    return hrefFor(`/tools/${slug}/`);
  }

  function renderShell() {
    const headerTarget = document.querySelector("[data-site-header]");
    const footerTarget = document.querySelector("[data-site-footer]");

    if (headerTarget) {
      headerTarget.innerHTML = `
        <header class="site-header">
          <div class="studio-topbar">
            <a class="studio-logo" href="${hrefFor("/")}">${siteConfig.name}</a>
            <nav class="studio-menu" aria-label="Primary">
              <a class="studio-menu-link" href="${toolHref("lwc-generator")}">New</a>
              <a class="studio-menu-link" href="${hrefFor("/tools/")}">Developer Tools</a>
              <a class="studio-menu-link" href="${hrefFor("/tools/")}">Utility Tools</a>
              <a class="studio-menu-link" href="${hrefFor("/docs/")}">Themes</a>
            </nav>
            <div class="studio-topbar-right">
              <span class="studio-edition">Developer Edition</span>
              <span class="studio-profile">Shivam Gupta</span>
            </div>
          </div>
        </header>
      `;
    }

    if (footerTarget) {
      footerTarget.innerHTML = `
        <footer class="site-footer">
          <div class="container footer-inner">
            <p>${siteConfig.name} · ${siteConfig.tagline}</p>
            <div class="footer-links">
              <a href="${hrefFor("/")}">Home</a>
              <a href="${hrefFor("/tools/")}">Tools</a>
              <a href="${hrefFor("/docs/")}">Docs</a>
              <a href="https://pulsagi.com/tools/" rel="noreferrer">Pulsagi Tools</a>
            </div>
          </div>
        </footer>
      `;
    }
  }

  function renderToolCard(tool) {
    return `
      <a class="tool-card" href="${toolHref(tool.slug)}">
        <span class="chip secondary">${tool.category}</span>
        <h3>${tool.title}</h3>
        <p>${tool.description}</p>
        <div class="card-meta">
          ${tool.keywords
            .slice(0, 3)
            .map((keyword) => `<span class="meta-tag">${keyword}</span>`)
            .join("")}
        </div>
      </a>
    `;
  }

  function renderHome() {
    const featureTarget = document.querySelector("[data-feature-cards]");
    const faqTarget = document.querySelector("[data-home-faqs]");

    if (featureTarget) {
      featureTarget.innerHTML = featureCards
        .map(
          (card) => `
            <article class="studio-info-card">
              <h3>${card.title}</h3>
              <p>${card.description}</p>
            </article>
          `
        )
        .join("");
    }

    if (faqTarget) {
      faqTarget.innerHTML = homeFaqs
        .map(
          (item) => `
            <article class="faq-card">
              <h3>${item.question}</h3>
              <p>${item.answer}</p>
            </article>
          `
        )
        .join("");
    }
  }

  function renderDirectory() {
    const searchInput = document.querySelector("[data-tool-search]");
    const categoryRow = document.querySelector("[data-category-filters]");
    const resultsTarget = document.querySelector("[data-tool-results]");
    let selectedCategory = "All";

    function currentSearch() {
      return (searchInput?.value || "").trim().toLowerCase();
    }

    function renderResults() {
      const matches = toolRegistry.filter((tool) => {
        const matchesCategory =
          selectedCategory === "All" || tool.category === selectedCategory;
        const haystack = [tool.title, tool.description, tool.tagline, ...tool.keywords]
          .join(" ")
          .toLowerCase();
        const matchesSearch = !currentSearch() || haystack.includes(currentSearch());
        return matchesCategory && matchesSearch;
      });

      if (!matches.length) {
        resultsTarget.innerHTML = `
          <div class="empty-state">
            <div>
              <h3>No tools match this filter</h3>
              <p class="muted">Try a broader keyword or switch back to All categories to browse the full Lightning Studio toolkit.</p>
            </div>
          </div>
        `;
        return;
      }

      resultsTarget.innerHTML = matches.map(renderToolCard).join("");
    }

    if (categoryRow) {
      categoryRow.innerHTML = [
        `<button class="button secondary" data-category="All">All</button>`,
        ...toolCategories.map(
          (category) =>
            `<button class="button ghost" data-category="${category}">${category}</button>`
        )
      ].join("");

      categoryRow.addEventListener("click", (event) => {
        const button = event.target.closest("[data-category]");
        if (!button) {
          return;
        }

        selectedCategory = button.dataset.category;
        categoryRow.querySelectorAll("[data-category]").forEach((item) => {
          item.className = `button ${
            item.dataset.category === selectedCategory ? "secondary" : "ghost"
          }`;
        });
        renderResults();
      });
    }

    searchInput?.addEventListener("input", renderResults);
    renderResults();
  }

  renderShell();

  if (page === "home") {
    renderHome();
  }

  if (page === "directory") {
    renderDirectory();
  }
})();
