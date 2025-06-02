
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ComposedChart,
  AreaChart,
  Area
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { clients, services, campaigns } from "@/services/mockData";
import { TrendingUp, Users, DollarSign, UserCheck, UserX, RotateCcw, Calendar } from "lucide-react";

const ClientsAnalysis = () => {
  const [selectedView, setSelectedView] = useState("overview");

  // Cálculo de LTV temporal baseado em permanência real
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
    
    return service.price * Math.min(monthsActive / service.duration, 2);
  };

  // Distribuição de Serviços com LTV temporal
  const serviceDistribution = services.map(service => {
    let count = 0;
    let totalLTV = 0;
    let totalRetentionDays = 0;
    
    const serviceClients = clients.filter(c => {
      switch(c.serviceType) {
        case "monthly": return service.name === "Plano Mensal";
        case "quarterly": return service.name === "Plano Trimestral";
        case "biannual": return service.name === "Plano Semestral";
        case "annual": return service.name === "Plano Anual";
        default: return false;
      }
    });
    
    count = serviceClients.length;
    totalLTV = serviceClients.reduce((sum, client) => sum + calculateClientLTV(client), 0);
    totalRetentionDays = serviceClients.reduce((sum, client) => {
      const start = new Date(client.startDate);
      const end = new Date(client.endDate);
      return sum + Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    }, 0);
    
    const percentage = (count / clients.length) * 100;
    const avgLTV = count > 0 ? totalLTV / count : 0;
    const avgRetention = count > 0 ? totalRetentionDays / count : 0;
    
    return {
      name: service.name.replace("Plano ", ""),
      clientes: count,
      ltvMedio: avgLTV,
      retencaoMedia: Math.round(avgRetention),
      percentual: parseFloat(percentage.toFixed(1)),
      receitaTotal: totalLTV
    };
  });

  // Performance de Campanhas com LTV
  const campaignPerformance = campaigns.map(campaign => {
    const campaignClients = clients.filter(c => c.campaignId === campaign.id);
    const totalLTV = campaignClients.reduce((sum, client) => sum + calculateClientLTV(client), 0);
    const avgLTV = campaignClients.length > 0 ? totalLTV / campaignClients.length : 0;
    
    return {
      nome: campaign.name,
      clientes: campaignClients.length,
      ltvMedio: avgLTV,
      ltvTotal: totalLTV,
      conversao: campaign.conversions || 0
    };
  }).filter(c => c.clientes > 0);

  // Status dos Alunos
  const clientStatus = [
    {
      status: "Ativos",
      quantidade: clients.filter(c => c.status === "active").length,
      cor: "#10B981"
    },
    {
      status: "Inativos", 
      quantidade: clients.filter(c => c.status === "inactive").length,
      cor: "#EF4444"
    }
  ];

  // Análise temporal de tipos de cliente
  const currentDate = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(currentDate.getMonth() - 1);
  
  const clientTypes = [
    {
      tipo: "Novos",
      quantidade: clients.filter(c => new Date(c.startDate) >= oneMonthAgo).length,
      percentual: 0
    },
    {
      tipo: "Renovação",
      quantidade: clients.filter(c => {
        const endDate = new Date(c.endDate);
        return endDate <= currentDate && c.status === "active";
      }).length,
      percentual: 0
    },
    {
      tipo: "Retorno",
      quantidade: Math.floor(clients.length * 0.12),
      percentual: 0
    },
    {
      tipo: "Cancelamento",
      quantidade: clients.filter(c => c.status === "inactive").length,
      percentual: 0
    }
  ];

  clientTypes.forEach(type => {
    type.percentual = parseFloat(((type.quantidade / clients.length) * 100).toFixed(1));
  });

  // Evolução temporal dos tipos de cliente
  const monthlyClientEvolution = [
    { mes: "Jan", novos: 8, renovacao: 5, cancelamento: 2, retorno: 1, ltvMedio: 850 },
    { mes: "Fev", novos: 12, renovacao: 7, cancelamento: 3, retorno: 2, ltvMedio: 920 },
    { mes: "Mar", novos: 15, renovacao: 8, cancelamento: 2, retorno: 3, ltvMedio: 1050 },
    { mes: "Abr", novos: 18, renovacao: 10, cancelamento: 4, retorno: 2, ltvMedio: 1150 },
    { mes: "Mai", novos: 22, renovacao: 12, cancelamento: 3, retorno: 4, ltvMedio: 1280 },
    { mes: "Jun", novos: 25, renovacao: 15, cancelamento: 5, retorno: 3, ltvMedio: 1340 }
  ];

  // Análise de LTV por faixas temporais
  const ltvTemporalRanges = [
    { faixa: "0-90 dias", clientes: 0, ltvMedio: 0, cor: "#EF4444" },
    { faixa: "91-180 dias", clientes: 0, ltvMedio: 0, cor: "#F59E0B" },
    { faixa: "181-365 dias", clientes: 0, ltvMedio: 0, cor: "#10B981" },
    { faixa: "365+ dias", clientes: 0, ltvMedio: 0, cor: "#8B5CF6" }
  ];

  clients.forEach(client => {
    const startDate = new Date(client.startDate);
    const endDate = new Date(client.endDate);
    const daysActive = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const ltv = calculateClientLTV(client);
    
    let rangeIndex = 0;
    if (daysActive <= 90) rangeIndex = 0;
    else if (daysActive <= 180) rangeIndex = 1;
    else if (daysActive <= 365) rangeIndex = 2;
    else rangeIndex = 3;
    
    ltvTemporalRanges[rangeIndex].clientes++;
    ltvTemporalRanges[rangeIndex].ltvMedio += ltv;
  });

  ltvTemporalRanges.forEach(range => {
    if (range.clientes > 0) {
      range.ltvMedio = range.ltvMedio / range.clientes;
    }
  });

  // Métricas principais
  const totalLTV = serviceDistribution.reduce((sum, service) => sum + service.receitaTotal, 0);
  const averageLTV = totalLTV / clients.length;
  const retentionRate = ((clients.filter(c => c.status === "active").length / clients.length) * 100);
  const churnRate = ((clients.filter(c => c.status === "inactive").length / clients.length) * 100);
  const avgRetentionDays = Math.round(serviceDistribution.reduce((sum, service) => sum + service.retencaoMedia, 0) / serviceDistribution.length);

  const chartConfig = {
    clientes: { label: "Clientes", color: "#3B82F6" },
    ltv: { label: "LTV", color: "#10B981" },
    retencao: { label: "Retenção", color: "#8B5CF6" }
  };

  return (
    <div className="space-y-6">
      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LTV Médio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averageLTV.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Baseado em permanência temporal
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Retenção</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {retentionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Clientes ativos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permanência Média</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgRetentionDays} dias
            </div>
            <p className="text-xs text-muted-foreground">
              Tempo médio de permanência
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clientTypes[0].quantidade}
            </div>
            <p className="text-xs text-muted-foreground">
              Último mês
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
          Serviços
        </Button>
        <Button 
          variant={selectedView === "campaigns" ? "default" : "outline"}
          onClick={() => setSelectedView("campaigns")}
          size="sm"
        >
          Campanhas
        </Button>
        <Button 
          variant={selectedView === "temporal" ? "default" : "outline"}
          onClick={() => setSelectedView("temporal")}
          size="sm"
        >
          Análise Temporal
        </Button>
        <Button 
          variant={selectedView === "ltv-temporal" ? "default" : "outline"}
          onClick={() => setSelectedView("ltv-temporal")}
          size="sm"
        >
          LTV Temporal
        </Button>
      </div>
      
      {/* Gráficos por Visualização */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {selectedView === "overview" && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Serviços</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={serviceDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="clientes" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Status dos Alunos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={clientStatus}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="quantidade"
                        label={({ status, quantidade }) => `${status}: ${quantidade}`}
                      >
                        {clientStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.cor} />
                        ))}
                      </Pie>
                      <Tooltip />
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
                    <BarChart data={serviceDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => 
                        new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          minimumFractionDigits: 0
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
                    <BarChart data={serviceDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
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
                    <BarChart data={campaignPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nome" />
                      <YAxis tickFormatter={(value) => 
                        new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          minimumFractionDigits: 0
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
                <CardTitle>Clientes por Campanha</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={campaignPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nome" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="clientes" fill="#F59E0B" radius={[4, 4, 0, 0]} />
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
                <CardTitle>Evolução dos Tipos de Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyClientEvolution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line type="monotone" dataKey="novos" stroke="#10B981" strokeWidth={2} name="Novos" />
                      <Line type="monotone" dataKey="renovacao" stroke="#3B82F6" strokeWidth={2} name="Renovação" />
                      <Line type="monotone" dataKey="cancelamento" stroke="#EF4444" strokeWidth={2} name="Cancelamento" />
                      <Line type="monotone" dataKey="retorno" stroke="#8B5CF6" strokeWidth={2} name="Retorno" />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Correlação: Novos Clientes vs LTV Médio</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthlyClientEvolution}>
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
                      <Bar yAxisId="left" dataKey="novos" fill="#3B82F6" name="Novos Clientes" radius={[4, 4, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="ltvMedio" stroke="#10B981" strokeWidth={3} name="LTV Médio" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </>
        )}

        {selectedView === "ltv-temporal" && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>LTV por Faixas de Permanência</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ltvTemporalRanges}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="faixa" />
                      <YAxis tickFormatter={(value) => 
                        new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          minimumFractionDigits: 0
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
                <CardTitle>Distribuição de Clientes por Permanência</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ltvTemporalRanges}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="clientes"
                        label={({ faixa, clientes }) => `${faixa}: ${clientes}`}
                      >
                        {ltvTemporalRanges.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.cor} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Resumo Estratégico */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Executivo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Melhor LTV por Serviço</h4>
              <p className="text-blue-700">
                {serviceDistribution.reduce((prev, current) => 
                  prev.ltvMedio > current.ltvMedio ? prev : current
                ).name}
              </p>
              <p className="text-sm text-blue-600">
                LTV: {serviceDistribution.reduce((prev, current) => 
                  prev.ltvMedio > current.ltvMedio ? prev : current
                ).ltvMedio.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Taxa de Retenção</h4>
              <p className="text-green-700">
                {retentionRate.toFixed(1)}%
              </p>
              <p className="text-sm text-green-600">
                {avgRetentionDays} dias de permanência média
              </p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-2">Melhor Campanha (LTV)</h4>
              <p className="text-purple-700">
                {campaignPerformance.length > 0 ? 
                  campaignPerformance.reduce((prev, current) => 
                    prev.ltvMedio > current.ltvMedio ? prev : current
                  ).nome : "N/A"
                }
              </p>
              <p className="text-sm text-purple-600">
                {campaignPerformance.length > 0 ? 
                  campaignPerformance.reduce((prev, current) => 
                    prev.ltvMedio > current.ltvMedio ? prev : current
                  ).ltvMedio.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }) : "N/A"
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientsAnalysis;
