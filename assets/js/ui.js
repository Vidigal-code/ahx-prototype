function assetPath(fileName) {
  return `${basePath()}${fileName}`;
}

function routePath(route) {
  return `${basePath()}${AHX_CONFIG.routes[route]}`;
}

function basePath() {
  const script = [...document.scripts].find((item) => item.src.endsWith("/assets/js/app.js"));
  const attribute = script?.getAttribute("src") ?? "assets/js/app.js";
  return attribute.replace("assets/js/app.js", "");
}

function node(tag, options = {}, children = []) {
  const element = document.createElement(tag);
  Object.entries(options).forEach(([key, value]) => {
    if (value === false || value === null || value === undefined) return;
    if (key === "className") element.className = value;
    else if (key === "text") element.textContent = value;
    else if (key === "html") element.innerHTML = value;
    else if (key.startsWith("on") && typeof value === "function") element.addEventListener(key.slice(2).toLowerCase(), value);
    else element.setAttribute(key, value);
  });
  children.filter(Boolean).forEach((child) => element.append(child));
  return element;
}

function lucideIcon(name, className = "lucide-icon") {
  return node("iconify-icon", { className, icon: resolveIconName(name), "aria-hidden": "true" });
}

function renderLucideIcons() {
  document.querySelectorAll("iconify-icon").forEach((icon) => {
    if (!icon.getAttribute("icon")) icon.setAttribute("icon", resolveIconName("circle"));
  });
}

function resolveIconName(name) {
  if (!name) return "tabler:circle";
  if (name.includes(":")) return name;
  return AHX_ICON_PROVIDER_MAP[name] ?? `tabler:${name}`;
}

function iconNameOf(entity) {
  return entity.iconName ?? AHX_ICON_MAP[entity.id] ?? "circle";
}

function iconButton(label, iconName, onClick, disabled = false, variant = "") {
  return node("button", { className: `icon-button ${variant ? `icon-button--${variant}` : ""}`.trim(), type: "button", "aria-label": label, title: label, onClick, disabled }, [
    lucideIcon(iconName, "lucide-icon icon-button__glyph")
  ]);
}

function iconTextButton(label, iconName, variant = "ghost", onClick = null, disabled = false) {
  return node("button", { className: `button button--${variant} button--icon-text`, type: onClick ? "button" : "submit", "aria-label": label, title: label, onClick, disabled }, [
    lucideIcon(iconName, "lucide-icon"),
    node("span", { text: label })
  ]);
}

function brandIconSource(variant = "auto") {
  if (variant === "dark-surface") return AHX_CONFIG.brand.icon;
  return getTheme() === "light" ? AHX_CONFIG.brand.iconLight : AHX_CONFIG.brand.icon;
}

function brandMark(size = "medium", variant = "auto") {
  return node("img", {
    className: `brand-mark brand-mark--${size}`,
    src: assetPath(brandIconSource(variant)),
    alt: AHX_CONFIG.brand.shortName
  });
}

function brandBlock(variant = "auto") {
  return node("a", { className: "brand-block", href: routePath("login"), "aria-label": AHX_CONFIG.brand.name }, [
    brandMark("small", variant),
    node("span", { className: "brand-block__name", text: AHX_CONFIG.brand.name })
  ]);
}

function siteHeader(activePage = "", leadingActions = []) {
  return node("header", { className: "site-header" }, [
    node("div", { className: "site-header__start" }, [
      ...leadingActions,
      brandBlock()
    ]),
    controlsBar()
  ]);
}

function appLayout(activePage, content) {
  return node("div", { className: "app-shell" }, [
    node("button", { className: "sidebar-overlay", type: "button", "aria-label": t("closeMenu"), onClick: closeSidebar }),
    renderSidebar(activePage),
    node("section", { className: "workspace" }, [
      siteHeader(activePage, [sidebarToggleButton()]),
      content,
      siteFooter()
    ]),
    renderNotificationModal(),
    renderVoiceAutomationModal()
  ]);
}

function renderSidebar(activePage = "") {
  return node("aside", { className: "sidebar" }, [
    node("div", { className: "sidebar__top" }, [
      brandBlock(),
      sidebarCloseButton()
    ]),
    renderSidebarLanguageControl(),
    node("p", { className: "sidebar__label", text: t("sidebarTitle") }),
    node("nav", { className: "sidebar__nav" }, AHX_CONFIG.navigation.map((item) =>
      node("a", {
        className: item.id === activePage ? "is-active" : "",
        href: routePath(item.route),
        onClick: closeSidebarOnMobile
      }, [
        lucideIcon(iconNameOf(item), "lucide-icon sidebar__nav-icon"),
        node("span", { text: t(item.labelKey) })
      ])
    ))
  ]);
}

function renderSidebarLanguageControl() {
  const languageSelect = node("select", { className: "select", "aria-label": t("language"), onChange: (event) => updatePreference("language", event.target.value) });
  Object.entries(languageMenu()).forEach(([value, label]) => {
    languageSelect.append(node("option", { value, text: label, selected: value === getLanguage() }));
  });
  return node("label", { className: "sidebar-language field field--compact" }, [
    node("span", { text: t("language") }),
    selectControl(languageSelect)
  ]);
}

function sidebarToggleButton() {
  return node("button", { className: "hamburger-button", type: "button", "aria-label": t("menu"), "aria-expanded": "true", onClick: toggleSidebar }, [
    lucideIcon("menu", "lucide-icon hamburger-button__icon")
  ]);
}

function sidebarCloseButton() {
  return node("button", { className: "sidebar__close", type: "button", "aria-label": t("closeMenu"), onClick: closeSidebar }, [
    lucideIcon("x", "lucide-icon")
  ]);
}

function toggleSidebar() {
  const shell = document.querySelector(".app-shell");
  if (!shell) return;
  const isOpen = shell.classList.toggle("is-sidebar-open");
  setSidebarExpanded(isOpen);
}

function closeSidebar() {
  const shell = document.querySelector(".app-shell");
  if (!shell) return;
  shell.classList.remove("is-sidebar-open");
  setSidebarExpanded(false);
}

function closeSidebarOnMobile() {
  closeSidebar();
}

function setSidebarExpanded(isExpanded) {
  document.querySelectorAll(".hamburger-button").forEach((button) => {
    button.setAttribute("aria-expanded", String(isExpanded));
  });
}

function syncSidebarState() {
  const shell = document.querySelector(".app-shell");
  if (!shell) return;
  shell.classList.remove("is-sidebar-open");
  shell.classList.remove("is-sidebar-collapsed");
  setSidebarExpanded(false);
}

function siteFooter() {
  return node("footer", { className: "site-footer" }, [
    node("div", { className: "site-footer__brand" }, [
      brandMark("small"),
      node("div", {}, [
        node("strong", { text: AHX_CONFIG.brand.name }),
        node("p", { text: t("footerCopy") })
      ])
    ])
  ]);
}

function controlsBar() {
  const themeButton = iconButton(t("theme"), getTheme() === "dark" ? "moon" : "sun", () => updatePreference("theme", getTheme() === "dark" ? "light" : "dark"));
  return node("div", { className: "controls-bar" }, [
    iconButton(t("notifications"), "bell", openNotificationModal),
    iconButton(t("microphone"), "mic", openVoiceAutomationModal),
    themeButton
  ]);
}

function renderNotificationModal() {
  if (storage.get("ahx_notification_modal", "") !== "open") return null;
  return node("section", { className: "filter-modal", role: "dialog", "aria-modal": "true" }, [
    node("div", { className: "filter-modal__panel filter-modal__panel--compact" }, [
      node("div", { className: "filter-modal__header" }, [
        node("div", { className: "diary-title" }, [
          lucideIcon("bell", "lucide-icon"),
          node("h2", { text: t("notifications") })
        ]),
        iconButton(t("close"), "x", closeNotificationModal)
      ]),
      node("div", { className: "empty-notifications" }, [
        lucideIcon("inbox", "lucide-icon"),
        node("p", { text: t("noNotifications") })
      ])
    ])
  ]);
}

function renderVoiceAutomationModal() {
  if (storage.get("ahx_voice_modal", "") !== "open") return null;
  return node("section", { className: "filter-modal", role: "dialog", "aria-modal": "true" }, [
    node("div", { className: "filter-modal__panel" }, [
      node("div", { className: "filter-modal__header" }, [
        node("div", { className: "diary-title" }, [
          lucideIcon("mic", "lucide-icon"),
          node("h2", { text: t("voiceAutomation") })
        ]),
        iconButton(t("close"), "x", closeVoiceAutomationModal)
      ]),
      voiceCategoryField(),
      voiceTaskField(),
      node("div", { className: "voice-status-card" }, [
        node("div", { className: "diary-title" }, [
          lucideIcon("audio-lines", "lucide-icon"),
          node("h3", { text: t("voiceStatus") })
        ]),
        node("button", { className: "mic-toggle", type: "button", onClick: toggleMicrophone }, [
          lucideIcon("mic", "lucide-icon"),
          node("span", { "data-voice-state": "", text: document.body.classList.contains("is-listening") ? t("micOn") : t("micOff") })
        ]),
        node("p", { text: t("voiceAutomationContext") })
      ])
    ])
  ]);
}

function voiceCategoryField() {
  const select = node("select", { name: "voiceCategory", className: "select" });
  AHX_FEATURES.forEach((category) => {
    select.append(node("option", {
      value: category.id,
      text: labelOf(category),
      selected: category.id === "personal",
      disabled: category.id !== "personal"
    }));
  });
  return node("label", { className: "field" }, [node("span", { text: t("category") }), selectControl(select)]);
}

function voiceTaskField() {
  const select = node("select", { name: "voiceTask", className: "select" });
  AHX_FEATURES.forEach((category) => {
    const group = node("optgroup", { label: labelOf(category) });
    category.items.forEach((item) => {
      const enabled = category.id === "personal" && AHX_PERSONAL_ACTIVE_IDS.includes(item.id);
      group.append(node("option", {
        value: item.id,
        text: labelOf(item),
        disabled: !enabled,
        selected: item.id === "travel"
      }));
    });
    select.append(group);
  });
  return node("label", { className: "field" }, [node("span", { text: t("task") }), selectControl(select)]);
}

function openNotificationModal() {
  storage.set("ahx_notification_modal", "open");
  renderApp();
}

function closeNotificationModal() {
  storage.set("ahx_notification_modal", "");
  renderApp();
}

function openVoiceAutomationModal() {
  storage.set("ahx_voice_modal", "open");
  renderApp();
}

function closeVoiceAutomationModal() {
  storage.set("ahx_voice_modal", "");
  renderApp();
}

function toggleMicrophone() {
  const isListening = document.body.classList.toggle("is-listening");
  updateStatus(isListening ? t("micOn") : t("micOff"));
  document.querySelectorAll("[data-voice-state]").forEach((item) => {
    item.textContent = isListening ? t("micOn") : t("micOff");
  });
}

function heroPanel() {
  return node("section", { className: "visual-panel" }, [
    node("img", { className: "visual-panel__image", src: assetPath(AHX_CONFIG.brand.banner), alt: AHX_CONFIG.brand.name }),
    node("div", { className: "visual-panel__overlay" }),
    node("div", { className: "visual-panel__content" }, [
      node("div", { className: "visual-panel__copy" }, [
        node("h1", { text: t("taglineStrong") }),
        node("p", { text: t("tagline") })
      ])
    ])
  ]);
}

function authLayout(content, activePage = "login") {
  return appLayout(activePage, node("div", { className: "site-frame" }, [
    node("div", { className: "auth-shell" }, [
      heroPanel(),
      node("section", { className: "auth-card" }, [
        content
      ])
    ])
  ]));
}

function field(label, type, name, placeholder = "") {
  const input = node("input", { type, name, placeholder, autocomplete: name });
  return node("label", { className: "field" }, [
    node("span", { text: label }),
    inputControl(input, type)
  ]);
}

function inputControl(input, type) {
  if (!isTemporalInput(type)) return input;
  return node("span", { className: `date-shell date-shell--${type}` }, [
    input,
    node("span", { className: "date-shell__icon", "aria-hidden": "true" })
  ]);
}

function isTemporalInput(type) {
  return ["date", "time", "datetime-local", "month", "week"].includes(type);
}

function textareaField(label, name, placeholder = "") {
  return node("label", { className: "field" }, [
    node("span", { text: label }),
    node("textarea", { name, placeholder, rows: "5" })
  ]);
}

function selectField(label, name, options) {
  const select = node("select", { name, className: "select" });
  options.forEach((option) => select.append(node("option", { value: option.value, text: option.label })));
  return node("label", { className: "field" }, [node("span", { text: label }), selectControl(select)]);
}

function selectControl(select, modifier = "") {
  return node("span", { className: `select-shell ${modifier}`.trim() }, [
    select,
    node("span", { className: "select-shell__icon", "aria-hidden": "true" })
  ]);
}

function primaryLink(text, route, className = "button button--primary") {
  return node("a", { className, href: routePath(route), text });
}

function actionButton(text, variant = "primary", onClick = null, disabled = false) {
  return node("button", { className: `button button--${variant}`, type: onClick ? "button" : "submit", text, onClick, disabled });
}

function categoryOptions() {
  return AHX_FEATURES.map((category) => ({ value: category.id, label: labelOf(category) }));
}

function flattenFeatures() {
  return AHX_FEATURES.flatMap((category) => category.items.map((item) => ({ ...item, category: labelOf(category) })));
}

function renderFeaturePills(limit = 12) {
  return flattenFeatures().slice(0, limit).map((item) =>
    node("span", { className: "feature-pill" }, [
      lucideIcon(iconNameOf(item), "lucide-icon feature-pill__icon"),
      node("span", { text: labelOf(item) })
    ])
  );
}

function updatePreference(type, value) {
  if (type === "language") setLanguage(value);
  if (type === "theme") setTheme(value);
  renderApp();
}

function getTheme() {
  return storage.get("ahx_theme", "dark");
}

function setTheme(theme) {
  storage.set("ahx_theme", theme);
}

function applyTheme() {
  document.documentElement.dataset.theme = getTheme();
}

function updateStatus(message) {
  const status = document.querySelector("[data-status]");
  if (status) status.textContent = message;
}
