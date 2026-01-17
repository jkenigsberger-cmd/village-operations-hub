import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { VillageProvider } from "@/context/VillageContext";
import MainLayout from "@/components/MainLayout";
import TasksToday from "./pages/TasksToday";
import Reservations from "./pages/Reservations";
import Neighborhoods from "./pages/Neighborhoods";
import Neighborhood from "./pages/Neighborhood";
import TentDetail from "./pages/TentDetail";
import Facilities from "./pages/Facilities";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <VillageProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout><TasksToday /></MainLayout>} />
            <Route path="/tasks" element={<MainLayout><TasksToday /></MainLayout>} />
            <Route path="/reservations" element={<MainLayout><Reservations /></MainLayout>} />
            <Route path="/neighborhoods" element={<MainLayout><Neighborhoods /></MainLayout>} />
            <Route path="/neighborhood/:id" element={<Neighborhood />} />
            <Route path="/tent/:id" element={<TentDetail />} />
            <Route path="/facilities" element={<Facilities />} />
            <Route path="/facilities/:areaId" element={<Facilities />} />
            <Route path="/settings" element={<MainLayout><Settings /></MainLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </VillageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
