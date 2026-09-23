import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 
'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
// Add page imports here
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Fleet from '@/pages/Fleet';
import Drivers from '@/pages/Drivers';
import Loads from '@/pages/Loads';
import DriverLayout from '@/components/DriverLayout';
import DriverHome from '@/pages/driver/DriverHome';
import DriverInspection from '@/pages/driver/Inspection';
import DriverLoadManagement from '@/pages/driver/LoadManagement';
import DriverFuel from '@/pages/driver/Fuel';
import DriverBreakdown from '@/pages/driver/Breakdown';
import Production from '@/pages/Production';
import Compliance from '@/pages/Compliance';
import Weighbill from '@/pages/Weighbill';
import Engineering from '@/pages/Engineering';
import Stores from '@/pages/Stores';
import HR from '@/pages/HR';
import Safety from '@/pages/Safety';
import Finance from '@/pages/Finance';
import Insights from '@/pages/Insights';
import Reports from '@/pages/Reports';
import ClientPortal from '@/pages/ClientPortal';
import Integrations from '@/pages/Integrations';
import Admin from '@/pages/Admin';
import Billing from '@/pages/Billing';
import BusinessDirectory from '@/pages/BusinessDirectory';
import Onboarding from '@/pages/Onboarding';
import ClockInGate from '@/components/ClockInGate';
import ComplianceOps from '@/pages/ComplianceOps';

const AuthenticatedApp = () => {
 const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } 
= useAuth();

 if (isLoadingPublicSettings || isLoadingAuth) {
 return (
 <div className="fixed inset-0 flex items-center justify-center">
 <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800  rounded-full animate-spin"></div>
 </div>
 );
 }

 if (authError) {
 if (authError.type === 'user_not_registered') {
 return <UserNotRegisteredError />;
 } else if (authError.type === 'auth_required') {
 navigateToLogin();
 return null;
 }
 }

 return (
 <Routes>
 <Route path="/login" element={<Login />} />
 <Route path="/register" element={<Register />} />
 <Route path="/forgot-password" element={<ForgotPassword />} />
 <Route path="/reset-password" element={<ResetPassword />} />
 <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" 
replace />} />}>
 <Route element={<Layout />}>
 <Route path="/" element={<ClockInGate><Dashboard /></ClockInGate>} />
 <Route path="/fleet" element={<Fleet />} />
 <Route path="/drivers" element={<Drivers />} />
 <Route path="/loads" element={<Loads />} />
 <Route path="/production" element={<Production />} />
 <Route path="/compliance" element={<Compliance />} />
 <Route path="/weighbill" element={<Weighbill />} />
 <Route path="/engineering" element={<Engineering />} />
 <Route path="/stores" element={<Stores />} />
 <Route path="/hr" element={<HR />} />
 <Route path="/safety" element={<Safety />} />
 <Route path="/finance" element={<Finance />} />
 <Route path="/insights" element={<Insights />} />
 <Route path="/reports" element={<Reports />} />
 <Route path="/portal" element={<ClientPortal />} />
 <Route path="/integrations" element={<Integrations />} />
 <Route path="/admin" element={<Admin />} />
 <Route path="/billing" element={<Billing />} />
 <Route path="/directory" element={<BusinessDirectory />} />
 <Route path="/onboarding" element={<Onboarding />} />
 <Route path="/compliance-ops" element={<ComplianceOps />} />
 </Route>
 <Route path="/driver" element={<DriverLayout />}>
 <Route index element={<DriverHome />} />
 <Route path="inspect" element={<DriverInspection />} />
 <Route path="load" element={<DriverLoadManagement />} />
 <Route path="fuel" element={<DriverFuel />} />
 <Route path="report" element={<DriverBreakdown />} />
 </Route>
 </Route>
 <Route path="*" element={<PageNotFound />} />
 </Routes>
 );
};


function App() {

 return (
 <AuthProvider>
 <QueryClientProvider client={queryClientInstance}>
 <Router>
 <ScrollToTop />
 <AuthenticatedApp />
 </Router>
 <Toaster />
 </QueryClientProvider>
 </AuthProvider>
 )

}

export default App
