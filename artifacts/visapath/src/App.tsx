import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { getToken } from "@/lib/auth";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import VerifyOtp from "@/pages/VerifyOtp";
import Dashboard from "@/pages/Dashboard";
import ApplyCountries from "@/pages/ApplyCountries";
import ApplyVisaType from "@/pages/ApplyVisaType";
import ApplicationForm from "@/pages/ApplicationForm";
import Applications from "@/pages/Applications";
import ApplicationDetail from "@/pages/ApplicationDetail";
import Track from "@/pages/Track";
import NotFound from "@/pages/NotFound";
import { useEffect, useState } from "react";
import { customFetch } from "@/lib/customFetch";

setAuthTokenGetter(() => getToken());

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error: any) => {
        if (error?.status === 401 || error?.status === 404) return false;
        return failureCount < 2;
      },
    },
  },
});

function Router() {
  return (
    <AuthProvider>
      <Layout>
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/verify-otp" component={VerifyOtp} />
          <Route path="/track" component={Track} />

          <Route path="/dashboard">
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          </Route>

          <Route path="/apply">
            <ApplyCountries />
          </Route>

          <Route path="/apply/:countryCode">
            {(params) => <ApplyVisaType key={params.countryCode} />}
          </Route>

          <Route path="/apply/:countryCode/:visaType/form/:id">
            {(params) => (
              <ProtectedRoute>
                <ApplicationForm key={params.id} />
              </ProtectedRoute>
            )}
          </Route>

          <Route path="/applications">
            <ProtectedRoute>
              <Applications />
            </ProtectedRoute>
          </Route>

          <Route path="/applications/:id">
            {(params) => (
              <ProtectedRoute>
                <ApplicationDetail key={params.id} />
              </ProtectedRoute>
            )}
          </Route>

          <Route component={NotFound} />
        </Switch>
      </Layout>
    </AuthProvider>
  );
}

function App() {
  const [googleClientId, setGoogleClientId] = useState("");

  useEffect(() => {
    customFetch<{ googleClientId: string }>("/api/auth/config")
      .then((data) => setGoogleClientId(data.googleClientId))
      .catch(() => {});
  }, []);

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
