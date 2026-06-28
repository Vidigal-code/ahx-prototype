window.AHX_PAGE_RENDERERS = window.AHX_PAGE_RENDERERS || {};

window.AHX_PAGE_RENDERERS.home = function renderHomePage() {
  const modules = diaryModules();
  const summary = buildDiaryDashboardSummary(modules);
  return appLayout("home", node("div", { className: "home-content home-dashboard" }, [
    renderHomeDashboardHeader(summary),
    renderHomeDashboardStats(summary),
    renderHomeDashboardProgress(summary),
    renderHomeDashboardModules(modules)
  ]));
};

function buildDiaryDashboardSummary(modules) {
  const items = modules.flatMap((module) => module.items.map((item) => ({ ...item, module })));
  const stats = diaryContainerStats(items);
  return {
    modules: modules.length,
    total: stats.total,
    planned: stats.planned,
    progress: stats.progress,
    complete: stats.complete,
    high: stats.high,
    medium: stats.medium,
    low: stats.low,
    completion: stats.completion
  };
}

function renderHomeDashboardHeader(summary) {
  return node("header", { className: "workspace-header dashboard-header" }, [
    node("div", { className: "section-heading" }, [
      node("p", { className: "eyebrow", text: t("dashboard") }),
      node("h1", { text: t("diaryTitle") }),
      node("p", { text: t("diarySubtitle") })
    ]),
    node("div", { className: "dashboard-completion" }, [
      node("strong", { text: `${summary.completion}%` }),
      node("span", { text: t("completionRate") })
    ])
  ]);
}

function renderHomeDashboardStats(summary) {
  const cards = [
    ["book-open-text", t("visibleContainers"), summary.modules],
    ["list-checks", t("totalTasks"), summary.total],
    ["calendar-clock", t("plannedTasks"), summary.planned],
    ["activity", t("progressTasks"), summary.progress],
    ["badge-check", t("completedTasks"), summary.complete],
    ["triangle-alert", t("highPriority"), summary.high]
  ];
  return node("section", { className: "dashboard-stat-grid" }, cards.map(([icon, label, value]) =>
    node("article", { className: "dashboard-stat-card" }, [
      dashboardIcon(icon, "dashboard-stat-card__icon"),
      node("strong", { text: String(value) }),
      node("span", { text: label })
    ])
  ));
}

function renderHomeDashboardProgress(summary) {
  const total = Math.max(summary.total, 1);
  const rows = [
    [t("planned"), summary.planned, "planned"],
    [t("inProgress"), summary.progress, "progress"],
    [t("complete"), summary.complete, "complete"],
    [t("highPriority"), summary.high, "high"]
  ];
  return node("section", { className: "dashboard-progress" }, [
    node("article", { className: "dashboard-progress__panel panel" }, [
      node("div", { className: "panel__header dashboard-progress__header" }, [
        node("h2", { text: t("status") }),
        node("span", { className: "panel-badge", text: `${summary.total} ${t("totalTasks")}` })
      ]),
      node("div", { className: "dashboard-progress__rows" }, rows.map(([label, value, type]) => {
        const percent = Math.round((value / total) * 100);
        return node("div", { className: `dashboard-progress__row dashboard-progress__row--${type}` }, [
          node("div", { className: "dashboard-progress__label" }, [
            node("span", { className: `dashboard-progress__dot dashboard-progress__dot--${type}` }),
            node("span", { text: label })
          ]),
          node("strong", { className: "dashboard-progress__value", text: String(value) }),
          node("div", { className: "dashboard-progress__track" }, [
            node("span", { className: `dashboard-progress__bar dashboard-progress__bar--${type}`, style: `width: ${percent}%` })
          ]),
          node("span", { className: "dashboard-progress__percent", text: `${percent}%` })
        ]);
      }))
    ])
  ]);
}

function renderHomeDashboardModules(modules) {
  return node("section", { className: "dashboard-modules" }, modules.map((module) => {
    const stats = diaryContainerStats(module.items);
    return node("article", { className: "dashboard-module-card" }, [
      node("header", { className: "dashboard-module-card__header" }, [
        dashboardIcon(iconNameOf(module), "dashboard-module-card__icon"),
        node("div", {}, [
          node("h2", { text: localizedText(module.labels) }),
          node("p", { text: `${stats.total} ${t("totalTasks")} · ${stats.completion}% ${t("completionRate")}` })
        ])
      ]),
      node("div", { className: "dashboard-module-card__metrics" }, [
        dashboardMetric(t("planned"), stats.planned),
        dashboardMetric(t("inProgress"), stats.progress),
        dashboardMetric(t("complete"), stats.complete),
        dashboardMetric(t("high"), stats.high)
      ])
    ]);
  }));
}

function dashboardMetric(label, value) {
  return node("div", {}, [
    node("strong", { text: String(value) }),
    node("span", { text: label })
  ]);
}

function dashboardIcon(iconName, className) {
  return node("span", { className: `dashboard-icon ${className}` }, [
    lucideIcon(iconName || "circle", "lucide-icon dashboard-icon__glyph")
  ]);
}
