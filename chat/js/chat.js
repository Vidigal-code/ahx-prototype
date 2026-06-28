window.AHX_PAGE_RENDERERS = window.AHX_PAGE_RENDERERS || {};

const AHX_CHAT_STATE = {
  action: "create",
  step: "idle",
  taskName: "",
  details: "",
  editText: "",
  selectedTaskId: ""
};

window.AHX_PAGE_RENDERERS.chat = function renderChatPage() {
  const tasks = chatDiaryTasks();
  AHX_CHAT_STATE.selectedTaskId = AHX_CHAT_STATE.selectedTaskId || tasks[0]?.id || "";
  return appLayout("chat", node("div", { className: "chat-page" }, [
    renderChatHero(),
    node("section", { className: "chat-workspace" }, [
      renderChatPanel(tasks),
      renderChatControls(tasks)
    ])
  ]));
};

function renderChatHero() {
  return node("section", { className: "chat-hero" }, [
    node("div", { className: "section-heading" }, [
      renderChatActiveModeControl(),
      node("h1", { text: t("chatPageTitle") }),
      node("p", { text: t("chatPageSubtitle") })
    ]),
    iconTextButton(t("microphone"), "mic", "primary", openVoiceAutomationModal)
  ]);
}

function renderChatActiveModeControl() {
  const select = node("select", { className: "select", name: "chatActiveMode", "aria-label": t("activeMode") });
  AHX_FEATURES.forEach((category) => {
    select.append(node("option", {
      value: category.id,
      text: labelOf(category),
      selected: category.id === "personal",
      disabled: category.id !== "personal"
    }));
  });
  return node("label", { className: "diary-active-mode chat-active-mode" }, [
    node("span", { className: "eyebrow", text: `${t("activeMode")}:` }),
    selectControl(select)
  ]);
}

function renderChatPanel(tasks) {
  return node("article", { className: "chat-ai-panel panel" }, [
    node("div", { className: "panel__header" }, [
      node("div", { className: "diary-title" }, [
        lucideIcon("message-circle", "lucide-icon"),
        node("h2", { text: t("chatTitle") })
      ]),
      node("span", { className: "panel-badge", text: "AI" })
    ]),
    node("div", { className: "chat-ai-log", "data-chat-log": "" }, [
      chatBubble("assistant", t("chatAssistantIntro")),
      renderChatActionChoices()
    ]),
    node("form", { className: "chat-ai-input", onSubmit: handleChatSubmit }, [
      node("input", { type: "text", name: "message", placeholder: t("chatMessagePlaceholder"), autocomplete: "off" }),
      iconTextButton(t("send"), "send", "primary")
    ])
  ]);
}

function renderChatActionChoices() {
  const actions = [
    ["create", t("chatCreateTask"), "plus"],
    ["edit", t("chatEditTask"), "pencil"],
    ["delete", t("chatDeleteTask"), "trash-2"]
  ];
  return node("div", { className: "chat-action-choices", "data-chat-actions": "" }, actions.map(([action, label, icon]) =>
    node("button", {
      className: `chat-action-choice ${action === AHX_CHAT_STATE.action ? "is-active" : ""}`,
      type: "button",
      "data-chat-action": action,
      onClick: () => chooseChatAction(action)
    }, [
      lucideIcon(icon, "lucide-icon"),
      node("span", { text: label })
    ])
  ));
}

function renderChatControls(tasks) {
  return node("aside", { className: "chat-control-panel panel" }, [
    node("div", { className: "panel__header" }, [
      node("h2", { text: t("chatModeSearch") }),
      lucideIcon("search", "lucide-icon")
    ]),
    node("p", { className: "modal-copy", text: t("chatModeSearchText") }),
    renderChatCategoryField(),
    renderChatTaskSearch(),
    renderChatTaskField(tasks),
    node("div", { className: "chat-control-actions" }, [
      iconTextButton(t("chatCreateTask"), "plus", "primary", () => chooseChatAction("create")),
      iconTextButton(t("chatEditTask"), "pencil", "ghost", () => chooseChatAction("edit"), !tasks.length),
      iconTextButton(t("chatDeleteTask"), "trash-2", "ghost", () => chooseChatAction("delete"), !tasks.length)
    ])
  ]);
}

function renderChatCategoryField() {
  const select = node("select", { className: "select", name: "chatCategory", "aria-label": t("chatCategory") });
  AHX_FEATURES.forEach((category) => {
    select.append(node("option", {
      value: category.id,
      text: labelOf(category),
      selected: category.id === "personal",
      disabled: category.id !== "personal"
    }));
  });
  return node("label", { className: "field" }, [node("span", { text: t("chatCategory") }), selectControl(select)]);
}

function renderChatTaskSearch() {
  return node("label", { className: "field" }, [
    node("span", { text: t("search") }),
    node("input", { type: "search", placeholder: t("globalSearchPlaceholder"), onInput: filterChatTasks })
  ]);
}

function renderChatTaskField(tasks) {
  const select = node("select", { className: "select", name: "chatTask", "data-chat-task-select": "", onChange: syncChatSelectedTask });
  tasks.forEach((task) => {
    select.append(node("option", {
      value: task.id,
      text: `${task.title} - ${task.module}`,
      selected: task.id === AHX_CHAT_STATE.selectedTaskId
    }));
  });
  return node("label", { className: "field" }, [node("span", { text: t("chatDiaryTask") }), selectControl(select)]);
}

function chatDiaryTasks() {
  return diaryModules().flatMap((module) => module.items.map((item) => ({
    id: item.id,
    title: localizedText(item.title),
    details: localizedText(item.details),
    module: localizedText(module.labels),
    status: item.status,
    priority: item.priority
  })));
}

function chooseChatAction(action) {
  AHX_CHAT_STATE.action = action;
  AHX_CHAT_STATE.step = action === "create" ? "createName" : action === "edit" ? "editDetails" : "deleteConfirm";
  updateChatActionButtons();
  appendChatMessage("user", chatActionLabel(action));
  if (action === "create") appendChatMessage("assistant", t("chatTaskQuestion"));
  if (action === "edit") appendChatMessage("assistant", `${selectedChatTaskLabel()} - ${t("chatEditQuestion")}`);
  if (action === "delete") appendDeletePrompt();
}

function handleChatSubmit(event) {
  event.preventDefault();
  const input = event.currentTarget.elements.message;
  const message = input.value.trim();
  if (!message) return;
  input.value = "";
  appendChatMessage("user", message);
  continueChatFlow(message);
}

function continueChatFlow(message) {
  if (AHX_CHAT_STATE.step === "idle") {
    chooseChatAction(AHX_CHAT_STATE.action || "create");
    return;
  }
  if (AHX_CHAT_STATE.step === "createName") {
    AHX_CHAT_STATE.taskName = message;
    AHX_CHAT_STATE.step = "createDetails";
    appendChatMessage("assistant", t("chatDetailsQuestion"));
    return;
  }
  if (AHX_CHAT_STATE.step === "createDetails") {
    AHX_CHAT_STATE.details = message;
    AHX_CHAT_STATE.step = "createConfirm";
    appendChatMessage("assistant", `${t("chatConfirmQuestion")}\n${chatJsonPreview("create")}`);
    return;
  }
  if (AHX_CHAT_STATE.step === "editDetails") {
    AHX_CHAT_STATE.editText = message;
    AHX_CHAT_STATE.step = "editConfirm";
    appendChatMessage("assistant", `${t("chatConfirmQuestion")}\n${chatJsonPreview("edit")}`);
    return;
  }
  if (AHX_CHAT_STATE.step === "deleteConfirm" || AHX_CHAT_STATE.step.endsWith("Confirm")) {
    handleChatConfirmation(message);
  }
}

function handleChatConfirmation(message) {
  if (!isPositiveAnswer(message)) {
    AHX_CHAT_STATE.step = "idle";
    appendChatMessage("assistant", t("chatCancelled"));
    return;
  }
  if (AHX_CHAT_STATE.action === "delete") {
    appendChatMessage("assistant", `${t("chatJsonReady")}\n${chatJsonPreview("delete")}`);
    appendChatDeleteButton();
  } else {
    appendChatMessage("assistant", t("chatJsonReady"));
  }
  AHX_CHAT_STATE.step = "idle";
}

function appendDeletePrompt() {
  appendChatMessage("assistant", `${selectedChatTaskLabel()} - ${t("chatDeleteQuestion")}`);
}

function appendChatDeleteButton() {
  const log = document.querySelector("[data-chat-log]");
  if (!log) return;
  log.append(node("div", { className: "chat-delete-row" }, [
    iconTextButton(t("chatDeleteButton"), "trash-2", "danger", () => appendChatMessage("assistant", t("chatJsonReady")))
  ]));
  log.scrollTop = log.scrollHeight;
  renderLucideIcons();
}

function appendChatMessage(type, message) {
  const log = document.querySelector("[data-chat-log]");
  if (!log) return;
  log.append(chatBubble(type, message));
  log.scrollTop = log.scrollHeight;
  renderLucideIcons();
}

function chatBubble(type, message) {
  return node("div", { className: `chat-ai-message chat-ai-message--${type}` }, [
    node("span", { className: "chat-ai-message__avatar" }, [
      lucideIcon(type === "assistant" ? "sparkles" : "user-circle", "lucide-icon")
    ]),
    node("p", { text: message })
  ]);
}

function chatJsonPreview(action) {
  const payload = {
    source: "AionHex chat",
    action,
    category: "personal",
    taskId: action === "create" ? null : AHX_CHAT_STATE.selectedTaskId,
    taskName: action === "create" ? AHX_CHAT_STATE.taskName : selectedChatTaskLabel(),
    details: action === "edit" ? AHX_CHAT_STATE.editText : AHX_CHAT_STATE.details
  };
  return JSON.stringify(payload, null, 2);
}

function selectedChatTaskLabel() {
  const task = chatDiaryTasks().find((item) => item.id === AHX_CHAT_STATE.selectedTaskId) || chatDiaryTasks()[0];
  return task ? task.title : t("chatDiaryTask");
}

function syncChatSelectedTask(event) {
  AHX_CHAT_STATE.selectedTaskId = event.target.value;
}

function filterChatTasks(event) {
  const query = event.target.value.toLowerCase();
  const select = document.querySelector("[data-chat-task-select]");
  if (!select) return;
  const tasks = chatDiaryTasks().filter((task) => `${task.title} ${task.module}`.toLowerCase().includes(query));
  select.replaceChildren(...tasks.map((task) => node("option", { value: task.id, text: `${task.title} - ${task.module}` })));
  AHX_CHAT_STATE.selectedTaskId = tasks[0]?.id || "";
}

function updateChatActionButtons() {
  document.querySelectorAll(".chat-action-choice").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.chatAction === AHX_CHAT_STATE.action);
  });
}

function chatActionLabel(action) {
  return {
    create: t("chatCreateTask"),
    edit: t("chatEditTask"),
    delete: t("chatDeleteTask")
  }[action] || t("chatCreateTask");
}

function isPositiveAnswer(message) {
  return ["yes", "y", "sim", "s", "si"].includes(message.trim().toLowerCase());
}
