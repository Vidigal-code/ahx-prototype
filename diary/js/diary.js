window.AHX_PAGE_RENDERERS = window.AHX_PAGE_RENDERERS || {};

window.AHX_PAGE_RENDERERS.diary = function renderDiaryPage() {
  const isKanban = getDiaryViewMode() === "kanban";
  const modules = diaryModules();
  const hasModules = modules.length > 0;
  return appLayout("diary", node("div", { className: "diary-page" }, [
    node("section", { className: "diary-hero" }, [
      node("div", { className: "section-heading" }, [
        renderDiaryActiveModeControl(),
        node("p", { text: t("diarySubtitle") })
      ]),
      iconTextButton(isKanban ? t("switchToForms") : t("switchToKanban"), isKanban ? "layout-list" : "kanban", "primary", toggleDiaryView, !hasModules)
    ]),
    renderDiaryActions(hasModules),
    renderDiaryContent(modules, isKanban),
    renderDiaryFullscreenModal(),
    renderDiaryGlobalSearchModal(),
    renderDiarySettingsModal(),
    renderDiaryFilterModal(),
    renderDiaryInfoModal(),
    renderDiaryDeleteModal(),
    renderDiaryConfirmDeleteModal(),
    renderDiaryCreateModal(),
    renderDiaryEditModal(),
    renderDiaryDeleteItemModal(),
    renderDiaryMoveItemModal()
  ]));
};


function renderDiaryActiveModeControl() {
  const select = node("select", { className: "select", name: "diaryActiveMode", "aria-label": t("activeMode") });
  AHX_FEATURES.forEach((category) => {
    select.append(node("option", {
      value: category.id,
      text: labelOf(category),
      selected: category.id === "personal",
      disabled: category.id !== "personal"
    }));
  });
  return node("label", { className: "diary-active-mode" }, [
    node("span", { className: "eyebrow", text: `${t("activeMode")}:` }),
    selectControl(select)
  ]);
}

function renderDiaryActions(hasModules = true) {
  return node("section", { className: "diary-actions" }, [
    iconTextButton(t("search"), "search", "ghost", openDiaryGlobalSearchModal),
    iconTextButton(t("import"), "upload", "ghost", () => document.querySelector("[data-diary-import-file]").click()),
    iconTextButton(t("export"), "download", "ghost", exportDiaryContainers, !hasModules),
    iconTextButton(t("settings"), "settings-2", "ghost", openDiarySettingsModal),
    iconTextButton(t("delete"), "trash-2", "ghost", openDiaryDeleteModal, !hasModules),
    iconTextButton(t("addTask"), "plus", "primary", () => openDiaryCreateModal(), !hasModules),
    node("input", { type: "file", hidden: true, "data-diary-import-file": "", accept: "application/json", onChange: importDiaryContainers })
  ]);
}

function renderDiaryContent(modules, isKanban) {
  if (!modules.length) return renderDiaryEmptyState();
  return isKanban ? renderDiaryKanban(modules) : renderDiaryContainers(modules);
}

function renderDiaryEmptyState() {
  return node("section", { className: "diary-empty panel" }, [
    lucideIcon("eye-off", "lucide-icon"),
    node("h2", { text: t("diaryEmptyTitle") }),
    node("p", { text: t("diaryEmptyText") })
  ]);
}

function renderDiaryContainers(modules) {
  return node("section", { className: "diary-grid" }, modules.map((module) => renderDiaryContainer(module)));
}

function renderDiaryContainer(module, options = {}) {
  const items = filteredDiaryItems(module);
  const page = diaryPage(module.id, items.length);
  const pages = Math.max(1, Math.ceil(items.length / DIARY_PAGE_SIZE));
  const visibleItems = paginatedDiaryItems(items, page);
  const isEditing = isDiaryModuleEditing(module.id);

  return node("article", { className: "diary-container panel" }, [
    node("div", { className: "panel__header" }, [
      node("div", { className: "diary-title" }, [
        lucideIcon(module.iconName, "lucide-icon"),
        node("h2", { text: localizedText(module.labels) })
      ]),
      renderDiaryContainerActionBar(module, options, isEditing)
    ]),
    node("div", { className: "diary-list" }, visibleItems.map((item) => renderDiaryItem(item, isEditing))),
    renderDiaryPagination(module.id, page, pages)
  ]);
}

function renderDiaryItem(item, isEditing = false) {
  return node("article", { className: `diary-item diary-item--${item.status}` }, [
    isEditing ? node("div", { className: "diary-item__edit-actions" }, [
      iconButton(t("edit"), "pencil", () => openDiaryEditItem(item.id)),
      iconButton(t("delete"), "trash-2", () => openDiaryDeleteItem(item.id)),
      iconButton(t("moveTask"), "move-right", () => openDiaryMoveItem(item.id)),
      iconButton(t("exportTasks"), "file-down", () => exportDiaryTask(item.id))
    ]) : null,
    node("div", { className: "diary-item__top" }, [
      node("strong", { text: localizedText(item.title) }),
      node("span", { className: `panel-badge priority-${item.priority}`, text: t(item.priority) })
    ]),
    node("p", { text: localizedText(item.details) }),
    node("dl", { className: "diary-meta" }, [
      metaPair(t("status"), diaryStatusLabel(item.status)),
      metaPair(t("owner"), item.owner),
      metaPair(t("date"), item.date),
      metaPair(t("tag"), item.tag)
    ])
  ]);
}

function renderDiaryPagination(moduleId, page, pages) {
  return node("div", { className: "diary-pagination" }, [
    node("span", { className: "diary-pagination__title", text: `${t("page")} ${page} / ${pages}` }),
    iconButton(t("previous"), "chevron-up", () => changeDiaryPage(moduleId, page - 1), page <= 1),
    iconButton(t("next"), "chevron-down", () => changeDiaryPage(moduleId, page + 1), page >= pages)
  ]);
}

function renderDiaryKanban(modules) {
  const statuses = ["planned", "progress", "complete"];
  return node("section", { className: "kanban-board" }, modules.map((module) =>
    node("article", { className: "kanban-module panel" }, [
      node("div", { className: "panel__header" }, [
        node("div", { className: "diary-title" }, [
          lucideIcon(module.iconName, "lucide-icon"),
          node("h2", { text: localizedText(module.labels) })
        ]),
        renderDiaryContainerActionBar(module, {}, isDiaryModuleEditing(module.id))
      ]),
      node("div", { className: "kanban-columns" }, statuses.map((status) => renderDiaryKanbanColumn(module, status)))
    ])
  ));
}

function renderDiaryKanbanColumn(module, status) {
  const items = filteredDiaryItems(module).filter((item) => item.status === status);
  const pageKey = `${module.id}_${status}`;
  const page = diaryPage(pageKey, items.length);
  const pages = Math.max(1, Math.ceil(items.length / DIARY_PAGE_SIZE));
  const isEditing = isDiaryModuleEditing(module.id);
  return node("div", { className: "kanban-column" }, [
    node("h3", { text: diaryStatusLabel(status) }),
    node("div", { className: "kanban-list" }, paginatedDiaryItems(items, page).map((item) => renderDiaryItem(item, isEditing))),
    renderDiaryPagination(pageKey, page, pages)
  ]);
}

function renderDiaryContainerActionBar(module, options = {}, isEditing = false) {
  const actions = diaryContainerActionButtons(module, options, isEditing);
  const isFullscreen = Boolean(options.fullscreen);
  const isHidden = isDiaryContainerActionsHidden(module.id);
  const page = diaryContainerActionPage(module.id, actions.length);
  const pageCount = Math.max(1, Math.ceil(actions.length / 2));
  const visibleActions = actions.slice((page - 1) * 2, page * 2);

  return node("div", { className: "diary-container__action-shell" }, [
    node("div", { className: "diary-container__action-controls" }, [
      node("div", { className: "diary-container__action-start" }, [
        iconButton(t("information"), "info", () => openDiaryInfo(module.id)),
        iconButton(isHidden ? t("showIconButtons") : t("hideIconButtons"), isHidden ? "eye" : "eye-off", () => toggleDiaryContainerActions(module.id))
      ]),
      node("div", { className: "diary-container__action-nav" }, [
        iconButton(t("previous"), "chevron-left", () => changeDiaryContainerActionPage(module.id, -1, actions.length), isHidden || page <= 1),
        iconButton(t("next"), "chevron-right", () => changeDiaryContainerActionPage(module.id, 1, actions.length), isHidden || page >= pageCount)
      ]),
      node("div", { className: "diary-container__action-end" }, [
        iconButton(t("filter"), "filter", () => openDiaryFilter(module.id)),
        isFullscreen ? iconButton(t("close"), "x", closeDiaryFullscreen) : iconButton(t("fullscreen"), "maximize-2", () => openDiaryFullscreen(module.id))
      ])
    ]),
    !isHidden ? node("div", { className: "diary-container__actions", "aria-label": t("containerActions") }, visibleActions) : null
  ]);
}

function diaryContainerActionButtons(module, options = {}, isEditing = false) {
  return [
    iconButton(t("addTask"), "plus", () => openDiaryCreateModal(module.id), false, "primary"),
    iconButton(isEditing ? t("finishEditing") : t("editMode"), isEditing ? "check" : "pencil", () => toggleDiaryModuleEditing(module.id)),
    iconButton(t("importTasks"), "file-up", () => openDiaryContainerImport(module.id)),
    iconButton(t("exportTasks"), "file-down", () => exportDiaryContainerTasks(module.id))
  ];
}

function renderDiaryFullscreenModal() {
  const moduleId = storage.get("ahx_diary_fullscreen_module", "");
  if (!moduleId) return null;
  const module = diaryModules().find((item) => item.id === moduleId);
  if (!module) return null;
  return node("section", { className: "container-fullscreen", role: "dialog", "aria-modal": "true" }, [
    node("div", { className: "container-fullscreen__panel" }, [
      renderDiaryContainer(module, { fullscreen: true })
    ])
  ]);
}

function renderDiaryInfoModal() {
  const moduleId = storage.get("ahx_diary_info_module", "");
  if (!moduleId) return null;
  const module = diaryModules().find((item) => item.id === moduleId);
  if (!module) return null;
  const stats = diaryContainerStats(module.items);
  const metrics = [
    { label: t("totalTasks"), value: stats.total },
    { label: t("completedTasks"), value: stats.complete },
    { label: t("progressTasks"), value: stats.progress },
    { label: t("plannedTasks"), value: stats.planned },
    { label: t("highPriority"), value: stats.high },
    { label: t("mediumPriority"), value: stats.medium },
    { label: t("lowPriority"), value: stats.low },
    { label: t("completionRate"), value: `${stats.completion}%` }
  ];

  return node("section", { className: "filter-modal", role: "dialog", "aria-modal": "true" }, [
    node("div", { className: "filter-modal__panel filter-modal__panel--compact diary-info-modal" }, [
      node("div", { className: "filter-modal__header" }, [
        node("div", { className: "diary-title" }, [
          lucideIcon("info", "lucide-icon"),
          node("h2", { text: `${t("information")} · ${localizedText(module.labels)}` })
        ]),
        iconButton(t("close"), "x", closeDiaryInfo)
      ]),
      node("div", { className: "diary-info-grid" }, metrics.map((metric) =>
        node("article", { className: "diary-info-card" }, [
          node("span", { text: metric.label }),
          node("strong", { text: String(metric.value) })
        ])
      )),
      node("div", { className: "button-row" }, [
        actionButton(t("close"), "primary", closeDiaryInfo)
      ])
    ])
  ]);
}

function renderDiaryGlobalSearchModal() {
  if (storage.get("ahx_diary_global_search_modal", "") !== "open") return null;
  return node("section", { className: "filter-modal", role: "dialog", "aria-modal": "true" }, [
    node("form", { className: "filter-modal__panel filter-modal__panel--compact diary-global-search-modal", onSubmit: applyDiaryGlobalSearch }, [
      node("div", { className: "filter-modal__header" }, [
        node("div", { className: "diary-title" }, [
          lucideIcon("search", "lucide-icon"),
          node("h2", { text: t("globalSearch") })
        ]),
        iconButton(t("close"), "x", closeDiaryGlobalSearchModal)
      ]),
      node("label", { className: "field" }, [
        node("span", { text: t("search") }),
        node("input", { type: "search", name: "query", value: diaryGlobalSearch(), placeholder: t("globalSearchPlaceholder") })
      ]),
      node("div", { className: "button-row" }, [
        actionButton(t("applyFilters"), "primary"),
        actionButton(t("clearFilters"), "ghost", clearDiaryGlobalSearch),
        actionButton(t("close"), "ghost", closeDiaryGlobalSearchModal)
      ])
    ])
  ]);
}

function renderDiarySettingsModal() {
  if (storage.get("ahx_diary_settings_modal", "") !== "open") return null;
  const deleted = new Set(storage.get("ahx_diary_deleted_modules", []));
  const modules = orderedDiaryModuleDefinitions();
  return node("section", { className: "filter-modal", role: "dialog", "aria-modal": "true" }, [
    node("div", { className: "filter-modal__panel" }, [
      node("div", { className: "filter-modal__header" }, [
        node("div", { className: "diary-title" }, [
          lucideIcon("settings-2", "lucide-icon"),
          node("h2", { text: t("diarySettingsTitle") })
        ]),
        iconButton(t("close"), "x", closeDiarySettingsModal)
      ]),
      node("div", { className: "settings-modal__labels" }, [
        node("span", { text: t("visibleContainers") }),
        node("span", { text: t("containerHierarchy") })
      ]),
      node("div", { className: "settings-list" }, modules.map((module, index) =>
        renderDiarySettingsRow(module, index, modules.length, !deleted.has(module.id))
      )),
      node("div", { className: "button-row" }, [
        actionButton(t("close"), "primary", closeDiarySettingsModal)
      ])
    ])
  ]);
}

function renderDiarySettingsRow(module, index, total, isVisible) {
  return node("article", { className: "settings-row" }, [
    node("label", { className: "settings-row__toggle" }, [
      node("input", { type: "checkbox", checked: isVisible, onChange: () => setDiaryModuleVisible(module.id, !isVisible) }),
      node("span", { className: "check-row__box" }),
      node("span", { className: "feature-card__icon" }, [lucideIcon(module.iconName, "lucide-icon")]),
      node("span", { text: localizedText(module.labels) })
    ]),
    node("div", { className: "settings-row__actions" }, [
      iconButton(t("moveUp"), "arrow-up", () => moveDiaryModule(module.id, -1)),
      iconButton(t("moveDown"), "arrow-down", () => moveDiaryModule(module.id, 1))
    ].map((button, buttonIndex) => {
      if ((buttonIndex === 0 && index === 0) || (buttonIndex === 1 && index === total - 1)) button.disabled = true;
      return button;
    }))
  ]);
}

function renderDiaryFilterModal() {
  const moduleId = storage.get("ahx_diary_filter_modal", "");
  if (!moduleId) return null;
  const module = diaryModules().find((item) => item.id === moduleId);
  if (!module) return null;
  const filters = diaryFilters()[moduleId] ?? {};

  return node("section", { className: "filter-modal", role: "dialog", "aria-modal": "true" }, [
    node("form", { className: "filter-modal__panel", onSubmit: applyDiaryFilter(moduleId) }, [
      node("div", { className: "filter-modal__header" }, [
        node("div", { className: "diary-title" }, [
          lucideIcon(module.iconName, "lucide-icon"),
          node("h2", { text: `${t("filter")} · ${localizedText(module.labels)}` })
        ]),
        iconButton(t("close"), "x", closeDiaryFilter)
      ]),
      filterTextField(t("information"), "query", filters.query ?? ""),
      filterSelectField(t("status"), "status", filters.status ?? "", [
        { value: "", label: t("allStatuses") },
        { value: "planned", label: t("planned") },
        { value: "progress", label: t("inProgress") },
        { value: "complete", label: t("complete") }
      ]),
      filterSelectField(t("priorityFilter"), "priority", filters.priority ?? "", [
        { value: "", label: t("allPriorities") },
        { value: "low", label: t("low") },
        { value: "medium", label: t("medium") },
        { value: "high", label: t("high") }
      ]),
      node("div", { className: "button-row" }, [
        actionButton(t("applyFilters"), "primary"),
        actionButton(t("clearFilters"), "ghost", () => clearDiaryFilter(moduleId)),
        actionButton(t("close"), "ghost", closeDiaryFilter)
      ])
    ])
  ]);
}

function renderDiaryDeleteModal() {
  if (storage.get("ahx_diary_delete_modal", "") !== "open") return null;
  const deleted = new Set(storage.get("ahx_diary_deleted_modules", []));
  const deletableModules = orderedDiaryModuleDefinitions().filter((module) => !deleted.has(module.id));
  return node("section", { className: "filter-modal", role: "dialog", "aria-modal": "true" }, [
    node("div", { className: "filter-modal__panel" }, [
      node("div", { className: "filter-modal__header" }, [
        node("div", { className: "diary-title" }, [
          lucideIcon("trash-2", "lucide-icon"),
          node("h2", { text: t("selectContainerToDelete") })
        ]),
        iconButton(t("close"), "x", closeDiaryDeleteModal)
      ]),
      node("div", { className: "delete-options" }, deletableModules.map((module) =>
        node("label", { className: "delete-option" }, [
          node("input", { type: "checkbox", value: module.id, onChange: () => openDiaryConfirmDeleteModal(module.id) }),
          node("span", { className: "check-row__box" }),
          lucideIcon(module.iconName, "lucide-icon"),
          node("span", { text: localizedText(module.labels) })
        ])
      )),
      node("div", { className: "button-row" }, [
        actionButton(t("cancel"), "ghost", closeDiaryDeleteModal)
      ])
    ])
  ]);
}

function renderDiaryConfirmDeleteModal() {
  const moduleId = storage.get("ahx_diary_pending_delete", "");
  if (!moduleId) return null;
  const module = diaryModules().find((item) => item.id === moduleId);
  if (!module) return null;
  return node("section", { className: "filter-modal", role: "dialog", "aria-modal": "true" }, [
    node("div", { className: "filter-modal__panel filter-modal__panel--compact" }, [
      node("div", { className: "filter-modal__header" }, [
        node("div", { className: "diary-title" }, [
          lucideIcon("triangle-alert", "lucide-icon"),
          node("h2", { text: t("confirmDeleteTitle") })
        ]),
        iconButton(t("close"), "x", cancelDiaryDelete)
      ]),
      node("p", { className: "modal-copy", text: `${t("confirmDeleteText")} ${localizedText(module.labels)}` }),
      node("div", { className: "button-row" }, [
        actionButton(t("confirm"), "primary", () => confirmDiaryDelete(moduleId)),
        actionButton(t("cancel"), "ghost", cancelDiaryDelete)
      ])
    ])
  ]);
}

function renderDiaryCreateModal() {
  if (storage.get("ahx_diary_create_modal", "") !== "open") return null;
  const fixedModuleId = storage.get("ahx_diary_create_module", "");
  const fixedModule = diaryModules().find((module) => module.id === fixedModuleId);
  return node("section", { className: "filter-modal", role: "dialog", "aria-modal": "true" }, [
    node("form", { className: "filter-modal__panel", onSubmit: createDiaryTask }, [
      node("div", { className: "filter-modal__header" }, [
        node("div", { className: "diary-title" }, [
          lucideIcon("plus", "lucide-icon"),
          node("h2", { text: t("addTask") })
        ]),
        iconButton(t("close"), "x", closeDiaryCreateModal)
      ]),
      fixedModule ? renderFixedDiaryModuleField(fixedModule) : filterSelectField(t("selectMode"), "moduleId", "", diaryModules().map((module) => ({
        value: module.id,
        label: localizedText(module.labels)
      }))),
      filterTextField(t("taskTitle"), "title", ""),
      node("label", { className: "field" }, [
        node("span", { text: t("taskDetails") }),
        node("textarea", { name: "details", rows: "5", placeholder: t("taskDetails") })
      ]),
      filterSelectField(t("status"), "status", "planned", [
        { value: "planned", label: t("planned") },
        { value: "progress", label: t("inProgress") },
        { value: "complete", label: t("complete") }
      ]),
      filterSelectField(t("priorityFilter"), "priority", "medium", [
        { value: "low", label: t("low") },
        { value: "medium", label: t("medium") },
        { value: "high", label: t("high") }
      ]),
      field(t("date"), "date", "date"),
      filterTextField(t("owner"), "owner", "AionHex"),
      filterTextField(t("tag"), "tag", t("tag")),
      node("div", { className: "button-row" }, [
        actionButton(t("addTask"), "primary"),
        actionButton(t("cancel"), "ghost", closeDiaryCreateModal)
      ])
    ])
  ]);
}

function renderFixedDiaryModuleField(module) {
  return node("div", { className: "selected-module" }, [
    node("input", { type: "hidden", name: "moduleId", value: module.id }),
    node("span", { className: "feature-card__icon" }, [lucideIcon(module.iconName, "lucide-icon")]),
    node("span", { text: localizedText(module.labels) })
  ]);
}

function renderDiaryEditModal() {
  const itemId = storage.get("ahx_diary_edit_item", "");
  if (!itemId) return null;
  const item = findDiaryItem(itemId);
  if (!item) return null;
  return node("section", { className: "filter-modal", role: "dialog", "aria-modal": "true" }, [
    node("form", { className: "filter-modal__panel", onSubmit: updateDiaryTask(item.id) }, [
      node("div", { className: "filter-modal__header" }, [
        node("div", { className: "diary-title" }, [
          lucideIcon("pencil", "lucide-icon"),
          node("h2", { text: t("editTask") })
        ]),
        iconButton(t("close"), "x", closeDiaryEditModal)
      ]),
      modalTextField(t("taskTitle"), "title", localizedText(item.title)),
      node("label", { className: "field" }, [
        node("span", { text: t("taskDetails") }),
        node("textarea", { name: "details", rows: "5", text: localizedText(item.details) })
      ]),
      filterSelectField(t("status"), "status", item.status, [
        { value: "planned", label: t("planned") },
        { value: "progress", label: t("inProgress") },
        { value: "complete", label: t("complete") }
      ]),
      filterSelectField(t("priorityFilter"), "priority", item.priority, [
        { value: "low", label: t("low") },
        { value: "medium", label: t("medium") },
        { value: "high", label: t("high") }
      ]),
      modalDateField(t("date"), "date", item.date),
      modalTextField(t("owner"), "owner", item.owner),
      modalTextField(t("tag"), "tag", item.tag),
      node("div", { className: "button-row" }, [
        actionButton(t("saveChanges"), "primary"),
        actionButton(t("cancel"), "ghost", closeDiaryEditModal)
      ])
    ])
  ]);
}

function renderDiaryDeleteItemModal() {
  const itemId = storage.get("ahx_diary_pending_delete_item", "");
  if (!itemId) return null;
  const item = findDiaryItem(itemId);
  if (!item) return null;
  return node("section", { className: "filter-modal", role: "dialog", "aria-modal": "true" }, [
    node("div", { className: "filter-modal__panel filter-modal__panel--compact" }, [
      node("div", { className: "filter-modal__header" }, [
        node("div", { className: "diary-title" }, [
          lucideIcon("trash-2", "lucide-icon"),
          node("h2", { text: t("deleteTask") })
        ]),
        iconButton(t("close"), "x", closeDiaryDeleteItemModal)
      ]),
      node("p", { className: "modal-copy", text: `${t("confirmDeleteItemText")} ${localizedText(item.title)}` }),
      node("div", { className: "button-row" }, [
        actionButton(t("confirm"), "primary", () => confirmDiaryDeleteItem(item.id)),
        actionButton(t("cancel"), "ghost", closeDiaryDeleteItemModal)
      ])
    ])
  ]);
}

function renderDiaryMoveItemModal() {
  const itemId = storage.get("ahx_diary_pending_move_item", "");
  if (!itemId) return null;
  const item = findDiaryItem(itemId);
  if (!item) return null;
  const currentModule = findDiaryModuleByItem(itemId);
  return node("section", { className: "filter-modal", role: "dialog", "aria-modal": "true" }, [
    node("form", { className: "filter-modal__panel", onSubmit: confirmDiaryMoveItem(item.id) }, [
      node("div", { className: "filter-modal__header" }, [
        node("div", { className: "diary-title" }, [
          lucideIcon("move-right", "lucide-icon"),
          node("h2", { text: t("moveTask") })
        ]),
        iconButton(t("close"), "x", closeDiaryMoveItemModal)
      ]),
      node("article", { className: `diary-item diary-item--${item.status}` }, [
        node("div", { className: "diary-item__top" }, [
          node("strong", { text: localizedText(item.title) }),
          node("span", { className: `panel-badge priority-${item.priority}`, text: t(item.priority) })
        ]),
        node("p", { text: localizedText(item.details) }),
        node("dl", { className: "diary-meta" }, [
          metaPair(t("status"), diaryStatusLabel(item.status)),
          metaPair(t("owner"), item.owner),
          metaPair(t("date"), item.date),
          metaPair(t("tag"), item.tag)
        ])
      ]),
      node("p", { className: "modal-copy", text: t("confirmMoveText") }),
      filterSelectField(t("moveToContainer"), "moduleId", currentModule?.id ?? "", diaryModules().map((module) => ({
        value: module.id,
        label: localizedText(module.labels)
      }))),
      node("div", { className: "button-row" }, [
        actionButton(t("confirm"), "primary"),
        actionButton(t("cancel"), "ghost", closeDiaryMoveItemModal)
      ])
    ])
  ]);
}


