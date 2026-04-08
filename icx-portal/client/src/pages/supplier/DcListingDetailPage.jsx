import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { LocationLink } from '../../components/ui/LocationInput';

const STATUS_VARIANT = { DRAFT: 'default', SUBMITTED: 'info', IN_REVIEW: 'warning', REVISION_REQUESTED: 'warning', RESUBMITTED: 'info', APPROVED: 'success', REJECTED: 'error' };

const Field = ({ label, value }) => (
  <div>
    <dt className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">{label}</dt>
    <dd className="text-sm">{value || <span className="text-gray-400">—</span>}</dd>
  </div>
);

export default function DcListingDetailPage() {
  const { id } = useParams();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/dc-applications/${id}`).then((r) => setApp(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!app) return <div className="text-center py-20">DC listing not found</div>;

  const site = app.sites?.[0];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{app.companyLegalEntity || 'DC Listing'}</h1>
          <p className="text-gray-500 text-sm mt-1">Created {new Date(app.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={STATUS_VARIANT[app.status] || 'default'}>{app.status?.replace(/_/g, ' ')}</Badge>
          {['DRAFT', 'REVISION_REQUESTED'].includes(app.status) && (
            <Link to={`/supplier/dc-listings/${id}/edit`}><Button>Edit</Button></Link>
          )}
        </div>
      </div>

      <Card>
        <h2 className="font-semibold mb-4">Company Details</h2>
        <dl className="grid sm:grid-cols-3 gap-4">
          <Field label="Legal Entity" value={app.companyLegalEntity} />
          <Field label="Country" value={app.companyCountry} />
          <Field label="Contact Name" value={app.contactName} />
          <Field label="Contact Email" value={app.contactEmail} />
          <Field label="Contact Mobile" value={app.contactMobile} />
        </dl>
      </Card>

      {site && (
        <>
          <Card>
            <h2 className="font-semibold mb-4">Site Details — {site.siteName}</h2>
            <dl className="grid sm:grid-cols-3 gap-4">
              <Field label="Project Type" value={site.projectType} />
              <Field label="Status" value={site.currentProjectStatus} />
              <Field label="Business Model" value={site.businessModel} />
              <Field label="Address" value={site.address} />
              <Field label="Country" value={site.country} />
              <Field label="Google Maps Link" value={<LocationLink value={site.coordinates} />} />
              <Field label="Total IT Load" value={site.totalItLoadMw ? `${site.totalItLoadMw} MW` : null} />
              <Field label="Total White Space" value={site.totalWhiteSpaceSqm ? `${site.totalWhiteSpaceSqm} sqm` : null} />
              <Field label="DC Tiering" value={site.dcTiering} />
            </dl>
          </Card>

          <Card>
            <h2 className="font-semibold mb-4">Power Infrastructure</h2>
            <dl className="grid sm:grid-cols-3 gap-4">
              <Field label="Power Source" value={site.powerSource} />
              <Field label="Power Redundancy" value={site.powerRedundancy} />
              <Field label="Backup Power" value={site.backupPower} />
              <Field label="Design PUE" value={site.designPue} />
              <Field label="Renewable Energy" value={site.renewableEnergyPct ? `${site.renewableEnergyPct}%` : null} />
            </dl>
          </Card>

          <Card>
            <h2 className="font-semibold mb-4">Commercial Terms</h2>
            <dl className="grid sm:grid-cols-3 gap-4">
              <Field label="Storage Rent (USD/sqm)" value={site.storageRentUsd} />
              <Field label="Avg Power Price" value={site.avgPowerPriceCents ? `${site.avgPowerPriceCents} ¢/kWh` : null} />
              <Field label="Power Price Structure" value={site.powerPriceStructure} />
              <Field label="Payment Frequency" value={site.paymentFrequency} />
              <Field label="Annual Escalation" value={site.annualEscalationPct ? `${site.annualEscalationPct}%` : null} />
            </dl>
          </Card>
        </>
      )}

      {app.status === 'REVISION_REQUESTED' && site?.flaggedFields?.length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <h2 className="font-semibold text-yellow-800 mb-3">Revision Required</h2>
          <p className="text-sm text-yellow-700 mb-2">The following fields need to be updated:</p>
          <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
            {site.flaggedFields.map((f) => <li key={f}>{f}</li>)}
          </ul>
          <Link to={`/supplier/dc-listings/${id}/edit`} className="mt-4 inline-block">
            <Button>Edit Listing</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
