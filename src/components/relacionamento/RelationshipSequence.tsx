
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MessageList from "./MessageList";
import MessageScheduleTable from "./MessageScheduleTable";
import MilestoneConfig from "./MilestoneConfig";
import DataTransition from "@/components/common/DataTransition";
import { useRealMessageTemplates } from "@/hooks/useRealMessageTemplates";

const RelationshipSequence = () => {
  const [activeTab, setActiveTab] = useState("templates");
  const { templates, loading, error } = useRealMessageTemplates();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Régua de Relacionamento</h2>
        <p className="text-gray-600">
          Configure mensagens automáticas baseadas em marcos temporais
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Modelos de Mensagens</TabsTrigger>
          <TabsTrigger value="schedule">Programação</TabsTrigger>
          <TabsTrigger value="milestones">Marcos Temporais</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <DataTransition loading={loading} error={error}>
            <MessageList templates={templates} />
          </DataTransition>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <DataTransition loading={loading} error={error}>
            <MessageScheduleTable templates={templates} />
          </DataTransition>
        </TabsContent>

        <TabsContent value="milestones" className="space-y-4">
          <MilestoneConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RelationshipSequence;
