
import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DataTransitionProps {
  loading: boolean;
  error: string | null;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const DataTransition = ({ loading, error, children, fallback }: DataTransitionProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando dados...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar dados: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default DataTransition;
