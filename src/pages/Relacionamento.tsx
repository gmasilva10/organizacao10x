
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CalendarView from "@/components/relacionamento/CalendarView";
import KanbanView from "@/components/relacionamento/KanbanView";
import RelationshipSequence from "@/components/relacionamento/RelationshipSequence";
import { CalendarIcon, KanbanSquare, MessageCircleIcon } from "lucide-react";

const Relacionamento = () => {
  const [activeTab, setActiveTab] = useState("regua");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Agenda de Relacionamento
        </h1>
        <p className="text-gray-600 mt-1">
          Gerencie seus contatos e acompanhamentos com alunos
        </p>
      </div>

      <Tabs
        defaultValue="regua"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-3 w-[500px]">
          <TabsTrigger value="calendario" className="flex items-center gap-2">
            <CalendarIcon size={16} />
            Calendário
          </TabsTrigger>
          <TabsTrigger value="kanban" className="flex items-center gap-2">
            <KanbanSquare size={16} />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="regua" className="flex items-center gap-2">
            <MessageCircleIcon size={16} />
            Modelos de Mensagens
          </TabsTrigger>
        </TabsList>
        <TabsContent value="calendario">
          <CalendarView />
        </TabsContent>
        <TabsContent value="kanban">
          <KanbanView />
        </TabsContent>
        <TabsContent value="regua">
          <RelationshipSequence />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Relacionamento;
