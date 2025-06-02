
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { KanbanColumn, KanbanCard } from '@/types';

export const useRealKanbanData = () => {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { organization } = useAuth();

  useEffect(() => {
    if (!organization?.organization_id) {
      setLoading(false);
      return;
    }

    fetchKanbanData();
  }, [organization?.organization_id]);

  const fetchKanbanData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar colunas
      const { data: columnsData, error: columnsError } = await supabase
        .from('kanban_columns')
        .select('*')
        .eq('organization_id', organization.organization_id)
        .order('kanban_column_order');

      if (columnsError) {
        console.error('Erro ao buscar colunas:', columnsError);
        throw columnsError;
      }

      // Buscar cards
      const { data: cardsData, error: cardsError } = await supabase
        .from('kanban_cards')
        .select(`
          *,
          client:clients (
            client_name,
            client_email,
            client_phone,
            client_attention_level,
            client_status,
            client_services (
              service_id,
              client_service_start_date,
              client_service_end_date
            )
          )
        `);

      if (cardsError) {
        console.error('Erro ao buscar cards:', cardsError);
        throw cardsError;
      }

      // Transformar dados
      const transformedColumns: KanbanColumn[] = (columnsData || []).map(column => {
        const columnCards = (cardsData || [])
          .filter(card => card.kanban_column_id === column.kanban_column_id)
          .map(card => ({
            id: card.kanban_card_id,
            clientId: card.client_id,
            clientName: card.client?.client_name || 'Cliente sem nome',
            clientEmail: card.client?.client_email || '',
            phone: card.client?.client_phone || '',
            content: card.kanban_card_content || '',
            dueDate: card.kanban_card_due_date || '',
            attentionLevel: (card.client?.client_attention_level as any) || 'medium',
            serviceType: 'monthly', // Implementar mapeamento real depois
            isActive: card.client?.client_status === 'active',
            startDate: card.client?.client_services?.[0]?.client_service_start_date || '',
            endDate: card.client?.client_services?.[0]?.client_service_end_date || ''
          })) as KanbanCard[];

        return {
          id: column.kanban_column_id,
          title: column.kanban_column_title,
          color: column.kanban_column_color,
          cards: columnCards
        };
      });

      setColumns(transformedColumns);
    } catch (err) {
      console.error('Erro ao buscar dados do kanban:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const updateCardColumn = async (cardId: string, targetColumnId: string) => {
    try {
      const { error } = await supabase
        .from('kanban_cards')
        .update({ kanban_column_id: targetColumnId })
        .eq('kanban_card_id', cardId);

      if (error) {
        console.error('Erro ao atualizar card:', error);
        throw error;
      }

      await fetchKanbanData();
    } catch (err) {
      console.error('Erro ao mover card:', err);
      throw err;
    }
  };

  const removeCard = async (cardId: string) => {
    try {
      const { error } = await supabase
        .from('kanban_cards')
        .delete()
        .eq('kanban_card_id', cardId);

      if (error) {
        console.error('Erro ao deletar card:', error);
        throw error;
      }

      await fetchKanbanData();
    } catch (err) {
      console.error('Erro ao remover card:', err);
      throw err;
    }
  };

  const addColumn = async (title: string, color: string) => {
    try {
      // Get the next order number
      const maxOrder = columns.length > 0 ? Math.max(...columns.map((_, index) => index + 1)) : 0;
      
      const { error } = await supabase
        .from('kanban_columns')
        .insert({
          kanban_column_title: title,
          kanban_column_color: color,
          kanban_column_order: maxOrder + 1,
          organization_id: organization.organization_id
        });

      if (error) {
        console.error('Erro ao criar coluna:', error);
        throw error;
      }

      await fetchKanbanData();
    } catch (err) {
      console.error('Erro ao criar coluna:', err);
      throw err;
    }
  };

  const removeColumn = async (columnId: string) => {
    try {
      // First, delete all cards in this column
      const { error: cardsError } = await supabase
        .from('kanban_cards')
        .delete()
        .eq('kanban_column_id', columnId);

      if (cardsError) {
        console.error('Erro ao deletar cards da coluna:', cardsError);
        throw cardsError;
      }

      // Then delete the column
      const { error: columnError } = await supabase
        .from('kanban_columns')
        .delete()
        .eq('kanban_column_id', columnId);

      if (columnError) {
        console.error('Erro ao deletar coluna:', columnError);
        throw columnError;
      }

      await fetchKanbanData();
    } catch (err) {
      console.error('Erro ao remover coluna:', err);
      throw err;
    }
  };

  const addCard = async (columnId: string, clientId: string, content: string) => {
    try {
      const { error } = await supabase
        .from('kanban_cards')
        .insert({
          kanban_column_id: columnId,
          client_id: clientId,
          kanban_card_content: content,
          kanban_card_due_date: null
        });

      if (error) {
        console.error('Erro ao criar card:', error);
        throw error;
      }

      await fetchKanbanData();
    } catch (err) {
      console.error('Erro ao adicionar card:', err);
      throw err;
    }
  };

  return { 
    columns, 
    loading, 
    error, 
    refetch: fetchKanbanData,
    updateCardColumn,
    moveCard: updateCardColumn,
    removeCard,
    addColumn,
    removeColumn,
    addCard
  };
};
