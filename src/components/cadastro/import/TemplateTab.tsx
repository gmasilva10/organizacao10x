
import React from "react";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import * as XLSX from 'xlsx';

const TemplateTab: React.FC = () => {
  const generateTemplate = () => {
    // Create the template data with column headers
    const templateData = [
      [
        "Nome do Aluno*", "Telefone*", "CPF*", "E-mail*", "Data de Nascimento*", 
        "Cidade", "Estado", "País", "Colaborador", "Tipo de Cliente", "Serviço", 
        "Valor do Serviço (R$)", "Forma de Pagamento", "Parcelas", "Data do Pagamento",
        "Nível de Atenção", "Observações"
      ],
      // Add a sample row
      [
        "João Silva", "5511999999999", "123.456.789-00", "joao@exemplo.com", "01/01/1990",
        "São Paulo", "SP", "Brasil", "Carlos", "Lead", "Plano Mensal", "100.00", 
        "PIX", "1", "01/01/2025", "Médio", "Cliente interessado em treinos de força"
      ]
    ];

    // Create a new workbook and add the data
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template Alunos");
    
    // Generate the XLSX file
    XLSX.writeFile(workbook, "template_importacao_alunos.xlsx");
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">Use nosso modelo para importar seus alunos corretamente. O arquivo será gerado no formato XLSX com os campos padronizados.</p>
      
      <Button variant="outline" className="w-full justify-start text-sm" onClick={generateTemplate}>
        <FileDown className="mr-2" size={14} />
        Baixar Template XLSX
      </Button>
      
      <div className="bg-gray-50 p-3 rounded-lg">
        <p className="text-xs font-medium mb-1">Campos do template:</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div>
            <p className="text-xs font-medium text-gray-600">Obrigatórios:</p>
            <ul className="list-disc ml-4 text-xs text-gray-600">
              <li>Nome do Aluno</li>
              <li>Telefone</li>
              <li>CPF</li>
              <li>E-mail</li>
              <li>Data de Nascimento</li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600">Opcionais:</p>
            <ul className="list-disc ml-4 text-xs text-gray-600 space-y-0.5">
              <li>Cidade, Estado, País</li>
              <li>Colaborador</li>
              <li>Tipo de Cliente</li>
              <li>Serviço, Valor</li>
              <li>Informações de pagamento</li>
              <li>Observações</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateTab;
