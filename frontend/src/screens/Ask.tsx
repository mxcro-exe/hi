import { useState } from 'react';
import { useApp } from '../App';
import { api } from '../api';
import ErrorState from '../components/ErrorState';

export default function Ask() {
  const { t } = useApp();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<Array<{ record_id: string; field: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    setSources([]);
    try {
      const result = await api.askRecords('default', question);
      setAnswer(result.answer);
      setSources(result.sources);
    } catch (err) {
      const message = err && typeof err === 'object' && 'error' in err
        ? (err as { error: { message: string } }).error.message
        : 'Failed to get answer';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-primary">{t('ask.title')}</h2>
        <p className="text-text-secondary text-sm mt-1">{t('ask.grounded')}</p>
      </div>

      <div className="card p-4 mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t('ask.placeholder')}
            className="input flex-1"
            disabled={loading}
          />
          <button onClick={handleSend} disabled={loading || !question.trim()} className="btn-primary">
            {t('ask.send')}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <ErrorState message={error} onRetry={handleSend} />
        </div>
      )}

      {answer && (
        <div className="card p-5 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.627 48.627 0 0 1 12 20.918a48.627 48.627 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary mb-1">{t('ask.answer')}</p>
              <p className="text-sm text-text-secondary">{answer}</p>
            </div>
          </div>
          {sources.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border-light">
              <p className="text-xs font-medium text-text-muted mb-2">{t('ask.sources')}</p>
              <div className="flex flex-wrap gap-2">
                {sources.map((s, i) => (
                  <span key={i} className="text-xs bg-surface-100 px-2 py-1 rounded text-text-secondary">
                    {s.record_id}: {s.field}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!answer && !loading && !error && (
        <div className="text-center py-12">
          <svg className="w-12 h-12 text-text-muted mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <p className="text-sm text-text-muted">Ask anything about your medical records</p>
        </div>
      )}
    </div>
  );
}