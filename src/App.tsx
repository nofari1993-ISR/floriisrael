import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import AIChatPage from "./pages/AIChatPage";
import DIYBuilderPage from "./pages/DIYBuilderPage";
import Checkout from "./pages/Checkout";
import Dashboard from "./pages/Dashboard";
import AdminPermissions from "./pages/AdminPermissions";
import Terms from "./pages/Terms";
import ResetPassword from "./pages/ResetPassword";
import ShopLanding from "./pages/ShopLanding";
import ShopsPage from "./pages/ShopsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/ai-chat" element={<AIChatPage />} />
          <Route path="/diy-builder" element={<DIYBuilderPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin/permissions" element={<AdminPermissions />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/shop/:shopId" element={<ShopLanding />} />
          <Route path="/shops" element={<ShopsPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
