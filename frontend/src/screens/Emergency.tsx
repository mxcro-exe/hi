import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '../App';
import { api } from '../api';
import ErrorState from '../components/ErrorState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import type { Record } from '../types';

export default function Emergency() {
  const { id } = useParams<{ id: string }>();
  const { t } = useApp();
  const [record, setRecord] = useState<Record | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await api.getRecord(id);
        setRecord(data.record);
      } catch (err) {
        const message = err && typeof err === 'object' && 'error' in err
          ? (err as { error: { message: string } }).error.message
          : 'Failed to load record';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-text-primary mb-4">{t('emergency.title')}</h2>
        <LoadingSkeleton type="detail" />
      </div>
    );
  }

  if (error && !record) {
    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-text-primary mb-4">{t('emergency.title')}</h2>
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (!record) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-primary">{t('emergency.title')}</h2>
        <p className="text-text-secondary text-sm mt-1">{t('emergency.subtitle')}</p>
      </div>

      <div className="card p-6 mb-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">{t('emergency.conditions')}</h3>
            {record.diagnoses.length > 0 ? (
              <ul className="space-y-2">
                {record.diagnoses.map((d, i) => (
                  <li key={i} className="text-sm text-text-primary bg-surface-50 p-2 rounded-lg">{d.text}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-text-muted">{t('emergency.none')}</p>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">{t('emergency.medicines')}</h3>
            {record.medicines.length > 0 ? (
              <ul className="space-y-2">
                {record.medicines.map((m, i) => (
                  <li key={i} className="text-sm text-text-primary bg-surface-50 p-2 rounded-lg">
                    {m.name_raw} ({m.strength})
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-text-muted">{t('emergency.none')}</p>
            )}
          </div>
        </div>
      </div>

      <div className="card p-6 mb-6">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">QR Code (Mock)</h3>
        <div className="flex items-center justify-center p-4 bg-surface-50 rounded-lg">
          <div className="text-center">
            <div className="w-48 h-48 bg-white border-2 border-dashed border-border-medium rounded-lg flex items-center justify-center mx-auto mb-3">
              <div className="text-center">
                <svg className="w-12 h-12 text-text-muted mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5Zm13.5-4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5Z" />
                </svg>
                <p className="text-xs text-text-muted">QR would render here</p>
              </div>
            </div>
            <p className="text-xs text-text-muted">Contains conditions + medicines + allergies</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => window.print()} className="btn-primary flex-1">
          {t('emergency.print')}
        </button>
      </div>
    </div>
  );
}