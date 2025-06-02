
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useClientMilestones = () => {
  const [loading, setLoading] = useState(false);

  const updateAnamnesis = async (clientId: string): Promise<boolean> => {
    setLoading(true);
    try {
      console.log('Atualizando anamnese para cliente:', clientId);
      
      const { error } = await supabase
        .from('clients')
        .update({ 
          client_anamnesis_date: new Date().toISOString().split('T')[0]
        })
        .eq('client_id', clientId);

      if (error) {
        console.error('Erro ao atualizar anamnese:', error);
        toast.error('Erro ao registrar anamnese');
        return false;
      }

      console.log('Anamnese registrada com sucesso');
      toast.success('Anamnese registrada com sucesso!');
      
      // Emit event to update onboarding progress
      const event = new CustomEvent('onboardingProgress', {
        detail: { 
          clientId, 
          completedSteps: ['col1', 'col2', 'col3'] // Include anamnesis step
        }
      });
      window.dispatchEvent(event);
      
      return true;
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast.error('Erro inesperado ao registrar anamnese');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateWorkoutDelivery = async (clientId: string): Promise<boolean> => {
    setLoading(true);
    try {
      console.log('Registrando entrega de treino para cliente:', clientId);
      
      const { error } = await supabase
        .from('clients')
        .update({ 
          client_workout_delivery_date: new Date().toISOString().split('T')[0]
        })
        .eq('client_id', clientId);

      if (error) {
        console.error('Erro ao registrar entrega de treino:', error);
        toast.error('Erro ao registrar entrega de treino');
        return false;
      }

      console.log('Entrega de treino registrada com sucesso');
      toast.success('Treino entregue com sucesso!');
      
      // Emit event to update onboarding progress
      const event = new CustomEvent('onboardingProgress', {
        detail: { 
          clientId, 
          completedSteps: ['col1', 'col2', 'col3', 'col4', 'col5'] // All steps completed
        }
      });
      window.dispatchEvent(event);
      
      return true;
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast.error('Erro inesperado ao registrar entrega de treino');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    updateAnamnesis,
    updateWorkoutDelivery
  };
};
