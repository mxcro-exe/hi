import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { api, type UploadProgress } from '../api';

export default function Upload() {
  const { t, useMock } = useApp();
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setError('Please upload a PDF, JPG, or PNG file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File must be smaller than 10MB');
      return;
    }

    setError(null);
    setIsLoading(true);
    setProgress({ step: 'reading', message: t('upload.stepReading') });

    try {
      const response = await api.uploadRecord(file, setProgress);
      navigate(`/verify/${response.record_id}`);
    } catch (err) {
      const message = err && typeof err === 'object' && 'error' in err
        ? (err as { error: { message: string } }).error.message
        : 'Upload failed. Please try again.';
      setError(message);
      setProgress(null);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, t]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const openCamera = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-primary">{t('upload.title')}</h2>
        <p className="text-text-secondary mt-1">{t('upload.subtitle')}</p>
      </div>

      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-border-medium hover:border-primary-400 hover:bg-surface-50'}
          ${isLoading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          capture="environment"
          onChange={onInputChange}
          className="hidden"
        />

        {!progress && !isLoading && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5h12a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 18.75 4.5H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            </div>
            <p className="text-lg font-medium text-text-primary mb-2">{t('upload.drop')}</p>
            <p className="text-sm text-text-muted mb-6">{t('upload.hint')}</p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); openCamera(); }}
                className="btn-primary"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.25 2.25 0 0 1 8.25 4.5h7.5a2.25 2.25 0 0 1 2.25 2.25v7.5a2.25 2.25 0 0 1-2.25 2.25h-7.5a2.25 2.25 0 0 1-2.25-2.25v-7.5a2.25 2.25 0 0 1 .54-1.863l3.75-4.5a2.25 2.25 0 0 1 3.27.042l.41.41a2.25 2.25 0 0 1 .042 3.27l-4.5 3.75a2.25 2.25 0 0 1-1.66.63H9.75" />
                </svg>
                {t('upload.camera')}
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="btn-secondary"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
                {t('upload.file')}
              </button>
            </div>
          </>
        )}

        {progress && (
          <div className="py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-50 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-lg font-medium text-text-primary mb-2">{t('upload.analysing')}</p>
            <p className="text-sm text-text-secondary">{progress.message}</p>
            <div className="mt-4 max-w-xs mx-auto h-1.5 bg-surface-200 rounded-full overflow-hidden">
              <div className="h-full bg-primary-500 rounded-full transition-all duration-500" style={{ width: progress.step === 'complete' ? '100%' : '60%' }}></div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-error-bg border border-error-border rounded-lg">
          <p className="text-sm text-error-text">{error}</p>
          <button onClick={() => setError(null)} className="btn-ghost mt-2 text-sm">
            {t('common.retry')}
          </button>
        </div>
      )}

      {useMock && (
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-text-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-warning-text animate-pulse"></span>
          Running in {t('common.mockDemo')} mode
        </div>
      )}
    </div>
  );
}