import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Check, Clock, Calendar } from "lucide-react";
import { Select } from "@/components/ui/select";

// Sample data for the chart organized by period
const chartData = {
  daily: [],
  weekly: [],
  monthly: []
};

interface TasksChartProps {
  filter: "daily" | "weekly" | "monthly";
}

const TasksChart = ({ filter }: TasksChartProps) => {
  const [periodFilter, setPeriodFilter] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [data, setData] = useState(chartData.weekly);
  
  useEffect(() => {
    setData(chartData[periodFilter]);
  }, [periodFilter]);
  
  const completedTasks = data.reduce((sum, item) => sum + item.completed, 0);
  const pendingTasks = data.reduce((sum, item) => sum + item.pending, 0);
  const productivity = completedTasks + pendingTasks > 0 
    ? Math.round((completedTasks / (completedTasks + pendingTasks)) * 100) 
    : 0;

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium text-gray-800 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Produtividade do Relacionamento
          </h3>
          <p className="text-sm text-gray-500">Visão analítica dos acompanhamentos e ações realizadas</p>
        </div>
        <div className="w-32">
          <select 
            className="w-full text-sm border border-gray-200 rounded-md px-2 py-1"
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value as "daily" | "weekly" | "monthly")}
          >
            <option value="daily">Diário</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensal</option>
          </select>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="p-3 bg-green-50 rounded-lg flex-1 flex items-center gap-3">
          <div className="bg-green-100 rounded-full p-1.5">
            <Check size={18} className="text-green-600" />
          </div>
          <div>
            <div className="text-sm text-gray-500">Concluídas</div>
            <div className="font-bold text-xl">{completedTasks}</div>
          </div>
        </div>
        <div className="p-3 bg-yellow-50 rounded-lg flex-1 flex items-center gap-3">
          <div className="bg-yellow-100 rounded-full p-1.5">
            <Clock size={18} className="text-yellow-600" />
          </div>
          <div>
            <div className="text-sm text-gray-500">Pendentes</div>
            <div className="font-bold text-xl">{pendingTasks}</div>
          </div>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg flex-1 flex items-center gap-3">
          <div className="bg-blue-100 rounded-full p-1.5">
            <Calendar size={18} className="text-blue-600" />
          </div>
          <div>
            <div className="text-sm text-gray-500">Produtividade</div>
            <div className="font-bold text-xl">{productivity}%</div>
          </div>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22C55E" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EAB308" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#EAB308" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip />
            <Area
              type="monotone" 
              dataKey="completed" 
              stroke="#22C55E" 
              fillOpacity={1}
              fill="url(#colorCompleted)" 
              name="Concluídas"
            />
            <Area
              type="monotone" 
              dataKey="pending" 
              stroke="#EAB308" 
              fillOpacity={1}
              fill="url(#colorPending)"
              name="Pendentes" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TasksChart;
