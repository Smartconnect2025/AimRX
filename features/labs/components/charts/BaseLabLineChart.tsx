import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BiomarkerResult } from "../../types/lab";

interface LabDataPoint {
  date: string;
  value: number;
  status: BiomarkerResult["status"];
}

type LabTooltipProps = {
  active?: boolean;
  payload?: [{ payload: LabDataPoint }];
  label?: string;
};

interface ReferenceRange {
  min?: number;
  max?: number;
  criticalMin?: number;
  criticalMax?: number;
  gender?: "male" | "female" | "both";
}

interface BaseLabLineChartProps {
  data: LabDataPoint[];
  biomarkerKey: string;
  biomarkerName: string;
  unit: string;
  color: string;
  referenceRange: ReferenceRange;
  height?: number;
  showCriticalLines?: boolean;
  gender?: "male" | "female";
}

// interface MultiBiomarkerConfig {
//   name: string;
//   unit: string;
//   color: string;
//   referenceRange: ReferenceRange;
// }

// interface MultiLineChartProps {
//   data: Record<string, DataPoint[]>;
//   biomarkers: Record<string, MultiBiomarkerConfig>;
//   height?: number;
//   title: string;
// }

export const BaseLabLineChart = ({
  data,
  biomarkerKey,
  biomarkerName,
  unit,
  color,
  referenceRange,
  height = 200,
  showCriticalLines = true,
}: BaseLabLineChartProps) => {
  const chartData = useMemo(() => {
    return data.map((point) => ({
      ...point,
      [biomarkerKey]: point.value,
    }));
  }, [data, biomarkerKey]);

  // const latestValue = data[data.length - 1];
  // const previousValue = data[data.length - 2];

  // const trend = useMemo(() => {
  //   if (!latestValue || !previousValue) return 'stable';
  //   const change = ((latestValue.value - previousValue.value) / previousValue.value) * 100;
  //   if (Math.abs(change) < 5) return 'stable';
  //   return change > 0 ? 'increasing' : 'decreasing';
  // }, [latestValue, previousValue]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical_high":
      case "critical_low":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "high":
      case "low":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800";
      case "normal":
        return "bg-primary/10 text-primary border-primary/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const CustomTooltip = (props: LabTooltipProps) => {
    const { active, payload, label } = props;
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-background p-3 border rounded-lg shadow-lg border-border">
          <p className="font-medium text-sm text-foreground">{label}</p>
          <p className="text-sm" style={{ color }}>
            {biomarkerName}: {dataPoint.value} {unit}
          </p>
          <Badge
            variant="outline"
            className={`text-xs mt-1 ${getStatusColor(dataPoint.status)}`}
          >
            {dataPoint.status.replace(/_/g, " ").toUpperCase()}
          </Badge>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-1">
      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 8, left: 40, bottom: 20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              opacity={0.3}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              height={55}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              width={55}
              domain={["dataMin - 15%", "dataMax + 15%"]}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Normal Range Shading */}
            {referenceRange.min && referenceRange.max && (
              <ReferenceArea
                y1={referenceRange.min}
                y2={referenceRange.max}
                fill="hsl(142 76% 36%)"
                fillOpacity={0.15}
                stroke="none"
              />
            )}

            {/* Critical Low Range */}
            {referenceRange.criticalMin && referenceRange.min && (
              <ReferenceArea
                y1={referenceRange.criticalMin}
                y2={referenceRange.min}
                fill="hsl(var(--destructive))"
                fillOpacity={0.1}
                stroke="none"
              />
            )}

            {/* Critical High Range */}
            {referenceRange.max && referenceRange.criticalMax && (
              <ReferenceArea
                y1={referenceRange.max}
                y2={referenceRange.criticalMax}
                fill="hsl(var(--destructive))"
                fillOpacity={0.1}
                stroke="none"
              />
            )}

            {/* Reference Lines for Normal Range */}
            {referenceRange.min && (
              <ReferenceLine
                y={referenceRange.min}
                stroke="hsl(142 76% 36%)"
                strokeDasharray="3 3"
                strokeOpacity={0.8}
                strokeWidth={1}
              />
            )}
            {referenceRange.max && (
              <ReferenceLine
                y={referenceRange.max}
                stroke="hsl(142 76% 36%)"
                strokeDasharray="3 3"
                strokeOpacity={0.8}
                strokeWidth={1}
              />
            )}

            {/* Critical Value Lines */}
            {showCriticalLines && referenceRange.criticalMin && (
              <ReferenceLine
                y={referenceRange.criticalMin}
                stroke="hsl(var(--destructive))"
                strokeDasharray="5 5"
                strokeWidth={2}
                strokeOpacity={0.9}
              />
            )}
            {showCriticalLines && referenceRange.criticalMax && (
              <ReferenceLine
                y={referenceRange.criticalMax}
                stroke="hsl(var(--destructive))"
                strokeDasharray="5 5"
                strokeWidth={2}
                strokeOpacity={0.9}
              />
            )}

            {/* Data Line */}
            <Line
              type="monotone"
              dataKey={biomarkerKey}
              stroke={color}
              strokeWidth={3}
              dot={{
                r: 5,
                fill: color,
                strokeWidth: 2,
                stroke: "hsl(var(--background))",
              }}
              activeDot={{
                r: 7,
                fill: color,
                strokeWidth: 2,
                stroke: "hsl(var(--background))",
              }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Multi-biomarker chart component

// export const MultiLineChart = ({ data, biomarkers, height = 300 }: MultiLineChartProps) => {
//   const [visibleBiomarkers, setVisibleBiomarkers] = useState<Record<string, boolean>>(
//     Object.keys(biomarkers).reduce((acc, key) => ({ ...acc, [key]: true }), {})
//   );

//   const chartData = useMemo(() => {
//     // Get all unique dates from all biomarkers
//     const allDates = new Set<string>();
//     Object.values(data).forEach(biomarkerData => {
//       biomarkerData.forEach(point => allDates.add(point.date));
//     });

//     // Create combined data structure
//     return Array.from(allDates).sort().map(date => {
//       type DataPoint = {
//         date: string,
//         [k: string]: any
//       }
//       const dataPoint: DataPoint = { date };

//       Object.keys(biomarkers).forEach(biomarkerKey => {
//         const biomarkerData = data[biomarkerKey] || [];
//         const point = biomarkerData.find(p => p.date === date);
//         dataPoint[biomarkerKey] = point?.value || null;
//         dataPoint[`${biomarkerKey}_status`] = point?.status || null;
//       });

//       return dataPoint;
//     });
//   }, [data, biomarkers]);

//   const toggleBiomarker = (biomarkerKey: string) => {
//     setVisibleBiomarkers(prev => ({
//       ...prev,
//       [biomarkerKey]: !prev[biomarkerKey]
//     }));
//   };

//   const getYAxisLabel = () => {
//     return ''; // Remove Y-axis label since biomarkers have different units
//   };

//   const getReferenceAreas = () => {
//     const visibleBiomarkerKeys = Object.keys(biomarkers).filter(key => visibleBiomarkers[key]);

//     if (visibleBiomarkerKeys.length !== 1) {
//       // Don't show reference areas when multiple biomarkers with different ranges are visible
//       return null;
//     }

//     const biomarkerKey = visibleBiomarkerKeys[0];
//     const config = biomarkers[biomarkerKey];
//     const range = config.referenceRange;

//     return (
//       <>
//         {/* Critical Low Range */}
//         {range.criticalMin && range.min && (
//           <ReferenceArea
//             y1={range.criticalMin}
//             y2={range.min}
//             fill="hsl(var(--destructive))"
//             fillOpacity={0.1}
//             stroke="none"
//           />
//         )}

//         {/* Normal Range */}
//         {range.min && range.max && (
//           <ReferenceArea
//             y1={range.min}
//             y2={range.max}
//             fill="hsl(var(--primary))"
//             fillOpacity={0.05}
//             stroke="none"
//           />
//         )}

//         {/* Critical High Range */}
//         {range.max && range.criticalMax && (
//           <ReferenceArea
//             y1={range.max}
//             y2={range.criticalMax}
//             fill="hsl(var(--destructive))"
//             fillOpacity={0.1}
//             stroke="none"
//           />
//         )}

//         {/* Reference Lines for Normal Range */}
//         {range.min && (
//           <ReferenceLine
//             y={range.min}
//             stroke="hsl(var(--primary))"
//             strokeDasharray="3 3"
//             strokeOpacity={0.7}
//           />
//         )}
//         {range.max && (
//           <ReferenceLine
//             y={range.max}
//             stroke="hsl(var(--primary))"
//             strokeDasharray="3 3"
//             strokeOpacity={0.7}
//           />
//         )}

//         {/* Critical Value Lines */}
//         {range.criticalMin && (
//           <ReferenceLine
//             y={range.criticalMin}
//             stroke="hsl(var(--destructive))"
//             strokeDasharray="5 5"
//             strokeWidth={2}
//             strokeOpacity={0.8}
//           />
//         )}
//         {range.criticalMax && (
//           <ReferenceLine
//             y={range.criticalMax}
//             stroke="hsl(var(--destructive))"
//             strokeDasharray="5 5"
//             strokeWidth={2}
//             strokeOpacity={0.8}
//           />
//         )}
//       </>
//     );
//   };

//   const CustomTooltip = ({ active, payload, label }: any) => {
//     if (active && payload && payload.length) {
//       const activeBiomarkers = payload.filter((p: any) =>
//         visibleBiomarkers[p.dataKey] && p.value !== null
//       );

//       if (activeBiomarkers.length === 0) return null;

//       return (
//         <div className="bg-background p-3 border rounded-lg shadow-lg border-border">
//           <p className="font-medium text-sm mb-2 text-foreground">{label}</p>
//           {activeBiomarkers.map((entry: any, index: number) => {
//             const biomarker = biomarkers[entry.dataKey];
//             const status = entry.payload[`${entry.dataKey}_status`];
//             return (
//               <div key={index} className="text-sm mb-1">
//                 <p style={{ color: biomarker.color }}>
//                   {biomarker.name}: {entry.value} {biomarker.unit}
//                 </p>
//                 {status && (
//                   <Badge variant="outline" className={`text-xs ${getStatusColor(status)}`}>
//                     {status.replace(/_/g, ' ').toUpperCase()}
//                   </Badge>
//                 )}
//               </div>
//             );
//           })}
//         </div>
//       );
//     }
//     return null;
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'critical_high':
//       case 'critical_low':
//         return 'bg-destructive/10 text-destructive border-destructive/20';
//       case 'high':
//       case 'low':
//         return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
//       case 'normal':
//         return 'bg-primary/10 text-primary border-primary/20';
//       default:
//         return 'bg-muted text-muted-foreground border-border';
//     }
//   };

//   // Add legend for reference ranges when only one biomarker is visible
//   const visibleBiomarkerKeys = Object.keys(biomarkers).filter(key => visibleBiomarkers[key]);
//   const showReferenceRangeLegend = visibleBiomarkerKeys.length === 1;

//   return (
//     <div className="space-y-4">
//       {/* Biomarker Toggle Controls */}
//       <div className="space-y-3">
//         <h4 className="text-sm font-semibold text-muted-foreground">Select Biomarkers</h4>
//         <div className="flex flex-wrap gap-3">
//           {Object.entries(biomarkers).map(([biomarkerKey, config]) => (
//             <div key={biomarkerKey} className="flex items-center space-x-2">
//               <Checkbox
//                 id={biomarkerKey}
//                 checked={visibleBiomarkers[biomarkerKey]}
//                 onCheckedChange={() => toggleBiomarker(biomarkerKey)}
//               />
//               <label
//                 htmlFor={biomarkerKey}
//                 className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
//               >
//                 <div
//                   className="w-3 h-3 rounded-full"
//                   style={{ backgroundColor: config.color }}
//                 />
//                 {config.name}
//               </label>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Chart */}
//       <div style={{ height }}>
//         <ResponsiveContainer width="100%" height="100%">
//           <LineChart data={chartData} margin={{ top: 5, right: 8, left: 35, bottom: 15 }}>
//             <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
//             <XAxis
//               dataKey="date"
//               tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
//               angle={-45}
//               textAnchor="end"
//               height={40}
//             />
//             <YAxis
//               tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
//               width={45}
//               domain={['dataMin - 10', 'dataMax + 10']}
//             />
//             <Tooltip content={<CustomTooltip />} />

//             {/* Reference Areas and Lines */}
//             {getReferenceAreas()}

//             {/* Data Lines */}
//             {Object.entries(biomarkers).map(([biomarkerKey, config]) => {
//               if (!visibleBiomarkers[biomarkerKey]) return null;

//               return (
//                 <Line
//                   key={biomarkerKey}
//                   type="monotone"
//                   dataKey={biomarkerKey}
//                   stroke={config.color}
//                   strokeWidth={2}
//                   dot={{ r: 4, fill: config.color, strokeWidth: 2, stroke: "hsl(var(--background))" }}
//                   activeDot={{ r: 6, fill: config.color, strokeWidth: 2, stroke: "hsl(var(--background))" }}
//                   connectNulls={false}
//                 />
//               );
//             })}
//           </LineChart>
//         </ResponsiveContainer>
//       </div>
//     </div>
//   );
// };
