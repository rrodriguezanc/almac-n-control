import { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LabelList 
} from 'recharts';
import { isToday, isAfter, subDays, addDays } from 'date-fns';
import type { Movement } from '../hooks/useInventory';

interface TopConsumedProductsChartProps {
  movements: Movement[];
}

export function TopConsumedProductsChart({ movements }: TopConsumedProductsChartProps) {
  const [period, setPeriod] = useState<"today" | "week" | "month">("month");
  const [warehouse, setWarehouse] = useState<"all" | "instrumentacion" | "electrico">("all");

  const chartData = useMemo(() => {
    const now = new Date();
    // Determinar duraciones
    let durationDays = 30;
    if (period === 'today') durationDays = 1;
    if (period === 'week') durationDays = 7;

    const grouped = movements.reduce((acc, curr) => {
      // Solo salidas
      if (curr.type !== 'salida') return acc;
      // Filtrar por almacén
      if (warehouse !== 'all' && curr.warehouse !== warehouse) return acc;
      
      const moveDate = new Date(curr.date);
      const name = curr.productName || "Desconocido";
      const stock = curr.currentStock || 0;
      
      let isCurrent = false;
      let isPrevious = false;
      
      if (period === 'today') {
        isCurrent = isToday(moveDate);
        isPrevious = isToday(addDays(moveDate, 1)); // ayer
      } else if (period === 'week') {
        isCurrent = isAfter(moveDate, subDays(now, 7));
        isPrevious = !isCurrent && isAfter(moveDate, subDays(now, 14));
      } else if (period === 'month') {
        isCurrent = isAfter(moveDate, subDays(now, 30));
        isPrevious = !isCurrent && isAfter(moveDate, subDays(now, 60));
      }

      if (isCurrent || isPrevious) {
        if (!acc[name]) {
          acc[name] = { fullName: name, current: 0, previous: 0, stock, durationDays, activeDates: new Set() };
        }
        if (isCurrent) {
          acc[name].current += curr.quantity;
          acc[name].activeDates.add(moveDate.toISOString().split('T')[0]);
        }
        if (isPrevious) {
          acc[name].previous += curr.quantity;
        }
      }
      return acc;
    }, {} as Record<string, { fullName: string, current: number, previous: number, stock: number, durationDays: number, activeDates: Set<string> }>);

    return Object.values(grouped)
      .map((data) => {
        let trend = 0;
        if (data.previous === 0) {
          trend = data.current > 0 ? 100 : 0;
        } else {
          trend = ((data.current - data.previous) / data.previous) * 100;
        }
        
        // El usuario solicitó que tome las "unidades totales". 
        // Si calculamos el promedio basándonos en los días que REALMENTE hubo consumo:
        const activeDaysCount = Math.max(1, data.activeDates.size);
        const averageDaily = data.current / activeDaysCount;
        
        let daysToDeplete = 0;
        let depleteLabel = "∞";
        
        if (data.stock <= 0) {
           depleteLabel = "Agotado";
        } else if (averageDaily > 0) {
           daysToDeplete = Math.round(data.stock / averageDaily);
           depleteLabel = `${daysToDeplete} días`;
        }
        
        return { 
          name: data.fullName.length > 25 ? data.fullName.substring(0, 25) + '...' : data.fullName, 
          fullName: data.fullName,
          total: data.current,
          trend: Math.round(trend),
          depleteLabel,
          stock: data.stock,
          averageDaily: Math.round(averageDaily * 10) / 10,
          activeDaysCount
        };
      })
      .filter(d => d.total > 0) // Sólo mostrar si hubo consumo recientemente
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [movements, period, warehouse]);

  const CustomBarLabel = (props: any) => {
    const { x, y, width, height, index } = props;
    const item = chartData[index];
    if (!item) return null;

    const color = item.trend > 0 ? '#10b981' : item.trend < 0 ? '#ef4444' : '#9ca3af';
    const arrow = item.trend > 0 ? '▲' : item.trend < 0 ? '▼' : '—';
    const trendText = item.trend !== 0 ? `${arrow} ${Math.abs(item.trend)}%` : '—';

    return (
      <text x={x + width + 5} y={y + height / 2} dy={4} textAnchor="start" fontSize={11} fontWeight="bold">
        <tspan fill={color}>{trendText}</tspan>
        {item.depleteLabel !== "∞" && (
          <tspan fill="#9ca3af"> • {item.depleteLabel}</tspan>
        )}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isPositive = data.trend > 0;
      const isNegative = data.trend < 0;
      const colorClass = isPositive ? 'text-emerald-500' : isNegative ? 'text-rose-500' : 'text-gray-400';
      const arrow = isPositive ? '▲' : isNegative ? '▼' : '—';
      const trendText = data.trend !== 0 ? `${arrow} ${Math.abs(data.trend)}% vs anterior` : '— sin cambio vs anterior';

      return (
        <div className="bg-white p-3 border rounded-xl shadow-lg border-muted z-50">
          <p className="font-bold text-xs mb-2 max-w-[200px] break-words">{data.fullName}</p>
          <div className="space-y-1">
            <p className="text-sm font-black text-primary flex items-center gap-2">
              Total Consumido: {data.total} uds
            </p>
            <p className={`text-xs font-bold ${colorClass}`}>
              {trendText}
            </p>
            <div className="h-px bg-muted w-full my-1.5" />
            <p className="text-xs font-medium text-muted-foreground flex justify-between gap-4">
              <span>Ritmo de trabajo:</span> <span className="text-foreground font-bold">{data.total} uds en {data.activeDaysCount} {data.activeDaysCount === 1 ? 'día' : 'días'}</span>
            </p>
            <p className="text-xs font-medium text-muted-foreground flex justify-between gap-4">
              <span>Stock en almacén:</span> <span className="text-foreground font-bold">{data.stock} uds</span>
            </p>
            <p className="text-xs font-medium text-muted-foreground flex justify-between gap-4 items-center mt-1">
              <span>Rendimiento est.:</span> 
              <span className={`text-foreground font-black px-1.5 py-0.5 rounded-sm text-xs ${data.depleteLabel === "Agotado" ? "bg-rose-100 text-rose-700" : "bg-muted"}`}>
                {data.depleteLabel}
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card rounded-xl border border-muted p-5 shadow-sm h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold">Top Productos Consumidos</h2>
          <p className="text-sm text-muted-foreground">Más solicitados en salidas con previsiones</p>
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

      <div className="w-full h-[400px]">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 50, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#4b5563', fontWeight: 'bold' }}
                width={140}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
              <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={28}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index < 3 ? '#3b82f6' : '#93c5fd'} /> // Top 3 más oscuros
                ))}
                <LabelList 
                  content={<CustomBarLabel />}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
            <p className="font-medium text-sm">No hay salidas registradas</p>
            <p className="text-xs">Para los filtros seleccionados</p>
          </div>
        )}
      </div>
    </div>
  );
}
