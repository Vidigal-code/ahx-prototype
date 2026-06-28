const storage = {
  get(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

function getLanguage() {
  const savedLanguage = storage.get("ahx_language", AHX_CONFIG.defaultLanguage);
  return AHX_TRANSLATIONS[savedLanguage] ? savedLanguage : AHX_CONFIG.defaultLanguage;
}

function setLanguage(language) {
  if (AHX_TRANSLATIONS[language]) {
    storage.set("ahx_language", language);
  }
}

function t(key) {
  return AHX_TRANSLATIONS[getLanguage()][key] ?? AHX_TRANSLATIONS.en[key] ?? key;
}

function labelOf(entity) {
  const language = getLanguage();
  return entity.labels?.[language] ?? entity.labels?.en ?? "";
}

function languageMenu() {
  return AHX_CONFIG.languages[getLanguage()]?.menu ?? AHX_CONFIG.languages[AHX_CONFIG.defaultLanguage].menu;
}
