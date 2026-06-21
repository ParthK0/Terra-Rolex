import { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import { 
  Search, 
  Calendar, 
  Leaf, 
  RefreshCw,
  Car,
  Lightbulb,
  Beef,
  Filter
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

interface LogEntry {
  id: string;
  userId: string;
  category: string;
  subtype: string;
  amount: number;
  co2_kg: number;
  equivalent: string;
  description?: string;
  timestamp: string;
  fuel_type?: string;
  region?: string;
}

export default function AdminLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch('/admin/logs');
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      } else {
        throw new Error('Failed to retrieve atmospheric log stream.');
      }
    } catch (error) { const err = error as Error;
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'transport':
      case 'transportation':
        return <Car className="h-4.5 w-4.5 text-accent-blue" />;
      case 'diet':
      case 'food':
        return <Beef className="h-4.5 w-4.5 text-accent-green" />;
      case 'energy':
      case 'home':
        return <Lightbulb className="h-4.5 w-4.5 text-yellow-500" />;
      default:
        return <Leaf className="h-4.5 w-4.5 text-purple-500" />;
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category.toLowerCase()) {
      case 'transport':
      case 'transportation':
        return 'bg-blue-50 text-accent-blue border border-blue-100/50';
      case 'diet':
      case 'food':
        return 'bg-green-50 text-accent-green border border-green-100/50';
      case 'energy':
      case 'home':
        return 'bg-yellow-50 text-yellow-700 border border-yellow-150';
      default:
        return 'bg-purple-50 text-purple-700 border border-purple-100/50';
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.subtype.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.description && log.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.fuel_type && log.fuel_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.region && log.region.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesCategory = categoryFilter === 'all' || log.category.toLowerCase() === categoryFilter.toLowerCase();
    
    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && log.timestamp >= startDate;
    }
    if (endDate) {
      const endDateTime = endDate + 'T23:59:59';
      matchesDate = matchesDate && log.timestamp <= endDateTime;
    }

    return matchesSearch && matchesCategory && matchesDate;
  });

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  if (loading) {
    return <LoadingSpinner message="Parsing carbon log transactions..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-text-charcoal tracking-tight font-display">
            Carbon Logging Stream
          </h1>
          <p className="text-sm font-semibold text-text-grey mt-1">
            Global real-time feed of all environmental and footprint logs recorded by user accounts.
          </p>
        </div>
        
        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-text-charcoal font-bold text-xs px-4 py-2.5 rounded-2xl shadow-sm transition-all cursor-pointer select-none active:scale-95"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh Feed</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-grey">
            <Search className="h-4.5 w-4.5" />
          </div>
          <input
            type="text"
            placeholder="Search logs by description, user ID, fuel, region..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-text-charcoal placeholder-text-grey/60 focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue transition-all"
          />
        </div>

        <div className="relative w-full sm:w-48 flex items-center">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-grey">
            <Filter className="h-4 w-4" />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-2xl pl-9 pr-4 py-2.5 text-sm text-text-charcoal focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue transition-all"
          >
            <option value="all">All Categories</option>
            <option value="transport">Transport</option>
            <option value="energy">Energy</option>
            <option value="diet">Diet</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Date Filters */}
        <div className="flex gap-2 w-full sm:w-auto items-center">
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-2xl px-3 py-1.5">
            <Calendar className="h-3.5 w-3.5 text-text-grey" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs text-text-charcoal focus:outline-none bg-transparent"
              title="Start Date"
            />
          </div>
          <span className="text-text-grey text-xs">to</span>
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-2xl px-3 py-1.5">
            <Calendar className="h-3.5 w-3.5 text-text-grey" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs text-text-charcoal focus:outline-none bg-transparent"
              title="End Date"
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs font-bold text-accent-red hover:underline ml-2 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="premium-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-150 text-[11px] uppercase tracking-wider font-extrabold text-text-grey">
                <th className="py-4 px-6">Timestamp</th>
                <th className="py-4 px-6">Guardian ID</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Details</th>
                <th className="py-4 px-6">Quantity</th>
                <th className="py-4 px-6">Carbon Impact</th>
                <th className="py-4 px-6">Context Equivalent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 font-semibold text-text-grey">
                    No log entries found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    
                    {/* Timestamp */}
                    <td className="py-4 px-6 text-text-grey font-semibold whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 opacity-60" />
                        <span>{formatDate(log.timestamp)}</span>
                      </div>
                    </td>

                    {/* Guardian ID */}
                    <td className="py-4 px-6 font-mono text-[11px] text-text-grey font-bold">
                      {log.userId.slice(0, 10)}...
                    </td>

                    {/* Category */}
                    <td className="py-4 px-6">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${getCategoryBadgeClass(log.category)}`}>
                        {getCategoryIcon(log.category)}
                        <span>{log.category.toUpperCase()}</span>
                      </div>
                    </td>

                    {/* Details */}
                    <td className="py-4 px-6 font-semibold text-text-charcoal">
                      <div>
                        <span>{log.description || `${log.subtype} activity`}</span>
                        {(log.fuel_type || log.region) && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {log.fuel_type && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-text-grey rounded">
                                Fuel: {log.fuel_type}
                              </span>
                            )}
                            {log.region && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-text-grey rounded">
                                Grid: {log.region}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Quantity */}
                    <td className="py-4 px-6 text-text-grey font-bold">
                      {log.amount} unit(s)
                    </td>

                    {/* Carbon Impact */}
                    <td className="py-4 px-6">
                      <span className={`font-black ${log.co2_kg <= 0 ? 'text-accent-green' : 'text-text-charcoal'}`}>
                        {log.co2_kg > 0 ? '+' : ''}{log.co2_kg.toFixed(2)} kg
                      </span>
                    </td>

                    {/* Context Equivalent */}
                    <td className="py-4 px-6 text-xs text-text-grey italic">
                      {log.equivalent || 'No equivalent comparison calculated.'}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
