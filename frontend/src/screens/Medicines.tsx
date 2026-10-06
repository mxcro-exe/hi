import { useState, useEffect } from 'react';
import { useApp } from '../App';
import { api } from '../api';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import type { Medicine } from '../types';

const scheduleOrder = ['morning', 'afternoon', 'night'] as const;

export default function Medicines() {
  const { t } = useApp();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getTimeline();
        const allMeds = data.items.flatMap(item => item.medicines);
        setMedicines(allMeds);
      } catch (err) {
        const message = err && typeof err === 'object' && 'error' in err
          ? (err as { error: { message: string } }).error.message
          : 'Failed to load medicines';
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
        <h2 className="text-2xl font-bold text-text-primary mb-4">{t('medicines.title')}</h2>
        <LoadingSkeleton type="list" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-text-primary mb-4">{t('medicines.title')}</h2>
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (medicines.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-text-primary mb-4">{t('medicines.title')}</h2>
        <EmptyState
          title={t('common.noData')}
          subtitle="No medicines found in your records"
          icon="medicine"
        />
      </div>
    );
  }

  const scheduleGroups = scheduleOrder.reduce<Record<string, Medicine[]>>((acc, time) => {
    acc[time] = medicines.filter(m => m.schedule_parsed.includes(time));
    return acc;
  }, {});

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-primary">{t('medicines.title')}</h2>
        <p className="text-text-secondary text-sm mt-1">{medicines.length} medicines</p>
      </div>

      <div className="space-y-6">
        {scheduleOrder.map((time) => (
          <div key={time}>
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
              {time === 'morning' ? t('medicines.morning') : time === 'afternoon' ? t('medicines.afternoon') : t('medicines.night')}
            </h3>
            {scheduleGroups[time].length === 0 ? (
              <p className="text-sm text-text-muted py-4">No medicines scheduled</p>
            ) : (
              <div className="space-y-2">
                {scheduleGroups[time].map((med, i) => (
                  <div key={i} className="card p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-text-primary">{med.name_raw}</h4>
                        <p className="text-sm text-text-secondary">{med.generic} • {med.strength}</p>
                      </div>
                      {med.food_instruction && (
                        <span className="badge badge-normal">
                          {med.food_instruction === 'before_food' ? t('medicines.beforeFood') : t('medicines.afterFood')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}