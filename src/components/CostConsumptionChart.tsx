import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { isToday, isAfter, subDays, format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Movement } from '../hooks/useInventory';

interface CostConsumptionChartProps {
  movements: Movement[];
}

export function CostConsumptionChart({ movements }: CostConsumptionChartProps) {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('month');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [warehouse, setWarehouse] = useState<'all' | 'instrumentacion' | 'electrico'>('all');

  // Obtain unique months available in data
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    movements.forEach(m => {
      if (m.type === 'salida' && m.price) {
        const d = parseISO(m.date);
        months.add(format(d, 'yyyy-MM'));
      }
    });
    return Array.from(months).sort().reverse(); // newest first
  }, [movements]);

  // Si seleccionamos "custom", asegurarnos de tener un mes por defecto si está vacío
  useMemo(() => {
    if (period === 'custom' && !selectedMonth && availableMonths.length > 0) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [period, selectedMonth, availableMonths]);

  const dataObj = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    if (period === 'today') {
      startDate = now;
    } else if (period === 'week') {
      startDate = subDays(now, 6);
    } else if (period === 'month') {
      startDate = subDays(now, 29);
    } else {
      // custom month
      if (!selectedMonth) return { chartData: [], costInstrumentacion: 0, costElectrico: 0 };
      const [year, month] = selectedMonth.split('-');
      const dateInMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
      startDate = startOfMonth(dateInMonth);
      endDate = endOfMonth(dateInMonth);
      // Si el mes es el actual, limitamos el endDate a hoy para no dibujar línea al futuro vacío
      if (isSameMonth(dateInMonth, now)) {
        endDate = now;
      }
    }

    // Costo por almacen
    let costInst = 0;
    let costElec = 0;

    // Generar array continuo de fechas
    const dateInterval = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Inicializar mapa de días
    const dailyCosts: Record<string, number> = {};
    dateInterval.forEach(date => {
      dailyCosts[format(date, 'yyyy-MM-dd')] = 0;
    });

    // Sumar costos
    movements.forEach((curr) => {
      if (curr.type !== 'salida') return;
      if (warehouse !== 'all' && curr.warehouse !== warehouse) return;
      
      const moveDate = parseISO(curr.date);
      if (moveDate >= startDate && moveDate <= endDate) {
        const dayKey = format(moveDate, 'yyyy-MM-dd');
        const cost = (curr.price || 0) * curr.quantity;
        
        if (dailyCosts[dayKey] !== undefined) {
          dailyCosts[dayKey] += cost;
        }

        // Sumar al almacén correspondiente
        if (curr.warehouse === 'instrumentacion') {
          costInst += cost;
        } else if (curr.warehouse === 'electrico') {
          costElec += cost;
        }
      }
    });

    // Formatear para recharts
    const chartDataFormatted = dateInterval.map(date => {
      const dayKey = format(date, 'yyyy-MM-dd');
      return {
        date: dayKey,
        displayDate: format(date, 'dd MMM', { locale: es }),
        costo: dailyCosts[dayKey] || 0
      };
    });

    return { 
      chartData: chartDataFormatted, 
      costInstrumentacion: costInst, 
      costElectrico: costElec 
    };
  }, [movements, period, selectedMonth, warehouse]);

  const { chartData, costInstrumentacion, costElectrico } = dataObj;
  const totalCost = costInstrumentacion + costElectrico;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="bg-card p-6 rounded-xl border shadow-sm animate-fade-in flex flex-col h-full min-h-[450px]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Costo Consumido en el Tiempo</h2>
          <p className="text-sm text-muted-foreground mt-1">Costo total del periodo: <span className="font-bold text-rose-600">{formatCurrency(totalCost)}</span></p>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <div className="flex bg-muted/50 p-1 rounded-lg">
            <button
              onClick={() => setWarehouse('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${warehouse === 'all'
                ? 'bg-background shadow-sm text-primary'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Todos
            </button>
            <button
              onClick={() => setWarehouse('instrumentacion')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${warehouse === 'instrumentacion'
                ? 'bg-background shadow-sm text-primary'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Inst.
            </button>
            <button
              onClick={() => setWarehouse('electrico')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${warehouse === 'electrico'
                ? 'bg-background shadow-sm text-primary'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Eléc.
            </button>
          </div>

          <div className="flex bg-muted/50 p-1 rounded-lg">
            <button
              onClick={() => setPeriod('week')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                period === 'week' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              7 Días
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                period === 'month' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              30 Días
            </button>
            <button
              onClick={() => setPeriod('custom')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                period === 'custom' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Por Mes
            </button>
          </div>
          
          {period === 'custom' && availableMonths.length > 0 && (
            <select 
              className="text-xs bg-muted/30 border border-muted-foreground/20 rounded-md px-2 py-1.5 text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {availableMonths.map(m => {
                const [year, month] = m.split('-');
                const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
                return (
                  <option key={m} value={m}>
                    {format(dateObj, 'MMMM yyyy', { locale: es }).replace(/^\w/, c => c.toUpperCase())}
                  </option>
                )
              })}
            </select>
          )}
        </div>
      </div>

      <div className="flex-1 w-full min-h-[220px]">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorCosto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.2)" />
              <XAxis 
                dataKey="displayDate" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickMargin={10}
                minTickGap={20}
              />
              <YAxis 
                tickFormatter={(val) => `$${val.toLocaleString()}`} 
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                width={70}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Costo Consumido']}
                labelFormatter={(label) => `Fecha: ${label}`}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Area 
                type="monotone" 
                dataKey="costo" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorCosto)" 
                activeDot={{ r: 6, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm font-medium">
            No hay gastos registrados en este período.
          </div>
        )}
      </div>

      <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-4">
        <div className="flex flex-col items-center justify-center bg-rose-50/50 rounded-lg p-3">
          <p className="text-xs font-bold uppercase tracking-wider text-rose-600/80 mb-1">Instrumentación</p>
          <p className="text-xl font-black text-rose-600">{formatCurrency(costInstrumentacion)}</p>
        </div>
        <div className="flex flex-col items-center justify-center bg-amber-50/50 rounded-lg p-3">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-600/80 mb-1">Eléctrico</p>
          <p className="text-xl font-black text-amber-600">{formatCurrency(costElectrico)}</p>
        </div>
      </div>
    </div>
  );
}
