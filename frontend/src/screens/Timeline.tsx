import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { api } from '../api';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import type { TimelineItem } from '../types';

const docTypeIcons: Record<string, React.ReactNode> = {
  lab_report: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H6.375m2.25 0v7.5m0 0h7.5m-7.5 0v7.5m0 0h7.5" />
    </svg>
  ),
  prescription: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v8.25A2.25 2.25 0 0 0 6 16.5h.75m9 0h3.75m-3.75 0v3.75m0-3.75H18" />
    </svg>
  ),
  discharge_summary: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v8.25A2.25 2.25 0 0 0 6 16.5h.75m9 0h3.75m-3.75 0v3.75m0-3.75H18" />
    </svg>
  ),
};

export default function Timeline() {
  const { t } = useApp();
  const navigate = useNavigate();
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getTimeline();
        setItems(data.items);
      } catch (err) {
        const message = err && typeof err === 'object' && 'error' in err
          ? (err as { error: { message: string } }).error.message
          : 'Failed to load timeline';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-text-primary">{t('timeline.title')}</h2>
        </div>
        <LoadingSkeleton type="list" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-text-primary mb-4">{t('timeline.title')}</h2>
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-text-primary mb-4">{t('timeline.title')}</h2>
        <EmptyState
          title={t('timeline.empty')}
          subtitle={t('timeline.emptySubtitle')}
          action={{ label: t('nav.upload'), onClick: () => navigate('/upload') }}
          icon="timeline"
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-primary">{t('timeline.title')}</h2>
        <p className="text-text-secondary text-sm mt-1">{items.length} records</p>
      </div>

      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border-light"></div>
        <div className="space-y-4">
          {items.map((item) => {
            const abnormalTests = item.tests.filter(t => t.flag === 'HIGH' || t.flag === 'LOW');
            const isDraft = item.status === 'draft';
            const targetRoute = isDraft ? `/verify/${item.record_id}` : `/summary/${item.record_id}`;

            return (
              <div
                key={item.record_id}
                onClick={() => navigate(targetRoute)}
                className="relative pl-16 pr-4 py-4 cursor-pointer group"
              >
                <div className="absolute left-4 top-5 w-5 h-5 rounded-full bg-white border-2 border-primary-500 group-hover:bg-primary-500 transition-colors"></div>
                <div className={`card p-4 ${isDraft ? 'ring-2 ring-warning-border' : ''}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
                        {docTypeIcons[item.doc_type] || docTypeIcons.lab_report}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary capitalize">
                          {item.doc_type.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-text-muted">{item.doc_date}</p>
                      </div>
                    </div>
                    <span className={`badge ${isDraft ? 'badge-warning' : 'badge-normal'}`}>
                      {isDraft ? t('common.draft') : t('common.confirmed')}
                    </span>
                  </div>

                  <p className="text-sm text-text-secondary mb-2">{item.headline}</p>

                  <div className="flex flex-wrap gap-2">
                    {abnormalTests.length > 0 && (
                      <span className="badge badge-high">{abnormalTests.length} {t('timeline.abnormal')}</span>
                    )}
                    {item.medicines.length > 0 && (
                      <span className="badge badge-unknown">{item.medicines.length} {item.medicines.length === 1 ? t('timeline.medicine') : t('timeline.medicines')}</span>
                    )}
                    {item.tests.length > 0 && (
                      <span className="badge badge-normal">{item.tests.length} {item.tests.length === 1 ? t('timeline.test') : t('timeline.tests')}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}