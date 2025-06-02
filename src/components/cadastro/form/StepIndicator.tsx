
import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  steps: Array<{
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
  currentStep: string;
  completedSteps: string[];
}

const StepIndicator = ({ steps, currentStep, completedSteps }: StepIndicatorProps) => {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(step.id);
        const isCurrent = currentStep === step.id;
        const isClickable = index === 0 || completedSteps.includes(steps[index - 1]?.id);

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-200",
                  {
                    "bg-primary border-primary text-primary-foreground": isCurrent,
                    "bg-green-500 border-green-500 text-white": isCompleted,
                    "bg-gray-100 border-gray-300 text-gray-400": !isCurrent && !isCompleted && !isClickable,
                    "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300": !isCurrent && !isCompleted && isClickable,
                  }
                )}
              >
                {isCompleted ? (
                  <Check className="h-6 w-6" />
                ) : (
                  <step.icon className="h-6 w-6" />
                )}
              </div>
              <span 
                className={cn(
                  "text-sm font-medium mt-2 text-center",
                  {
                    "text-primary": isCurrent,
                    "text-green-600": isCompleted,
                    "text-gray-400": !isCurrent && !isCompleted && !isClickable,
                    "text-gray-600": !isCurrent && !isCompleted && isClickable,
                  }
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div 
                className={cn(
                  "flex-1 h-0.5 mx-4 transition-all duration-200",
                  {
                    "bg-green-500": completedSteps.includes(step.id),
                    "bg-primary": isCurrent,
                    "bg-gray-200": !completedSteps.includes(step.id) && !isCurrent,
                  }
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default StepIndicator;
