
import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MessageData {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  messageCode: string;
  messageContent: string;
  attentionLevel: "low" | "medium" | "high";
  scheduledDate: string;
  status: "pending" | "sent";
}

interface DayViewProps {
  currentDate: Date;
  messages: MessageData[];
  onStatusUpdate: (messageId: string, status: "sent") => void;
}

const DayView = ({ currentDate, messages }: DayViewProps) => {
  const dayMessages = messages.filter(message => {
    const messageDate = new Date(message.scheduledDate).toDateString();
    return messageDate === currentDate.toDateString();
  });

  return (
    <div className="bg-white rounded-lg border h-full">
      <div className="p-4 border-b bg-gray-50">
        <h3 className="font-medium text-gray-900">
          {format(currentDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </h3>
        <p className="text-sm text-gray-600">
          {dayMessages.length} mensagem(ns) agendada(s)
        </p>
      </div>
      
      <div className="p-4 h-full overflow-y-auto">
        {dayMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center py-8 text-gray-500">
              <p>Nenhuma mensagem agendada para este dia</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {dayMessages.map((message) => (
              <div
                key={message.id}
                className="p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="font-medium text-blue-900 mb-1">
                  {message.clientName}
                </div>
                <div className="text-sm text-blue-700">
                  {message.messageCode}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  {message.clientPhone}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DayView;
