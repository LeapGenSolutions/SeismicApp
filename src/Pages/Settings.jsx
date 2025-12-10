import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ChevronRight, Shield, Database, Settings as SettingsIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { PageNavigation } from "../components/ui/page-navigation";

// Athena Logo Component
function AthenaLogo({ size = 64, className = "", animated = true }) {
  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className={`${animated ? 'transition-all duration-300' : ''}`}
      >
        <defs>
          <linearGradient id="athenaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0891b2" stopOpacity="1" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="1" />
            <stop offset="100%" stopColor="#67e8f9" stopOpacity="1" />
          </linearGradient>
        </defs>
        
        {/* Main circle background */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="url(#athenaGradient)"
          className={`${animated ? 'transition-all duration-300' : ''}`}
        />
        
        {/* Inner ring */}
        <circle
          cx="50"
          cy="50"
          r="35"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          opacity="0.4"
        />
        
        {/* Medical heartbeat line */}
        <g transform="translate(50, 50)">
          <path
            d="M -20 0 L -15 0 L -12 -8 L -8 12 L -4 -15 L 0 8 L 4 -6 L 8 0 L 20 0"
            stroke="white"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`${animated ? 'transition-all duration-300' : ''}`}
          />
        </g>
        
        {/* Medical cross - small and subtle */}
        <g transform="translate(50, 28)">
          <rect
            x="-1.5"
            y="-6"
            width="3"
            height="12"
            fill="white"
            rx="1.5"
            opacity="0.8"
          />
          <rect
            x="-6"
            y="-1.5"
            width="12"
            height="3"
            fill="white"
            rx="1.5"
            opacity="0.8"
          />
        </g>
        
        {/* Data dots around the circle */}
        <g className={`${animated ? 'transition-all duration-300' : ''}`}>
          <circle cx="75" cy="35" r="2" fill="white" opacity="0.6" />
          <circle cx="75" cy="65" r="2" fill="white" opacity="0.6" />
          <circle cx="25" cy="35" r="2" fill="white" opacity="0.6" />
          <circle cx="25" cy="65" r="2" fill="white" opacity="0.6" />
        </g>
      </svg>
    </div>
  );
}

function Settings() {
  const [, setLocation] = useLocation();
  const [athenaStatus, setAthenaStatus] = useState('pending');

  useEffect(() => {
    document.title = "Settings - Seismic Connect";

    // Check if user is returning from Athena integration
    const urlParams = new URLSearchParams(window.location.search);
    const fromAthena = urlParams.get('fromAthena');
    if (fromAthena === 'configured') {
      setAthenaStatus('configured');
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleCardClick = (path) => {
    setLocation(path);
  };

  const getAthenaStatusDisplay = () => {
    switch (athenaStatus) {
      case 'configured':
        return {
          text: 'Configured',
          color: 'bg-green-50 text-green-700 border-green-200',
          dotColor: 'bg-green-500'
        };
      case 'connected':
        return {
          text: 'Connected',
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dotColor: 'bg-emerald-500'
        };
      default:
        return {
          text: 'Configuration Required',
          color: 'bg-amber-50 text-amber-700 border-amber-200',
          dotColor: 'bg-yellow-500'
        };
    }
  };

  const athenaStatusInfo = getAthenaStatusDisplay();

  return (
    <div className="px-4 pb-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <PageNavigation
          showBackButton={true}
          title="Settings"
          subtitle="Manage integrations, billing, and configuration"
          showDate={false}
        />

        {/* Main Integration Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Athena Health Integration Card */}
          <Card
            className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
            onClick={() => handleCardClick('/athena-integration')}
          >
            <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                    <AthenaLogo size={32} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl font-bold text-white mb-1">
                      Athena Health Integration
                    </CardTitle>
                    <p className="text-blue-100 text-sm leading-relaxed">
                      Connect and configure your Athena Health system for seamless data synchronization
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
              </div>
            </CardHeader>
            <CardContent className="p-6 bg-white">
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 text-lg">Key Features</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-3 text-sm text-gray-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                      <span>Portal Authentication</span>
                    </li>
                    <li className="flex items-center gap-3 text-sm text-gray-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                      <span>API Key Management</span>
                    </li>
                  </ul>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Status:</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 ${athenaStatusInfo.dotColor} rounded-full`}></div>
                    <span className="text-sm text-gray-600">{athenaStatusInfo.text}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment & Billing Management Card */}
          <Card
            className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
            onClick={() => handleCardClick('/payment-billing')}
          >
            <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                    <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center">
                      <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl font-bold text-white mb-1">
                      Payment & Billing Management
                    </CardTitle>
                    <p className="text-blue-100 text-sm leading-relaxed">
                      Configure secure payment processing and billing preferences with PCI-DSS compliance
                      </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
              </div>
            </CardHeader>
            <CardContent className="p-6 bg-white">
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 text-lg">Key Features</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-3 text-sm text-gray-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                      <span>Credit Card Processing</span>
                    </li>
                    <li className="flex items-center gap-3 text-sm text-gray-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                      <span>Venmo Integration</span>
                    </li>
                    <li className="flex items-center gap-3 text-sm text-gray-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                      <span>PayPal Setup</span>
                    </li>
                  </ul>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Status:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Configuration Required</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Configuration Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Additional Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Security Settings */}
            <Card className="border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Shield className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Security Settings</h3>
                    <p className="text-sm text-gray-600">Manage access controls</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Management */}
            <Card className="border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Database className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Data Management</h3>
                    <p className="text-sm text-gray-600">Backup and sync options</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Preferences */}
            <Card className="border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <SettingsIcon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">System Preferences</h3>
                  <p className="text-sm text-gray-600">General configuration</p>
                </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
