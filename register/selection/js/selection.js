window.AHX_PAGE_RENDERERS = window.AHX_PAGE_RENDERERS || {};

window.AHX_PAGE_RENDERERS.selection = function renderSelectionPage() {
  const selected = new Set(storage.get("ahx_selected_features", ["travel"]));
  return appLayout("selection", node("div", { className: "page-shell page-shell--selection" }, [
    renderSelectionHero(selected),
    node("section", { className: "feature-grid" }, AHX_FEATURES.map((category) => renderCategoryCard(category, selected)))
  ]));
};

function renderSelectionHero(selected) {
  const enabledSelectedCount = [...selected].filter((id) => AHX_PERSONAL_ACTIVE_IDS.includes(id)).length;
  return node("section", { className: "selection-hero" }, [
    node("div", { className: "section-heading" }, [
      node("p", { className: "eyebrow", text: t("allCategories") }),
      node("h1", { text: t("selectionTitle") }),
      node("p", { text: t("selectionSubtitle") })
    ]),
    node("div", { className: "selection-actions" }, [
      node("span", { className: "selection-count", "data-selection-count": "", text: `${enabledSelectedCount} ${t("selectedCount")}` }),
      actionButton(t("saveSelection"), "primary", () => {
        storage.set("ahx_selected_features", getCheckedValues());
        location.href = routePath("home");
      })
    ])
  ]);
}

function renderCategoryCard(category, selected) {
  return node("article", { className: "feature-card", "data-category": category.id }, [
    node("header", { className: "feature-card__header" }, [
      node("span", { className: "feature-card__icon" }, [
        lucideIcon(iconNameOf(category), "lucide-icon")
      ]),
      node("h2", { text: labelOf(category) })
    ]),
    node("div", { className: "feature-card__items" }, category.items.map((item) => renderFeatureToggle(item, selected.has(item.id))))
  ]);
}

function renderFeatureToggle(item, checked) {
  const isEnabled = AHX_PERSONAL_ACTIVE_IDS.includes(item.id);
  return node("label", { className: "check-row" }, [
    node("input", { type: "checkbox", value: item.id, checked: checked && isEnabled, disabled: !isEnabled, onChange: updateSelectionCount }),
    node("span", { className: "check-row__box" }),
    node("span", { className: "check-row__icon" }, [
      lucideIcon(iconNameOf(item), "lucide-icon")
    ]),
    node("span", { text: labelOf(item) }),
    !isEnabled ? node("span", { className: "locked-mode", text: t("disabledMode") }) : null
  ]);
}

function getCheckedValues() {
  return [...document.querySelectorAll(".check-row input:checked")].map((input) => input.value);
}

function updateSelectionCount() {
  const count = document.querySelector("[data-selection-count]");
  if (count) count.textContent = `${getCheckedValues().length} ${t("selectedCount")}`;
}
