
import React from "react";
import { ImportStats } from "./types";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface ImportStatsDisplayProps {
  stats: ImportStats;
}

const ImportStatsDisplay: React.FC<ImportStatsDisplayProps> = ({ stats }) => {
  return (
    <div className={`p-3 rounded-lg ${stats.failed > 0 ? 'bg-amber-50' : 'bg-green-50'}`}>
      <div className="flex items-start gap-2">
        <div className={`rounded-full p-1 ${stats.failed > 0 ? 'bg-amber-100' : 'bg-green-100'}`}>
          {stats.failed > 0 ? (
            <AlertCircle className="h-5 w-5 text-amber-500" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          )}
        </div>
        <div className="w-full">
          <p className="text-sm font-medium">
            {stats.successful} de {stats.total} alunos importados com sucesso
          </p>
          
          {stats.failed > 0 && (
            <div className="mt-1">
              <p className="text-xs font-medium text-amber-700">Erros encontrados ({stats.failed}):</p>
              <div className="max-h-40 overflow-y-auto mt-1 bg-white rounded p-2 border border-amber-200">
                {stats.errors.slice(0, 10).map((error, index) => (
                  <p key={index} className="text-xs text-gray-700 mb-1 pb-1 border-b border-gray-100 break-words">{error}</p>
                ))}
                {stats.errors.length > 10 && (
                  <p className="text-xs text-gray-700 font-medium mt-1">
                    ...e mais {stats.errors.length - 10} erros
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportStatsDisplay;
