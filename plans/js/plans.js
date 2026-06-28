window.AHX_PAGE_RENDERERS = window.AHX_PAGE_RENDERERS || {};

const AHX_PLAN_PRICES_USD = {
  work: 12,
  development: 29,
  studies: 10,
  finance: 18,
  health: 14,
  personal: 8,
  communication: 16,
  intelligence: 22,
  automation: 34,
  business: 39,
  content: 20
};

const AHX_PLAN_INTEGRATIONS = {
  development: "GitHub",
  automation: "APIs",
  business: "CRM",
  communication: "WhatsApp",
  intelligence: "Internet"
};

const AHX_PLAN_EXCHANGE = {
  pt: { rate: 5.5, currency: "BRL", locale: "pt-BR" },
  es: { rate: 0.92, currency: "EUR", locale: "es-ES" },
  en: { rate: 1, currency: "USD", locale: "en-US" }
};

window.AHX_PAGE_RENDERERS.plans = function renderPlansPage() {
  return appLayout("plans", node("div", { className: "plans-page" }, [
    renderPlansHero(),
    node("section", { className: "plans-grid" }, [
      renderFreePlanCard(),
      ...AHX_FEATURES.map(renderModulePlanCard)
    ])
  ]));
};

function renderPlansHero() {
  return node("header", { className: "plans-hero" }, [
    node("div", { className: "section-heading" }, [
      node("p", { className: "eyebrow", text: AHX_CONFIG.brand.shortName }),
      node("h1", { text: t("plansTitle") }),
      node("p", { text: t("plansSubtitle") })
    ])
  ]);
}

function renderFreePlanCard() {
  return node("article", { className: "plan-card plan-card--enabled" }, [
    renderPlanHeader("sparkles", t("freePlan"), t("enabledPlan")),
    node("strong", { className: "plan-card__price", text: formatPlanPrice(0) }),
    node("p", { className: "plan-card__description", text: t("freePlanDescription") }),
    node("ul", { className: "plan-card__features" }, [
      node("li", { text: t("freePlanFeatureOne") }),
      node("li", { text: t("freePlanFeatureTwo") }),
      node("li", { text: t("freePlanFeatureThree") })
    ]),
    actionButton(t("freePlanCta"), "primary", null, true)
  ]);
}

function renderModulePlanCard(category) {
  const price = AHX_PLAN_PRICES_USD[category.id] ?? 15;
  const integration = AHX_PLAN_INTEGRATIONS[category.id];
  return node("article", { className: "plan-card is-disabled" }, [
    renderPlanHeader(iconNameOf(category), labelOf(category), t("disabledPlan")),
    node("strong", { className: "plan-card__price", text: formatPlanPrice(price) }),
    node("p", { className: "plan-card__description", text: t("modulePlanDescription") }),
    integration ? node("span", { className: "plan-card__integration", text: `${t("integrationIncluded")}: ${integration}` }) : null,
    node("ul", { className: "plan-card__features" }, category.items.slice(0, 5).map((item) =>
      node("li", { text: labelOf(item) })
    )),
    actionButton(t("unavailablePrototype"), "ghost", null, true)
  ]);
}

function renderPlanHeader(icon, title, status) {
  return node("header", { className: "plan-card__header" }, [
    node("span", { className: "plan-card__icon" }, [lucideIcon(icon, "lucide-icon")]),
    node("div", {}, [
      node("h2", { text: title }),
      node("span", { className: "plan-card__status", text: status })
    ])
  ]);
}

function formatPlanPrice(usdPrice) {
  const language = getLanguage();
  const currency = AHX_PLAN_EXCHANGE[language] ?? AHX_PLAN_EXCHANGE.en;
  const value = usdPrice * currency.rate;
  return new Intl.NumberFormat(currency.locale, {
    style: "currency",
    currency: currency.currency,
    maximumFractionDigits: value >= 100 ? 0 : 2
  }).format(value);
}
