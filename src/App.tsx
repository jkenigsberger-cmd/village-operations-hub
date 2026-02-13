import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { VillageProvider } from "@/context/VillageContext";
import PasswordGate from "@/components/PasswordGate";
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
import GroupAllocation from "./pages/GroupAllocation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <PasswordGate>
      <TooltipProvider>
        <VillageProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
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
              <Route path="/allocation/:id" element={<GroupAllocation />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </VillageProvider>
      </TooltipProvider>
    </PasswordGate>
  </QueryClientProvider>
);

export default App;
