
import React from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay } from "date-fns";
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

interface MonthViewProps {
  currentDate: Date;
  messages: MessageData[];
  onDayClick: (date: Date) => void;
}

const MonthView = ({ currentDate, messages, onDayClick }: MonthViewProps) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = [];
  let day = startDate;
  
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const getMessagesForDay = (date: Date) => {
    return messages.filter(message => 
      isSameDay(new Date(message.scheduledDate), date)
    );
  };

  const weekDayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="grid grid-cols-7 border-b bg-gray-50">
        {weekDayNames.map((dayName) => (
          <div key={dayName} className="p-3 text-center border-r last:border-r-0">
            <div className="text-sm font-medium text-gray-900">{dayName}</div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7">
        {days.map((day, dayIdx) => {
          const dayMessages = getMessagesForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div 
              key={day.toISOString()} 
              className={`min-h-[100px] p-2 border-r border-b last:border-r-0 cursor-pointer hover:bg-gray-50 ${
                !isCurrentMonth ? "bg-gray-100 text-gray-400" : ""
              } ${isToday ? "bg-blue-50" : ""}`}
              onClick={() => onDayClick(day)}
            >
              <div className={`text-sm font-medium mb-1 ${
                isToday ? "text-blue-600 font-bold" : ""
              }`}>
                {format(day, "d")}
              </div>
              
              <div className="space-y-1">
                {dayMessages.slice(0, 2).map((message) => (
                  <div
                    key={message.id}
                    className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate"
                  >
                    {message.clientName}
                  </div>
                ))}
                
                {dayMessages.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{dayMessages.length - 2}
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

export default MonthView;
