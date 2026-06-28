window.AHX_PAGE_RENDERERS = window.AHX_PAGE_RENDERERS || {};

window.AHX_PAGE_RENDERERS.registerAuth = function renderRegisterAuthPage() {
  return authLayout(node("div", { className: "auth-flow auth-flow--providers" }, [
    renderRegisterAuthHeading(),
    node("p", { className: "auth-provider-copy", text: t("registerAuthText") }),
    node("div", { className: "auth-provider-grid" }, AHX_AUTH_PROVIDERS.map(renderAuthProviderButton)),
    node("p", { className: "auth-provider-note", text: t("authProviderNote") }),
    node("div", { className: "button-row" }, [
      primaryLink(t("register"), "register", "button button--ghost"),
      primaryLink(t("login"), "login", "button button--ghost")
    ])
  ]), "registerAuth");
};

function renderRegisterAuthHeading() {
  return node("div", { className: "section-heading" }, [
    node("p", { className: "eyebrow", text: t("registerAuth") }),
    node("h2", { text: t("registerAuthTitle") }),
    node("p", { text: t("registerAuthSubtitle") })
  ]);
}

function renderAuthProviderButton(provider) {
  return node("button", {
    className: "auth-provider-button",
    type: "button",
    title: `${t("continueWith")} ${t(provider.key)}`,
    "aria-label": `${t("continueWith")} ${t(provider.key)}`,
    onClick: () => location.href = routePath("selection")
  }, [
    node("span", { className: "auth-provider-button__icon" }, [
      lucideIcon(provider.icon, "lucide-icon")
    ]),
    node("span", { text: t(provider.key) })
  ]);
}
