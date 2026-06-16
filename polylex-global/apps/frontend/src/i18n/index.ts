import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import vi from './locales/vi.json';
import pt from './locales/pt.json';

const SUPPORTED_LOCALES = ['en', 'vi', 'pt'];
const STORAGE_KEY = 'polylex-locale';

const savedLocale = localStorage.getItem(STORAGE_KEY);
const detectedLang =
  savedLocale && SUPPORTED_LOCALES.includes(savedLocale) ? savedLocale : 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    vi: { translation: vi },
    pt: { translation: pt },
  },
  lng: detectedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export const setLocale = (lang: string): void => {
  const locale = SUPPORTED_LOCALES.includes(lang) ? lang : 'en';
  localStorage.setItem(STORAGE_KEY, locale);
  void i18n.changeLanguage(locale);
};

export default i18n;
