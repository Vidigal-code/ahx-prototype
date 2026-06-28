window.AHX_PAGE_RENDERERS = window.AHX_PAGE_RENDERERS || {};

window.AHX_PAGE_RENDERERS.register = function renderRegisterPage() {
  return authLayout(node("div", { className: "auth-flow" }, [
    renderRegisterHeading(),
    renderRegisterForm()
  ]), "register");
};

function renderRegisterHeading() {
  return node("div", { className: "section-heading" }, [
    node("p", { className: "eyebrow", text: AHX_CONFIG.brand.shortName }),
    node("h2", { text: t("registerTitle") }),
    node("p", { text: t("registerSubtitle") })
  ]);
}

function renderRegisterForm() {
  return node("form", { className: "stack", onSubmit: handleAuthSubmit("selection") }, [
    field(t("name"), "text", "name", AHX_CONFIG.formDefaults.namePlaceholder),
    field(t("email"), "email", "email", AHX_CONFIG.formDefaults.emailPlaceholder),
    field(t("password"), "password", "password", AHX_CONFIG.formDefaults.passwordPlaceholder),
    selectField(t("goal"), "goal", categoryOptions()),
    node("div", { className: "button-row" }, [
      actionButton(t("createAccount"), "primary"),
      primaryLink(t("login"), "login", "button button--ghost")
    ]),
    node("div", { className: "auth-text-links" }, [
      primaryLink(t("registerWithAuth"), "registerAuth", "text-link")
    ])
  ]);
}
