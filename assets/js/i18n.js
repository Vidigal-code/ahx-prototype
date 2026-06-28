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
  return AHX_CONFIG.defaultLanguage;
}

function setLanguage(language) {
  if (AHX_TRANSLATIONS[language]) {
    storage.set("ahx_language", AHX_CONFIG.defaultLanguage);
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
  return AHX_CONFIG.languages[getLanguage()].menu;
}
