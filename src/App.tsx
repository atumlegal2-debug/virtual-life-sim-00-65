import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { GameProvider } from "@/contexts/GameContext";
import { StoreProvider } from "@/contexts/StoreContext";
import { RelationshipProvider } from "@/contexts/RelationshipContext";
import { FriendshipProvider } from "@/contexts/FriendshipContext";
import { PregnancyProvider } from "@/contexts/PregnancyContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Manager from "./pages/Manager";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <GameProvider>
        <StoreProvider>
          <RelationshipProvider>
            <FriendshipProvider>
              <PregnancyProvider>
                <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/manager" element={<Manager />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
                </TooltipProvider>
              </PregnancyProvider>
            </FriendshipProvider>
          </RelationshipProvider>
        </StoreProvider>
      </GameProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
