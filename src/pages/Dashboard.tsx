
import React from "react";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import MetricCard from "@/components/dashboard/MetricCard";
import TasksChart from "@/components/dashboard/TasksChart";
import TasksList from "@/components/dashboard/TasksList";
import NotificationsList from "@/components/dashboard/NotificationsList";
import DataTransition from "@/components/common/DataTransition";
import { Users, DollarSign, UserPlus, RotateCcw, UserX } from "lucide-react";

const Dashboard = () => {
  const { metrics, loading, error } = useDashboardMetrics();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Dashboard
        </h1>
        <p className="text-gray-600 mt-1">
          Visão geral do seu negócio
        </p>
      </div>

      <DataTransition loading={loading} error={error}>
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <MetricCard
              title="Alunos Ativos"
              value={metrics.activeClients.count}
              changePercentage={metrics.activeClients.changePercentage}
              icon={<Users size={20} />}
            />
            <MetricCard
              title="Faturamento Mensal"
              value={metrics.monthlyRevenue.amount}
              changePercentage={metrics.monthlyRevenue.changePercentage}
              icon={<DollarSign size={20} />}
              format="currency"
            />
            <MetricCard
              title="Novos Leads"
              value={metrics.newLeads.count}
              changePercentage={metrics.newLeads.changePercentage}
              icon={<UserPlus size={20} />}
            />
            <MetricCard
              title="Renovações"
              value={metrics.renewals.count}
              changePercentage={metrics.renewals.changePercentage}
              icon={<RotateCcw size={20} />}
            />
            <MetricCard
              title="Cancelamentos"
              value={metrics.cancellations.count}
              changePercentage={metrics.cancellations.changePercentage}
              icon={<UserX size={20} />}
            />
          </div>
        )}
      </DataTransition>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <TasksChart filter="weekly" />
          <TasksList />
        </div>
        <div>
          <NotificationsList />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
