import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import { useApp } from '../App';
import { api } from '../api';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import type { TrendsResponse } from '../types';

const TEST_NAMES = ['HbA1c', 'LDL Cholesterol', 'Creatinine', 'TSH', 'Blood Pressure'];

export default function Trends() {
  const { t } = useApp();
  const [selectedTest, setSelectedTest] = useState(TEST_NAMES[0]);
  const [data, setData] = useState<TrendsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.getTrends('default', selectedTest);
        setData(result);
      } catch (err) {
        const message = err && typeof err === 'object' && 'error' in err
          ? (err as { error: { message: string } }).error.message
          : 'Failed to load trends';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedTest]);

  const refRange = useMemo(() => {
    if (!data || data.points.length === 0) return { low: 0, high: 0 };
    const values = data.points.map(p => p.value);
    return { low: Math.min(...values) * 0.9, high: Math.max(...values) * 1.1 };
  }, [data]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-text-primary mb-4">{t('trends.title')}</h2>
        <LoadingSkeleton type="card" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-text-primary mb-4">{t('trends.title')}</h2>
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-primary">{t('trends.title')}</h2>
      </div>

      <div className="card p-4 mb-6">
        <label className="label">{t('trends.selectTest')}</label>
        <select
          value={selectedTest}
          onChange={(e) => setSelectedTest(e.target.value)}
          className="input"
        >
          {TEST_NAMES.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {data && data.points.length > 0 ? (
        <div className="card p-4">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.points} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <ReferenceArea y1={refRange.low} y2={refRange.high} fill="#16a34a" fillOpacity={0.1} />
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip
                  labelFormatter={(label) => {
                    if (typeof label === 'string' || typeof label === 'number') {
                      return new Date(label).toLocaleDateString();
                    }
                    return '';
                  }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={((value: any) => {
                    const num = value !== undefined ? Number(value) : 0;
                    return [num, data.unit];
                  }) as any}
                  labelStyle={{ color: '#111827' }}
                  contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb' }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#0d9488"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#0d9488', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: '#0f766e', strokeWidth: 2, stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-text-muted text-center mt-2">
            {data.points.length} {t('trends.points')}
          </p>
        </div>
      ) : (
        <EmptyState title={t('trends.noData')} subtitle="Upload a lab report to see trends" icon="timeline" />
      )}
    </div>
  );
}