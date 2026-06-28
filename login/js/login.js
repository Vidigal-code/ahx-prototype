window.AHX_PAGE_RENDERERS = window.AHX_PAGE_RENDERERS || {};

window.AHX_PAGE_RENDERERS.login = function renderLoginPage() {
  return authLayout(node("div", { className: "auth-flow" }, [
    renderLoginHeading(),
    renderLoginForm()
  ]), "login");
};

function renderLoginHeading() {
  return node("div", { className: "section-heading" }, [
    node("p", { className: "eyebrow", text: AHX_CONFIG.brand.shortName }),
    node("h2", { text: t("loginTitle") }),
    node("p", { text: t("loginSubtitle") })
  ]);
}

function renderLoginForm() {
  return node("form", { className: "stack", onSubmit: handleAuthSubmit("home") }, [
    field(t("email"), "email", "email", AHX_CONFIG.formDefaults.emailPlaceholder),
    field(t("password"), "password", "password", AHX_CONFIG.formDefaults.passwordPlaceholder),
    node("div", { className: "button-row" }, [
      actionButton(t("login"), "primary"),
      primaryLink(t("register"), "register", "button button--ghost")
    ])
  ]);
}
