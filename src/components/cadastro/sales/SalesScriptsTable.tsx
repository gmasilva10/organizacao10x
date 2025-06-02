
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

interface SalesScript {
  id: string;
  month: string;
  leads: number;
  block1: number;
  block2: number;
  block3: number;
  sale: number;
}

interface SalesScriptsTableProps {
  scripts: SalesScript[];
  onEdit: (script: SalesScript) => void;
  onDelete: (script: SalesScript) => void;
}

const SalesScriptsTable = ({ scripts, onEdit, onDelete }: SalesScriptsTableProps) => {
  const calculateScriptConversion = (script: SalesScript) => {
    return script.leads > 0 ? ((script.sale / script.leads) * 100).toFixed(1) : "0.0";
  };

  const calculateOfferConversion = (script: SalesScript) => {
    return script.block3 > 0 ? ((script.sale / script.block3) * 100).toFixed(1) : "0.0";
  };

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mês/Ano</TableHead>
            <TableHead>Lead</TableHead>
            <TableHead>B1 - Diagnóstico</TableHead>
            <TableHead>B2 - Diferenciação</TableHead>
            <TableHead>B3 - Oferta</TableHead>
            <TableHead>Venda</TableHead>
            <TableHead className="bg-blue-50">Conversão do Script</TableHead>
            <TableHead className="bg-green-50">Conversão da Oferta</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {scripts.map((script) => (
            <TableRow key={script.id}>
              <TableCell className="font-medium">{script.month}</TableCell>
              <TableCell>{script.leads}</TableCell>
              <TableCell>{script.block1}</TableCell>
              <TableCell>{script.block2}</TableCell>
              <TableCell>{script.block3}</TableCell>
              <TableCell>{script.sale}</TableCell>
              <TableCell className="bg-blue-50 font-semibold text-blue-700">
                {calculateScriptConversion(script)}%
              </TableCell>
              <TableCell className="bg-green-50 font-semibold text-green-700">
                {calculateOfferConversion(script)}%
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => onEdit(script)}
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => onDelete(script)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default SalesScriptsTable;
