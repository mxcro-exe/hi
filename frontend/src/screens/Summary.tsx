import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../App';
import { api } from '../api';
import Disclaimer from '../components/Disclaimer';
import FlagBadge from '../components/FlagBadge';
import ErrorState from '../components/ErrorState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import type { Record } from '../types';

export default function Summary() {
  const { id } = useParams<{ id: string }>();
  const { t, useMock } = useApp();
  const [record, setRecord] = useState<Record | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);

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
          : 'Failed to load summary';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, useMock]);

  const abnormalCount = useMemo(() => record?.tests.filter(t => t.flag === 'HIGH' || t.flag === 'LOW').length || 0, [record]);

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const taVoice = window.speechSynthesis.getVoices().find(v => v.lang.startsWith('ta'));
    utterance.voice = taVoice || null;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <LoadingSkeleton type="detail" />
      </div>
    );
  }

  if (error && !record) {
    return (
      <div className="max-w-2xl mx-auto">
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (!record) return null;

  const summaryText = t('common.language') === 'ta' && record.summary_ta ? record.summary_ta : record.summary_en;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-text-primary">{t('summary.title')}</h2>
            {abnormalCount > 0 && (
              <span className="badge badge-high">{abnormalCount} {t('timeline.abnormal')}</span>
            )}
          </div>
          <p className="text-sm text-text-secondary capitalize">
            {record.doc_type.replace('_', ' ')} • {record.doc_date || 'No date'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {record.summary_ta && (
            <button
              onClick={() => {
                if (speaking) {
                  stopSpeaking();
                } else if (summaryText) {
                  speak(summaryText);
                }
              }}
              className="btn-ghost text-sm"
              title={speaking ? 'Stop reading' : 'Read aloud'}
            >
              {speaking ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.985V5.653Z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                </svg>
              )}
            </button>
          )}
          <Link to={`/verify/${id}`} className="btn-secondary text-sm">
            {t('common.edit')}
          </Link>
        </div>
      </div>

      {summaryText && (
        <div className="card p-5 mb-6 bg-primary-50 border-primary-200">
          <p className="text-text-primary leading-relaxed text-balance">{summaryText}</p>
        </div>
      )}

      {record.tests.length > 0 && (
        <section className="mb-6">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">{t('timeline.tests')}</h3>
          <div className="space-y-3">
            {record.tests.map((test, i) => {
              const position = ((test.value - test.ref_low) / (test.ref_high - test.ref_low)) * 100;
              const clamped = Math.max(0, Math.min(100, position));
              return (
                <div key={i} className="card p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-text-primary">{test.name}</h4>
                      <p className="text-xs text-text-muted">{test.loinc || '—'}</p>
                    </div>
                    <FlagBadge flag={test.flag} />
                  </div>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-2xl font-bold text-text-primary">{test.value}</span>
                    <span className="text-sm text-text-secondary">{test.unit}</span>
                  </div>
                  <div className="mb-3">
                    <div className="h-2 bg-surface-200 rounded-full overflow-hidden relative">
                      <div className="absolute inset-0 flex">
                        <div className="bg-status-low/10" style={{ width: '33%' }}></div>
                        <div className="bg-status-normal/20" style={{ width: '34%' }}></div>
                        <div className="bg-status-high/10" style={{ width: '33%' }}></div>
                      </div>
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-text-primary rounded-full"
                        style={{ left: `${clamped}%`, transform: 'translateX(-50%)' }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-text-muted mt-1">
                      <span>{test.ref_low}</span>
                      <span>Range: {test.ref_low} – {test.ref_high}</span>
                      <span>{test.ref_high}</span>
                    </div>
                  </div>
                  {test.explanation_en && (
                    <div className="p-3 bg-surface-50 rounded-lg">
                      <p className="text-sm text-text-secondary">{t('summary.explanation')}</p>
                      <p className="text-sm text-text-primary mt-1">{test.explanation_en}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {record.medicines.length > 0 && (
        <section className="mb-6">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">{t('summary.medicines')}</h3>
          <div className="space-y-2">
            {record.medicines.map((med, i) => (
              <div key={i} className="card p-4 flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-text-primary">{med.name_raw}</h4>
                  <p className="text-sm text-text-secondary">{med.generic} • {med.strength}</p>
                  {med.food_instruction && (
                    <span className="badge badge-normal mt-2">
                      {med.food_instruction === 'before_food' ? t('medicines.beforeFood') : t('medicines.afterFood')}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-text-muted">{med.duration_days} days</p>
                  <p className="text-xs text-text-muted mt-1">{Math.round(med.confidence * 100)}%</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {record.diagnoses.length > 0 && (
        <section className="mb-6">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">{t('summary.diagnoses')}</h3>
          <div className="space-y-2">
            {record.diagnoses.map((d, i) => (
              <div key={i} className="card p-3">
                <p className="text-sm text-text-primary">{d.text}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <Disclaimer />
    </div>
  );
}