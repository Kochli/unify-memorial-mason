
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import UnifiedInbox from "./pages/dashboard/UnifiedInbox";
import MapView from "./pages/dashboard/MapView";
import Orders from "./pages/dashboard/Orders";
import Invoicing from "./pages/dashboard/Invoicing";
import Reporting from "./pages/dashboard/Reporting";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />}>
            <Route path="inbox" element={<UnifiedInbox />} />
            <Route path="map" element={<MapView />} />
            <Route path="orders" element={<Orders />} />
            <Route path="invoicing" element={<Invoicing />} />
            <Route path="reporting" element={<Reporting />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
