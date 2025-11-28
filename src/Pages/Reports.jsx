import { useEffect } from "react";
import { useLocation } from "wouter";
import {
  FileText,
  BarChart3,
  Calculator,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { PageNavigation } from "../components/ui/page-navigation";

function Reports() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    document.title = "Reports - Seismic Connect";
  }, []);

  const reportCards = [
    {
      id: "billing-analytics",
      title: "Billing Analytics",
      description: "Visual insights into revenue, CPT usage, and provider performance.",
      icon: BarChart3,
      gradient: "from-blue-600 via-blue-700 to-indigo-700",
      badge: "Dashboard",
      onClick: () => setLocation("/billing-reports"), // route to your BillingReports page
    },
    {
      id: "billing-history",
      title: "Billing History",
      description: "Review invoices, payment status, and historical billing activity.",
      icon: FileText,
      gradient: "from-emerald-600 via-emerald-700 to-teal-700",
      badge: "Transaction Log",
      onClick: () => setLocation("/billing-history"),
    },
    {
      id: "bill-calculation",
      title: "Estimated Billing",
      description: "Simulate billing based on CPT codes, duration, and provider type.",
      icon: Calculator,
      gradient: "from-purple-600 via-purple-700 to-fuchsia-700",
      badge: "Simulation",
      onClick: () => setLocation("/bill-calculation"),
    },
  ];

  return (
    <div className="space-y-6">
      <PageNavigation
        title="Reports"
        subtitle="View billing analytics, history, and estimated billing"
        showDate={true}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {reportCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.id}
              className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
              onClick={card.onClick}
            >
              <CardHeader className={`p-5 bg-gradient-to-r ${card.gradient} text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/15 rounded-xl backdrop-blur-sm group-hover:bg-white/25 transition-colors">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-white">
                        {card.title}
                      </CardTitle>
                      <p className="text-xs text-blue-100 mt-1">
                        {card.badge}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardHeader>
              <CardContent className="p-5 bg-white">
                <p className="text-sm text-gray-700 leading-relaxed mb-4">
                  {card.description}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Click to view details</span>
                  <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                    Open
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default Reports;
