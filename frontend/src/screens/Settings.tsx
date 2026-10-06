import { useState } from 'react';
import { useApp } from '../App';
import { api } from '../api';

export default function Settings() {
  const { t, lang, setLang, useMock, setUseMock } = useApp();
  const [error, setError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const handleDelete = async () => {
    if (!confirm(t('settings.deleteConfirm'))) return;
    try {
      await api.deleteProfile('default');
      setDeleteSuccess(true);
    } catch (err) {
      const message = err && typeof err === 'object' && 'error' in err
        ? (err as { error: { message: string } }).error.message
        : 'Failed to delete data';
      setError(message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-primary">{t('settings.title')}</h2>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-error-bg border border-error-border rounded-lg">
          <p className="text-sm text-error-text">{error}</p>
        </div>
      )}

      {deleteSuccess && (
        <div className="mb-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <p className="text-sm text-primary-800">{t('settings.deleteSuccess')}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="card p-5">
          <h3 className="font-semibold text-text-primary mb-4">{t('settings.language')}</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setLang('en')}
              className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                lang === 'en' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-border-light hover:border-primary-300'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLang('ta')}
              className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                lang === 'ta' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-border-light hover:border-primary-300'
              }`}
            >
              தமிழ்
            </button>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-text-primary mb-2">{t('settings.apiMode')}</h3>
          <p className="text-sm text-text-secondary mb-4">
            {useMock ? 'Using self-contained mock data. Toggle to connect to a real backend API.' : 'Connected to real API.'}
          </p>
          <button
            onClick={() => setUseMock(!useMock)}
            className={`w-full py-3 px-4 rounded-lg border-2 transition-all ${
              useMock ? 'border-warning-border bg-warning-bg text-warning-text' : 'border-primary-500 bg-primary-50 text-primary-700'
            }`}
          >
            {useMock ? `Switch to Real API (currently: ${t('settings.apiMock')})` : `Switch to Mock Data (currently: ${t('settings.apiReal')})`}
          </button>
        </div>

        <div className="card p-5 border-error-border">
          <h3 className="font-semibold text-error-text mb-2">{t('settings.deleteData')}</h3>
          <p className="text-sm text-text-secondary mb-4">
            This will delete all your uploaded records and settings. This action cannot be undone.
          </p>
          <button onClick={handleDelete} className="btn-danger w-full">
            {t('settings.deleteData')}
          </button>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-text-primary">{t('settings.version')}</h3>
              <p className="text-sm text-text-muted">AI Health Copilot v1.0.0</p>
            </div>
            {useMock && (
              <span className="badge badge-warning">{t('common.mockBadge')}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}