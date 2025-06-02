
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FormTabsProps {
  children: React.ReactNode;
  defaultTab: string;
  tabs: {
    value: string;
    label: string;
    content: React.ReactNode;
  }[];
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

const FormTabs = ({ defaultTab, tabs, children, activeTab, setActiveTab }: FormTabsProps) => {
  const handleValueChange = (value: string) => {
    if (setActiveTab) {
      setActiveTab(value);
    }
  };

  return (
    <Tabs 
      defaultValue={defaultTab} 
      value={activeTab} 
      onValueChange={handleValueChange}
      className="space-y-6"
    >
      <TabsList className="grid w-full grid-cols-2">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
        ))}
      </TabsList>
      
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="space-y-4 mt-4">
          {tab.content}
        </TabsContent>
      ))}

      {children}
    </Tabs>
  );
};

export default FormTabs;
