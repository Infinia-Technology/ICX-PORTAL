import { useState, useEffect } from 'react';
import { Building2, Server, MapPin, Zap, Construction, Rocket, ShoppingBag } from 'lucide-react';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Input from '../../components/ui/Input';
import { LocationLink } from '../../components/ui/LocationInput';
import { FEATURE_FLAGS } from '../../config/constants';

// Coming Soon UI — shown when marketplace feature flag is off
function ComingSoonView() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md mx-auto">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mx-auto mb-6">
          <Rocket className="w-10 h-10 text-[var(--color-primary)]" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Marketplace Coming Soon</h1>
        <p className="text-[var(--color-text-secondary)] mb-2">
          We are working hard to bring this feature to you.
        </p>
        <p className="text-sm text-[var(--color-text-muted)] mb-8">
          Browse and purchase data center capacity and GPU compute directly from verified suppliers. Stay tuned for updates.
        </p>
        <Button disabled className="opacity-50 cursor-not-allowed">
          <ShoppingBag className="w-4 h-4" /> Explore Marketplace
        </Button>
        <div className="mt-8 grid grid-cols-2 gap-4">
          <Card className="text-center py-4">
            <Building2 className="w-6 h-6 text-[var(--color-info)] mx-auto mb-2" />
            <p className="text-xs font-semibold">DC Listings</p>
            <p className="text-[10px] text-[var(--color-text-muted)]">Data center capacity</p>
          </Card>
          <Card className="text-center py-4">
            <Server className="w-6 h-6 text-[var(--color-success)] mx-auto mb-2" />
            <p className="text-xs font-semibold">GPU Listings</p>
            <p className="text-[10px] text-[var(--color-text-muted)]">GPU compute clusters</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Full marketplace view — shown when feature flag is on
function MarketplaceView() {
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

  const filteredDc = dcListings.filter((l) =>
    !search || l.site?.country?.toLowerCase().includes(search.toLowerCase()) ||
    l.companyLegalEntity?.toLowerCase().includes(search.toLowerCase()) ||
    l.site?.siteName?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredGpu = gpuListings.filter((c) =>
    !search || c.country?.toLowerCase().includes(search.toLowerCase()) ||
    c.gpuTechnology?.toLowerCase().includes(search.toLowerCase()) ||
    c.vendorName?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Marketplace</h1>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1">Browse approved data center and GPU listings</p>
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
        <Input placeholder="Search by location, name..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
      </div>

      {tab === 'dc' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDc.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-gray-400">No DC listings found</div>
          ) : filteredDc.map((listing) => (
            <Card key={listing._id} elevated className="hover:border-[var(--color-primary)] transition-colors">
              <div className="flex items-start justify-between mb-3">
                <Building2 className="w-8 h-8 text-[var(--color-info)]" />
                <Badge variant="success">Approved</Badge>
              </div>
              <h3 className="font-semibold mb-1">{listing.site?.siteName || listing.companyLegalEntity}</h3>
              <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                <MapPin className="w-3 h-3" />{listing.site?.country || listing.companyCountry}
              </p>
              {listing.site?.totalItLoadMw && (
                <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                  <Zap className="w-3 h-3" />{listing.site.totalItLoadMw} MW IT Load
                </p>
              )}
              {listing.site?.businessModel && <Badge variant="default" className="text-xs mb-3">{listing.site.businessModel}</Badge>}
              {listing.site?.coordinates && (
                <div className="mt-2 text-xs"><LocationLink value={listing.site.coordinates} /></div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGpu.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-gray-400">No GPU listings found</div>
          ) : filteredGpu.map((cluster) => (
            <Card key={cluster._id} elevated className="hover:border-[var(--color-primary)] transition-colors">
              <div className="flex items-start justify-between mb-3">
                <Server className="w-8 h-8 text-[var(--color-success)]" />
                <Badge variant="success">Approved</Badge>
              </div>
              <h3 className="font-semibold mb-1">{cluster.vendorName}</h3>
              <p className="text-xs text-gray-500 mb-1">{cluster.gpuTechnology}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                <MapPin className="w-3 h-3" />{cluster.location}, {cluster.country}
              </p>
              <p className="text-xs text-gray-500">{cluster.singleClusterSize} GPUs per cluster</p>
              {cluster.googleMapsLink && (
                <div className="mt-2 text-xs"><LocationLink value={cluster.googleMapsLink} /></div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Route handler — renders based on feature flag
export default function MarketplacePage() {
  if (!FEATURE_FLAGS.MARKETPLACE_LIVE) return <ComingSoonView />;
  return <MarketplaceView />;
}
