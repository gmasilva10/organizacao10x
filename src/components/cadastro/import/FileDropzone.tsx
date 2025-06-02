
import React from "react";
import { FileX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileDropzoneProps {
  file: File | null;
  setFile: (file: File | null) => void;
  isDragging: boolean;
  setIsDragging: (isDragging: boolean) => void;
  isProcessing: boolean;
  resetImportStats: () => void;
}

const FileDropzone: React.FC<FileDropzoneProps> = ({
  file,
  setFile,
  isDragging,
  setIsDragging,
  isProcessing,
  resetImportStats
}) => {
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || file.type === "application/vnd.ms-excel") {
        setFile(file);
      } else {
        // Toast error is handled in parent component
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    resetImportStats();
  };

  return (
    <div 
      className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer min-h-[130px] ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isProcessing && document.getElementById('file-input')?.click()}
    >
      {file ? (
        <div className="flex flex-col items-center">
          <FileX size={18} className="text-gray-500 mb-1" />
          <p className="font-medium text-sm">{file.name}</p>
          <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
          <Button variant="outline" size="sm" className="mt-1" onClick={handleRemoveFile}>
            Remover
          </Button>
        </div>
      ) : (
        <>
          <FileX size={18} className="text-gray-500 mb-1" />
          <p className="font-medium text-sm">Clique ou arraste um arquivo</p>
          <p className="text-xs text-gray-500">XLS, XLSX</p>
        </>
      )}
      <input 
        type="file" 
        id="file-input" 
        className="hidden" 
        accept=".xls,.xlsx" 
        onChange={handleFileChange}
        disabled={isProcessing}
      />
    </div>
  );
};

export default FileDropzone;
