
import { KanbanColumn } from "../../types";

// Kanban board columns
export const kanbanColumns: KanbanColumn[] = [
  {
    id: "1",
    title: "Novo Aluno",
    color: "kanban-blue",
    cards: [
      {
        id: "card1",
        clientId: "1",
        clientName: "João Silva",
        attentionLevel: "low",
        content: "Enviar mensagem de boas-vindas"
      },
      {
        id: "card5",
        clientId: "5",
        clientName: "Pedro Santos",
        attentionLevel: "medium",
        content: "Enviar formulário inicial"
      }
    ]
  },
  {
    id: "2",
    title: "Contato Inicial",
    color: "kanban-purple",
    cards: [
      {
        id: "card2",
        clientId: "2",
        clientName: "Maria Souza",
        attentionLevel: "medium",
        content: "Ligar para confirmar dados"
      }
    ]
  },
  {
    id: "3",
    title: "Avaliação",
    color: "kanban-pink",
    cards: [
      {
        id: "card4",
        clientId: "4",
        clientName: "Ana Oliveira",
        attentionLevel: "low",
        content: "Agendar chamada de avaliação"
      }
    ]
  },
  {
    id: "4",
    title: "Acompanhamento Semanal",
    color: "kanban-orange",
    cards: []
  },
  {
    id: "5",
    title: "Proximidade do Fim",
    color: "kanban-yellow",
    cards: [
      {
        id: "card3",
        clientId: "3",
        clientName: "Carlos Ferreira",
        attentionLevel: "high",
        content: "Enviar proposta de renovação"
      }
    ]
  },
  {
    id: "6",
    title: "Renovação",
    color: "kanban-green",
    cards: []
  }
];
