import { useState } from 'react';
import { useApp } from '../App';
import { api } from '../api';

export default function Abha() {
  const { t } = useApp();
  const [abhaId, setAbhaId] = useState('');
  const [linkStatus, setLinkStatus] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLink = async () => {
    if (!abhaId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await api.linkAbha('default', abhaId);
      setLinkStatus('Linked successfully');
    } catch (err) {
      const message = err && typeof err === 'object' && 'error' in err
        ? (err as { error: { message: string } }).error.message
        : 'Failed to link ABHA';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.importAbha('default');
      setImportStatus(`Imported ${result.imported_record_ids.length} records (mock)`);
    } catch (err) {
      const message = err && typeof err === 'object' && 'error' in err
        ? (err as { error: { message: string } }).error.message
        : 'Failed to import';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-primary">{t('abha.title')}</h2>
      </div>

      {linkStatus && (
        <div className="mb-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <p className="text-sm text-primary-800">{linkStatus}</p>
        </div>
      )}

      {importStatus && (
        <div className="mb-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <p className="text-sm text-primary-800">{importStatus}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-error-bg border border-error-border rounded-lg">
          <p className="text-sm text-error-text">{error}</p>
        </div>
      )}

      <div className="card p-5 mb-6">
        <h3 className="font-semibold text-text-primary mb-3">{t('abha.link')}</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={abhaId}
            onChange={(e) => setAbhaId(e.target.value)}
            placeholder={t('abha.linkPlaceholder')}
            className="input flex-1"
          />
          <button onClick={handleLink} disabled={loading || !abhaId.trim()} className="btn-primary">
            {loading ? '…' : t('abha.link')}
          </button>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-text-primary mb-3">{t('abha.import')}</h3>
        <p className="text-sm text-text-secondary mb-4">
          Import your health records from ABHA (Ayushman Bharat Health Account).
        </p>
        <button onClick={handleImport} disabled={loading} className="btn-primary w-full">
          {loading ? 'Importing…' : t('abha.import')}
        </button>
      </div>
    </div>
  );
}