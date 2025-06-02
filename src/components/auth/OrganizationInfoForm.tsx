
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDocument } from "@/utils/documentFormatter";

interface OrganizationInfoFormProps {
  organizationName: string;
  setOrganizationName: (value: string) => void;
  documentType: string;
  setDocumentType: (value: string) => void;
  document: string;
  setDocument: (value: string) => void;
}

export const OrganizationInfoForm = ({
  organizationName,
  setOrganizationName,
  documentType,
  setDocumentType,
  document,
  setDocument
}: OrganizationInfoFormProps) => {
  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDocument(formatDocument(value, documentType));
  };

  return (
    <>
      <div className="mb-4">
        <Label htmlFor="organization">Nome da Empresa</Label>
        <Input 
          id="organization" 
          type="text" 
          placeholder="Nome da sua empresa" 
          value={organizationName} 
          onChange={e => setOrganizationName(e.target.value)} 
          className="mt-1" 
          required 
        />
      </div>
      
      <div className="mb-4">
        <Label htmlFor="documentType">Tipo de Documento</Label>
        <Select onValueChange={setDocumentType} value={documentType}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Selecione o tipo de documento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CPF">CPF</SelectItem>
            <SelectItem value="CNPJ">CNPJ</SelectItem>
            <SelectItem value="Estrangeiro">Estrangeiro</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {documentType && (
        <div className="mb-4">
          <Label htmlFor="document">Documento</Label>
          <Input 
            id="document" 
            type="text" 
            placeholder={
              documentType === "CPF" 
                ? "123.456.789-10" 
                : documentType === "CNPJ" 
                  ? "12.345.678/0001-99" 
                  : "Número do documento"
            } 
            value={document} 
            onChange={handleDocumentChange} 
            className="mt-1" 
            required 
          />
        </div>
      )}
    </>
  );
};
