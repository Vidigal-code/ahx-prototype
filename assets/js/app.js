function renderApp() {
  applyTheme();
  document.documentElement.lang = getLanguage();
  const app = document.querySelector("#app");
  const page = app.dataset.page || "block";
  if (page === "block" && isAuthUnlocked()) {
    location.href = routePath("home");
    return;
  }
  if (isProtectedPage(page) && !isAuthUnlocked()) {
    location.href = routePath("block");
    return;
  }
  app.replaceChildren(pageRenderer(page)());
  bindPageEvents(page);
  renderLucideIcons();
}

const DIARY_PAGE_SIZE = 2;

function pageRenderer(page) {
  return window.AHX_PAGE_RENDERERS?.[page] ?? window.AHX_PAGE_RENDERERS?.block;
}

function isProtectedPage(page) {
  return !AHX_CONFIG.auth.publicPages.includes(page);
}

function isAuthUnlocked() {
  return storage.get(AHX_CONFIG.auth.sessionKey, false) === true;
}

function localizedText(values) {
  return values[getLanguage()] ?? values.en ?? "";
}

function multilingualValue(value) {
  return { en: value, pt: value, es: value };
}

function diaryModules() {
  const deleted = new Set(storage.get("ahx_diary_deleted_modules", []));
  const deletedItems = new Set(storage.get("ahx_diary_deleted_items", []));
  const itemOverrides = storage.get("ahx_diary_item_overrides", {});
  const customItems = storage.get("ahx_diary_custom_items", {});
  const itemMoves = storage.get("ahx_diary_item_moves", {});
  const groupedItems = {};
  orderedDiaryModuleDefinitions().forEach((module) => {
    [...module.items, ...(AHX_DIARY_EXTRA_ITEMS[module.id] ?? []), ...(customItems[module.id] ?? [])]
      .filter((item) => !deletedItems.has(item.id))
      .forEach((item) => {
        const targetModuleId = itemMoves[item.id] ?? module.id;
        groupedItems[targetModuleId] = groupedItems[targetModuleId] ?? [];
        groupedItems[targetModuleId].push({
          ...item,
          ...(itemOverrides[item.id] ?? {}),
          sourceModuleId: module.id
        });
      });
  });
  return orderedDiaryModuleDefinitions()
    .filter((module) => !deleted.has(module.id))
    .map((module) => ({
      ...module,
      items: groupedItems[module.id] ?? []
    }));
}

function orderedDiaryModuleDefinitions() {
  const order = diaryModuleOrder();
  return order
    .map((moduleId) => AHX_DIARY_MODULES.find((module) => module.id === moduleId))
    .filter(Boolean);
}

function diaryModuleOrder() {
  const moduleIds = AHX_DIARY_MODULES.map((module) => module.id);
  const savedOrder = storage.get("ahx_diary_module_order", []);
  return [
    ...savedOrder.filter((moduleId) => moduleIds.includes(moduleId)),
    ...moduleIds.filter((moduleId) => !savedOrder.includes(moduleId))
  ];
}

function findDiaryItem(itemId) {
  return diaryModules().flatMap((module) => module.items).find((item) => item.id === itemId);
}

function findDiaryModuleByItem(itemId) {
  return diaryModules().find((module) => module.items.some((item) => item.id === itemId));
}

function metaPair(label, value) {
  return node("div", {}, [
    node("dt", { text: label }),
    node("dd", { text: value })
  ]);
}

function diaryStatusLabel(status) {
  const labels = {
    planned: t("planned"),
    progress: t("inProgress"),
    complete: t("complete")
  };
  return labels[status] ?? status;
}

function getDiaryViewMode() {
  return storage.get("ahx_diary_view", "containers");
}

function toggleDiaryView() {
  storage.set("ahx_diary_view", getDiaryViewMode() === "kanban" ? "containers" : "kanban");
  renderApp();
}

function diaryPages() {
  return storage.get("ahx_diary_pages", {});
}

function diaryPage(moduleId, itemCount) {
  const pages = Math.max(1, Math.ceil(itemCount / DIARY_PAGE_SIZE));
  const page = Number(diaryPages()[moduleId] ?? 1);
  return Math.min(Math.max(page, 1), pages);
}

function paginatedDiaryItems(items, page) {
  const start = (page - 1) * DIARY_PAGE_SIZE;
  return items.slice(start, start + DIARY_PAGE_SIZE);
}

function changeDiaryPage(moduleId, page) {
  const pages = diaryPages();
  pages[moduleId] = Math.max(1, page);
  storage.set("ahx_diary_pages", pages);
  renderApp();
}

function diaryContainerActionPages() {
  return storage.get("ahx_diary_action_pages", {});
}

function diaryContainerActionPage(moduleId, actionCount) {
  const pages = Math.max(1, Math.ceil(actionCount / 2));
  const page = Number(diaryContainerActionPages()[moduleId] ?? 1);
  return Math.min(Math.max(page, 1), pages);
}

function changeDiaryContainerActionPage(moduleId, direction, actionCount) {
  const pages = diaryContainerActionPages();
  const page = diaryContainerActionPage(moduleId, actionCount);
  pages[moduleId] = Math.max(1, page + direction);
  storage.set("ahx_diary_action_pages", pages);
  renderApp();
}

function hiddenDiaryContainerActions() {
  return new Set(storage.get("ahx_diary_hidden_action_modules", []));
}

function isDiaryContainerActionsHidden(moduleId) {
  return hiddenDiaryContainerActions().has(moduleId);
}

function toggleDiaryContainerActions(moduleId) {
  const hidden = hiddenDiaryContainerActions();
  if (hidden.has(moduleId)) hidden.delete(moduleId);
  else hidden.add(moduleId);
  storage.set("ahx_diary_hidden_action_modules", [...hidden]);
  renderApp();
}

function diaryFilters() {
  return storage.get("ahx_diary_filters", {});
}

function diaryGlobalSearch() {
  return storage.get("ahx_diary_global_search", "");
}

function filteredDiaryItems(module) {
  const filters = diaryFilters()[module.id] ?? {};
  const query = (filters.query ?? "").trim().toLowerCase();
  const globalQuery = diaryGlobalSearch().trim().toLowerCase();
  return module.items.filter((item) => {
    const text = `${localizedText(item.title)} ${localizedText(item.details)} ${item.owner} ${item.tag} ${item.date}`.toLowerCase();
    const matchesQuery = !query || text.includes(query);
    const matchesGlobalQuery = !globalQuery || text.includes(globalQuery);
    const matchesStatus = !filters.status || item.status === filters.status;
    const matchesPriority = !filters.priority || item.priority === filters.priority;
    return matchesQuery && matchesGlobalQuery && matchesStatus && matchesPriority;
  });
}

function diaryContainerStats(items) {
  const total = items.length;
  const stats = items.reduce((totals, item) => {
    totals[item.status] = (totals[item.status] ?? 0) + 1;
    totals[item.priority] = (totals[item.priority] ?? 0) + 1;
    return totals;
  }, { planned: 0, progress: 0, complete: 0, low: 0, medium: 0, high: 0 });
  return {
    total,
    planned: stats.planned,
    progress: stats.progress,
    complete: stats.complete,
    low: stats.low,
    medium: stats.medium,
    high: stats.high,
    completion: total ? Math.round((stats.complete / total) * 100) : 0
  };
}

function openDiaryGlobalSearchModal() {
  storage.set("ahx_diary_global_search_modal", "open");
  renderApp();
}

function closeDiaryGlobalSearchModal() {
  storage.set("ahx_diary_global_search_modal", "");
  renderApp();
}

function applyDiaryGlobalSearch(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  storage.set("ahx_diary_global_search", String(form.get("query") ?? ""));
  storage.set("ahx_diary_global_search_modal", "");
  storage.set("ahx_diary_pages", {});
  renderApp();
}

function clearDiaryGlobalSearch() {
  storage.set("ahx_diary_global_search", "");
  storage.set("ahx_diary_global_search_modal", "");
  storage.set("ahx_diary_pages", {});
  renderApp();
}

function openDiaryFilter(moduleId) {
  storage.set("ahx_diary_filter_modal", moduleId);
  renderApp();
}

function closeDiaryFilter() {
  storage.set("ahx_diary_filter_modal", "");
  renderApp();
}

function openDiaryInfo(moduleId) {
  storage.set("ahx_diary_info_module", moduleId);
  renderApp();
}

function closeDiaryInfo() {
  storage.set("ahx_diary_info_module", "");
  renderApp();
}

function clearDiaryFilter(moduleId) {
  const filters = diaryFilters();
  delete filters[moduleId];
  storage.set("ahx_diary_filters", filters);
  storage.set("ahx_diary_filter_modal", "");
  renderApp();
}

function applyDiaryFilter(moduleId) {
  return (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const filters = diaryFilters();
    filters[moduleId] = {
      query: String(form.get("query") ?? ""),
      status: String(form.get("status") ?? ""),
      priority: String(form.get("priority") ?? "")
    };
    const pages = diaryPages();
    pages[moduleId] = 1;
    storage.set("ahx_diary_filters", filters);
    storage.set("ahx_diary_pages", pages);
    storage.set("ahx_diary_filter_modal", "");
    renderApp();
  };
}

function openDiaryDeleteModal() {
  storage.set("ahx_diary_delete_modal", "open");
  renderApp();
}

function closeDiaryDeleteModal() {
  storage.set("ahx_diary_delete_modal", "");
  storage.set("ahx_diary_pending_delete", "");
  renderApp();
}

function openDiaryConfirmDeleteModal(moduleId) {
  storage.set("ahx_diary_delete_modal", "");
  storage.set("ahx_diary_pending_delete", moduleId);
  renderApp();
}

function cancelDiaryDelete() {
  storage.set("ahx_diary_pending_delete", "");
  storage.set("ahx_diary_delete_modal", "");
  renderApp();
}

function confirmDiaryDelete(moduleId) {
  const deleted = new Set(storage.get("ahx_diary_deleted_modules", []));
  deleted.add(moduleId);
  storage.set("ahx_diary_deleted_modules", [...deleted]);
  storage.set("ahx_diary_pending_delete", "");
  storage.set("ahx_diary_delete_modal", "");
  renderApp();
}

function openDiarySettingsModal() {
  storage.set("ahx_diary_settings_modal", "open");
  renderApp();
}

function closeDiarySettingsModal() {
  storage.set("ahx_diary_settings_modal", "");
  renderApp();
}

function setDiaryModuleVisible(moduleId, isVisible) {
  const deleted = new Set(storage.get("ahx_diary_deleted_modules", []));
  if (isVisible) deleted.delete(moduleId);
  else deleted.add(moduleId);
  storage.set("ahx_diary_deleted_modules", [...deleted]);
  if (!isVisible && storage.get("ahx_diary_fullscreen_module", "") === moduleId) {
    storage.set("ahx_diary_fullscreen_module", "");
  }
  renderApp();
}

function moveDiaryModule(moduleId, direction) {
  const order = diaryModuleOrder();
  const currentIndex = order.indexOf(moduleId);
  const nextIndex = currentIndex + direction;
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= order.length) return;
  const nextOrder = [...order];
  [nextOrder[currentIndex], nextOrder[nextIndex]] = [nextOrder[nextIndex], nextOrder[currentIndex]];
  storage.set("ahx_diary_module_order", nextOrder);
  renderApp();
}

function diaryEditingModules() {
  return new Set(storage.get("ahx_diary_editing_modules", []));
}

function isDiaryModuleEditing(moduleId) {
  return diaryEditingModules().has(moduleId);
}

function toggleDiaryModuleEditing(moduleId) {
  const editingModules = diaryEditingModules();
  if (editingModules.has(moduleId)) editingModules.delete(moduleId);
  else editingModules.add(moduleId);
  storage.set("ahx_diary_editing_modules", [...editingModules]);
  renderApp();
}

function openDiaryFullscreen(moduleId) {
  storage.set("ahx_diary_fullscreen_module", moduleId);
  renderApp();
}

function closeDiaryFullscreen() {
  storage.set("ahx_diary_fullscreen_module", "");
  renderApp();
}

function openDiaryCreateModal(moduleId = "") {
  storage.set("ahx_diary_create_modal", "open");
  storage.set("ahx_diary_create_module", moduleId);
  renderApp();
}

function closeDiaryCreateModal() {
  storage.set("ahx_diary_create_modal", "");
  storage.set("ahx_diary_create_module", "");
  renderApp();
}

function openDiaryEditItem(itemId) {
  storage.set("ahx_diary_edit_item", itemId);
  renderApp();
}

function closeDiaryEditModal() {
  storage.set("ahx_diary_edit_item", "");
  renderApp();
}

function updateDiaryTask(itemId) {
  return (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") || "").trim();
    if (!title) return;
    const details = String(form.get("details") || "").trim() || title;
    const overrides = storage.get("ahx_diary_item_overrides", {});
    overrides[itemId] = {
      status: String(form.get("status") || "planned"),
      priority: String(form.get("priority") || "medium"),
      date: String(form.get("date") || new Date().toISOString().slice(0, 10)),
      owner: String(form.get("owner") || "AionHex"),
      tag: String(form.get("tag") || t("tag")),
      title: multilingualValue(title),
      details: multilingualValue(details)
    };
    storage.set("ahx_diary_item_overrides", overrides);
    storage.set("ahx_diary_edit_item", "");
    renderApp();
  };
}

function openDiaryDeleteItem(itemId) {
  storage.set("ahx_diary_pending_delete_item", itemId);
  renderApp();
}

function closeDiaryDeleteItemModal() {
  storage.set("ahx_diary_pending_delete_item", "");
  renderApp();
}

function confirmDiaryDeleteItem(itemId) {
  const deletedItems = new Set(storage.get("ahx_diary_deleted_items", []));
  deletedItems.add(itemId);
  storage.set("ahx_diary_deleted_items", [...deletedItems]);
  storage.set("ahx_diary_pending_delete_item", "");
  renderApp();
}

function openDiaryMoveItem(itemId) {
  storage.set("ahx_diary_pending_move_item", itemId);
  renderApp();
}

function closeDiaryMoveItemModal() {
  storage.set("ahx_diary_pending_move_item", "");
  renderApp();
}

function confirmDiaryMoveItem(itemId) {
  return (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const moduleId = String(form.get("moduleId") || "");
    if (!moduleId) return;
    const itemMoves = storage.get("ahx_diary_item_moves", {});
    itemMoves[itemId] = moduleId;
    storage.set("ahx_diary_item_moves", itemMoves);
    storage.set("ahx_diary_pending_move_item", "");
    storage.set("ahx_diary_pages", {});
    renderApp();
  };
}

function createDiaryTask(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const moduleId = String(form.get("moduleId") || "");
  const title = String(form.get("title") || "").trim();
  if (!moduleId || !title) return;
  const details = String(form.get("details") || "").trim() || title;
  const customItems = storage.get("ahx_diary_custom_items", {});
  const item = {
    id: `custom_${Date.now()}`,
    status: String(form.get("status") || "planned"),
    priority: String(form.get("priority") || "medium"),
    date: String(form.get("date") || new Date().toISOString().slice(0, 10)),
    owner: String(form.get("owner") || "AionHex"),
    tag: String(form.get("tag") || t("tag")),
    title: multilingualValue(title),
    details: multilingualValue(details)
  };
  customItems[moduleId] = [...(customItems[moduleId] ?? []), item];
  storage.set("ahx_diary_custom_items", customItems);
  storage.set("ahx_diary_create_modal", "");
  storage.set("ahx_diary_create_module", "");
  renderApp();
}

function filterTextField(label, name, value) {
  return node("label", { className: "field" }, [
    node("span", { text: label }),
    node("input", { type: "search", name, value, placeholder: label })
  ]);
}

function modalTextField(label, name, value) {
  return node("label", { className: "field" }, [
    node("span", { text: label }),
    node("input", { type: "text", name, value, placeholder: label })
  ]);
}

function modalDateField(label, name, value) {
  const input = node("input", { type: "date", name, value });
  return node("label", { className: "field" }, [
    node("span", { text: label }),
    inputControl(input, "date")
  ]);
}

function filterSelectField(label, name, value, options) {
  const select = node("select", { name, className: "select" });
  options.forEach((option) => select.append(node("option", {
    value: option.value,
    text: option.label,
    selected: option.value === value
  })));
  return node("label", { className: "field" }, [node("span", { text: label }), selectControl(select)]);
}

function handleAuthSubmit(route) {
  return async (event) => {
    event.preventDefault();
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    const isValid = await matchesMockedPassword(password);
    storage.set(AHX_CONFIG.auth.sessionKey, isValid);
    updateStatus(isValid ? t("authUnlocked") : t("authBlocked"));
    if (isValid) location.href = routePath(route);
  };
}

async function matchesMockedPassword(password) {
  return (await sha256(password)) === AHX_CONFIG.auth.passwordSha256;
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  if (!globalThis.crypto?.subtle) return sha256Fallback(bytes);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function sha256Fallback(bytes) {
  const rightRotate = (value, amount) => (value >>> amount) | (value << (32 - amount));
  const constants = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  const hash = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const padded = [...bytes, 0x80];
  while ((padded.length % 64) !== 56) padded.push(0);
  const bitLength = bytes.length * 8;
  for (let shift = 56; shift >= 0; shift -= 8) padded.push((bitLength / 2 ** shift) & 0xff);

  for (let offset = 0; offset < padded.length; offset += 64) {
    const words = new Array(64).fill(0);
    for (let index = 0; index < 16; index += 1) {
      const position = offset + index * 4;
      words[index] = ((padded[position] << 24) | (padded[position + 1] << 16) | (padded[position + 2] << 8) | padded[position + 3]) >>> 0;
    }
    for (let index = 16; index < 64; index += 1) {
      const s0 = rightRotate(words[index - 15], 7) ^ rightRotate(words[index - 15], 18) ^ (words[index - 15] >>> 3);
      const s1 = rightRotate(words[index - 2], 17) ^ rightRotate(words[index - 2], 19) ^ (words[index - 2] >>> 10);
      words[index] = (words[index - 16] + s0 + words[index - 7] + s1) >>> 0;
    }

    let [a, b, c, d, e, f, g, h] = hash;
    for (let index = 0; index < 64; index += 1) {
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + constants[index] + words[index]) >>> 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }
    [a, b, c, d, e, f, g, h].forEach((value, index) => {
      hash[index] = (hash[index] + value) >>> 0;
    });
  }
  return hash.map((value) => value.toString(16).padStart(8, "0")).join("");
}

function exportPrototypeData() {
  const data = {
    language: getLanguage(),
    theme: getTheme(),
    selectedFeatures: storage.get("ahx_selected_features", []),
    diary: {
      view: storage.get("ahx_diary_view", "containers"),
      filters: storage.get("ahx_diary_filters", {}),
      pages: storage.get("ahx_diary_pages", {}),
      customItems: storage.get("ahx_diary_custom_items", {}),
      itemOverrides: storage.get("ahx_diary_item_overrides", {}),
      itemMoves: storage.get("ahx_diary_item_moves", {}),
      deletedItems: storage.get("ahx_diary_deleted_items", []),
      editingModules: storage.get("ahx_diary_editing_modules", []),
      moduleOrder: storage.get("ahx_diary_module_order", []),
      deletedModules: storage.get("ahx_diary_deleted_modules", [])
    }
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const link = node("a", { href: URL.createObjectURL(blob), download: "aionhex-prototype.json" });
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
  updateStatus(t("exported"));
}

function importPrototypeData(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (data.language) setLanguage(data.language);
      if (data.theme) setTheme(data.theme);
      if (Array.isArray(data.selectedFeatures)) storage.set("ahx_selected_features", data.selectedFeatures);
      if (data.diary?.view) storage.set("ahx_diary_view", data.diary.view);
      if (data.diary?.filters) storage.set("ahx_diary_filters", data.diary.filters);
      if (data.diary?.pages) storage.set("ahx_diary_pages", data.diary.pages);
      if (data.diary?.customItems) storage.set("ahx_diary_custom_items", data.diary.customItems);
      if (data.diary?.itemOverrides) storage.set("ahx_diary_item_overrides", data.diary.itemOverrides);
      if (data.diary?.itemMoves) storage.set("ahx_diary_item_moves", data.diary.itemMoves);
      if (Array.isArray(data.diary?.deletedItems)) storage.set("ahx_diary_deleted_items", data.diary.deletedItems);
      if (Array.isArray(data.diary?.editingModules)) storage.set("ahx_diary_editing_modules", data.diary.editingModules);
      if (Array.isArray(data.diary?.moduleOrder)) storage.set("ahx_diary_module_order", data.diary.moduleOrder);
      if (Array.isArray(data.diary?.deletedModules)) storage.set("ahx_diary_deleted_modules", data.diary.deletedModules);
      updateStatus(t("imported"));
      renderApp();
    } catch {
      updateStatus("Invalid file");
    }
  };
  reader.readAsText(file);
}

function exportDiaryContainers() {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    containers: diaryModules().map((module) => ({
      moduleId: module.id,
      moduleLabel: localizedText(module.labels),
      items: module.items
    })),
    moduleOrder: storage.get("ahx_diary_module_order", []),
    deletedModules: storage.get("ahx_diary_deleted_modules", [])
  };
  downloadJson(data, "aionhex-diary-containers.json");
  updateStatus(t("exported"));
}

function importDiaryContainers(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      const containers = importedDiaryContainers(data);
      if (!Array.isArray(containers)) throw new Error("Invalid file");
      const moduleIds = containers.map((group) => group.moduleId).filter(Boolean);
      storage.set("ahx_diary_custom_items", importedTaskGroups(containers));
      storage.set("ahx_diary_item_overrides", {});
      storage.set("ahx_diary_item_moves", {});
      storage.set("ahx_diary_deleted_items", baseDiaryItemIds(moduleIds));
      if (Array.isArray(data.moduleOrder)) storage.set("ahx_diary_module_order", data.moduleOrder);
      if (Array.isArray(data.deletedModules)) {
        storage.set("ahx_diary_deleted_modules", data.deletedModules);
      } else {
        showImportedDiaryModules(moduleIds);
      }
      event.target.value = "";
      updateStatus(t("imported"));
      renderApp();
    } catch {
      updateStatus("Invalid file");
    }
  };
  reader.readAsText(file);
}

function importedDiaryContainers(data) {
  if (Array.isArray(data.containers)) return data.containers;
  if (Array.isArray(data.tasks)) return data.tasks;
  if (data.moduleId && Array.isArray(data.items)) return [data];
  return null;
}

function importedTaskGroups(tasks) {
  return tasks.reduce((groups, group) => {
    if (!group.moduleId || !Array.isArray(group.items)) return groups;
    groups[group.moduleId] = group.items.map(normalizeImportedDiaryItem);
    return groups;
  }, {});
}

function openDiaryContainerImport(moduleId) {
  const input = node("input", { type: "file", accept: "application/json", hidden: true });
  input.addEventListener("change", importDiaryContainerTasks(moduleId));
  document.body.append(input);
  input.click();
}

function exportDiaryContainerTasks(moduleId) {
  const module = diaryModules().find((item) => item.id === moduleId);
  if (!module) return;
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    moduleId: module.id,
    moduleLabel: localizedText(module.labels),
    items: module.items
  };
  downloadJson(data, `aionhex-${module.id}-tasks.json`);
  updateStatus(t("exported"));
}

function exportDiaryTask(itemId) {
  const item = findDiaryItem(itemId);
  const module = findDiaryModuleByItem(itemId);
  if (!item || !module) return;
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    moduleId: module.id,
    moduleLabel: localizedText(module.labels),
    item
  };
  downloadJson(data, `aionhex-${module.id}-${item.id}.json`);
  updateStatus(t("exported"));
}

function importDiaryContainerTasks(moduleId) {
  return (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      event.target.remove();
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const items = extractImportedDiaryItems(data);
        if (!items.length) throw new Error("Invalid file");
        const customItems = storage.get("ahx_diary_custom_items", {});
        customItems[moduleId] = [
          ...(customItems[moduleId] ?? []),
          ...items.map(normalizeImportedDiaryItem)
        ];
        storage.set("ahx_diary_custom_items", customItems);
        storage.set("ahx_diary_pages", {});
        updateStatus(t("imported"));
        renderApp();
      } catch {
        updateStatus("Invalid file");
      } finally {
        event.target.remove();
      }
    };
    reader.readAsText(file);
  };
}

function extractImportedDiaryItems(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.tasks)) return data.tasks;
  if (data.title || data.details) return [data];
  return [];
}

function normalizeImportedDiaryItem(item) {
  return {
    id: `imported_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    status: ["planned", "progress", "complete"].includes(item.status) ? item.status : "planned",
    priority: ["low", "medium", "high"].includes(item.priority) ? item.priority : "medium",
    date: item.date || new Date().toISOString().slice(0, 10),
    owner: item.owner || "AionHex",
    tag: item.tag || t("tag"),
    title: normalizeMultilingualValue(item.title, t("task")),
    details: normalizeMultilingualValue(item.details, textFallback(item.title, t("task")))
  };
}

function normalizeMultilingualValue(value, fallback) {
  if (value && typeof value === "object") {
    const text = value[getLanguage()] ?? value.en ?? value.pt ?? value.es ?? fallback;
    return {
      en: value.en ?? text,
      pt: value.pt ?? text,
      es: value.es ?? text
    };
  }
  return multilingualValue(String(value || fallback));
}

function textFallback(value, fallback) {
  if (value && typeof value === "object") return value[getLanguage()] ?? value.en ?? value.pt ?? value.es ?? fallback;
  return value || fallback;
}

function baseDiaryItemIds(moduleIds) {
  const scope = new Set(moduleIds);
  return AHX_DIARY_MODULES
    .filter((module) => !scope.size || scope.has(module.id))
    .flatMap((module) => [...module.items, ...(AHX_DIARY_EXTRA_ITEMS[module.id] ?? [])])
    .map((item) => item.id);
}

function showImportedDiaryModules(moduleIds) {
  const imported = new Set(moduleIds);
  const deleted = storage.get("ahx_diary_deleted_modules", []).filter((moduleId) => !imported.has(moduleId));
  storage.set("ahx_diary_deleted_modules", deleted);
}

function downloadJson(data, fileName) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const link = node("a", { href: URL.createObjectURL(blob), download: fileName });
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

function bindPageEvents(page) {
  syncSidebarState();
  window.onresize = syncSidebarState;
  if (page === "home") {
    const categoryFilter = document.querySelector("[name='categoryFilter']");
    categoryFilter?.addEventListener("change", () => {
      const values = categoryFilter.value === "all"
        ? flattenFeatures()
        : AHX_FEATURES.find((category) => category.id === categoryFilter.value)?.items ?? [];
      const container = document.querySelector("[data-feature-pills]");
      container.replaceChildren(...values.map(renderFeaturePill));
      renderLucideIcons();
    });
  }
}

document.addEventListener("DOMContentLoaded", renderApp);
