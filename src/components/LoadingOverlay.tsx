import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = 'Memproses data...'
}) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 shadow-xl flex flex-col items-center gap-3 border border-slate-200">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
        <span className="text-xs font-semibold text-slate-700">{message}</span>
      </div>
    </div>
  );
};

export default LoadingOverlay;
