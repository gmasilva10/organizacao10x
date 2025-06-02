
import React from "react";
import { Button } from "@/components/ui/button";
import SeparateMonthSelect from "./SeparateMonthSelect";
import YearSelect from "./YearSelect";
import NumericInput from "./NumericInput";
import { useSalesScriptForm } from "./hooks/useSalesScriptForm";

interface SalesScriptFormProps {
  onClose: () => void;
  script?: any;
}

const SalesScriptForm = ({ onClose, script }: SalesScriptFormProps) => {
  const {
    formValues,
    loading,
    handleChange,
    handleSubmit
  } = useSalesScriptForm({ onClose, script });

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-4">
        <SeparateMonthSelect
          value={formValues.month}
          onChange={(value) => handleChange("month", value)}
          disabled={loading}
        />
        
        <YearSelect
          value={formValues.year}
          onChange={(value) => handleChange("year", value)}
          disabled={loading}
        />
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        <NumericInput
          id="leads"
          label="Lead"
          value={formValues.leads}
          onChange={(value) => handleChange("leads", value)}
          disabled={loading}
        />
        
        <NumericInput
          id="block1"
          label="B1 - Diagnóstico"
          value={formValues.block1}
          onChange={(value) => handleChange("block1", value)}
          disabled={loading}
        />

        <NumericInput
          id="block2"
          label="B2 - Diferenciação"
          value={formValues.block2}
          onChange={(value) => handleChange("block2", value)}
          disabled={loading}
        />
        
        <NumericInput
          id="block3"
          label="B3 - Oferta"
          value={formValues.block3}
          onChange={(value) => handleChange("block3", value)}
          disabled={loading}
        />
        
        <NumericInput
          id="sale"
          label="Venda"
          value={formValues.sale}
          onChange={(value) => handleChange("sale", value)}
          disabled={loading}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button 
          variant="outline" 
          type="button"
          onClick={onClose}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button 
          type="submit"
          disabled={loading}
        >
          {loading ? "Salvando..." : script ? "Salvar Alterações" : "Salvar Script"}
        </Button>
      </div>
    </form>
  );
};

export default SalesScriptForm;
