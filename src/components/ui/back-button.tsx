import * as React from "react";
import { useState } from "react";
import { Button } from "./button";
import { Badge } from "./badge";
import { ChevronLeft, History } from "lucide-react";

export type DashboardLayout = 'original' | 'compact' | 'expanded';

interface BackButtonProps {
  layouts: Array<{ id: DashboardLayout; name: string }>;
  onLayoutChange: (layout: DashboardLayout) => void;
}

export const BackButton = ({ layouts, onLayoutChange }: BackButtonProps) => {
  const [layout, setLayout] = useState<DashboardLayout>('original');
  const [layoutHistory, setLayoutHistory] = useState<DashboardLayout[]>(['original']);

  const handleLayoutChange = (newLayout: DashboardLayout) => {
    if (newLayout !== layout) {
      setLayoutHistory(prev => [...prev, newLayout]);
      setLayout(newLayout);
      onLayoutChange(newLayout);
    }
  };

  const handleBackNavigation = () => {
    if (layoutHistory.length > 1) {
      const newHistory = [...layoutHistory];
      newHistory.pop(); // Remove current layout
      const previousLayout = newHistory[newHistory.length - 1];
      setLayoutHistory(newHistory);
      setLayout(previousLayout);
      onLayoutChange(previousLayout);
    }
  };

  const canGoBack = layoutHistory.length > 1;
  const currentLayoutName = layouts.find(l => l.id === layout)?.name || 'Dashboard';

  if (!canGoBack) return null;

  return (
    <div className="relative group">
      <Button 
        onClick={handleBackNavigation}
        className="relative overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-6 py-2"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative flex items-center space-x-2">
          <div className="relative">
            <ChevronLeft className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" />
            <div className="absolute inset-0 animate-pulse">
              <ChevronLeft className="w-5 h-5 opacity-30" />
            </div>
          </div>
          <span className="font-medium transition-all duration-300 group-hover:tracking-wide">
            Go Back
          </span>
        </div>
      </Button>
      
      {/* Interactive breadcrumb trail */}
      <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50 min-w-max">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <History className="w-4 h-4" />
          <span>Navigation Trail:</span>
        </div>
        <div className="flex items-center space-x-1 mt-2">
          {layoutHistory.map((historyLayout, index) => (
            <div key={index} className="flex items-center">
              <Badge 
                variant={index === layoutHistory.length - 1 ? "default" : "secondary"}
                className={`text-xs cursor-pointer transition-colors duration-200 ${
                  index === layoutHistory.length - 1 
                    ? "bg-blue-500 text-white" 
                    : "hover:bg-gray-200"
                }`}
                onClick={() => {
                  const newHistory = layoutHistory.slice(0, index + 1);
                  setLayoutHistory(newHistory);
                  setLayout(historyLayout);
                  onLayoutChange(historyLayout);
                }}
              >
                {layouts.find(l => l.id === historyLayout)?.name}
              </Badge>
              {index < layoutHistory.length - 1 && (
                <ChevronLeft className="w-3 h-3 text-gray-400 rotate-180 mx-1" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 