import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import ReferEarn from "./pages/ReferEarn";
import Login from "./pages/Login";
import OtpVerify from "./pages/OtpVerify";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import Terms from "./pages/Terms";
import Profile from "./pages/Profile";
import KycVerification from "./pages/KycVerification";
import Wallet from "./pages/Wallet";
import History from "./pages/History";
import Support from "./pages/Support";
import DepositMoney from "./pages/DepositMoney";
import WithdrawMoney from "./pages/WithdrawMoney";
import ClassicLudo from "./pages/ClassicLudo";
import TransactionHistory from "./pages/TransactionHistory";
import AdminDashboard from "./pages/AdminDashboard";
import GameHistory from "./pages/GameHistory";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/refer-earn" element={<ReferEarn />} />
            <Route path="/login" element={<Login />} />
            <Route path="/otp-verify" element={<OtpVerify />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/kyc-verification" element={<KycVerification />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/history" element={<History />} />
            <Route path="/support" element={<Support />} />
            <Route path="/wallet/deposit" element={<DepositMoney />} />
            <Route path="/wallet/withdraw" element={<WithdrawMoney />} />
            <Route path="/wallet/history" element={<TransactionHistory />} />
            <Route path="/classic-ludo" element={<ClassicLudo />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/game-history" element={<GameHistory />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
