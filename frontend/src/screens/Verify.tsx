import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { api } from '../api';
import Disclaimer from '../components/Disclaimer';
import ErrorState from '../components/ErrorState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import type { Record, Medicine, Test } from '../types';

export default function Verify() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, useMock } = useApp();
  const [record, setRecord] = useState<Record | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBbox, setShowBbox] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showMockBanner, setShowMockBanner] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await api.getRecord(id);
        setRecord(data.record);
        setShowMockBanner(useMock);
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
  }, [id, useMock]);

  const needsReviewIds = useMemo(() => new Set(record?.needs_review || []), [record]);

  const isLowConfidence = (confidence: number) => confidence < 0.7;

  const updateMedicine = (index: number, field: keyof Medicine, value: string | number | string[] | null) => {
    if (!record) return;
    const updated = [...record.medicines];
    updated[index] = { ...updated[index], [field]: value };
    setRecord({ ...record, medicines: updated });
  };

  const updateTest = (index: number, field: keyof Test, value: string | number | string[] | null) => {
    if (!record) return;
    const updated = [...record.tests];
    updated[index] = { ...updated[index], [field]: value };
    setRecord({ ...record, tests: updated });
  };

  const handleSave = async () => {
    if (!record || !id) return;
    setSaving(true);
    try {
      await api.confirmRecord(id, record);
      navigate(`/summary/${id}`);
    } catch (err) {
      const message = err && typeof err === 'object' && 'error' in err
        ? (err as { error: { message: string } }).error.message
        : 'Failed to save';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <LoadingSkeleton type="list" />
      </div>
    );
  }

  if (error && !record) {
    return (
      <div className="max-w-4xl mx-auto">
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (!record) return null;

  const fieldTab = () => (
    <div className="space-y-4">
      {record.medicines.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">{t('verify.medicine')}s</h3>
          <div className="space-y-3">
            {record.medicines.map((med, i) => {
              const needsReview = needsReviewIds.has(`medicines[${i}]`) || isLowConfidence(med.confidence);
              return (
                <div key={i} className={`card p-4 ${needsReview ? 'ring-2 ring-warning-border bg-warning-bg/30' : ''}`}>
                  {needsReview && (
                    <div className="flex items-center gap-2 mb-3 text-warning-text">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                      </svg>
                      <span className="text-xs font-medium">{t('verify.needsReview')}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">{t('verify.name')}</label>
                      <input className="input" value={med.name_raw} onChange={(e) => updateMedicine(i, 'name_raw', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">{t('verify.generic')}</label>
                      <input className="input" value={med.generic || ''} onChange={(e) => updateMedicine(i, 'generic', e.target.value || null)} />
                    </div>
                    <div>
                      <label className="label">{t('verify.strength')}</label>
                      <input className="input" value={med.strength || ''} onChange={(e) => updateMedicine(i, 'strength', e.target.value || null)} />
                    </div>
                    <div>
                      <label className="label">{t('verify.schedule')}</label>
                      <input className="input" value={med.schedule_raw || ''} onChange={(e) => updateMedicine(i, 'schedule_raw', e.target.value || null)} />
                    </div>
                    <div>
                      <label className="label">{t('verify.food')}</label>
                      <select className="input" value={med.food_instruction || ''} onChange={(e) => updateMedicine(i, 'food_instruction', e.target.value === '' ? null : e.target.value)}>
                        <option value="">—</option>
                        <option value="before_food">{t('medicines.beforeFood')}</option>
                        <option value="after_food">{t('medicines.afterFood')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">{t('verify.duration')}</label>
                      <input type="number" className="input" value={med.duration_days} onChange={(e) => updateMedicine(i, 'duration_days', parseInt(e.target.value) || 0)} />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`text-xs font-medium ${med.confidence < 0.7 ? 'text-warning-text' : 'text-text-muted'}`}>
                      Confidence: {Math.round(med.confidence * 100)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {record.tests.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">{t('verify.test')}s</h3>
          <div className="space-y-3">
            {record.tests.map((test, i) => {
              const needsReview = needsReviewIds.has(`tests[${i}]`) || isLowConfidence(test.confidence);
              return (
                <div key={i} className={`card p-4 ${needsReview ? 'ring-2 ring-warning-border bg-warning-bg/30' : ''}`}>
                  {needsReview && (
                    <div className="flex items-center gap-2 mb-3 text-warning-text">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                      </svg>
                      <span className="text-xs font-medium">{t('verify.needsReview')}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">{t('verify.name')}</label>
                      <input className="input" value={test.name} onChange={(e) => updateTest(i, 'name', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">{t('verify.value')}</label>
                      <input type="number" className="input" value={test.value} onChange={(e) => updateTest(i, 'value', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div>
                      <label className="label">{t('verify.unit')}</label>
                      <input className="input" value={test.unit} onChange={(e) => updateTest(i, 'unit', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">{t('verify.refRange')}</label>
                      <div className="flex gap-2">
                        <input type="number" className="input" value={test.ref_low} onChange={(e) => updateTest(i, 'ref_low', parseFloat(e.target.value) || 0)} placeholder="Low" />
                        <input type="number" className="input" value={test.ref_high} onChange={(e) => updateTest(i, 'ref_high', parseFloat(e.target.value) || 0)} placeholder="High" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="label">{t('verify.explanation')}</label>
                    <textarea className="input min-h-[80px]" value={test.explanation_en || ''} onChange={(e) => updateTest(i, 'explanation_en', e.target.value)} />
                  </div>
                  <div className="mt-2">
                    <span className={`text-xs font-medium ${test.confidence < 0.7 ? 'text-warning-text' : 'text-text-muted'}`}>
                      Confidence: {Math.round(test.confidence * 100)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {record.diagnoses.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">{t('verify.diagnosis')}s</h3>
          <div className="space-y-2">
            {record.diagnoses.map((d, i) => (
              <div key={i} className="card p-3 flex items-center justify-between">
                <span className="text-sm text-text-primary">{d.text}</span>
                <span className="text-xs text-text-muted">{Math.round(d.confidence * 100)}%</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">{t('verify.title')}</h2>
          <p className="text-text-secondary text-sm mt-1">{t('verify.subtitle')}</p>
        </div>
        <button onClick={() => navigate(-1)} className="btn-ghost text-sm">
          {t('common.back')}
        </button>
      </div>

      {showMockBanner && (
        <div className="mb-4 flex items-center gap-2 text-xs text-text-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-warning-text animate-pulse"></span>
          {t('common.mockDemo')}
        </div>
      )}

      {showBbox && (
        <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-lg flex items-center justify-between">
          <span className="text-sm text-primary-800">Confidence regions shown (mock visualization)</span>
          <button onClick={() => setShowBbox(false)} className="text-sm text-primary-700 hover:text-primary-900">Hide</button>
        </div>
      )}

      <div className="lg:grid lg:grid-cols-2 lg:gap-6">
        <div className="mb-6 lg:mb-0">
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-border-light flex items-center gap-2">
              <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H6.375m2.25 0v7.5m0 0h7.5m-7.5 0v7.5m0 0h7.5" />
              </svg>
              <span className="text-sm font-medium text-text-primary">{t('verify.document')}</span>
            </div>
            <div className="p-4 bg-surface-100 min-h-[300px] flex items-center justify-center">
              <div className="text-center">
                <svg className="w-16 h-16 text-text-muted mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H6.375m2.25 0v7.5m0 0h7.5m-7.5 0v7.5m0 0h7.5" />
                </svg>
                <p className="text-sm text-text-secondary">Document preview</p>
                <p className="text-xs text-text-muted mt-1">Original file would render here</p>
              </div>
            </div>
          </div>

          {record.tests.some(t => t.bbox) || record.medicines.some(m => m.bbox) ? (
            <button
              onClick={() => setShowBbox(!showBbox)}
              className="mt-3 w-full btn-secondary text-sm"
            >
              {showBbox ? t('verify.hideBbox') : t('verify.showBbox')}
            </button>
          ) : null}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
            <span className="text-sm font-medium text-text-primary">{t('verify.fields')}</span>
          </div>
          {fieldTab()}
        </div>
      </div>

      <div className="sticky bottom-4 mt-8">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full py-4 text-base"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Saving…
            </span>
          ) : (
            t('verify.confirmSave')
          )}
        </button>
      </div>

      {error && saving === false && (
        <div className="mt-4 p-4 bg-error-bg border border-error-border rounded-lg">
          <p className="text-sm text-error-text">{error}</p>
        </div>
      )}

      <Disclaimer />
    </div>
  );
}