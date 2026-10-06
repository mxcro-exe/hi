import { useApp } from '../App';

export default function Header() {
  const { t, lang, setLang, useMock } = useApp();

  return (
    <header className="screen-header">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.627 48.627 0 0 1 12 20.918a48.627 48.627 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-text-primary leading-tight">{t('app.title')}</h1>
            <p className="text-xs text-text-muted hidden sm:block">{t('app.tagline')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {useMock && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-warning-bg text-warning-text border border-warning-border">
              <span className="w-1.5 h-1.5 rounded-full bg-warning-text animate-pulse"></span>
              {t('common.mockBadge')}
            </span>
          )}
          <button
            onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 active:bg-primary-200 transition-colors"
          >
            {lang === 'en' ? 'தமிழ்' : 'EN'}
          </button>
        </div>
      </div>
    </header>
  );
}