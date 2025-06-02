
import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import UploadTab from "./UploadTab";
import TemplateTab from "./TemplateTab";
import { ImportStats } from "./types";

interface ImportClientsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ImportClientsDialog = ({ isOpen, onClose }: ImportClientsDialogProps) => {
  const [activeTab, setActiveTab] = useState<string>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);

  const resetImport = () => {
    setFile(null);
    setImportStats(null);
  };

  const handleDialogClose = () => {
    if (!isProcessing) {
      resetImport();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-2xl">
        <DialogTitle>Importar Alunos</DialogTitle>
        
        <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid grid-cols-2 mb-2">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="template">Template</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-3">
            <UploadTab 
              file={file}
              setFile={setFile}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
              importStats={importStats}
              setImportStats={setImportStats}
            />
          </TabsContent>
          
          <TabsContent value="template" className="space-y-3">
            <TemplateTab />
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-2 mt-1">
          <Button variant="outline" size="sm" onClick={handleDialogClose} disabled={isProcessing}>
            {importStats ? 'Fechar' : 'Cancelar'}
          </Button>
          <Button 
            size="sm" 
            disabled={!file || isProcessing || (importStats !== null)} 
            onClick={() => {
              if (file) {
                const uploadTab = document.querySelector('[value="upload"]');
                if (uploadTab && activeTab !== "upload") {
                  (uploadTab as HTMLElement).click();
                }
                const importButton = document.querySelector('[data-import-button="true"]');
                if (importButton) {
                  (importButton as HTMLElement).click();
                }
              }
            }}
          >
            {isProcessing ? 'Importando...' : 'Importar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportClientsDialog;
