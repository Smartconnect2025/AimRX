// interface BiomarkerConfig {
//   key: string;
//   name: string;
//   unit: string;
//   color: string;
//   panelName: string;
//   visible: boolean;
//   yAxis?: 'left' | 'right';
// }

// interface MultiMetricOverlayProps {
//   data: any[];
//   onExport?: (format: 'png' | 'csv') => void;
// }

// const ALL_BIOMARKERS: BiomarkerConfig[] = [
//   // Metabolic Panel
//   { key: 'glucose', name: 'Glucose', unit: 'mg/dL', color: '#8884d8', panelName: 'Metabolic', visible: true, yAxis: 'left' },
//   { key: 'creatinine', name: 'Creatinine', unit: 'mg/dL', color: '#82ca9d', panelName: 'Metabolic', visible: false, yAxis: 'right' },
//   { key: 'alt', name: 'ALT', unit: 'U/L', color: '#ffc658', panelName: 'Metabolic', visible: false, yAxis: 'right' },

//   // Lipid Panel
//   { key: 'total_cholesterol', name: 'Total Cholesterol', unit: 'mg/dL', color: '#ff7300', panelName: 'Lipid', visible: true, yAxis: 'left' },
//   { key: 'ldl_cholesterol', name: 'LDL Cholesterol', unit: 'mg/dL', color: '#ff6b6b', panelName: 'Lipid', visible: false, yAxis: 'left' },
//   { key: 'hdl_cholesterol', name: 'HDL Cholesterol', unit: 'mg/dL', color: '#51cf66', panelName: 'Lipid', visible: false, yAxis: 'left' },

//   // CBC
//   { key: 'wbc', name: 'White Blood Cells', unit: 'K/uL', color: '#8dd1e1', panelName: 'CBC', visible: false, yAxis: 'right' },
//   { key: 'rbc', name: 'Red Blood Cells', unit: 'M/uL', color: '#d084d0', panelName: 'CBC', visible: false, yAxis: 'right' },
//   { key: 'hemoglobin', name: 'Hemoglobin', unit: 'g/dL', color: '#87d068', panelName: 'CBC', visible: false, yAxis: 'right' },

//   // Thyroid
//   { key: 'tsh', name: 'TSH', unit: 'mIU/L', color: '#ffa940', panelName: 'Thyroid', visible: false, yAxis: 'right' },
//   { key: 'free_t4', name: 'Free T4', unit: 'ng/dL', color: '#597ef7', panelName: 'Thyroid', visible: false, yAxis: 'right' },

//   // HbA1c
//   { key: 'hba1c', name: 'HbA1c', unit: '%', color: '#f759ab', panelName: 'Diabetes', visible: false, yAxis: 'right' }
// ];

// const TIME_PERIODS = [
//   { value: '3_months', label: '3 Months', months: 3 },
//   { value: '6_months', label: '6 Months', months: 6 },
//   { value: '1_year', label: '1 Year', months: 12 },
//   { value: 'all_time', label: 'All Time', months: null }
// ];

// export const MultiMetricOverlay = ({ data, onExport }: MultiMetricOverlayProps) => {
//   const [timePeriod, setTimePeriod] = useState<string>('6_months');
//   const [biomarkerVisibility, setBiomarkerVisibility] = useState<Record<string, boolean>>(
//     ALL_BIOMARKERS.reduce((acc, biomarker) => ({
//       ...acc,
//       [biomarker.key]: biomarker.visible
//     }), {})
//   );

//   // Process data for charting
//   const chartData = useMemo(() => {
//     const processedData: any[] = [];

//     data.forEach(result => {
//       const resultDate = parseISO(result.test_date);
//       const dataPoint: any = {
//         date: format(resultDate, 'MMM dd'),
//         fullDate: format(resultDate, 'MMM dd, yyyy'),
//         timestamp: resultDate.getTime()
//       };

//       // Extract biomarker values from all panels
//       Object.entries(result.panels).forEach(([panelKey, panel]: [string, any]) => {
//         Object.entries(panel.results).forEach(([biomarkerKey, biomarker]: [string, any]) => {
//           if (ALL_BIOMARKERS.some(b => b.key === biomarkerKey)) {
//             dataPoint[biomarkerKey] = biomarker.value;
//             dataPoint[`${biomarkerKey}_status`] = biomarker.status;
//           }
//         });
//       });

//       processedData.push(dataPoint);
//     });

//     // Sort by date
//     processedData.sort((a, b) => a.timestamp - b.timestamp);

//     // Filter by time period
//     const selectedPeriod = TIME_PERIODS.find(p => p.value === timePeriod);
//     if (selectedPeriod && selectedPeriod.months) {
//       const cutoffDate = subMonths(new Date(), selectedPeriod.months);
//       return processedData.filter(point => point.timestamp >= cutoffDate.getTime());
//     }

//     return processedData;
//   }, [data, timePeriod]);

//   // Get visible biomarkers
//   const visibleBiomarkers = useMemo(() => {
//     return ALL_BIOMARKERS.filter(biomarker => biomarkerVisibility[biomarker.key]);
//   }, [biomarkerVisibility]);

//   // Group biomarkers by panel for organized display
//   const biomarkersByPanel = useMemo(() => {
//     const grouped: Record<string, BiomarkerConfig[]> = {};
//     ALL_BIOMARKERS.forEach(biomarker => {
//       if (!grouped[biomarker.panelName]) {
//         grouped[biomarker.panelName] = [];
//       }
//       grouped[biomarker.panelName].push(biomarker);
//     });
//     return grouped;
//   }, []);

//   const handleBiomarkerToggle = (biomarkerKey: string, checked: boolean) => {
//     setBiomarkerVisibility(prev => ({
//       ...prev,
//       [biomarkerKey]: checked
//     }));
//   };

//   const CustomTooltip = ({ active, payload, label }: any) => {
//     if (active && payload && payload.length) {
//       const dataPoint = payload[0].payload;
//       return (
//         <div className="bg-white p-3 border rounded-lg shadow-lg max-w-xs">
//           <p className="font-medium text-sm mb-2">{dataPoint.fullDate}</p>
//           {payload.map((entry: any, index: number) => {
//             const biomarker = ALL_BIOMARKERS.find(b => b.key === entry.dataKey);
//             const status = dataPoint[`${entry.dataKey}_status`];
//             return (
//               <div key={index} className="flex items-center justify-between text-xs mb-1">
//                 <span style={{ color: entry.color }}>
//                   {biomarker?.name}: {entry.value} {biomarker?.unit}
//                 </span>
//                 {status && (
//                   <Badge variant="outline" className="ml-2 text-xs">
//                     {status.toUpperCase()}
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

//   return (
//     <Card>
//       <CardHeader>
//         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//           <CardTitle>Multi-Metric Lab Overlay</CardTitle>
//           <div className="flex flex-col sm:flex-row gap-2">
//             <Button variant="outline" size="sm" onClick={() => onExport?.('png')}>
//               <Download className="h-4 w-4 mr-2" />
//               <span className="hidden sm:inline">Export PNG</span>
//               <span className="sm:hidden">PNG</span>
//             </Button>
//             <Button variant="outline" size="sm" onClick={() => onExport?.('csv')}>
//               <Download className="h-4 w-4 mr-2" />
//               <span className="hidden sm:inline">Export CSV</span>
//               <span className="sm:hidden">CSV</span>
//             </Button>
//           </div>
//         </div>
//       </CardHeader>
//       <CardContent>
//         <div className="space-y-6">
//           {/* Time Period Selector */}
//           <div className="flex flex-col sm:flex-row sm:items-center gap-4">
//             <div className="space-y-2">
//               <Label>Time Period</Label>
//               <Select value={timePeriod} onValueChange={setTimePeriod}>
//                 <SelectTrigger className="w-full sm:w-48">
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {TIME_PERIODS.map(period => (
//                     <SelectItem key={period.value} value={period.value}>
//                       <div className="flex items-center gap-2">
//                         <ZoomIn className="h-4 w-4" />
//                         {period.label}
//                       </div>
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>

//             <div className="flex items-center gap-2 text-sm text-muted-foreground">
//               <Settings className="h-4 w-4" />
//               <span>{visibleBiomarkers.length} metrics selected</span>
//             </div>
//           </div>

//           {/* Biomarker Selection by Panel */}
//           <div className="space-y-4">
//             <Label className="text-base font-semibold">Select Biomarkers to Overlay</Label>
//             <div className="space-y-4">
//               {Object.entries(biomarkersByPanel).map(([panelName, biomarkers]) => (
//                 <div key={panelName} className="space-y-2">
//                   <h4 className="text-sm font-medium text-muted-foreground">{panelName} Panel</h4>
//                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
//                     {biomarkers.map(biomarker => (
//                       <div key={biomarker.key} className="flex items-center gap-2 p-2 border rounded">
//                         <Checkbox
//                           checked={biomarkerVisibility[biomarker.key]}
//                           onCheckedChange={(checked) => handleBiomarkerToggle(biomarker.key, checked as boolean)}
//                         />
//                         <div className="flex items-center gap-2 min-w-0 flex-1">
//                           <div
//                             className="w-3 h-3 rounded-full flex-shrink-0"
//                             style={{ backgroundColor: biomarker.color }}
//                           />
//                           <div className="min-w-0">
//                             <span className="text-xs sm:text-sm font-medium truncate block">
//                               {biomarker.name}
//                             </span>
//                             <span className="text-xs text-muted-foreground">
//                               {biomarker.unit}
//                             </span>
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Chart */}
//           {chartData.length === 0 ? (
//             <div className="text-center py-12">
//               <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
//               <h3 className="text-lg font-medium mb-2">No Data Available</h3>
//               <p className="text-muted-foreground">
//                 No lab data found for the selected time period.
//               </p>
//             </div>
//           ) : visibleBiomarkers.length === 0 ? (
//             <div className="text-center py-12">
//               <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
//               <h3 className="text-lg font-medium mb-2">Select Biomarkers</h3>
//               <p className="text-muted-foreground">
//                 Choose one or more biomarkers above to display the overlay chart.
//               </p>
//             </div>
//           ) : (
//             <div className="h-64 sm:h-80 lg:h-96 w-full">
//               <ResponsiveContainer width="100%" height="100%">
//                 <LineChart data={chartData} margin={{ top: 5, right: 8, left: 35, bottom: 20 }}>
//                   <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//                   <XAxis
//                     dataKey="date"
//                     tick={{ fontSize: 10 }}
//                     angle={-45}
//                     textAnchor="end"
//                     height={60}
//                   />
//                   <YAxis
//                     yAxisId="left"
//                     tick={{ fontSize: 10 }}
//                     width={50}
//                   />
//                   <YAxis
//                     yAxisId="right"
//                     orientation="right"
//                     tick={{ fontSize: 10 }}
//                     width={50}
//                   />
//                   <Tooltip content={<CustomTooltip />} />

//                   {visibleBiomarkers.map(biomarker => (
//                     <Line
//                       key={biomarker.key}
//                       yAxisId={biomarker.yAxis || 'left'}
//                       type="monotone"
//                       dataKey={biomarker.key}
//                       stroke={biomarker.color}
//                       strokeWidth={2}
//                       dot={{ r: 3 }}
//                       connectNulls={false}
//                       name={`${biomarker.name} (${biomarker.unit})`}
//                     />
//                   ))}
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>
//           )}
//         </div>
//       </CardContent>
//     </Card>
//   );
// };
