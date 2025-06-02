
import React from "react";
import { Button } from "@/components/ui/button";

interface SalesViewSelectorProps {
  selectedView: string;
  onViewChange: (view: string) => void;
}

const SalesViewSelector = ({ selectedView, onViewChange }: SalesViewSelectorProps) => {
  const views = [
    { id: "funnel", label: "Funil Completo" },
    { id: "conversion", label: "Taxas de Conversão" }
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {views.map((view) => (
        <Button 
          key={view.id}
          variant={selectedView === view.id ? "default" : "outline"}
          onClick={() => onViewChange(view.id)}
          size="sm"
        >
          {view.label}
        </Button>
      ))}
    </div>
  );
};

export default SalesViewSelector;
