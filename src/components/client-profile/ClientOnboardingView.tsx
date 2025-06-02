
import React, { useState, useEffect } from "react";
import { Check, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useClientMilestones } from "@/hooks/useClientMilestones";

interface ClientOnboardingViewProps {
  clientId: string;
}

interface ClientData {
  client_anamnesis_date?: string;
  client_workout_delivery_date?: string;
  client_created_at?: string;
}

const ClientOnboardingView = ({ clientId }: ClientOnboardingViewProps) => {
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const { loading: actionLoading, updateAnamnesis, updateWorkoutDelivery } = useClientMilestones();

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        console.log('Buscando dados do cliente:', clientId);
        
        const { data, error } = await supabase
          .from('clients')
          .select('client_anamnesis_date, client_workout_delivery_date, client_created_at')
          .eq('client_id', clientId)
          .single();

        if (error) {
          console.error('Erro ao buscar dados do cliente:', error);
          return;
        }

        setClientData(data);
      } catch (error) {
        console.error('Erro inesperado:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [clientId]);

  const handleAnamnesisClick = async () => {
    const success = await updateAnamnesis(clientId);
    if (success) {
      // Atualizar dados locais
      setClientData(prev => prev ? {
        ...prev,
        client_anamnesis_date: new Date().toISOString().split('T')[0]
      } : null);
    }
  };

  const handleWorkoutDeliveryClick = async () => {
    const success = await updateWorkoutDelivery(clientId);
    if (success) {
      // Atualizar dados locais
      setClientData(prev => prev ? {
        ...prev,
        client_workout_delivery_date: new Date().toISOString().split('T')[0]
      } : null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-2 bg-gray-200 rounded"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Define onboarding steps based on real data
  const onboardingSteps = [
    {
      id: "col1",
      name: "Inserir dados iniciais",
      completed: !!clientData?.client_created_at,
      date: clientData?.client_created_at
    },
    {
      id: "col2", 
      name: "Entrega do APP",
      completed: !!clientData?.client_created_at, // Assume completed when client is created
      date: clientData?.client_created_at
    },
    {
      id: "col3",
      name: "Anamnese",
      completed: !!clientData?.client_anamnesis_date,
      date: clientData?.client_anamnesis_date
    },
    {
      id: "col4",
      name: "Contato com Nutricionista", 
      completed: false, // This would need its own field in the database
      date: null
    },
    {
      id: "col5",
      name: "Entrega do Treino",
      completed: !!clientData?.client_workout_delivery_date,
      date: clientData?.client_workout_delivery_date
    },
    {
      id: "col6",
      name: "Entrega do Plano Alimentar",
      completed: false, // This would need its own field in the database
      date: null
    },
    {
      id: "col7",
      name: "Entrega da Plataforma", 
      completed: false, // This would need its own field in the database
      date: null
    }
  ];

  const completedSteps = onboardingSteps.filter(step => step.completed).length;
  const totalSteps = onboardingSteps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium">Histórico do Onboarding</h3>
          <span className="text-sm text-gray-500">
            {completedSteps} de {totalSteps} etapas concluídas
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
      
      <div className="space-y-3">
        {onboardingSteps.map((step, index) => (
          <div 
            key={step.id} 
            className={`flex items-center justify-between p-4 rounded-md border ${
              step.completed 
                ? 'bg-green-50 border-green-200' 
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step.completed 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {step.completed ? (
                  <Check size={16} />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              
              <div>
                <div className={`font-medium ${step.completed ? 'text-green-800' : 'text-gray-700'}`}>
                  {step.name}
                </div>
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <Calendar size={12} />
                  {step.completed && step.date 
                    ? `Concluída em ${new Date(step.date).toLocaleDateString("pt-BR")}`
                    : "Pendente"
                  }
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {step.id === 'col3' && !step.completed && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAnamnesisClick}
                  disabled={actionLoading}
                  className="flex items-center gap-1"
                >
                  <Check size={14} />
                  Marcar Anamnese
                </Button>
              )}
              
              {step.id === 'col5' && !step.completed && clientData?.client_anamnesis_date && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleWorkoutDeliveryClick}
                  disabled={actionLoading}
                  className="flex items-center gap-1"
                >
                  <Check size={14} />
                  Treino Entregue
                </Button>
              )}
              
              {step.completed && (
                <div className="flex items-center gap-1 text-green-600">
                  <Check size={16} />
                  <span className="text-sm font-medium">Concluída</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {completedSteps === totalSteps && (
        <div className="mt-6 p-4 bg-green-100 border border-green-200 rounded-md">
          <div className="flex items-center gap-2 text-green-800">
            <Check size={20} />
            <span className="font-medium">Onboarding Completo!</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            Todas as etapas do onboarding foram concluídas com sucesso.
          </p>
        </div>
      )}
    </div>
  );
};

export default ClientOnboardingView;
