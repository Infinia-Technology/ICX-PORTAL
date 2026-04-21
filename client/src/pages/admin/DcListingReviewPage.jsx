import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import TextArea from '../../components/ui/TextArea';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';
import { LocationLink } from '../../components/ui/LocationInput';
import ListingMembersPanel from '../../components/ui/ListingMembersPanel';

const STATUS_VARIANT = { DRAFT: 'default', SUBMITTED: 'info', IN_REVIEW: 'warning', REVISION_REQUESTED: 'warning', RESUBMITTED: 'warning', APPROVED: 'success', REJECTED: 'error' };

const Field = ({ label, value, flagged }) => (
  <div className={flagged ? 'bg-yellow-50 border border-yellow-200 rounded p-2' : ''}>
    <dt className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">{label}{flagged && ' ⚠'}</dt>
    <dd className="text-sm">{value ?? '—'}</dd>
  </div>
);

const Bool = ({ label, value, flagged }) => (
  <Field label={label} value={value === true ? 'Yes' : value === false ? 'No' : null} flagged={flagged} />
);

const Section = ({ title, children }) => (
  <Card>
    <h2 className="font-semibold mb-4 text-base">{title}</h2>
    <dl className="grid sm:grid-cols-3 gap-x-6 gap-y-4">{children}</dl>
  </Card>
);

export default function DcListingReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('');
  const [flaggedFields, setFlaggedFields] = useState([]);
  const [flagInput, setFlagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/admin/dc-listings/${id}`).then((r) => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const review = async (action) => {
    setSubmitting(true);
    try {
      await api.put(`/admin/dc-listings/${id}/review`, { action, reason, flaggedFields });
      addToast({ type: 'success', message: `DC listing ${action.toLowerCase().replace('_', ' ')}` });
      navigate('/admin/dc-listings');
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Action failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const addFlag = () => {
    if (flagInput && !flaggedFields.includes(flagInput)) {
      setFlaggedFields((p) => [...p, flagInput]);
      setFlagInput('');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!data) return <div className="text-center py-20">Not found</div>;

  const flagSet = new Set(data.sites?.[0]?.flaggedFields || []);
  const isFlagged = (f) => flagSet.has(f);
  const canReview = ['SUBMITTED', 'IN_REVIEW', 'RESUBMITTED'].includes(data.status);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{data.companyLegalEntity || 'DC Listing'}</h1>
          <Badge variant={STATUS_VARIANT[data.status] || 'default'} className="mt-1">{data.status?.replace(/_/g, ' ')}</Badge>
        </div>
        <Button variant="secondary" onClick={() => navigate('/admin/dc-listings')}>Back</Button>
      </div>

      {/* Step 1: Company Details */}
      <Section title="Step 1 — Company Details">
        <Field label="Legal Entity" value={data.companyLegalEntity} />
        <Field label="Office Address" value={data.companyOfficeAddress} />
        <Field label="Country" value={data.companyCountry} />
        <Field label="Contact Name" value={data.contactName} />
        <Field label="Contact Email" value={data.contactEmail} />
        <Field label="Contact Mobile" value={data.contactMobile} />
        <Field label="Other Details" value={data.otherDetails} />
      </Section>

      {/* Render each site */}
      {data.sites?.map((site, idx) => (
        <div key={site._id} className="space-y-6">
          <h2 className="text-xl font-bold mt-4">Site {idx + 1}: {site.siteName || 'Unnamed'}</h2>

          {/* Step 2: Site Details */}
          <Section title="Step 2 — Site Details">
            <Field label="Site Name" value={site.siteName} flagged={isFlagged('siteName')} />
            <Field label="Project Type" value={site.projectType} flagged={isFlagged('projectType')} />
            <Field label="Current Project Status" value={site.currentProjectStatus} flagged={isFlagged('currentProjectStatus')} />
            <Field label="Business Model" value={site.businessModel} flagged={isFlagged('businessModel')} />
            <Field label="Sovereignty Restrictions" value={site.sovereigntyRestrictions} flagged={isFlagged('sovereigntyRestrictions')} />
            <Field label="Regulatory Compliance" value={site.regulatoryCompliance} flagged={isFlagged('regulatoryCompliance')} />
            <Bool label="Air Gapped" value={site.airGapped} />
            <Field label="Land Size" value={site.landSizeSqm ? `${site.landSizeSqm} sqm` : null} />
            <Field label="Building Count" value={site.buildingCount} />
            <Field label="Data Hall Count" value={site.dataHallCount} />
            <Field label="Address" value={site.address} flagged={isFlagged('address')} />
            <Field label="State / Region" value={site.stateRegion} />
            <Field label="Country" value={site.country} />
            <Field label="Google Maps Link" value={<LocationLink value={site.coordinates} />} />
          </Section>

          {/* Step 2b: Master Plan Capacity */}
          <Section title="Step 2b — Master Plan Capacity">
            <Field label="Current Energized" value={site.currentEnergizedMw ? `${site.currentEnergizedMw} MW` : null} />
            <Field label="Total IT Load" value={site.totalItLoadMw ? `${site.totalItLoadMw} MW` : null} />
            <Field label="Total Utility" value={site.totalUtilityMva ? `${site.totalUtilityMva} MVA` : null} />
            <Field label="Total White Space" value={site.totalWhiteSpaceSqm ? `${site.totalWhiteSpaceSqm} sqm` : null} />
            <Bool label="Expansion Possible" value={site.expansionPossible} />
            <Field label="Expansion Capacity" value={site.expansionMw ? `${site.expansionMw} MW` : null} />
          </Section>

          {/* Step 3: DC Specifications */}
          <Section title="Step 3 — DC Specifications">
            <Field label="Max Rack Density" value={site.maxRackDensityKw ? `${site.maxRackDensityKw} kW` : null} />
            <Field label="Typical Rack Density" value={site.typicalRackDensityKw ? `${site.typicalRackDensityKw} kW` : null} />
            <Field label="Cooling Methodology" value={site.coolingMethodology?.join(', ')} />
            <Field label="Liquid Cooling Status" value={site.liquidCoolingStatus} />
            <Field label="Design PUE" value={site.designPue} />
            <Field label="Design WUE" value={site.designWue} />
            <Field label="Floor Max Weight" value={site.floorMaxWeight ? `${site.floorMaxWeight} kg/sqm` : null} />
            <Field label="Land Owner" value={site.landOwner} />
            <Field label="Land Ownership Type" value={site.landOwnershipType} />
            <Field label="Lease Years" value={site.leaseYears} />
            <Field label="Physical Security" value={site.physicalSecurity} />
            <Field label="DC Tiering" value={site.dcTiering} flagged={isFlagged('dcTiering')} />
            <Bool label="DC Tiering Certified" value={site.dcTieringCertified} />
            <Bool label="ISO 27001" value={site.iso27001} />
            <Bool label="ISO 50001" value={site.iso50001} />
            <Bool label="SOC 2" value={site.soc2} />
            <Field label="Other Certifications" value={site.otherCertifications} />
            <Field label="Power Permit Status" value={site.powerPermitStatus} />
            <Field label="Building Permit Status" value={site.buildingPermitStatus} />
            <Field label="Env Permit Status" value={site.envPermitStatus} />
            <Field label="Current Status Detail" value={site.currentStatusDetail} />
            <Field label="Other Spec Details" value={site.otherSpecDetails} />
            <Field label="Fire Suppression Type" value={site.fireSuppressionType} />
            <Field label="Water / Flood Risk" value={site.waterFloodRisk} />
            <Field label="Seismic Risk" value={site.seismicRisk} />
            <Field label="Site Dev GC" value={site.siteDevGC} />
            <Field label="Site Operator" value={site.siteOperator} />
          </Section>

          {/* Step 4: Power Infrastructure */}
          <Section title="Step 4 — Power Infrastructure">
            <Field label="Power Source" value={site.powerSource} flagged={isFlagged('powerSource')} />
            <Field label="Grid Voltage" value={site.gridVoltageKv ? `${site.gridVoltageKv} kV` : null} />
            <Field label="Power Redundancy" value={site.powerRedundancy} flagged={isFlagged('powerRedundancy')} />
            <Field label="Backup Power" value={site.backupPower} />
            <Field label="Backup Power Other" value={site.backupPowerOther} />
            <Field label="Substation Status" value={site.substationStatus} />
            <Field label="Transformer Redundancy" value={site.transformerRedundancy} />
            <Field label="Maintenance Concurrency" value={site.maintenanceConcurrency} />
            <Field label="UPS Autonomy" value={site.upsAutonomyMin ? `${site.upsAutonomyMin} min` : null} />
            <Field label="UPS Topology" value={site.upsTopology} />
            <Field label="Renewable Energy" value={site.renewableEnergyPct != null ? `${site.renewableEnergyPct}%` : null} />
            <Field label="Renewable Types" value={site.renewableTypes?.join(', ')} />
            <Field label="Number of Feeds" value={site.numberOfFeeds} />
            <Field label="A/B Feeds Separated" value={site.abFeedsSeparated} />
            <Field label="Future Reserved Power" value={site.futureReservedPower} />
            <Field label="Curtailment Risk" value={site.curtailmentRisk} />
            <Field label="Power Other Details" value={site.powerOtherDetails} />
          </Section>

          {/* Step 5: Connectivity */}
          <Section title="Step 5 — Connectivity">
            <Bool label="Carrier Neutral" value={site.carrierNeutral} />
            <Field label="Carriers On-Net" value={site.carriersOnNet} />
            <Field label="Carriers Available" value={site.carriersAvailable} />
            <Bool label="Dark Fibre Available" value={site.darkFibreAvailable} />
            <Field label="Fiber Entry Points" value={site.fiberEntryPoints} />
            <Field label="MMR Description" value={site.mmrDescription} />
            <Field label="MMR Redundancy" value={site.mmrRedundancy} />
            <Field label="Connectivity Mapping" value={site.connectivityMapping} />
            <Field label="Distance to IX" value={site.distanceToIxKm ? `${site.distanceToIxKm} km` : null} />
            <Field label="Cross Connect Available" value={site.crossConnectAvail} />
            <Field label="Latency" value={site.latencyMs ? `${site.latencyMs} ms` : null} />
            <Field label="Latency Destination" value={site.latencyDestination} />
            <Field label="Connectivity Other" value={site.connectivityOther} />
          </Section>

          {/* Step 6: Commercial Terms */}
          <Section title="Step 6 — Commercial Terms">
            <Field label="Lease Term Options" value={site.leaseTermOptions} />
            <Field label="Break / Extension Rights" value={site.breakExtensionRights} />
            <Field label="Payment Frequency" value={site.paymentFrequency} />
            <Field label="Deposit Requirement" value={site.depositRequirement} />
            <Field label="Remote Hands Pricing" value={site.remoteHandsPricing} />
            <Field label="Other OPEX" value={site.otherOpex} />
            <Field label="Fit-Out Contribution" value={site.fitOutContribution} />
            <Field label="Make-Good Obligations" value={site.makeGoodObligations} />
            <Field label="Tax / VAT Treatment" value={site.taxVatTreatment} />
            <Field label="Indexation Basis" value={site.indexationBasis} />
          </Section>

          {/* Step 8: Site Financials */}
          <Section title="Step 8 — Site Financials">
            <Field label="Storage Rent" value={site.storageRentUsd ? `$${site.storageRentUsd}/sqm` : null} />
            <Bool label="Tax Incentives" value={site.taxIncentives} />
            <Field label="Annual Escalation" value={site.annualEscalationPct != null ? `${site.annualEscalationPct}%` : null} />
            <Field label="Additional OPEX" value={site.additionalOpex} />
            <Bool label="Insurance by DC" value={site.insuranceByDc} />
            <Bool label="Deposit Required" value={site.depositRequired} />
            <Field label="Power Price Structure" value={site.powerPriceStructure} />
            <Field label="PPA" value={site.ppa} />
            <Field label="Avg Power Price" value={site.avgPowerPriceCents ? `${site.avgPowerPriceCents}¢/kWh` : null} />
            <Field label="Cross Connect Pricing" value={site.crossConnectPricing} />
          </Section>

          {/* Step 9: Remarks */}
          {site.remarks && (
            <Section title="Step 9 — Remarks">
              <div className="sm:col-span-3">
                <p className="text-sm whitespace-pre-wrap">{site.remarks}</p>
              </div>
            </Section>
          )}

          {/* Documents */}
          {site.documents?.length > 0 && (
            <Card>
              <h2 className="font-semibold mb-4">Documents</h2>
              <div className="space-y-2">
                {site.documents.map((doc) => (
                  <div key={doc._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-[var(--radius-md)]">
                    <div>
                      <p className="text-sm font-medium">{doc.fileName}</p>
                      <p className="text-xs text-gray-500">{doc.documentType} — {(doc.fileSize / 1024).toFixed(1)} KB</p>
                    </div>
                    {doc.fileUrl && (
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--color-primary)] hover:underline">View</a>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      ))}

      {/* Review Decision */}
      {canReview && (
        <Card>
          <h2 className="font-semibold mb-4">Review Decision</h2>

          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Flag Fields (for revision)</p>
            <div className="flex gap-2 mb-2">
              <Input placeholder="Field name to flag" value={flagInput} onChange={(e) => setFlagInput(e.target.value)} className="max-w-xs" />
              <Button size="sm" onClick={addFlag} variant="secondary">Add Flag</Button>
            </div>
            {flaggedFields.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {flaggedFields.map((f) => (
                  <span key={f} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded flex items-center gap-1">
                    {f} <button onClick={() => setFlaggedFields((p) => p.filter((x) => x !== f))}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <TextArea label="Reason / Comments" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional notes..." rows={3} />
          <div className="flex gap-3 mt-4">
            <Button onClick={() => review('APPROVE')} loading={submitting} className="bg-green-600 hover:bg-green-700">Approve</Button>
            <Button onClick={() => review('REQUEST_REVISION')} loading={submitting} variant="secondary" className="border-yellow-400 text-yellow-700">Request Revision</Button>
            <Button onClick={() => review('REJECT')} loading={submitting} variant="secondary" className="border-red-400 text-red-600">Reject</Button>
          </div>
        </Card>
      )}

      {/* ── Team Members Panel ── */}
      <ListingMembersPanel
        listingId={id}
        listingName={data.companyLegalEntity || 'DC Listing'}
      />
    </div>
  );
}
