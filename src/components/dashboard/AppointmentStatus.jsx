import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { FaCheckCircle, FaClock, FaHourglassHalf, FaUserTimes } from "react-icons/fa";

const STATUS_CARDS = [
  {
    key: "completed",
    label: "Completed",
    color: "#D1FADF",
    text: "#039855",
    icon: <FaCheckCircle className="text-green-500" />,
  },
  {
    key: "inProgress",
    label: "In Progress",
    color: "#E0F2FE",
    text: "#2563EB",
    icon: <FaClock className="text-blue-500" />,
  },
  {
    key: "waiting",
    label: "Waiting",
    color: "#FEF9C3",
    text: "#EAB308",
    icon: <FaHourglassHalf className="text-yellow-500" />,
  },
  {
    key: "noShow",
    label: "No-Show",
    color: "#FEE2E2",
    text: "#EF4444",
    icon: <FaUserTimes className="text-red-500" />,
  },
];

const COLORS = ["#22C55E", "#3B82F6", "#FACC15", "#EF4444"];

const AppointmentStatus = ({ date = format(new Date(), "yyyy-MM-dd") }) => {
  const { data: stats, isLoading } = useQuery({
    queryKey: [`/api/stats/appointments/${date}`],
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow p-6 min-h-[220px] animate-pulse">
        <div className="h-6 w-1/3 bg-neutral-200 rounded mb-4"></div>
        <div className="grid grid-cols-1 gap-3 mb-6">
          <div className="h-12 bg-neutral-200 rounded"></div>
          <div className="h-12 bg-neutral-200 rounded"></div>
          <div className="h-12 bg-neutral-200 rounded"></div>
          <div className="h-12 bg-neutral-200 rounded"></div>
        </div>
        <div className="h-32 w-full bg-neutral-200 rounded-full"></div>
      </div>
    );
  }

  const totalAppointments = stats?.totalAppointments || 0;
  const completed = stats?.statusBreakdown?.completed || 0;
  const inProgress = stats?.statusBreakdown?.inProgress || 0;
  const waiting = stats?.statusBreakdown?.waiting || 0;
  const noShow = stats?.statusBreakdown?.noShow || 0;

  const data = [
    { name: "Completed", value: completed },
    { name: "In Progress", value: inProgress },
    { name: "Waiting", value: waiting },
    { name: "No-Show", value: noShow },
  ];

  return (
    <div className="bg-white rounded-xl shadow p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="text-lg font-semibold text-gray-800">Status Overview</div>
        <div className="bg-green-100 p-2 rounded-full">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="8" fill="#22C55E" opacity="0.15"/><path d="M12 8v4l3 2" stroke="#22C55E" strokeWidth="2" strokeLinecap="round"/></svg>
        </div>
      </div>
      <div className="flex flex-col gap-3 mb-6">
        {STATUS_CARDS.map((card, idx) => (
          <div key={card.key} className="flex items-center justify-between rounded-lg px-4 py-3" style={{ background: card.color }}>
            <div className="flex items-center gap-2 font-medium" style={{ color: card.text }}>
              {card.icon}
              {card.label}
            </div>
            <div className="text-lg font-bold" style={{ color: card.text }}>
              {data[idx].value}
            </div>
          </div>
        ))}
      </div>
      <div className="flex-1 flex items-center justify-center">
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={65}
              paddingAngle={2}
              dataKey="value"
              isAnimationActive={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AppointmentStatus;
