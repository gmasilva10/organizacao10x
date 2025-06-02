
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StepCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

const StepCard = ({ title, description, children, className }: StepCardProps) => {
  return (
    <Card className={cn("w-full mx-auto shadow-sm border bg-white", className)}>
      <CardHeader className="text-center pb-3">
        <CardTitle className="text-lg font-semibold text-gray-800">{title}</CardTitle>
        {description && (
          <p className="text-gray-600 text-xs mt-1">{description}</p>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {children}
      </CardContent>
    </Card>
  );
};

export default StepCard;
