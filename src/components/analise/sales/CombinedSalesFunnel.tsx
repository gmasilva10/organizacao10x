import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingDown, Users, Target, Eye, EyeOff } from "lucide-react";

interface FunnelStage {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface CombinedSalesFunnelProps {
  data: FunnelStage[];
  title?: string;
}

const CombinedSalesFunnel = ({ data, title = "Funil de Conversão Completo" }: CombinedSalesFunnelProps) => {
  const [showLossData, setShowLossData] = useState(false);
  const maxValue = Math.max(...data.map(stage => stage.value));
  
  // Calculate drop rate between stages
  const getDropRate = (currentIndex: number) => {
    if (currentIndex === 0) return 0;
    const previous = data[currentIndex - 1];
    const current = data[currentIndex];
    const dropRate = ((previous.value - current.value) / previous.value) * 100;
    return parseFloat(dropRate.toFixed(2));
  };

  // Get loss label for each stage transition
  const getLossLabel = (currentIndex: number) => {
    const stageLabels = [
      "Leads Iniciais",
      "B1", 
      "B2",
      "B3",
      "Venda"
    ];
    
    if (currentIndex === 0) return "";
    return `${stageLabels[currentIndex - 1]} → ${stageLabels[currentIndex]}`;
  };

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Target className="h-6 w-6" />
            {title}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLossData(!showLossData)}
            className="flex items-center gap-2"
          >
            {showLossData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showLossData ? "Ocultar Perdas" : "Mostrar Perdas"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="space-y-6">
          {data.map((stage, index) => {
            const width = (stage.value / maxValue) * 100;
            const dropRate = getDropRate(index);
            const isFirst = index === 0;
            const lossLabel = getLossLabel(index);
            
            return (
              <div key={stage.name} className="relative">
                {/* Stage Container */}
                <div className="relative">
                  {/* Main Funnel Bar */}
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-20 text-sm font-medium text-gray-700">
                      {stage.name}
                    </div>
                    
                    <div className="flex-1 relative">
                      <div 
                        className="h-12 transition-all duration-700 hover:scale-105 cursor-pointer group relative rounded-lg shadow-md"
                        style={{
                          width: `${width}%`,
                          background: `linear-gradient(135deg, ${stage.color}, ${stage.color}dd)`,
                          minWidth: '120px'
                        }}
                      >
                        {/* Stage Content */}
                        <div className="absolute inset-0 flex items-center justify-between px-4 text-white">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span className="font-bold">{stage.value.toLocaleString()}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold">{stage.percentage.toFixed(2)}%</div>
                          </div>
                        </div>
                        
                        {/* Hover Effect */}
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                      </div>
                    </div>

                    {/* Stage Metrics */}
                    <div className="w-32 text-right">
                      <div className="text-lg font-bold text-gray-800">
                        {stage.value.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {stage.percentage.toFixed(2)}% do total
                      </div>
                    </div>
                  </div>

                  {/* Loss Analysis - Show from Block 1 onwards and when toggle is enabled */}
                  {!isFirst && showLossData && (
                    <div className="ml-24 mb-4 relative">
                      <div className="flex items-center gap-4 py-2 px-4 bg-red-50 rounded-lg border-l-4 border-red-300">
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingDown className="h-4 w-4 text-red-600" />
                          <span className="font-medium text-gray-600">Perda {lossLabel}:</span>
                          <span className="font-bold text-red-600">
                            {(data[index - 1].value - data[index].value).toLocaleString()} leads ({dropRate.toFixed(2)}%)
                          </span>
                        </div>

                        <div className="flex-1">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-red-500 transition-all duration-700"
                              style={{ 
                                width: `${dropRate}%`
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Connection Line */}
                      <div className="absolute left-1/2 -bottom-2 w-px h-4 bg-gray-300"></div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Summary Statistics */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {data[0]?.value?.toLocaleString() || 0}
              </div>
              <div className="text-sm text-blue-700 font-medium">Leads Iniciais</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {data[data.length - 1]?.value?.toLocaleString() || 0}
              </div>
              <div className="text-sm text-green-700 font-medium">Vendas Finais</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {data[data.length - 1]?.percentage?.toFixed(2) || 0}%
              </div>
              <div className="text-sm text-purple-700 font-medium">Taxa Global</div>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {((data[0]?.value - data[data.length - 1]?.value) || 0).toLocaleString()}
              </div>
              <div className="text-sm text-red-700 font-medium">Leads Perdidos</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CombinedSalesFunnel;
