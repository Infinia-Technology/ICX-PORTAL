import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import PublicLayout from './components/layout/PublicLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { ROLES } from './config/constants';

// Public pages
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import SupplierRegisterPage from './pages/public/SupplierRegisterPage';
import CustomerRegisterPage from './pages/public/CustomerRegisterPage';
import TermsPage from './pages/public/TermsPage';
import PrivacyPage from './pages/public/PrivacyPage';
import NotFoundPage from './pages/public/NotFoundPage';
import ErrorPage from './pages/public/ErrorPage';
import InviteAcceptPage from './pages/public/InviteAcceptPage';

// Supplier pages
import SupplierDashboard from './pages/supplier/SupplierDashboard';
import DcListingsPage from './pages/supplier/DcListingsPage';
import DcListingNewPage from './pages/supplier/DcListingNewPage';
import DcListingDetailPage from './pages/supplier/DcListingDetailPage';
import DcListingEditPage from './pages/supplier/DcListingEditPage';
import GpuClustersPage from './pages/supplier/GpuClustersPage';
import GpuClusterNewPage from './pages/supplier/GpuClusterNewPage';
import GpuClusterDetailPage from './pages/supplier/GpuClusterDetailPage';
import GpuClusterEditPage from './pages/supplier/GpuClusterEditPage';
import SupplierInventoryPage from './pages/supplier/InventoryPage';
import TeamPage from './pages/supplier/TeamPage';
import SupplierGpuDemandNewPage from './pages/supplier/GpuDemandNewPage';
import SupplierDcRequestNewPage from './pages/supplier/DcRequestNewPage';
import SupplierSettingsPage from './pages/supplier/SupplierSettingsPage';
import KycWaitingPage from './pages/supplier/KycWaitingPage';

// Customer pages
import CustomerDashboard from './pages/customer/CustomerDashboard';
import MarketplacePage from './pages/customer/MarketplacePage';
import GpuDemandsPage from './pages/customer/GpuDemandsPage';
import GpuDemandNewPage from './pages/customer/GpuDemandNewPage';
import DcRequestsPage from './pages/customer/DcRequestsPage';
import DcRequestNewPage from './pages/customer/DcRequestNewPage';
import CustomerSettingsPage from './pages/customer/CustomerSettingsPage';

// Admin pages
import AdminWorkspace from './pages/admin/AdminWorkspace';
import QueuePage from './pages/admin/QueuePage';
import QueueReviewPage from './pages/admin/QueueReviewPage';
import SuppliersPage from './pages/admin/SuppliersPage';
import SupplierDetailPage from './pages/admin/SupplierDetailPage';
import CustomersPage from './pages/admin/CustomersPage';
import CustomerDetailPage from './pages/admin/CustomerDetailPage';
import AdminDcListingsPage from './pages/admin/AdminDcListingsPage';
import DcListingReviewPage from './pages/admin/DcListingReviewPage';
import AdminGpuClustersPage from './pages/admin/AdminGpuClustersPage';
import GpuClusterReviewPage from './pages/admin/GpuClusterReviewPage';
import AdminInventoryPage from './pages/admin/InventoryPage';
import AdminGpuDemandsPage from './pages/admin/AdminGpuDemandsPage';
import GpuDemandDetailPage from './pages/admin/GpuDemandDetailPage';
import AdminDcRequestsPage from './pages/admin/AdminDcRequestsPage';
import DcRequestDetailPage from './pages/admin/DcRequestDetailPage';
import ReadersPage from './pages/admin/ReadersPage';
import AuditLogPage from './pages/admin/AuditLogPage';
import UsersPage from './pages/admin/UsersPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import ReportsPage from './pages/admin/ReportsPage';
import AdminArchivePage from './pages/admin/AdminArchivePage';

// Reader pages
import ReaderMarketplacePage from './pages/reader/ReaderMarketplacePage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register/supplier" element={<SupplierRegisterPage />} />
              <Route path="/register/customer" element={<CustomerRegisterPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/error" element={<ErrorPage />} />
              <Route path="/invite/:token" element={<InviteAcceptPage />} />
            </Route>

            {/* Supplier / Broker routes */}
            <Route element={
              <ProtectedRoute allowedRoles={[ROLES.SUPPLIER, ROLES.BROKER, ROLES.SUBORDINATE]}>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route path="/supplier/dashboard" element={<SupplierDashboard />} />
              <Route path="/supplier/dc-listings" element={<DcListingsPage />} />
              <Route path="/supplier/dc-listings/new" element={<DcListingNewPage />} />
              <Route path="/supplier/dc-listings/:id" element={<DcListingDetailPage />} />
              <Route path="/supplier/dc-listings/:id/edit" element={<DcListingEditPage />} />
              <Route path="/supplier/gpu-clusters" element={<GpuClustersPage />} />
              <Route path="/supplier/gpu-clusters/new" element={<GpuClusterNewPage />} />
              <Route path="/supplier/gpu-clusters/:id" element={<GpuClusterDetailPage />} />
              <Route path="/supplier/gpu-clusters/:id/edit" element={<GpuClusterEditPage />} />
              <Route path="/supplier/inventory" element={<SupplierInventoryPage />} />
              <Route path="/supplier/team" element={<TeamPage />} />
              <Route path="/supplier/gpu-demands/new" element={<SupplierGpuDemandNewPage />} />
              <Route path="/supplier/dc-requests/new" element={<SupplierDcRequestNewPage />} />
              <Route path="/supplier/settings" element={<SupplierSettingsPage />} />
              <Route path="/supplier/kyc-waiting" element={<KycWaitingPage />} />
            </Route>

            {/* Customer routes */}
            <Route element={
              <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route path="/customer/dashboard" element={<CustomerDashboard />} />
              <Route path="/customer/marketplace" element={<MarketplacePage />} />
              <Route path="/customer/gpu-demands" element={<GpuDemandsPage />} />
              <Route path="/customer/gpu-demands/new" element={<GpuDemandNewPage />} />
              <Route path="/customer/dc-requests" element={<DcRequestsPage />} />
              <Route path="/customer/dc-requests/new" element={<DcRequestNewPage />} />
              <Route path="/customer/settings" element={<CustomerSettingsPage />} />
            </Route>

            {/* Admin / Superadmin / Viewer routes */}
            <Route element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.VIEWER]}>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route path="/admin/dashboard" element={<AdminWorkspace />} />
              <Route path="/admin/queue" element={<AdminWorkspace />} />
              <Route path="/admin/queue/:id" element={<QueueReviewPage />} />
              <Route path="/admin/suppliers" element={<SuppliersPage />} />
              <Route path="/admin/suppliers/:id" element={<SupplierDetailPage />} />
              <Route path="/admin/customers" element={<CustomersPage />} />
              <Route path="/admin/customers/:id" element={<CustomerDetailPage />} />
              <Route path="/admin/dc-listings" element={<AdminDcListingsPage />} />
              <Route path="/admin/dc-listings/new" element={<DcListingNewPage />} />
              <Route path="/admin/dc-listings/:id" element={<DcListingReviewPage />} />
              <Route path="/admin/gpu-clusters" element={<AdminGpuClustersPage />} />
              <Route path="/admin/gpu-clusters/new" element={<GpuClusterNewPage />} />
              <Route path="/admin/gpu-clusters/:id" element={<GpuClusterReviewPage />} />
              <Route path="/admin/inventory" element={<AdminInventoryPage />} />
              <Route path="/admin/gpu-demands" element={<AdminGpuDemandsPage />} />
              <Route path="/admin/gpu-demands/:id" element={<GpuDemandDetailPage />} />
              <Route path="/admin/dc-requests" element={<AdminDcRequestsPage />} />
              <Route path="/admin/dc-requests/:id" element={<DcRequestDetailPage />} />
              <Route path="/admin/readers" element={<ReadersPage />} />
              <Route path="/admin/audit-log" element={<AuditLogPage />} />
              <Route path="/admin/users" element={<UsersPage />} />
              <Route path="/admin/reports" element={<ReportsPage />} />
              <Route path="/admin/archives" element={<AdminArchivePage />} />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />
            </Route>

            {/* Reader routes */}
            <Route element={
              <ProtectedRoute allowedRoles={[ROLES.READER]}>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route path="/reader/marketplace" element={<ReaderMarketplacePage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<PublicLayout />}>
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
