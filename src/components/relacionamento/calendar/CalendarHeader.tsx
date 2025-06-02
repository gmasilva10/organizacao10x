
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CalendarHeaderProps {
  currentDate: Date;
  view: "day" | "week" | "month";
  onPrevious: () => void;
  onNext: () => void;
  onViewChange: (view: "day" | "week" | "month") => void;
  onToday: () => void;
}

const CalendarHeader = ({ 
  currentDate, 
  view, 
  onPrevious, 
  onNext, 
  onViewChange, 
  onToday 
}: CalendarHeaderProps) => {
  const getDateDisplay = () => {
    switch (view) {
      case "day":
        return format(currentDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      case "week":
        return format(currentDate, "MMMM yyyy", { locale: ptBR });
      case "month":
        return format(currentDate, "MMMM yyyy", { locale: ptBR });
      default:
        return "";
    }
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onPrevious}>
            <ChevronLeft size={16} />
          </Button>
          <Button variant="outline" size="sm" onClick={onNext}>
            <ChevronRight size={16} />
          </Button>
          <Button variant="outline" size="sm" onClick={onToday}>
            Hoje
          </Button>
        </div>
        
        <h2 className="text-xl font-semibold capitalize">
          {getDateDisplay()}
        </h2>
      </div>
      
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        <Button
          variant={view === "day" ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewChange("day")}
        >
          Dia
        </Button>
        <Button
          variant={view === "week" ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewChange("week")}
        >
          Semana
        </Button>
        <Button
          variant={view === "month" ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewChange("month")}
        >
          Mês
        </Button>
      </div>
    </div>
  );
};

export default CalendarHeader;
