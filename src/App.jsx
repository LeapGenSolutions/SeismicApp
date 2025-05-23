import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";

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


function Router() {
  const queryParams = new URLSearchParams(window.location.search);
  const role = queryParams.get("role");

  return (
    <div className="h-screen flex overflow-hidden">
      {role !== "patient" && <Sidebar />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-neutral-50 p-6">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/appointments" component={Appointments} />
            <Route path="/video-call" component={VideoRecorder} />
            <Route path="/patients" component={Patients} />
            <Route path="/reports" component={Reports} />
            <Route path="/settings" component={Settings} />
            <Route path="/meeting-room" component={StreamVideoCoreV2} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function Main() {
  const isAuthenticated = useIsAuthenticated();
  const { instance, accounts } = useMsal();
  const [hasRole, setHasRole] = useState(false)

  function requestProfileData() {
    // Silently acquires an access token which is then attached to a request for MS Graph data
    instance
      .acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      })
      .then((response) => {
        console.log(response.idTokenClaims);
        if (response.idTokenClaims.roles && "SeismicDoctors" in response.idTokenClaims.roles) {
          setHasRole(true)
        }
      });
  }

  useEffect(() => {
    if (isAuthenticated) {
      requestProfileData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])
  return (
    <>
      {!hasRole ? <AuthenticatedTemplate>
        <QueryClientProvider client={queryClient}>
          <Router />
          <Toaster />
        </QueryClientProvider>
      </AuthenticatedTemplate> :
        <AuthenticatedTemplate>
          Sign is successful but you dont previlaged role to view this app. Try contacting your admin
        </AuthenticatedTemplate>
      }
      <UnauthenticatedTemplate>
        <h5 className="card-title">Please sign-in to see your profile information.</h5>
        <SignInButton />
      </UnauthenticatedTemplate>
    </>
  )
}

function App() {

  return (
    <Provider store={store}>
      <div className="App">
        <Main />
      </div>
    </Provider>
  );
}

export default App;
