
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface InfoCardProps {
  title: string;
  content: string;
  icon: React.ReactNode;
}

const InfoCard = ({ title, content, icon }: InfoCardProps) => {
  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <div className="bg-yellow-100 text-yellow-800 rounded-full p-1">
            {icon}
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {content}
        </p>
      </CardContent>
    </Card>
  );
};

export default InfoCard;
