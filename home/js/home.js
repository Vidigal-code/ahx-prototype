window.AHX_PAGE_RENDERERS = window.AHX_PAGE_RENDERERS || {};

window.AHX_PAGE_RENDERERS.home = function renderHomePage() {
  return appLayout("home", node("div", { className: "home-content" }, [
    renderHomeHeader(),
    renderToolStrip(),
    node("div", { className: "workspace-grid" }, [
      renderRequestForm(),
      renderChatPanel(),
      renderFeaturePanel()
    ])
  ]));
};


function renderHomeHeader() {
  return node("header", { className: "workspace-header" }, [
    node("div", { className: "section-heading" }, [
      node("p", { className: "eyebrow", text: t("dashboard") }),
      node("h1", { text: t("homeTitle") }),
      node("p", { text: t("homeSubtitle") })
    ])
  ]);
}

function renderToolStrip() {
  return node("section", { className: "tool-strip" }, [
    node("label", { className: "search-box" }, [
      lucideIcon("search", "lucide-icon search-box__icon"),
      node("input", { type: "search", "data-search": "", placeholder: t("searchPlaceholder"), onInput: filterFeaturePanel })
    ]),
    selectField(t("category"), "categoryFilter", [{ value: "all", label: t("allCategories") }, ...categoryOptions()]),
    microphoneButton(),
    node("input", { type: "file", hidden: true, "data-import-file": "", accept: "application/json", onChange: importPrototypeData })
  ]);
}

function microphoneButton() {
  return node("button", { className: "icon-button mic-button", type: "button", "aria-label": t("microphone"), title: t("microphone"), onClick: toggleMicrophone }, [
    lucideIcon("mic", "lucide-icon icon-button__glyph")
  ]);
}

function renderRequestForm() {
  return node("form", { className: "panel request-panel", onSubmit: handleRequestSubmit }, [
    node("div", { className: "panel__header" }, [
      node("h2", { text: t("formTitle") }),
      node("span", { className: "panel-badge", text: t("statusReady") })
    ]),
    selectField(t("requestType"), "requestType", categoryOptions()),
    selectField(t("priority"), "priority", [
      { value: "low", label: t("low") },
      { value: "medium", label: t("medium") },
      { value: "high", label: t("high") }
    ]),
    field(t("deadline"), "datetime-local", "deadline"),
    textareaField(t("description"), "description", t("descriptionPlaceholder")),
    actionButton(t("submit"), "primary")
  ]);
}

function renderChatPanel() {
  return node("section", { className: "panel chat-panel" }, [
    node("div", { className: "panel__header" }, [
      node("h2", { text: t("chatTitle") }),
      node("span", { className: "panel-badge", text: "AI" })
    ]),
    node("div", { className: "chat-log", "data-chat-log": "" }, [
      node("div", { className: "chat-message chat-message--ai", text: t("assistantGreeting") })
    ]),
    node("form", { className: "chat-input", onSubmit: handleChatSubmit }, [
      node("input", { type: "text", name: "message", placeholder: t("chatPlaceholder") }),
      actionButton(t("send"), "primary")
    ])
  ]);
}

function renderFeaturePanel() {
  return node("section", { className: "panel feature-panel" }, [
    node("div", { className: "panel__header" }, [
      node("h2", { text: t("quickActions") }),
      node("span", { className: "panel-badge", text: AHX_CONFIG.brand.shortName })
    ]),
    node("div", { className: "feature-pills", "data-feature-pills": "" }, renderFeaturePills(20))
  ]);
}

function handleRequestSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  appendChatMessage("user", form.get("description") || t("descriptionPlaceholder"));
  appendChatMessage("ai", t("assistantGreeting"));
  updateStatus(t("statusReady"));
  event.currentTarget.reset();
}

function handleChatSubmit(event) {
  event.preventDefault();
  const input = event.currentTarget.elements.message;
  if (!input.value.trim()) return;
  appendChatMessage("user", input.value.trim());
  appendChatMessage("ai", t("assistantGreeting"));
  input.value = "";
}

function appendChatMessage(type, message) {
  const log = document.querySelector("[data-chat-log]");
  if (!log) return;
  log.append(node("div", { className: `chat-message chat-message--${type}`, text: message }));
  log.scrollTop = log.scrollHeight;
}

function filterFeaturePanel(event) {
  const query = event.target.value.toLowerCase();
  const container = document.querySelector("[data-feature-pills]");
  const items = flattenFeatures().filter((item) => {
    return `${labelOf(item)} ${item.category}`.toLowerCase().includes(query);
  });
  container.replaceChildren(...items.slice(0, 30).map(renderFeaturePill));
  renderLucideIcons();
}


