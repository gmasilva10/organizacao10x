
import React from "react";
import { Button } from "@/components/ui/button";
import { FileText, Dumbbell } from "lucide-react";
import { useClientMilestones } from "@/hooks/useClientMilestones";

interface MilestoneButtonsProps {
  clientId: string;
  anamnesisDate?: string | null;
  workoutDeliveryDate?: string | null;
  onUpdate?: () => void;
}

const MilestoneButtons = ({ 
  clientId, 
  anamnesisDate, 
  workoutDeliveryDate, 
  onUpdate 
}: MilestoneButtonsProps) => {
  const { loading, updateAnamnesis, updateWorkoutDelivery } = useClientMilestones();

  const handleAnamnesisClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await updateAnamnesis(clientId);
    if (success && onUpdate) {
      onUpdate();
    }
  };

  const handleWorkoutClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await updateWorkoutDelivery(clientId);
    if (success && onUpdate) {
      onUpdate();
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleAnamnesisClick}
        disabled={loading || !!anamnesisDate}
        className={`h-8 w-8 p-0 ${anamnesisDate ? 'text-green-600 bg-green-50' : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'}`}
        title={anamnesisDate ? "Anamnese realizada" : "Marcar anamnese como realizada"}
      >
        <FileText size={16} />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleWorkoutClick}
        disabled={loading || !!workoutDeliveryDate}
        className={`h-8 w-8 p-0 ${workoutDeliveryDate ? 'text-green-600 bg-green-50' : 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'}`}
        title={workoutDeliveryDate ? "Treino entregue" : "Marcar treino como entregue"}
      >
        <Dumbbell size={16} />
      </Button>
    </div>
  );
};

export default MilestoneButtons;
