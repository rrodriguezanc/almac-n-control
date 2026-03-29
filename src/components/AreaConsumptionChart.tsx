import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { isToday, isAfter, subDays } from 'date-fns';
import type { Movement } from '../hooks/useInventory';

interface AreaConsumptionChartProps {
  movements: Movement[];
}

const COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#6366f1',
  '#84cc16',
];

export function AreaConsumptionChart({ movements }: AreaConsumptionChartProps) {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('month');
  const [warehouse, setWarehouse] = useState<'all' | 'instrumentacion' | 'electrico'>('all');

  const chartData = useMemo(() => {
    const now = new Date();

    const grouped = movements.reduce((acc, curr) => {
      if (curr.type !== 'salida') return acc;
      if (warehouse !== 'all' && curr.warehouse !== warehouse) return acc;

      const moveDate = new Date(curr.date);
      let isCurrent = false;

      if (period === 'today') {
        isCurrent = isToday(moveDate);
      } else if (period === 'week') {
        isCurrent = isAfter(moveDate, subDays(now, 7));
      } else if (period === 'month') {
        isCurrent = isAfter(moveDate, subDays(now, 30));
      }

      if (isCurrent) {
        let area = 'Sin Área Nominal';
        const rawNote = curr.note || '';
        const parts = rawNote.split('|').map((p) => p.trim());

        for (const part of parts) {
          if (part.startsWith('Área:')) {
            const extracted = part.replace('Área:', '').trim();
            if (extracted) area = extracted;
            break;
          }
        }

        const normalizedArea = area.trim().toUpperCase();

        if (!acc[normalizedArea]) {
          acc[normalizedArea] = 0;
        }

        acc[normalizedArea] += curr.quantity;
      }

      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([name, value]) => ({
        name: name.length > 25 ? name.substring(0, 25) + '...' : name,
        fullName: name,
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [movements, period, warehouse]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-xl shadow-lg border-muted z-50">
          <p className="font-bold text-xs mb-1 max-w-[200px] break-words">
            {data.fullName}
          </p>
          <div className="space-y-1">
            <p className="text-sm font-black text-primary flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: payload[0].payload.fill || '#3b82f6' }}
              />
              {data.value} unidades retiradas
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderScrollableLegend = () => {
    return (
      <div className="max-h-[120px] overflow-y-auto pr-2 mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {chartData.map((entry, index) => (
            <div
              key={`legend-${index}`}
              className="flex items-center gap-2 min-w-0"
              title={entry.fullName}
            >
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-xs font-bold text-muted-foreground truncate">
                {entry.fullName}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-card rounded-xl border border-muted p-5 shadow-sm h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold">Consumo por Área Destino</h2>
          <p className="text-sm text-muted-foreground">
            Distribución de salidas por departamento
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setPeriod('today')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${period === 'today'
                ? 'bg-white shadow-sm text-primary'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${period === 'week'
                ? 'bg-white shadow-sm text-primary'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              7 Días
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${period === 'month'
                ? 'bg-white shadow-sm text-primary'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              30 Días
            </button>
          </div>

          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setWarehouse('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${warehouse === 'all'
                ? 'bg-white shadow-sm text-primary'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Todos
            </button>
            <button
              onClick={() => setWarehouse('instrumentacion')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${warehouse === 'instrumentacion'
                ? 'bg-white shadow-sm text-primary'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Inst.
            </button>
            <button
              onClick={() => setWarehouse('electrico')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${warehouse === 'electrico'
                ? 'bg-white shadow-sm text-primary'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Eléc.
            </button>
          </div>
        </div>
      </div>

      {chartData.length > 0 ? (
        <>
          <div className="w-full h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {renderScrollableLegend()}
        </>
      ) : (
        <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
          <p className="font-medium text-sm">No hay salidas agrupables por área</p>
          <p className="text-xs">Para los filtros seleccionados</p>
        </div>
      )}
    </div>
  );
}