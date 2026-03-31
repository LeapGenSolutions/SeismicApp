import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { format } from "date-fns";

const emptyStats = {
  totalAppointments: 0,
  inPersonAppointments: 0,
  virtualAppointments: 0,
};

const emptyRiskTier = {
  high: 0,
  medium: 0,
  low: 0,
};

const normalizeText = (value = "") => String(value || "").trim().toLowerCase();

const normalizeKey = (value = "") => normalizeText(value).replace(/[\s_-]/g, "");

const getTodayKey = (propDate, localTodayKey, utcTodayKey) => {
  if (propDate instanceof Date) {
    return format(propDate, "yyyy-MM-dd");
  }

  if (typeof propDate === "string") {
    if (propDate === utcTodayKey && localTodayKey !== utcTodayKey) {
      return localTodayKey;
    }
    return propDate;
  }

  return localTodayKey;
};

const getTodayAppointments = (
  appointments = [],
  { todayKey, doctorId, doctorEmail, clinicName }
) => {
  if (!Array.isArray(appointments) || (!doctorId && !doctorEmail)) {
    return [];
  }

  return appointments.filter((appointment) => {
    const rawDate =
      appointment.appointment_date ?? appointment.appointmentDate ?? appointment.date ?? "";
    const appointmentDate =
      typeof rawDate === "string"
        ? rawDate.slice(0, 10)
        : rawDate instanceof Date
        ? format(rawDate, "yyyy-MM-dd")
        : "";

    const appointmentDoctorIds = [appointment.doctorId, appointment.doctor_id]
      .map((value) => String(value ?? "").trim())
      .filter(Boolean);

    const appointmentDoctorEmails = [appointment.doctorEmail, appointment.doctor_email]
      .map((value) => normalizeText(value))
      .filter(Boolean);

    const appointmentClinicName = normalizeText(
      appointment.clinicName ||
        appointment.clinic_name ||
        appointment.details?.clinicName ||
        appointment.details?.clinic_name ||
        appointment.original_json?.clinicName ||
        appointment.original_json?.clinic_name ||
        appointment.original_json?.details?.clinicName ||
        appointment.original_json?.details?.clinic_name
    );

    const appointmentStatus = normalizeKey(
      appointment.status ??
        appointment.appointment_status ??
        appointment.appointmentStatus
    );

    const isSameDoctor =
      appointmentDoctorIds.includes(doctorId) ||
      appointmentDoctorEmails.includes(doctorEmail);

    const isSameClinic = !clinicName || appointmentClinicName === clinicName;
    const isCancelled =
      appointmentStatus === "cancelled" || appointmentStatus === "canceled";

    return appointmentDate === todayKey && isSameDoctor && isSameClinic && !isCancelled;
  });
};

const getStats = (appointments = []) => ({
  totalAppointments: appointments.length,
  inPersonAppointments: appointments.filter((appointment) => {
    const type = normalizeKey(
      appointment.type ??
        appointment.appointment_type ??
        appointment.appointmentType
    );

    return type === "inperson" || type === "office";
  }).length,
  virtualAppointments: appointments.filter((appointment) => {
    const type = normalizeKey(
      appointment.type ??
        appointment.appointment_type ??
        appointment.appointmentType
    );

    return ["virtual", "online", "telehealth", "video"].includes(type);
  }).length,
});

const getRiskTierCounts = (appointments = []) => {
  const counts = { ...emptyRiskTier };

  for (const appointment of appointments) {
    const risk = normalizeKey(
      appointment.priority ??
        appointment.priorityLevel ??
        appointment.riskLevel ??
        appointment.risk_level
    );

    if (risk.includes("high") || risk.includes("critical") || risk.includes("urgent")) {
      counts.high += 1;
    } else if (risk.includes("medium") || risk.includes("moderate")) {
      counts.medium += 1;
    } else if (risk.includes("low")) {
      counts.low += 1;
    }
  }

  return counts;
};

const getDonutStyle = (riskTier = emptyRiskTier) => {
  const high = Number(riskTier.high) || 0;
  const medium = Number(riskTier.medium) || 0;
  const low = Number(riskTier.low) || 0;
  const total = high + medium + low;

  if (total === 0) {
    return {
      total: 0,
      background: "#e2e8f0",
    };
  }

  const highStop = ((high / total) * 100).toFixed(2);
  const mediumStop = (((high + medium) / total) * 100).toFixed(2);

  return {
    total,
    background: `conic-gradient(#e11d48 0% ${highStop}%, #f59e0b ${highStop}% ${mediumStop}%, #16a34a ${mediumStop}% 100%)`,
  };
};

const AppointmentStats = ({ date: propDate }) => {
  const loggedInDoctor = useSelector((state) => state.me.me);
  const appointments = useSelector((state) => state.appointments.appointments);

  const [stats, setStats] = useState(emptyStats);
  const [riskTier, setRiskTier] = useState(emptyRiskTier);
  const [isLoading, setIsLoading] = useState(true);

  const doctorEmail = normalizeText(
    loggedInDoctor?.email || loggedInDoctor?.doctor_email
  );
  const doctorId = String(
    loggedInDoctor?.doctor_id || loggedInDoctor?.id || loggedInDoctor?.oid || ""
  ).trim();
  const clinicName = normalizeText(
    loggedInDoctor?.clinicName || loggedInDoctor?.clinic_name
  );

  const localTodayKey = new Date().toLocaleDateString("en-CA");
  const utcTodayKey = new Date().toISOString().slice(0, 10);
  const todayKey = getTodayKey(propDate, localTodayKey, utcTodayKey);
  const formattedDate = format(new Date(`${todayKey}T00:00:00`), "MMMM d, yyyy");

  useEffect(() => {
    setIsLoading(true);

    const todayAppointments = getTodayAppointments(appointments, {
      todayKey,
      doctorId,
      doctorEmail,
      clinicName,
    });

    setStats(getStats(todayAppointments));
    setRiskTier(getRiskTierCounts(todayAppointments));
    setIsLoading(false);
  }, [appointments, todayKey, doctorId, doctorEmail, clinicName]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 min-h-[260px] animate-pulse">
        <div className="h-6 w-1/3 bg-neutral-200 rounded mb-4"></div>
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="h-16 bg-neutral-200 rounded"></div>
          <div className="h-16 bg-neutral-200 rounded"></div>
          <div className="h-16 bg-neutral-200 rounded"></div>
        </div>
        <div className="space-y-2">
          <div className="h-24 bg-neutral-200 rounded"></div>
          <div className="h-14 bg-neutral-200 rounded"></div>
        </div>
      </div>
    );
  }

  const { total: totalRiskPatients, background: riskTierDonutBackground } =
    getDonutStyle(riskTier);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-lg font-semibold text-gray-800">Today's Schedule</div>
          <div className="text-sm text-gray-500">{formattedDate}</div>
        </div>
        <div className="bg-sky-100 p-3 rounded-full">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
            <rect x="4" y="4" width="16" height="16" rx="8" fill="#3b82f6" opacity="0.15" />
            <path d="M8 7h8M8 11h8M8 15h4" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="min-h-[84px] rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-violet-700">
            Total Visits
          </div>
          <div className="mt-1 text-2xl font-bold text-violet-800">
            {stats.totalAppointments}
          </div>
        </div>
        <div className="min-h-[84px] rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
            In-Person
          </div>
          <div className="mt-1 text-2xl font-bold text-emerald-800">
            {stats.inPersonAppointments}
          </div>
        </div>
        <div className="min-h-[84px] rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">
            Virtual
          </div>
          <div className="mt-1 text-2xl font-bold text-blue-800">
            {stats.virtualAppointments}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
            Local Overview
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-800">
            Patients by Risk Tier
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            This donut is rendered only from local appointment data.
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-3">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative mx-auto h-28 w-28 shrink-0 sm:mx-0">
                <div
                  className="h-full w-full rounded-full border border-slate-200"
                  style={{ background: riskTierDonutBackground }}
                />
                <div className="absolute inset-[20%] flex flex-col items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700">
                  <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                    Total
                  </span>
                  <span className="text-lg font-bold text-slate-800">
                    {totalRiskPatients}
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-2 text-rose-700">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-600" />
                    High
                  </span>
                  <span className="font-semibold text-rose-800">{riskTier.high}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-2 text-amber-700">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    Medium
                  </span>
                  <span className="font-semibold text-amber-800">{riskTier.medium}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-2 text-emerald-700">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                    Low
                  </span>
                  <span className="font-semibold text-emerald-800">{riskTier.low}</span>
                </div>
                {totalRiskPatients === 0 ? (
                  <div className="pt-2 text-[11px] text-slate-500">
                    No local risk-tier values were found in today&apos;s appointments.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentStats;
