
import { MessageSchedule } from "../../types";

// Configuração de frequência das mensagens por tipo de plano
export const messageSchedules: MessageSchedule[] = [
  {
    serviceType: "monthly",
    durationDays: 30,
    messages: [
      { code: "M1", dayOffset: 0 },
      { code: "M2", dayOffset: 7 },
      { code: "M3", dayOffset: 21 },
      { code: "M5", dayOffset: 24 },
      { code: "M6", dayOffset: 29 }
    ]
  },
  {
    serviceType: "quarterly",
    durationDays: 90,
    messages: [
      { code: "M1", dayOffset: 0 },
      { code: "M2", dayOffset: 7 },
      { code: "M3", dayOffset: 30 },
      { code: "M4", dayOffset: 45 },
      { code: "M5", dayOffset: 83 },
      { code: "M6", dayOffset: 89 }
    ]
  },
  {
    serviceType: "biannual",
    durationDays: 180,
    messages: [
      { code: "M1", dayOffset: 0 },
      { code: "M2", dayOffset: 7 },
      { code: "M3", dayOffset: 30 },
      { code: "M4", dayOffset: 45 },
      { code: "M5", dayOffset: 172 },
      { code: "M6", dayOffset: 179 }
    ]
  },
  {
    serviceType: "annual",
    durationDays: 365,
    messages: [
      { code: "M1", dayOffset: 0 },
      { code: "M2", dayOffset: 7 },
      { code: "M3", dayOffset: 30 },
      { code: "M4", dayOffset: 90 },
      { code: "M5", dayOffset: 355 },
      { code: "M6", dayOffset: 364 }
    ]
  }
];
