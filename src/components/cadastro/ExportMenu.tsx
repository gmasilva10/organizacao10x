
import React from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExportMenuProps {
  onExportXLSX: () => void;
  onExportCSV: () => void;
}

const ExportMenu = ({ onExportXLSX, onExportCSV }: ExportMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <Download size={16} />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem className="flex items-center gap-2" onClick={onExportXLSX}>
          <Download size={16} />
          Exportar XLSX
        </DropdownMenuItem>
        <DropdownMenuItem className="flex items-center gap-2" onClick={onExportCSV}>
          <Download size={16} />
          Exportar CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportMenu;
