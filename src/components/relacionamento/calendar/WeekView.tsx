
import React from "react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

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

interface WeekViewProps {
  currentDate: Date;
  messages: MessageData[];
  onDayClick: (date: Date) => void;
}

const WeekView = ({ currentDate, messages, onDayClick }: WeekViewProps) => {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getMessagesForDay = (date: Date) => {
    return messages.filter(message => 
      isSameDay(new Date(message.scheduledDate), date)
    );
  };

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="grid grid-cols-7 border-b bg-gray-50">
        {weekDays.map((day) => (
          <div key={day.toISOString()} className="p-3 text-center border-r last:border-r-0">
            <div className="text-sm font-medium text-gray-900">
              {format(day, "EEE", { locale: ptBR })}
            </div>
            <div className="text-lg font-semibold text-gray-700">
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7" style={{ minHeight: "400px" }}>
        {weekDays.map((day) => {
          const dayMessages = getMessagesForDay(day);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div 
              key={day.toISOString()} 
              className={`p-2 border-r last:border-r-0 cursor-pointer hover:bg-gray-50 ${
                isToday ? "bg-blue-50" : ""
              }`}
              onClick={() => onDayClick(day)}
            >
              <div className="space-y-1">
                {dayMessages.slice(0, 3).map((message) => (
                  <div
                    key={message.id}
                    className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate"
                  >
                    {message.clientName}
                  </div>
                ))}
                
                {dayMessages.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{dayMessages.length - 3} mais
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeekView;
