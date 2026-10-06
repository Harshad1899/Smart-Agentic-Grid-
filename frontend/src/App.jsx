import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import {
  Activity, Zap, Clock, TrendingUp, BarChart3, Settings, Users, LayoutDashboard, Search, Bell, Wifi, WifiOff, AlertTriangle, CheckCircle
} from 'lucide-react';

const TOTAL_BATCHES = 7;
const STEPS_PER_BATCH = 60;
const TOTAL_STEPS = TOTAL_BATCHES * STEPS_PER_BATCH;

const SidebarItem = ({ icon, label, active }) => (
  <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ${active ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
    {icon}
    <span className="font-medium text-sm">{label}</span>
  </div>
);

function App() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [batchData, setBatchData] = useState([]);
  const [completedBatches, setCompletedBatches] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [isPolling, setIsPolling] = useState(true);

  useEffect(() => {
    if (!isPolling) return;

    const fetchData = async () => {
      try {

        const response = await axios.get('http://127.0.0.1:8081/api/results');

        if (Array.isArray(response.data)) {
          const activeData = response.data.slice(0, TOTAL_STEPS);
          const totalItems = activeData.length;

          if (totalItems >= TOTAL_STEPS) {
            setIsPolling(false);
          }

          const completedBatchesCount = Math.floor(totalItems / STEPS_PER_BATCH);
          const currentBatchIndex =
            totalItems > 0 && totalItems % STEPS_PER_BATCH === 0
              ? completedBatchesCount - 1
              : completedBatchesCount;

          const currentData =
            currentBatchIndex >= 0
              ? activeData.slice(
                  currentBatchIndex * STEPS_PER_BATCH,
                  (currentBatchIndex + 1) * STEPS_PER_BATCH
                )
              : [];

          setBatchData(currentData);

          const batches = [];
          for (let i = 0; i < completedBatchesCount; i++) {
            batches.push({
              batchId: i + 1,
              data: activeData.slice(i * STEPS_PER_BATCH, (i + 1) * STEPS_PER_BATCH)
            });
          }

          setCompletedBatches(batches.slice(-TOTAL_BATCHES));
        } else {
          setBatchData([]);
          setCompletedBatches([]);
        }

        setIsConnected(true);
        setError(null);
      } catch (err) {
        setIsConnected(false);
        setError("Cannot connect to FastAPI Backend.");
        console.error("Polling error:", err);
      }
    };

    // Initial fetch
    fetchData();

    // Setup 1-second interval
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, [isPolling]);

  const handleRestart = async () => {
    try {
      await axios.post('http://127.0.0.1:8081/api/results/reset');
      setBatchData([]);
      setCompletedBatches([]);
      setIsConnected(true);
      setError(null);
      setIsPolling(true);
    } catch (err) {
      setIsConnected(false);
      setError("Cannot reset FastAPI Backend.");
      console.error("Reset error:", err);
    }
  };

  // Compute dynamic KPIs based on the live batchData
  const kpiData = useMemo(() => {
    if (!batchData || batchData.length === 0) {
      return [
        { title: "Total Processing Time", value: "0.0s", change: "--", icon: <Clock className="text-slate-500" size={24} /> },
        { title: "Batches Processed", value: `0/${TOTAL_BATCHES}`, change: "--", icon: <Zap className="text-slate-500" size={24} /> },
      ];
    }

    const totalTime = batchData.reduce((sum, b) => sum + (b.time || 0), 0);

    return [
      { title: "Total Processing Time per batch", value: `${totalTime.toFixed(1)}s`, change: "Stable", icon: <Clock className="text-purple-400" size={24} /> },
      { title: "Batches Processed", value: `${batchData.length}/${TOTAL_BATCHES}`, change: "Live", icon: <Zap className="text-amber-400" size={24} /> },
    ];
  }, [batchData]);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800/60 bg-slate-950/50 flex flex-col pt-6 relative hidden md:flex">
        <div className="absolute inset-0 bg-indigo-500/5 blur-[100px] pointer-events-none"></div>
        <div className="flex items-center space-x-3 px-6 pb-8 border-b border-slate-800/60">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Zap className="text-white" size={18} />
          </div>
          <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Model Monitor
          </h1>
        </div>

        <div className="flex-1 px-4 py-6 space-y-2">
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Menu</p>
          <SidebarItem active icon={<LayoutDashboard size={20} />} label="Dashboard" />
          <SidebarItem icon={<BarChart3 size={20} />} label="Live Analytics" />
          <SidebarItem icon={<Users size={20} />} label="Team Models" />

          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-8 mb-4">Settings</p>
          <SidebarItem icon={<Settings size={20} />} label="API Config" />
        </div>

        <div className="p-4 mt-auto border-t border-slate-800/60">
          <div className="flex items-center space-x-3 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-indigo-500/30 flex items-center justify-center font-bold text-sm text-indigo-300">
              U
            </div>
            <div>
              <p className="text-sm font-semibold">User</p>
              <p className="text-xs text-slate-400">Local Env</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-y-auto w-full">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px] pointer-events-none pointer-events-none"></div>

        {/* Top Navbar */}
        <header className="h-20 border-b border-slate-800/60 flex items-center justify-between px-8 bg-slate-950/80 backdrop-blur-md sticky top-0 z-10 w-full">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center px-4 py-2 rounded-full border shadow-inner ${isConnected ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
              {isConnected ? <Wifi size={14} className="mr-2" /> : <WifiOff size={14} className="mr-2" />}
              <span className="text-xs font-bold uppercase tracking-wider">
                {isConnected ? 'FastAPI Connected' : 'FastAPI Offline'}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="relative w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
              <Bell size={18} />
              {error && <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
            </button>
            <button 
              onClick={handleRestart}
              className="px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors shadow-[0_0_15px_rgba(79,70,229,0.4)]"
            >
              Restart Epoch
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8 max-w-7xl mx-auto w-full flex-1 z-0 relative">

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mb-2">Live Training Monitor</h2>
              <p className="text-slate-400">Polling results dynamically. Target: <strong className="text-white">{TOTAL_STEPS}</strong> steps ({TOTAL_BATCHES} batches of {STEPS_PER_BATCH}).</p>
            </div>
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-inner">
              {['Overview', 'Metrics', 'Logs'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === tab ? 'bg-indigo-500/20 text-indigo-300 shadow-md transform scale-[1.02]' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Network Error Overlay */}
          {!isConnected && batchData.length === 0 && (
            <div className="w-full bg-rose-500/10 border border-rose-500/20 p-6 rounded-2xl mb-8 flex items-center justify-center backdrop-blur-sm text-rose-300">
              <WifiOff className="mr-3" size={24} />
              <span>Waiting for FastApi connection on <strong>http://127.0.0.1:8081/api/results</strong>... (Polling every 1s)</span>
            </div>
          )}

          {/* Completed Batches History */}
          {completedBatches.length > 0 && (
            <div className="w-full mb-8">
              <h3 className="text-lg font-bold text-white mb-4 px-1">Completed Batches History (Target: 7 Batches)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                {completedBatches.map((batch) => {
                  const b = batch.data[batch.data.length - 1] || {};
                  const finalError = b.error ?? b.loss ?? 0;
                  const threshold = b.threshold ?? 0.5;
                  const isAnomaly = b.status ? b.status.toLowerCase() !== 'normal' : (finalError > threshold);

                  return (
                    <div key={batch.batchId} className={`p-4 rounded-xl flex flex-col backdrop-blur-sm transition-all shadow-xl border relative overflow-hidden group ${isAnomaly
                        ? 'bg-rose-500/10 border-rose-500/30'
                        : 'bg-emerald-500/10 border-emerald-500/30'
                      }`}>
                      <div className={`absolute top-0 left-0 w-1 h-full ${isAnomaly ? 'bg-rose-500' : 'bg-emerald-400'}`}></div>

                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-bold text-white text-sm">Batch #{batch.batchId}</h4>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider">{STEPS_PER_BATCH} Steps</p>
                        </div>
                        <div className={`p-2 rounded-lg shadow-inner ${isAnomaly ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                          {isAnomaly ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
                        </div>
                      </div>

                      <div className="space-y-2 mb-4 flex-1">
                        <div className="flex justify-between items-end border-b border-slate-700/50 pb-1">
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Error</span>
                          <span className="font-mono font-bold text-white text-sm">{Number(finalError).toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between items-end border-b border-slate-700/50 pb-1">
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Threshold</span>
                          <span className="font-mono font-bold text-slate-300 text-sm">{typeof threshold === 'number' ? threshold.toFixed(4) : threshold}</span>
                        </div>
                      </div>

                      <div className={`w-full py-2 rounded-lg font-black tracking-widest text-sm text-center shadow-inner ${isAnomaly ? 'bg-rose-500/20 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                        }`}>
                        {isAnomaly ? 'ANOMALY' : 'NORMAL'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {kpiData.map((kpi, idx) => (
              <div key={idx} className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-colors">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/[0.02] rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-slate-800/80 rounded-xl shadow-inner border border-slate-700/50">
                    {kpi.icon}
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${kpi.change.startsWith('+') ? 'bg-emerald-500/10 text-emerald-400' : kpi.change.startsWith('-') || kpi.change === '--' ? 'bg-slate-800 text-slate-400' : 'bg-blue-500/10 text-blue-400'}`}>
                    {kpi.change}
                  </span>
                </div>
                <div>
                  <h3 className="text-slate-500 text-sm font-medium mb-1">{kpi.title}</h3>
                  <div className="text-3xl font-bold text-slate-100 font-mono tracking-tight">{kpi.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Primary Chart: Accuracy & Loss for the active batch */}
            <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm shadow-xl min-h-[350px] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-200">Model Performance (Current Batch)</h3>
                  <p className="text-xs text-slate-500 font-medium">Live step-by-step Accuracy vs Loss</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-emerald-400 mr-2 shadow-[0_0_8px_rgba(52,211,153,0.6)]"></div><span className="text-xs text-slate-400">Accuracy</span></div>
                  <div className="flex items-center ml-4"><div className="w-3 h-3 rounded-full bg-blue-500 mr-2 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div><span className="text-xs text-slate-400">Loss</span></div>
                </div>
              </div>
              <div className="flex-1 w-full font-mono text-sm">
                {batchData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={batchData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#34d399" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="step_in_batch" stroke="#64748b" tick={false} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="left" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                      <YAxis yAxisId="right" orientation="right" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: '#334155', backdropFilter: 'blur(8px)', borderRadius: '12px' }}
                        itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                        labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                      />
                      <Area yAxisId="left" type="monotone" dataKey="accuracy" stroke="#34d399" strokeWidth={2} fillOpacity={1} fill="url(#colorAccuracy)" isAnimationActive={false} />
                      <Area yAxisId="right" type="monotone" dataKey="loss" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorLoss)" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-600">Awaiting data stream...</div>
                )}
              </div>
            </div>

            {/* Time Chart for the active batch */}
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm shadow-xl min-h-[350px] flex flex-col">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-200">Proc. Time</h3>
                <p className="text-xs text-slate-500 font-medium">Secs/Step (Live)</p>
              </div>
              <div className="flex-1 w-full font-mono text-sm">
                {batchData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={batchData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="step_in_batch" stroke="#64748b" tick={false} axisLine={false} tickLine={false} />
                      <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                      <RechartsTooltip
                        cursor={{ fill: '#1e293b', opacity: 0.5 }}
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: '#334155', borderRadius: '12px' }}
                        itemStyle={{ color: '#a78bfa', fontWeight: 'bold' }}
                      />
                      {/* Keep the bar rendering simple while showing all 60 steps of the active batch */}
                      <Bar dataKey="time" fill="#8b5cf6" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-600">Awaiting data stream...</div>
                )}
              </div>
            </div>
          </div>

          {/* Details Table */}
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl flex flex-col h-96">
            <div className="px-6 py-5 border-b border-slate-800/80 bg-slate-900/80 sticky top-0 z-10 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-200">Live Batch Logs</h3>
              <span className="text-xs text-slate-500 font-medium">Showing latest {batchData.length} records</span>
            </div>

            <div className="overflow-y-auto flex-1 custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-900 z-10">
                  <tr className="text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-800/80">
                    <th className="px-6 py-4">Step Entry</th>
                    <th className="px-6 py-4">Accuracy</th>
                    <th className="px-6 py-4">Loss Value</th>
                    <th className="px-6 py-4">Proc. Time</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {batchData.length > 0 ? (
                    // We map in reverse to show the newest batches at the top of the table
                    [...batchData].reverse().map((row, idx) => (
                      <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-300 flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-3 ${idx === 0 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-slate-600'}`}></div>
                          B{row.batch}-S{row.step_in_batch}
                        </td>
                        <td className="px-6 py-4 text-emerald-400 font-mono">{row.accuracy ? (row.accuracy * 100).toFixed(1) + '%' : 'N/A'}</td>
                        <td className="px-6 py-4 text-blue-400 font-mono">{row.loss ? row.loss.toFixed(4) : 'N/A'}</td>
                        <td className="px-6 py-4 text-purple-400 font-mono">{row.time ? row.time + 's' : 'N/A'}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${idx === 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                            {idx === 0 ? 'Latest' : 'Logged'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-slate-500 italic">
                        Waiting for FastAPI entries...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <style jsx="true">{`
              .custom-scrollbar::-webkit-scrollbar {
                width: 8px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: rgba(15, 23, 42, 0.5);
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: rgba(51, 65, 85, 0.8);
                border-radius: 4px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: rgba(71, 85, 105, 1);
              }
            `}</style>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
