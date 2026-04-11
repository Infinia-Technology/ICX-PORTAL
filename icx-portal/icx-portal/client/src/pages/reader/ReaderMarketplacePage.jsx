import { useState, useEffect } from 'react';
import { Building2, Server, MapPin, Zap, Eye, Construction } from 'lucide-react';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Input from '../../components/ui/Input';

export default function ReaderMarketplacePage() {
  const [dcListings, setDcListings] = useState([]);
  const [gpuListings, setGpuListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('dc');
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/marketplace/dc-listings'),
      api.get('/marketplace/gpu-clusters'),
    ]).then(([dc, gpu]) => {
      setDcListings(dc.data.data || dc.data);
      setGpuListings(gpu.data.data || gpu.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filteredDc = dcListings.filter((l) => !search || l.site?.country?.toLowerCase().includes(search.toLowerCase()) || l.site?.siteName?.toLowerCase().includes(search.toLowerCase()));
  const filteredGpu = gpuListings.filter((c) => !search || c.country?.toLowerCase().includes(search.toLowerCase()) || c.gpuTechnology?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Marketplace</h1>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1 flex items-center gap-1">
          <Eye className="w-4 h-4" /> Browse-only access — pricing and contact details are not shown
        </p>
      </div>

      {/* Coming Soon Banner */}
      <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] bg-yellow-50 border border-yellow-200 text-yellow-800">
        <Construction className="w-5 h-5 shrink-0" />
        <div>
          <p className="text-sm font-semibold">Coming Soon</p>
          <p className="text-xs">Marketplace is under development. Listings will be available soon.</p>
        </div>
        <Badge variant="warning" className="ml-auto shrink-0">Beta</Badge>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex border border-[var(--color-border)] rounded-lg overflow-hidden">
          <button onClick={() => setTab('dc')} className={`px-4 py-2 text-sm font-medium ${tab === 'dc' ? 'bg-[var(--color-primary)] text-white' : 'hover:bg-gray-50'}`}>
            <Building2 className="w-4 h-4 inline mr-2" />DC Listings ({dcListings.length})
          </button>
          <button onClick={() => setTab('gpu')} className={`px-4 py-2 text-sm font-medium ${tab === 'gpu' ? 'bg-[var(--color-primary)] text-white' : 'hover:bg-gray-50'}`}>
            <Server className="w-4 h-4 inline mr-2" />GPU Listings ({gpuListings.length})
          </button>
        </div>
        <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
      </div>

      {tab === 'dc' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDc.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-gray-400">No DC listings available</div>
          ) : filteredDc.map((listing) => (
            <Card key={listing._id} elevated>
              <div className="flex items-start justify-between mb-3">
                <Building2 className="w-8 h-8 text-[var(--color-info)]" />
                <Badge variant="success">Approved</Badge>
              </div>
              <h3 className="font-semibold mb-1">{listing.site?.siteName || '—'}</h3>
              <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                <MapPin className="w-3 h-3" />{listing.site?.country || listing.companyCountry}
              </p>
              {listing.site?.totalItLoadMw && (
                <p className="text-xs text-gray-500 flex items-center gap-1"><Zap className="w-3 h-3" />{listing.site.totalItLoadMw} MW IT Load</p>
              )}
              {listing.site?.dcTiering && <Badge variant="default" className="text-xs mt-2">{listing.site.dcTiering}</Badge>}
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGpu.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-gray-400">No GPU listings available</div>
          ) : filteredGpu.map((cluster) => (
            <Card key={cluster._id} elevated>
              <div className="flex items-start justify-between mb-3">
                <Server className="w-8 h-8 text-[var(--color-success)]" />
                <Badge variant="success">Approved</Badge>
              </div>
              <h3 className="font-semibold mb-1">{cluster.vendorName}</h3>
              <p className="text-xs text-gray-500 mb-1">{cluster.gpuTechnology}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />{cluster.location}, {cluster.country}
              </p>
              <p className="text-xs text-gray-500">{cluster.singleClusterSize} GPUs per cluster</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
