window.AHX_PAGE_RENDERERS = window.AHX_PAGE_RENDERERS || {};

window.AHX_PAGE_RENDERERS.about = function renderAboutPage() {
  return appLayout("about", node("div", { className: "about-page" }, [
    renderAboutHero(),
    renderAboutCore(),
    renderAboutFeatures()
  ]));
};

function renderAboutHero() {
  const totalFeatures = AHX_FEATURES.reduce((total, category) => total + category.items.length, 0);
  const activeModes = AHX_PERSONAL_ACTIVE_IDS.length;
  return node("section", { className: "about-hero" }, [
    node("div", { className: "about-hero__copy" }, [
      node("p", { className: "eyebrow", text: t("aboutEyebrow") }),
      node("h1", { text: t("aboutMarketingLine") }),
      node("p", { text: t("aboutSubtitle") })
    ]),
    node("div", { className: "about-stats", "aria-label": t("aboutCapabilityMap") }, [
      renderAboutStat(AHX_FEATURES.length, t("aboutCategoriesLabel")),
      renderAboutStat(totalFeatures, t("aboutCapabilitiesLabel")),
      renderAboutStat(activeModes, t("aboutActiveModesLabel"))
    ])
  ]);
}

function renderAboutStat(value, label) {
  return node("div", { className: "about-stat" }, [
    node("strong", { text: String(value) }),
    node("span", { text: label })
  ]);
}

function renderAboutCore() {
  const items = [
    ["lock", "aboutCoreAccessTitle", "aboutCoreAccessText"],
    ["user-plus", "aboutCoreAuthTitle", "aboutCoreAuthText"],
    ["layout-dashboard", "aboutCoreWorkspaceTitle", "aboutCoreWorkspaceText"],
    ["book-open-text", "aboutCoreDiaryTitle", "aboutCoreDiaryText"],
    ["mic", "aboutCoreAutomationTitle", "aboutCoreAutomationText"],
    ["settings-2", "aboutCorePreferencesTitle", "aboutCorePreferencesText"]
  ];
  return node("section", { className: "about-section" }, [
    node("div", { className: "section-heading" }, [
      node("h2", { text: t("aboutCoreTitle") })
    ]),
    node("div", { className: "about-core-grid" }, items.map(([icon, titleKey, textKey]) =>
      node("article", { className: "about-card" }, [
        node("span", { className: "about-card__icon" }, [lucideIcon(icon, "lucide-icon")]),
        node("h3", { text: t(titleKey) }),
        node("p", { text: t(textKey) })
      ])
    ))
  ]);
}

function renderAboutFeatures() {
  return node("section", { className: "about-section" }, [
    node("div", { className: "section-heading" }, [
      node("p", { className: "eyebrow", text: t("aboutCapabilityMap") }),
      node("h2", { text: t("aboutAllFeaturesTitle") }),
      node("p", { text: t("aboutAllFeaturesText") })
    ]),
    node("div", { className: "about-feature-grid" }, AHX_FEATURES.map(renderAboutFeatureCategory))
  ]);
}

function renderAboutFeatureCategory(category) {
  return node("article", { className: "about-feature-card" }, [
    node("header", { className: "about-feature-card__header" }, [
      node("span", { className: "feature-card__icon" }, [lucideIcon(iconNameOf(category), "lucide-icon")]),
      node("div", {}, [
        node("h3", { text: labelOf(category) }),
        node("p", { text: `${category.items.length} ${t("aboutCapabilitiesLabel").toLowerCase()}` })
      ])
    ]),
    node("ul", { className: "about-feature-list" }, category.items.map((item) =>
      node("li", {}, [
        node("span", { className: "check-row__icon" }, [lucideIcon(iconNameOf(item), "lucide-icon")]),
        node("span", { text: labelOf(item) })
      ])
    ))
  ]);
}
