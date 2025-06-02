// This file exports all mock data from individual domain files
import { states } from './stateData';
import { services } from './serviceData';
import { campaigns } from './campaignData';
import { clients } from './clientData';
import { messages } from './messageData';
import { clientMessages } from './clientMessageData';
import { salesScripts } from './salesScriptData';
import { kanbanColumns } from './kanbanData';
// import { dashboardMetrics, taskMetrics } from './metricsData'; // Linha removida pois o arquivo metricsData.ts foi excluído
import { messageSchedules } from './messageScheduleData';

export {
  states,
  services,
  campaigns,
  clients,
  messages,
  clientMessages,
  salesScripts,
  kanbanColumns,
  // dashboardMetrics, // Removido
  // taskMetrics, // Removido
  messageSchedules
};
