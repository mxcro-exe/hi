import en from './en';
import ta from './ta';
import type { TranslationKeys } from './en';

export type Language = 'en' | 'ta';

const translations: Record<Language, TranslationKeys> = {
  en,
  ta,
};

export function getTranslation(lang: Language, key: string): string {
  const keys = key.split('.');
  let current: unknown = translations[lang] || translations.en;

  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = (current as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }

  return typeof current === 'string' ? current : key;
}

export function useI18n(lang: Language) {
  const t = (key: string) => getTranslation(lang, key);

  return {
    t,
    lang,
    direction: 'ltr',
  };
}