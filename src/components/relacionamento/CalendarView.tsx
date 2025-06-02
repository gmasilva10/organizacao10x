
import React, { useState } from "react";
import { addDays, addWeeks, addMonths, subDays, subWeeks, subMonths } from "date-fns";
import { clientMessages, messages, clients } from "@/services/mockData";
import CalendarHeader from "./calendar/CalendarHeader";
import DayView from "./calendar/DayView";
import WeekView from "./calendar/WeekView";
import MonthView from "./calendar/MonthView";
import MessagePanel from "./calendar/MessagePanel";

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"day" | "week" | "month">("month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Process message data
  const processedMessages = clientMessages
    .filter(message => message.status === "pending")
    .map(clientMessage => {
      const message = messages.find(m => m.id === clientMessage.messageId);
      const client = clients.find(c => c.id === clientMessage.clientId);
      
      return {
        id: clientMessage.id,
        clientId: clientMessage.clientId,
        clientName: client?.name || '',
        clientPhone: client?.phone || '',
        messageCode: message?.code || '',
        messageContent: message?.description || '',
        attentionLevel: client?.attentionLevel || 'medium' as const,
        scheduledDate: clientMessage.scheduledDate,
        status: clientMessage.status as "pending" | "sent"
      };
    });

  const handlePrevious = () => {
    switch (view) {
      case "day":
        setCurrentDate(subDays(currentDate, 1));
        break;
      case "week":
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case "month":
        setCurrentDate(subMonths(currentDate, 1));
        break;
    }
  };

  const handleNext = () => {
    switch (view) {
      case "day":
        setCurrentDate(addDays(currentDate, 1));
        break;
      case "week":
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case "month":
        setCurrentDate(addMonths(currentDate, 1));
        break;
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (date: Date) => {
    setCurrentDate(date);
    setSelectedDate(date);
    setView("day");
  };

  const handleStatusUpdate = (messageId: string, status: "sent") => {
    console.log(`Updating message ${messageId} to status: ${status}`);
    // Here you would typically update the message status in your data store
  };

  // Get messages for selected date or current date
  const getMessagesForDate = (date: Date) => {
    return processedMessages.filter(message => {
      const messageDate = new Date(message.scheduledDate).toDateString();
      return messageDate === date.toDateString();
    });
  };

  const displayDate = selectedDate || currentDate;
  const messagesForSelectedDate = getMessagesForDate(displayDate);

  return (
    <div className="flex gap-6 h-[calc(100vh-200px)]">
      {/* Calendar Section */}
      <div className="flex-1 flex flex-col">
        <CalendarHeader
          currentDate={currentDate}
          view={view}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onViewChange={setView}
          onToday={handleToday}
        />

        <div className="flex-1 overflow-hidden">
          {view === "day" && (
            <DayView
              currentDate={currentDate}
              messages={processedMessages}
              onStatusUpdate={handleStatusUpdate}
            />
          )}

          {view === "week" && (
            <WeekView
              currentDate={currentDate}
              messages={processedMessages}
              onDayClick={handleDayClick}
            />
          )}

          {view === "month" && (
            <MonthView
              currentDate={currentDate}
              messages={processedMessages}
              onDayClick={handleDayClick}
            />
          )}
        </div>
      </div>

      {/* Messages Panel */}
      <MessagePanel
        selectedDate={displayDate}
        messages={messagesForSelectedDate}
        onStatusUpdate={handleStatusUpdate}
        onDateSelect={setSelectedDate}
      />
    </div>
  );
};

export default CalendarView;
