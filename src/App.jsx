import { Router as WouterRouter, Switch, Route, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import PostCallDocumentation from "./Pages/PostCallDocumentation";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import Dashboard from "./Pages/Dashboard";
import Appointments from "./Pages/Appointments";
import Patients from "./Pages/Patients";
import Reports from "./Pages/Reports";
import Settings from "./Pages/Settings";
import NotFound from "./Pages/not-found";
import VideoRecorder from "./Pages/VideoRecorder";
import { AuthenticatedTemplate, UnauthenticatedTemplate, useIsAuthenticated, useMsal } from "@azure/msal-react";
import { SignInButton } from "./components/SignInButton";
import { useEffect, useState } from "react";
import { loginRequest } from "./authConfig";
// import StreamVideoCore from "./components/StreamVideoCore";
import StreamVideoCoreV2 from "./components/StreamVideoCoreV2";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import Login from "./Pages/Login";
import PatientJoinPage from "./components/PatientJoinPage";

// Move this OUTSIDE Main() so it's not re-created every render
const queryClient = new QueryClient();

function Router() {
  const queryParams = new URLSearchParams(window.location.search);
  const role = queryParams.get("role");

  const [location] = useLocation(); // <== Add this
  const isLoginPage = location === "/login"; // <== Add this

  if (isLoginPage) return <Login />; // <== Add this block

  return (
    <div className="h-screen flex overflow-hidden">
      {role !== "patient" && <Sidebar />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-neutral-50 p-6">
          <Switch>
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/appointments" component={Appointments} />
            <Route path="/video-call" component={VideoRecorder} />
            <Route path="/patients" component={Patients} />
            <Route path="/reports" component={Reports} />
            <Route path="/settings" component={Settings} />
            <Route path="/meeting-room" component={StreamVideoCoreV2} />
            <Route path="/post-call" component={PostCallDocumentation} />
            <Route path="/logout" component={LogoutRedirect} />
            <Route path="/join-as-patient/:meetingId" component={PatientJoinPage} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function Main() {
  const [location, setLocation] = useLocation();
  const isLoginPage = location === "/login";

  const isAuthenticated = useIsAuthenticated();
  const { instance, accounts } = useMsal();
  const [hasRole, setHasRole] = useState(false);
  const isGuest = localStorage.getItem("isGuest") === "true";

  useEffect(() => {
    if (isAuthenticated) {
      instance
        .acquireTokenSilent({
          ...loginRequest,
          account: accounts[0],
        })
        .then((response) => {
          if (
            response.idTokenClaims.roles &&
            response.idTokenClaims.roles.includes("SeismicDoctors")
          ) {
            setHasRole(true);
          }
        });
    }
  }, [isAuthenticated, instance, accounts]);

  // ✅ Redirect to login if not authenticated and not a guest
  useEffect(() => {
    if (location === "/" && !isLoginPage) {
      if (!isGuest && !isAuthenticated) {
        setLocation("/login");
      } else if (isGuest || hasRole) {
        setLocation("/dashboard");
      }
    }
  }, [location, isLoginPage, isGuest, isAuthenticated, hasRole, setLocation]);

  if (isLoginPage) return null;

  if (isGuest || hasRole) {
    return (
      <QueryClientProvider client={queryClient}>
        <Router />
        <Toaster />
      </QueryClientProvider>
    );
  }

  if (isAuthenticated && !hasRole) {
    return (
      <AuthenticatedTemplate>
        Sign-in successful, but you don't have the privileged role. Contact admin.
      </AuthenticatedTemplate>
    );
  }

  return (
    <UnauthenticatedTemplate>
      <h5 className="card-title">Please sign in to see your profile information.</h5>
      <SignInButton />
    </UnauthenticatedTemplate>
  );
}

function App() {
  return (
    <WouterRouter> {/* ✅ Correct usage */}
      <AppWithRouting />
    </WouterRouter>
  );
}

function AppWithRouting() {
  const [location] = useLocation();
  const isLoginPage = location === "/login";

  if (isLoginPage) {
    return <Login />;
  }

  return (
    <Provider store={store}>
      <div className="App">
        <Main />
      </div>
    </Provider>
  );
}


function LogoutRedirect() {
  const { instance } = useMsal();

  useEffect(() => {
    localStorage.removeItem("isGuest");
    instance.logoutRedirect({
      postLogoutRedirectUri: `${window.location.origin}/login`,
    });
  }, [instance]);

  return null; 
}

export default App;
