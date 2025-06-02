
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { clients, services, campaigns } from "@/services/mockData";
import { TrendingUp, DollarSign, Target, Users, Calendar } from "lucide-react";

const FinancialAnalysis = () => {
  const [selectedView, setSelectedView] = useState("overview");

  // Cálculo de LTV baseado em tempo real de permanência
  const calculateClientLTV = (client: any) => {
    const service = services.find(s => {
      switch(client.serviceType) {
        case "monthly": return s.name === "Plano Mensal";
        case "quarterly": return s.name === "Plano Trimestral";
        case "biannual": return s.name === "Plano Semestral";
        case "annual": return s.name === "Plano Anual";
        default: return false;
      }
    });
    
    if (!service) return 0;
    
    const startDate = new Date(client.startDate);
    const endDate = new Date(client.endDate);
    const daysActive = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const monthsActive = daysActive / 30;
    
    // LTV = valor do serviço * (tempo ativo / duração do plano)
    const ltvMultiplier = Math.min(monthsActive / service.duration, 2); // Cap em 2x para renovações
    return service.price * ltvMultiplier;
  };

  // Análise de LTV por Serviço com perspectiva temporal
  const ltvByService = services.map(service => {
    const serviceClients = clients.filter(c => {
      switch(c.serviceType) {
        case "monthly": return service.name === "Plano Mensal";
        case "quarterly": return service.name === "Plano Trimestral";
        case "biannual": return service.name === "Plano Semestral";
        case "annual": return service.name === "Plano Anual";
        default: return false;
      }
    });
    
    const totalLTV = serviceClients.reduce((sum, client) => sum + calculateClientLTV(client), 0);
    const avgLTV = serviceClients.length > 0 ? totalLTV / serviceClients.length : 0;
    const avgRetentionDays = serviceClients.length > 0 ? 
      serviceClients.reduce((sum, client) => {
        const start = new Date(client.startDate);
        const end = new Date(client.endDate);
        return sum + Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      }, 0) / serviceClients.length : 0;
    
    return {
      nome: service.name.replace("Plano ", ""),
      ltvMedio: avgLTV,
      retencaoMedia: Math.round(avgRetentionDays),
      clientes: serviceClients.length,
      receitaTotal: totalLTV
    };
  });

  // Análise temporal de LTV por mês
  const monthlyLTVEvolution = [
    { mes: "Jan", ltvMedio: 850, clientesNovos: 8, ltvTotal: 6800 },
    { mes: "Fev", ltvMedio: 920, clientesNovos: 12, ltvTotal: 11040 },
    { mes: "Mar", ltvMedio: 1050, clientesNovos: 15, ltvTotal: 15750 },
    { mes: "Abr", ltvMedio: 1150, clientesNovos: 18, ltvTotal: 20700 },
    { mes: "Mai", ltvMedio: 1280, clientesNovos: 22, ltvTotal: 28160 },
    { mes: "Jun", ltvMedio: 1340, clientesNovos: 25, ltvTotal: 33500 }
  ];

  // LTV por Campanhas
  const ltvByCampaign = campaigns.map(campaign => {
    const campaignClients = clients.filter(c => c.campaignId === campaign.id);
    const totalLTV = campaignClients.reduce((sum, client) => sum + calculateClientLTV(client), 0);
    const avgLTV = campaignClients.length > 0 ? totalLTV / campaignClients.length : 0;
    
    return {
      nome: campaign.name,
      ltvMedio: avgLTV,
      clientes: campaignClients.length,
      ltvTotal: totalLTV
    };
  }).filter(c => c.clientes > 0);

  // Análise de Cohorts de LTV (por período de entrada)
  const ltvCohorts = [
    { periodo: "Q1 2024", ltvMedio: 890, retencao90dias: 85, clientesCohort: 45 },
    { periodo: "Q2 2024", ltvMedio: 1150, retencao90dias: 78, clientesCohort: 52 },
    { periodo: "Q3 2024", ltvMedio: 1280, retencao90dias: 82, clientesCohort: 48 },
    { periodo: "Q4 2024", ltvMedio: 1340, retencao90dias: 88, clientesCohort: 38 }
  ];

  // Análise Sazonal de Comportamento Financeiro
  const seasonalAnalysis = [
    { periodo: "Jan-Mar", ltvMedio: 980, novosPeriodo: 35, receita: 34300 },
    { periodo: "Abr-Jun", ltvMedio: 1190, novosPeriodo: 65, receita: 77350 },
    { periodo: "Jul-Set", ltvMedio: 1050, novosPeriodo: 42, receita: 44100 },
    { periodo: "Out-Dez", ltvMedio: 1280, novosPeriodo: 48, receita: 61440 }
  ];

  // Distribuição de Receita por Faixa de LTV Temporal
  const ltvDistribution = [
    { faixa: "0-30 dias", receita: 25000, clientes: 18, ltvMedio: 1389 },
    { faixa: "31-90 dias", receita: 45000, clientes: 32, ltvMedio: 1406 },
    { faixa: "91-180 dias", receita: 38000, clientes: 25, ltvMedio: 1520 },
    { faixa: "180+ dias", receita: 28000, clientes: 15, ltvMedio: 1867 }
  ];

  // Métricas principais
  const totalRevenue = ltvByService.reduce((sum, service) => sum + service.receitaTotal, 0);
  const averageLTV = ltvByService.reduce((sum, service) => sum + service.ltvMedio, 0) / ltvByService.length;
  const currentMonthGrowth = monthlyLTVEvolution[monthlyLTVEvolution.length - 1]?.ltvMedio || 0;
  const previousMonthLTV = monthlyLTVEvolution[monthlyLTVEvolution.length - 2]?.ltvMedio || 0;
  const ltvGrowthRate = previousMonthLTV > 0 ? ((currentMonthGrowth - previousMonthLTV) / previousMonthLTV * 100) : 0;

  const chartConfig = {
    ltv: { label: "LTV", color: "#10B981" },
    receita: { label: "Receita", color: "#3B82F6" },
    retencao: { label: "Retenção", color: "#8B5CF6" }
  };

  return (
    <div className="space-y-6">
      {/* KPIs Financeiros Temporais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LTV Médio Atual</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averageLTV.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0,
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              +{ltvGrowthRate.toFixed(1)}% vs mês anterior
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total LTV</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalRevenue.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0,
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor acumulado temporal
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retenção Média</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(ltvByService.reduce((sum, service) => sum + service.retencaoMedia, 0) / ltvByService.length)} dias
            </div>
            <p className="text-xs text-muted-foreground">
              Tempo médio de permanência
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crescimento LTV</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{ltvGrowthRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Evolução mensal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Seleção de Visualização */}
      <div className="flex gap-2 flex-wrap">
        <Button 
          variant={selectedView === "overview" ? "default" : "outline"}
          onClick={() => setSelectedView("overview")}
          size="sm"
        >
          Visão Geral
        </Button>
        <Button 
          variant={selectedView === "services" ? "default" : "outline"}
          onClick={() => setSelectedView("services")}
          size="sm"
        >
          LTV por Serviço
        </Button>
        <Button 
          variant={selectedView === "campaigns" ? "default" : "outline"}
          onClick={() => setSelectedView("campaigns")}
          size="sm"
        >
          LTV por Campanha
        </Button>
        <Button 
          variant={selectedView === "temporal" ? "default" : "outline"}
          onClick={() => setSelectedView("temporal")}
          size="sm"
        >
          Evolução Temporal
        </Button>
        <Button 
          variant={selectedView === "cohorts" ? "default" : "outline"}
          onClick={() => setSelectedView("cohorts")}
          size="sm"
        >
          Análise de Cohorts
        </Button>
        <Button 
          variant={selectedView === "seasonal" ? "default" : "outline"}
          onClick={() => setSelectedView("seasonal")}
          size="sm"
        >
          Análise Sazonal
        </Button>
      </div>
      
      {/* Gráficos por Visualização */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {selectedView === "overview" && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Evolução do LTV Médio</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyLTVEvolution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis tickFormatter={(value) => 
                        new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          minimumFractionDigits: 0,
                        }).format(value)
                      } />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="ltvMedio" stroke="#10B981" strokeWidth={3} name="LTV Médio" />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Receita por Tempo de Vida</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ltvDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="receita"
                        label={({ faixa, receita }) => `${faixa}: ${new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          minimumFractionDigits: 0,
                        }).format(receita)}`}
                      >
                        {ltvDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 90 + 120}, 70%, 50%)`} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => 
                        [new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          minimumFractionDigits: 0,
                        }).format(value as number), "Receita"]
                      } />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {selectedView === "services" && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>LTV Médio por Serviço</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ltvByService}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nome" />
                      <YAxis tickFormatter={(value) => 
                        new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          minimumFractionDigits: 0,
                        }).format(value)
                      } />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="ltvMedio" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Retenção Média por Serviço (dias)</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ltvByService}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nome" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="retencaoMedia" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </>
        )}

        {selectedView === "campaigns" && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>LTV Médio por Campanha</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ltvByCampaign}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nome" />
                      <YAxis tickFormatter={(value) => 
                        new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          minimumFractionDigits: 0,
                        }).format(value)
                      } />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="ltvMedio" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Receita Total por Campanha</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ltvByCampaign}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nome" />
                      <YAxis tickFormatter={(value) => 
                        new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          minimumFractionDigits: 0,
                        }).format(value)
                      } />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="ltvTotal" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </>
        )}

        {selectedView === "temporal" && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Evolução do LTV vs Novos Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthlyLTVEvolution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => 
                        new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          minimumFractionDigits: 0,
                        }).format(value)
                      } />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="clientesNovos" fill="#3B82F6" name="Novos Clientes" radius={[4, 4, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="ltvMedio" stroke="#10B981" strokeWidth={3} name="LTV Médio" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Receita Total LTV por Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyLTVEvolution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis tickFormatter={(value) => 
                        new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          minimumFractionDigits: 0,
                        }).format(value)
                      } />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area type="monotone" dataKey="ltvTotal" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </>
        )}

        {selectedView === "cohorts" && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>LTV por Cohort de Entrada</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ltvCohorts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="periodo" />
                      <YAxis tickFormatter={(value) => 
                        new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          minimumFractionDigits: 0,
                        }).format(value)
                      } />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="ltvMedio" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Retenção 90 dias por Cohort</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ltvCohorts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="periodo" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="retencao90dias" stroke="#10B981" strokeWidth={3} name="Retenção 90d %" />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </>
        )}

        {selectedView === "seasonal" && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Análise Sazonal - LTV Médio</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={seasonalAnalysis}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="periodo" />
                      <YAxis tickFormatter={(value) => 
                        new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          minimumFractionDigits: 0,
                        }).format(value)
                      } />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="ltvMedio" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sazonalidade - Novos Clientes vs Receita</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={seasonalAnalysis}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="periodo" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => 
                        new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          minimumFractionDigits: 0,
                        }).format(value)
                      } />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="novosPeriodo" fill="#3B82F6" name="Novos Clientes" radius={[4, 4, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="receita" stroke="#10B981" strokeWidth={3} name="Receita" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Insights Estratégicos */}
      <Card>
        <CardHeader>
          <CardTitle>Insights Temporais e Estratégicos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Melhor Performance LTV</h4>
              <p className="text-green-700">
                {ltvByService.reduce((prev, current) => 
                  prev.ltvMedio > current.ltvMedio ? prev : current
                ).nome}
              </p>
              <p className="text-sm text-green-600">
                LTV: {ltvByService.reduce((prev, current) => 
                  prev.ltvMedio > current.ltvMedio ? prev : current
                ).ltvMedio.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Crescimento LTV</h4>
              <p className="text-blue-700">+{ltvGrowthRate.toFixed(1)}% ao mês</p>
              <p className="text-sm text-blue-600">
                Projeção 6 meses: {(currentMonthGrowth * Math.pow(1 + ltvGrowthRate/100, 6)).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-2">Maior Oportunidade</h4>
              <p className="text-purple-700">
                {ltvByCampaign.length > 0 ? 
                  ltvByCampaign.reduce((prev, current) => 
                    prev.ltvMedio > current.ltvMedio ? prev : current
                  ).nome : "N/A"
                }
              </p>
              <p className="text-sm text-purple-600">
                Potencial de escala identificado
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialAnalysis;
