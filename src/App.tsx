import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { VillageProvider } from "@/context/VillageContext";
import AuthGate from "@/components/AuthGate";
import { useVipCleanup } from "@/hooks/useVipCleanup";
import Index from "./pages/Index";
import Today from "./pages/Today";
import Neighborhood from "./pages/Neighborhood";
import TentDetail from "./pages/TentDetail";
import Facilities from "./pages/Facilities";
import Activities from "./pages/Activities";
import Settings from "./pages/Settings";
import Kitchen from "./pages/Kitchen";
import AdminGroups from "./pages/AdminGroups";
import AdminGroupEdit from "./pages/AdminGroupEdit";
import AdminIncome from "./pages/AdminIncome";
import AdminExpenses from "./pages/AdminExpenses";
import AdminOutsourced from "./pages/AdminOutsourced";
import AdminReports from "./pages/AdminReports";
import AdminQuotes from "./pages/AdminQuotes";
import AdminGuestForms from "./pages/AdminGuestForms";
import GroupAllocation from "./pages/GroupAllocation";
import UserManagement from "./pages/UserManagement";
import GuestForm from "./pages/GuestForm";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppInner = () => {
  useVipCleanup();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Routes>
        {/* Public route - no auth required */}
        <Route path="/guest-form/:groupId" element={<GuestForm />} />

        {/* All other routes require auth */}
        <Route path="/*" element={
          <AuthGate>
            <TooltipProvider>
              <VillageProvider>
                <AppInner />
                <Toaster />
                <Sonner />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/today" element={<Today />} />
                  <Route path="/neighborhood/:id" element={<Neighborhood />} />
                  <Route path="/tent/:id" element={<TentDetail />} />
                  <Route path="/facilities" element={<Facilities />} />
                  <Route path="/facilities/:areaId" element={<Facilities />} />
                  <Route path="/activities" element={<Activities />} />
                  <Route path="/kitchen" element={<Kitchen />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/admin/groups" element={<AdminGroups />} />
                  <Route path="/admin/groups/:id" element={<AdminGroupEdit />} />
                  <Route path="/admin/income" element={<AdminIncome />} />
                  <Route path="/admin/expenses" element={<AdminExpenses />} />
                  <Route path="/admin/outsourced" element={<AdminOutsourced />} />
                  <Route path="/admin/reports" element={<AdminReports />} />
                  <Route path="/admin/quotes" element={<AdminQuotes />} />
                  <Route path="/admin/guest-forms" element={<AdminGuestForms />} />
                  <Route path="/allocation/:id" element={<GroupAllocation />} />
                  <Route path="/admin/users" element={<UserManagement />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </VillageProvider>
            </TooltipProvider>
          </AuthGate>
        } />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
