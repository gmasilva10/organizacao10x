
import { useState, useCallback } from "react";
import * as XLSX from 'xlsx';
import { toast } from "sonner";
import { ImportStats } from "../types";
import { 
  validateRequiredFields, 
  parseDate, 
  validateStateCode,
  importClientToDatabase
} from "../utils";

export const useImportClients = (
  file: File | null,
  setImportStats: (stats: ImportStats | null) => void,
  setIsProcessing: (isProcessing: boolean) => void
) => {
  const importClients = useCallback(async () => {
    if (!file) return;
    
    setIsProcessing(true);
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          if (!e.target?.result) {
            toast.error("Erro de leitura: Não foi possível ler o arquivo");
            setIsProcessing(false);
            return;
          }
          
          const data = new Uint8Array(e.target.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          if (workbook.SheetNames.length === 0) {
            toast.error("Arquivo inválido: A planilha não contém nenhuma página");
            setIsProcessing(false);
            return;
          }
          
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          const stats = {
            total: jsonData.length,
            successful: 0,
            failed: 0,
            errors: [] as string[]
          };
          
          for (const row of jsonData) {
            try {
              // Skip header row if it was included
              if (row["Nome do Aluno*"] === "Nome do Aluno*") continue;
              
              // Validate required fields
              const missingFields = validateRequiredFields(row);
              
              if (missingFields.length > 0) {
                stats.failed++;
                stats.errors.push(`Linha com ${row["Nome do Aluno*"] || "cliente sem nome"}: campos obrigatórios ausentes: ${missingFields.join(', ')}`);
                continue;
              }
              
              const birthDate = parseDate(row["Data de Nascimento*"] as string);
              if (!birthDate) {
                stats.failed++;
                stats.errors.push(`Linha com ${row["Nome do Aluno*"]}: formato de data inválido (use DD/MM/AAAA)`);
                continue;
              }

              // Validate state code if provided
              if (row["Estado"] && !validateStateCode(row["Estado"] as string)) {
                stats.failed++;
                stats.errors.push(`Linha com ${row["Nome do Aluno*"]}: código de estado inválido: ${row["Estado"]}`);
                continue;
              }
              
              // Insert client into database
              await importClientToDatabase(row);
              stats.successful++;
              
            } catch (rowError) {
              console.error("Erro ao processar linha:", rowError);
              stats.failed++;
              const errorMessage = (rowError as Error).message || "Erro desconhecido";
              const clientName = row["Nome do Aluno*"] || "cliente desconhecido";
              stats.errors.push(`Linha com ${clientName}: ${errorMessage}`);
            }
          }
          
          setImportStats(stats);
          
          if (stats.successful > 0) {
            if (stats.failed > 0) {
              toast(`Importação concluída: ${stats.successful} de ${stats.total} alunos importados com sucesso`);
            } else {
              toast.success(`Importação concluída: ${stats.successful} de ${stats.total} alunos importados com sucesso`);
            }
          } else {
            toast.error("Falha na importação: Nenhum aluno foi importado. Verifique os erros.");
          }
          
        } catch (fileProcessError) {
          console.error("Erro ao processar arquivo:", fileProcessError);
          toast.error(`Erro ao processar o arquivo: ${(fileProcessError as Error).message || "Verifique o formato do seu arquivo"}`);
        } finally {
          setIsProcessing(false);
        }
      };
      
      reader.onerror = () => {
        toast.error("Erro de leitura: Não foi possível ler o arquivo");
        setIsProcessing(false);
      };
      
      reader.readAsArrayBuffer(file);
      
    } catch (error) {
      console.error("Erro inesperado:", error);
      toast.error(`Erro inesperado: ${(error as Error).message || "Ocorreu um erro ao processar o arquivo"}`);
      setIsProcessing(false);
    }
  }, [file, setImportStats, setIsProcessing]);

  return { importClients };
};
