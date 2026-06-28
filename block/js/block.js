window.AHX_PAGE_RENDERERS = window.AHX_PAGE_RENDERERS || {};

window.AHX_PAGE_RENDERERS.block = function renderBlockPage() {
  return authLayout(node("div", { className: "auth-flow" }, [
    renderBlockHeading(),
    renderBlockForm()
  ]), "block");
};

function renderBlockHeading() {
  return node("div", { className: "section-heading" }, [
    node("p", { className: "eyebrow", text: AHX_CONFIG.brand.shortName }),
    node("h2", { text: t("blockTitle") }),
    node("p", { text: t("blockSubtitle") })
  ]);
}

function renderBlockForm() {
  return node("form", { className: "stack", onSubmit: handleAuthSubmit("home") }, [
    field(t("password"), "password", "password", AHX_CONFIG.formDefaults.passwordPlaceholder),
    node("p", { className: "status-note", "data-status": "", text: t("authBlocked") }),
    node("div", { className: "button-row" }, [
      actionButton(t("unlockSite"), "primary")
    ])
  ]);
}
