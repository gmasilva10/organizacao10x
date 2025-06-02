
import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MessageCircle } from "lucide-react";
import ClientCard from "./ClientCard";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

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

interface MessagePanelProps {
  selectedDate: Date;
  messages: MessageData[];
  onStatusUpdate: (messageId: string, status: "sent") => void;
  onDateSelect: (date: Date) => void;
}

const MessagePanel = ({ selectedDate, messages, onStatusUpdate, onDateSelect }: MessagePanelProps) => {
  return (
    <div className="w-96 flex flex-col gap-4">
      {/* Date Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle size={20} className="text-blue-600" />
            Mensagens Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && onDateSelect(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {messages.length} mensagem(ns) para este dia
            </span>
            {messages.length > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {messages.filter(m => m.status === "pending").length} pendente(s)
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Messages List */}
      <div className="flex-1 overflow-hidden">
        <Card className="h-full">
          <CardContent className="p-0 h-full">
            <div className="h-full overflow-y-auto p-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <MessageCircle size={48} className="text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">
                    Nenhuma mensagem agendada
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    para {format(selectedDate, "dd/MM/yyyy")}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => (
                    <ClientCard
                      key={message.id}
                      clientId={message.clientId}
                      clientName={message.clientName}
                      clientPhone={message.clientPhone}
                      messageCode={message.messageCode}
                      messageContent={message.messageContent}
                      attentionLevel={message.attentionLevel}
                      scheduledDate={message.scheduledDate}
                      status={message.status}
                      onStatusUpdate={onStatusUpdate}
                      messageId={message.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MessagePanel;
