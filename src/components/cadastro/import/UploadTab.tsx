
import React, { useState } from "react";
import { ImportStats } from "./types";
import FileDropzone from "./FileDropzone";
import ImportStatsDisplay from "./ImportStatsDisplay";
import InfoPanel from "./InfoPanel";
import ProcessingState from "./ProcessingState";
import HiddenImportButton from "./HiddenImportButton";
import { useImportClients } from "./hooks/useImportClients";

interface UploadTabProps {
  file: File | null;
  setFile: (file: File | null) => void;
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
  importStats: ImportStats | null;
  setImportStats: (stats: ImportStats | null) => void;
}

const UploadTab: React.FC<UploadTabProps> = ({
  file,
  setFile,
  isProcessing,
  setIsProcessing,
  importStats,
  setImportStats
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const { importClients } = useImportClients(file, setImportStats, setIsProcessing);

  const resetImportStats = () => {
    setImportStats(null);
  };

  return (
    <div className="space-y-3">
      {isProcessing ? (
        <ProcessingState />
      ) : (
        <FileDropzone
          file={file}
          setFile={setFile}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
          isProcessing={isProcessing}
          resetImportStats={resetImportStats}
        />
      )}
      
      {importStats && <ImportStatsDisplay stats={importStats} />}
      
      <InfoPanel />

      {file && !isProcessing && !importStats && (
        <HiddenImportButton onClick={importClients} />
      )}
    </div>
  );
};

export default UploadTab;
