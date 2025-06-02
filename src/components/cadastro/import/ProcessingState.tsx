
import React from "react";
import { Loader } from "lucide-react";

const ProcessingState: React.FC = () => {
  return (
    <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center min-h-[130px] border-gray-300">
      <Loader size={18} className="animate-spin text-primary mb-1" />
      <p className="font-medium text-sm">Processando importação...</p>
      <p className="text-xs text-gray-500">Isso pode levar alguns minutos</p>
    </div>
  );
};

export default ProcessingState;
