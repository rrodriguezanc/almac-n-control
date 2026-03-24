import { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Cell 
} from 'recharts';
import { isToday, isAfter, subDays } from 'date-fns';
import type { Movement } from '../hooks/useInventory';

interface TopConsumedProductsChartProps {
  movements: Movement[];
}

export function TopConsumedProductsChart({ movements }: TopConsumedProductsChartProps) {
  const [period, setPeriod] = useState<"today" | "week" | "month">("month");
  const [warehouse, setWarehouse] = useState<"all" | "instrumentacion" | "electrico">("all");

  const chartData = useMemo(() => {
    // 1. Filtrar movimientos
    const filtered = movements.filter(m => {
      // Solo salidas
      if (m.type !== 'salida') return false;
      
      // Filtrar por almacén
      if (warehouse !== 'all' && m.warehouse !== warehouse) return false;
      
      // Filtrar por período
      const moveDate = new Date(m.date);
      if (period === 'today' && !isToday(moveDate)) return false;
      if (period === 'week' && !isAfter(moveDate, subDays(new Date(), 7))) return false;
      if (period === 'month' && !isAfter(moveDate, subDays(new Date(), 30))) return false;

      return true;
    });

    // 2. Agrupar por producto y sumar cantidades
    const grouped = filtered.reduce((acc, curr) => {
      // Quitamos la terminación "(Inst)" o "(Elec)" para agrupar mejor si se requiere, 
      // pero productName ya lo trae. Podemos usar productName tal cual.
      const name = curr.productName || "Desconocido";
      acc[name] = (acc[name] || 0) + curr.quantity;
      return acc;
    }, {} as Record<string, number>);

    // 3. Ordenar y limitar al top 10
    return Object.entries(grouped)
      .map(([name, total]) => ({ 
        name: name.length > 25 ? name.substring(0, 25) + '...' : name, 
        fullName: name,
        total 
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [movements, period, warehouse]);

  return (
    <div className="bg-card rounded-xl border border-muted p-5 shadow-sm h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold">Top Productos Consumidos</h2>
          <p className="text-sm text-muted-foreground">Más solicitados en salidas</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Selector de Período */}
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setPeriod("today")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${period === "today" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              Hoy
            </button>
            <button
              onClick={() => setPeriod("week")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${period === "week" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              7 Días
            </button>
            <button
              onClick={() => setPeriod("month")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${period === "month" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              30 Días
            </button>
          </div>

          {/* Selector de Almacén */}
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setWarehouse("all")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${warehouse === "all" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              Todos
            </button>
            <button
              onClick={() => setWarehouse("instrumentacion")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${warehouse === "instrumentacion" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              Inst.
            </button>
            <button
              onClick={() => setWarehouse("electrico")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${warehouse === "electrico" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              Eléc.
            </button>
          </div>
        </div>
      </div>

      <div className="w-full h-[350px]">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#6b7280' }} 
                width={140}
              />
              <RechartsTooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: '#f3f4f6' }}
                formatter={(value: number) => [<span className="font-bold text-primary">{value} uds</span>, 'Consumido']}
                labelFormatter={(label) => {
                  const item = chartData.find(d => d.name === label);
                  return <span className="font-black text-xs">{item ? item.fullName : label}</span>;
                }}
              />
              <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={24}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index < 3 ? '#3b82f6' : '#93c5fd'} /> // Top 3 más oscuros
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <p className="font-medium text-sm">No hay salidas registradas</p>
            <p className="text-xs">Para los filtros seleccionados</p>
          </div>
        )}
      </div>
    </div>
  );
}
