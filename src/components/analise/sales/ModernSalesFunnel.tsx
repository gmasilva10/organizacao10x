
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FunnelStage {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface ModernSalesFunnelProps {
  data: FunnelStage[];
  title?: string;
}

const ModernSalesFunnel = ({ data, title = "Funil de Conversão" }: ModernSalesFunnelProps) => {
  const maxValue = Math.max(...data.map(stage => stage.value));
  
  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-gray-800 text-center">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="relative space-y-3">
          {data.map((stage, index) => {
            const width = (stage.value / maxValue) * 100;
            const isLast = index === data.length - 1;
            
            return (
              <div key={stage.name} className="relative">
                {/* Stage Container */}
                <div className="relative">
                  {/* Funnel Shape */}
                  <div 
                    className="relative h-12 transition-all duration-500 hover:scale-105 cursor-pointer group"
                    style={{
                      width: `${width}%`,
                      background: `linear-gradient(135deg, ${stage.color}, ${stage.color}dd)`,
                      clipPath: isLast 
                        ? 'polygon(0 0, 100% 0, 90% 100%, 0% 100%)'
                        : 'polygon(0 0, 100% 0, 90% 100%, 0% 100%)',
                      boxShadow: `0 4px 16px ${stage.color}30`,
                    }}
                  >
                    {/* Stage Content */}
                    <div className="absolute inset-0 flex items-center justify-between px-4 text-white">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">{stage.name}</span>
                        <span className="text-xs opacity-90">{stage.value.toLocaleString()}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black">{stage.percentage}%</div>
                      </div>
                    </div>
                    
                    {/* Hover Effect Overlay */}
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  
                  {/* Connection Line to Next Stage */}
                  {!isLast && (
                    <div className="absolute top-12 left-0 w-full h-2 flex items-center">
                      <div 
                        className="h-0.5 bg-gradient-to-r from-gray-300 to-gray-400"
                        style={{ width: `${((data[index + 1].value / maxValue) * 100)}%` }}
                      />
                      <div className="ml-2 text-xs text-gray-500 font-medium">
                        -{((stage.value - data[index + 1].value) / stage.value * 100).toFixed(1)}%
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Stage Metrics - Compact version */}
                <div className="mt-4 mb-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600 font-medium">{stage.name}</span>
                    <div className="flex gap-3">
                      <span className="text-gray-800 font-bold">
                        {stage.value.toLocaleString()}
                      </span>
                      <span 
                        className="font-bold"
                        style={{ color: stage.color }}
                      >
                        {stage.percentage}%
                      </span>
                    </div>
                  </div>
                  
                  {/* Progress Bar - Smaller */}
                  <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-700 ease-out"
                      style={{ 
                        width: `${stage.percentage}%`,
                        background: `linear-gradient(90deg, ${stage.color}, ${stage.color}cc)`
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Summary Stats - Compact version */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {data[0]?.value?.toLocaleString() || 0}
              </div>
              <div className="text-xs text-gray-500">Total Inicial</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {data[data.length - 1]?.value?.toLocaleString() || 0}
              </div>
              <div className="text-xs text-gray-500">Conversões</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {data[data.length - 1]?.percentage || 0}%
              </div>
              <div className="text-xs text-gray-500">Taxa Final</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">
                {data.length}
              </div>
              <div className="text-xs text-gray-500">Etapas</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModernSalesFunnel;
