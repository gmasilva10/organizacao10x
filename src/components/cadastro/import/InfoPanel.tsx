
import React from "react";

const InfoPanel: React.FC = () => {
  return (
    <div className="bg-blue-50 p-3 rounded-lg">
      <div className="flex items-center gap-2 text-blue-700 text-xs">
        <div className="rounded-full bg-blue-100 p-1">
          <div className="h-3 w-3 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px]">i</div>
        </div>
        <span className="font-medium">Campos obrigatórios:</span>
      </div>
      <p className="text-xs text-gray-700 ml-6">Nome, Telefone, CPF, E-mail, Data de Nascimento</p>
      
      <div className="mt-2 text-xs text-gray-700">
        <p className="font-medium mb-1">Formatos esperados:</p>
        <ul className="list-disc ml-8 space-y-1 text-xs">
          <li>Telefone: somente números (ex: 5511999999999)</li>
          <li>CPF: formato 123.456.789-00 ou somente números</li>
          <li>Data de Nascimento: DD/MM/AAAA</li>
          <li>Valor do Serviço: formato decimal (ex: 100.00)</li>
          <li>Data do Pagamento: DD/MM/AAAA</li>
        </ul>
      </div>
    </div>
  );
};

export default InfoPanel;
