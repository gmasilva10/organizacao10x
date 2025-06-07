import React from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Columns3 } from 'lucide-react';

interface ColumnCustomizerProps {
  columnVisibility: Record<string, boolean>;
  onColumnVisibilityChange: (column: string, visible: boolean) => void;
}

const columnLabels: Record<string, string> = {
  email: 'Email',
  phone: 'Telefone',
  status: 'Status',
  serviceType: 'Serviço',
  campaignId: 'Campanha',
};

const ColumnCustomizer = ({
  columnVisibility,
  onColumnVisibilityChange,
}: ColumnCustomizerProps) => {
  const customizableColumns = Object.keys(columnLabels);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <Columns3 size={16} />
          Colunas
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Exibir/Ocultar Colunas</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {customizableColumns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column}
            checked={columnVisibility[column]}
            onCheckedChange={(checked) => onColumnVisibilityChange(column, checked)}
          >
            {columnLabels[column]}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ColumnCustomizer; 