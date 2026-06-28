window.AHX_PAGE_RENDERERS = window.AHX_PAGE_RENDERERS || {};

window.AHX_PAGE_RENDERERS.profile = function renderProfilePage() {
  return appLayout("profile", node("div", { className: "profile-page" }, [
    renderProfileHero(),
    node("div", { className: "profile-grid" }, [
      renderProfileInformationCard(),
      renderProfilePasswordCard(),
      renderProfileInviteCard(),
      renderProfilePlanCard()
    ])
  ]));
};

function renderProfileHero() {
  return node("header", { className: "profile-hero" }, [
    node("div", { className: "section-heading" }, [
      node("p", { className: "eyebrow", text: AHX_CONFIG.brand.shortName }),
      node("h1", { text: t("profileTitle") }),
      node("p", { text: t("profileSubtitle") })
    ])
  ]);
}

function renderProfileInformationCard() {
  const profile = storage.get("ahx_profile", {
    name: AHX_CONFIG.formDefaults.namePlaceholder,
    email: AHX_CONFIG.formDefaults.emailPlaceholder,
    company: AHX_CONFIG.brand.name,
    role: "Owner"
  });
  return node("form", { className: "profile-card", onSubmit: saveProfileInformation }, [
    profileCardHeader("user-circle", t("editInformation"), t("profileInfoText")),
    profileTextField(t("displayName"), "name", profile.name, "text"),
    profileTextField(t("email"), "email", profile.email, "email"),
    profileTextField(t("company"), "company", profile.company, "text"),
    profileTextField(t("role"), "role", profile.role, "text"),
    node("div", { className: "profile-card__actions" }, [
      actionButton(t("saveInformation"), "primary")
    ])
  ]);
}

function renderProfilePasswordCard() {
  return node("form", { className: "profile-card", onSubmit: updateProfilePassword }, [
    profileCardHeader("shield-check", t("passwordSettings"), t("passwordSettingsText")),
    profileTextField(t("currentPassword"), "currentPassword", "", "password"),
    profileTextField(t("newPassword"), "newPassword", "", "password"),
    profileTextField(t("confirmNewPassword"), "confirmNewPassword", "", "password"),
    node("div", { className: "profile-card__actions" }, [
      actionButton(t("updatePassword"), "primary")
    ])
  ]);
}

function renderProfilePlanCard() {
  return node("section", { className: "profile-card profile-card--plan" }, [
    profileCardHeader("wallet", t("activePlan"), t("freePlanText")),
    node("div", { className: "profile-plan" }, [
      node("span", { className: "profile-plan__badge", text: t("freePlan") }),
      node("p", { text: t("planIncluded") }),
      node("ul", { className: "profile-plan__list" }, [
        node("li", { text: t("freePlanFeatureOne") }),
        node("li", { text: t("freePlanFeatureTwo") }),
        node("li", { text: t("freePlanFeatureThree") })
      ])
    ]),
    node("div", { className: "profile-danger" }, [
      node("div", {}, [
        node("h3", { text: t("cancelPlan") }),
        node("p", { text: t("cancelPlanText") })
      ]),
      actionButton(t("cancelPlan"), "ghost", requestPlanCancelation)
    ])
  ]);
}

function renderProfileInviteCard() {
  const inviteCode = storage.get("ahx_invite_code", "");
  return node("section", { className: "profile-card" }, [
    profileCardHeader("send", t("inviteFriends"), t("inviteFriendsText")),
    node("label", { className: "field" }, [
      node("span", { text: t("uniqueInviteCode") }),
      node("input", {
        type: "text",
        value: inviteCode || "AHX-------",
        readonly: true,
        "aria-label": t("uniqueInviteCode")
      })
    ]),
    node("div", { className: "profile-card__actions" }, [
      actionButton(t("generateUniqueCode"), "primary", generateInviteCode)
    ]),
    node("div", { className: "profile-danger" }, [
      node("div", {}, [
        node("h3", { text: t("accountDangerZone") }),
        node("p", { text: t("accountDangerText") })
      ]),
      actionButton(t("deleteAccount"), "ghost", requestAccountDeletion)
    ])
  ]);
}

function profileCardHeader(icon, title, text) {
  return node("header", { className: "profile-card__header" }, [
    node("span", { className: "profile-card__icon" }, [lucideIcon(icon, "lucide-icon")]),
    node("div", {}, [
      node("h2", { text: title }),
      node("p", { text })
    ])
  ]);
}

function profileTextField(label, name, value, type = "text") {
  return node("label", { className: "field" }, [
    node("span", { text: label }),
    node("input", { type, name, value, placeholder: label, autocomplete: name })
  ]);
}

function saveProfileInformation(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  storage.set("ahx_profile", {
    name: String(form.get("name") ?? ""),
    email: String(form.get("email") ?? ""),
    company: String(form.get("company") ?? ""),
    role: String(form.get("role") ?? "")
  });
  updateStatus(t("informationSaved"));
}

function updateProfilePassword(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const newPassword = String(form.get("newPassword") ?? "");
  const confirmNewPassword = String(form.get("confirmNewPassword") ?? "");
  if (newPassword !== confirmNewPassword) {
    updateStatus(t("passwordMismatch"));
    return;
  }
  storage.set("ahx_profile_password_updated", new Date().toISOString());
  event.currentTarget.reset();
  updateStatus(t("passwordUpdated"));
}

function requestAccountDeletion() {
  storage.set("ahx_account_delete_requested", true);
  updateStatus(t("accountDeleteQueued"));
}

function requestPlanCancelation() {
  storage.set("ahx_plan_cancel_requested", true);
  updateStatus(t("planCancelQueued"));
}

function generateInviteCode() {
  const segment = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  storage.set("ahx_invite_code", `AHX-${segment()}-${segment()}`);
  updateStatus(t("inviteCodeGenerated"));
  renderApp();
}
