
import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MessageTemplate } from "@/hooks/useRealMessageTemplates";

interface MessageScheduleTableProps {
  templates: MessageTemplate[];
}

const MessageScheduleTable = ({ templates }: MessageScheduleTableProps) => {
  const sortedTemplates = [...templates].sort((a, b) => a.dayOffset - b.dayOffset);

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'boas-vindas': return 'bg-blue-100 text-blue-800';
      case 'follow-up': return 'bg-green-100 text-green-800';
      case 'renovação': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Cronograma de Mensagens</h2>
        <p className="text-gray-600">
          Visualize quando cada mensagem será enviada baseada nos marcos temporais
        </p>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dia</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Objetivo</TableHead>
              <TableHead>Preview</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTemplates.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">
                  D+{template.dayOffset}
                </TableCell>
                <TableCell>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                    {template.code}
                  </code>
                </TableCell>
                <TableCell>{template.description}</TableCell>
                <TableCell>
                  <Badge className={getCategoryColor(template.category)}>
                    {template.category}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600">
                    {template.objective}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="max-w-xs">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {template.content}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {sortedTemplates.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Nenhuma mensagem programada encontrada.
        </div>
      )}
    </div>
  );
};

export default MessageScheduleTable;
