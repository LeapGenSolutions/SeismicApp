import { useEffect, useMemo, useState } from "react";
import { BACKEND_URL, FABRIC_REPORT_URL } from "../../constants";
import { withAuthHeaders } from "../../api/auth";
import { fetchVbcDetailsConfig } from "../../api/vbcSummary";
import { tryNormalizeFabricPostCallPayload } from "../../lib/vbcAgentMapper";
import {
  buildWorkflowTask,
  formatWorkflowOwner,
  getWorkflowBadgeClassName,
} from "../../lib/vbcWorkflow";
import { CheckCircle2, AlertTriangle, ArrowRight, Clock3 } from "lucide-react";

const BASE = (BACKEND_URL || "").replace(/\/+$/, "");
const ALLOWED_FABRIC_HOST = "app.fabric.microsoft.com";

const fetchVbcPostCall = async (appointmentId, { signal } = {}) => {
  const response = await fetch(`${BASE}/api/vbc/post-call/${encodeURIComponent(appointmentId)}`, {
    signal,
    headers: withAuthHeaders(),
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    const error = new Error(`Failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
};

const toNumber = (value, fallback = null) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeClosureRate = (value) => {
  const numericValue = toNumber(value, null);
  if (numericValue === null) return null;
  if (numericValue >= 0 && numericValue <= 1) {
    return Math.round(numericValue * 100);
  }
  return Math.round(numericValue);
};

const normalizePostCall = (data = {}) => {
  const base =
    data && typeof data === "object" ? (data?.data ?? data) : {};
  const root = base && typeof base === "object" ? base : {};
  const explicitData = {
    addressedGaps: Array.isArray(root.addressedGaps)
      ? root.addressedGaps
      : Array.isArray(root.addressed_gaps)
      ? root.addressed_gaps
      : [],
    missedGaps: Array.isArray(root.missedGaps)
      ? root.missedGaps
      : Array.isArray(root.missed_gaps)
      ? root.missed_gaps
      : [],
    followUpActions: Array.isArray(root.followUpActions)
      ? root.followUpActions
      : Array.isArray(root.follow_up_actions)
      ? root.follow_up_actions
      : [],
    closureRate: normalizeClosureRate(root.closureRate ?? root.closure_rate),
    notes: String(root.notes ?? root.summaryNotes ?? root.summary_notes ?? "").trim(),
  };

  const hasExplicitData =
    explicitData.addressedGaps.length > 0 ||
    explicitData.missedGaps.length > 0 ||
    explicitData.followUpActions.length > 0 ||
    explicitData.closureRate !== null ||
    explicitData.notes;

  if (hasExplicitData) {
    return explicitData;
  }

  return tryNormalizeFabricPostCallPayload(root) || explicitData;
};

const normalizeGapLabel = (gap) =>
  typeof gap === "string" ? gap : gap?.label || gap?.name || JSON.stringify(gap);

const normalizeGapEvidence = (gap) =>
  typeof gap === "object" && gap ? gap.evidence || gap.reason || "" : "";

const normalizeGapDueDate = (gap) =>
  typeof gap === "object" && gap ? String(gap.dueDate || gap.due_date || "").slice(0, 10) : "";

const buildFabricEmbedUrl = (rawUrl) => {
  try {
    const parsedUrl = new URL(rawUrl);
    const isValidHost =
      parsedUrl.protocol === "https:" &&
      parsedUrl.hostname.toLowerCase() === ALLOWED_FABRIC_HOST;

    if (!isValidHost) {
      return "";
    }

    if (!parsedUrl.searchParams.has("autoAuth")) {
      parsedUrl.searchParams.set("autoAuth", "true");
    }

    return parsedUrl.toString();
  } catch {
    return "";
  }
};

const normalizeDateKey = (value = "") => {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
};

const VBCGapSummary = ({
  appointmentId,
  patientName = "",
  appointmentDate = "",
}) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [scopedEmbedUrl, setScopedEmbedUrl] = useState("");
  const [embedNotice, setEmbedNotice] = useState("");
  const [embedLoading, setEmbedLoading] = useState(true);
  const [embedError, setEmbedError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const configuredFabricUrl = (FABRIC_REPORT_URL || "").trim();
  const selectedReportUrl = (scopedEmbedUrl || configuredFabricUrl).trim();
  const fabricReportUrl = useMemo(
    () => buildFabricEmbedUrl(selectedReportUrl),
    [selectedReportUrl]
  );
  const hasConfigError = selectedReportUrl.length > 0 && fabricReportUrl.length === 0;
  const normalizedAppointmentDate = normalizeDateKey(appointmentDate);

  useEffect(() => {
    if (!appointmentId) {
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    setIsLoading(true);
    setError("");

    fetchVbcPostCall(appointmentId, { signal: controller.signal })
      .then((raw) => {
        setData(normalizePostCall(raw));
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          setError(
            err?.status === 404
              ? ""
              : "VBC post-call analysis is not yet available for this appointment."
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [appointmentId]);

  useEffect(() => {
    const controller = new AbortController();

    setScopedEmbedUrl("");
    setEmbedNotice("");

    if (!appointmentId && !patientName) return () => controller.abort();

    fetchVbcDetailsConfig(
      {
        appointmentId,
        date: normalizedAppointmentDate,
        patientName,
      },
      { signal: controller.signal }
    )
      .then((scopedConfig) => {
        const embed = scopedConfig?.embed || {};

        if (embed.embedUrl || scopedConfig?.embedUrl) {
          setScopedEmbedUrl(embed.embedUrl || scopedConfig.embedUrl);
          return;
        }

        if ((embed.filter || scopedConfig?.filter) && configuredFabricUrl) {
          const parsed = new URL(configuredFabricUrl);
          parsed.searchParams.set("filter", embed.filter || scopedConfig.filter);
          setScopedEmbedUrl(parsed.toString());
          return;
        }
      })
      .catch((fetchError) => {
        if (fetchError?.name === "AbortError") return;
        setEmbedNotice("");
      });

    return () => controller.abort();
  }, [appointmentId, configuredFabricUrl, normalizedAppointmentDate, patientName]);

  useEffect(() => {
    setEmbedLoading(true);
    setEmbedError("");
  }, [fabricReportUrl, reloadKey]);

  useEffect(() => {
    if (!fabricReportUrl || !embedLoading) return;

    const timeoutId = window.setTimeout(() => {
      setEmbedLoading(false);
      setEmbedError(
        "The Fabric dashboard is taking longer than expected. Check access or retry."
      );
    }, 20000);

    return () => window.clearTimeout(timeoutId);
  }, [embedLoading, fabricReportUrl, reloadKey]);

  const retryEmbed = () => {
    setReloadKey((previousValue) => previousValue + 1);
  };

  const addressedGaps = Array.isArray(data?.addressedGaps) ? data.addressedGaps : [];
  const missedGaps = Array.isArray(data?.missedGaps) ? data.missedGaps : [];
  const followUpActions = Array.isArray(data?.followUpActions) ? data.followUpActions : [];
  const closureRate = data?.closureRate ?? null;
  const notes = data?.notes || "";
  const hasAnyData =
    addressedGaps.length > 0 ||
    missedGaps.length > 0 ||
    followUpActions.length > 0 ||
    closureRate !== null ||
    Boolean(notes);

  return (
    <div className="space-y-6">
      {/* Header with closure rate */}
      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div>
          <h3 className="text-base font-semibold text-gray-900">VBC Gap Analysis</h3>
          <p className="text-sm text-gray-500">Post-call care gap summary for this appointment</p>
        </div>
        {closureRate !== null && (
          <div className="text-right">
            <div className="text-2xl font-semibold text-emerald-600">{closureRate}%</div>
            <div className="text-xs text-gray-500">Gap Closure Rate</div>
          </div>
        )}
      </div>

      {(embedNotice || fabricReportUrl || hasConfigError) && (
        <div className="space-y-3">
          {embedNotice && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              {embedNotice}
            </div>
          )}

          <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm sm:p-3">
            <div className="rounded-lg border border-gray-100 px-2 pb-2 pt-1 sm:px-3">
              <h4 className="text-sm font-semibold text-gray-900">Fabric Patient Dashboard</h4>
              <p className="mt-1 text-xs text-gray-500">
                Patient-scoped Power BI view for this VBC appointment.
              </p>
            </div>

            <div className="relative mt-3 h-[520px] overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
              {hasConfigError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white p-8 text-center">
                  <p className="text-base font-medium text-gray-800">
                    Fabric report URL is invalid.
                  </p>
                  <p className="mt-2 max-w-xl text-sm text-gray-500">
                    Check `FABRIC_REPORT_URL` in `src/constants/index.js`.
                  </p>
                </div>
              ) : fabricReportUrl ? (
                <>
                  {embedLoading && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/90 backdrop-blur-[1px]">
                      <span
                        className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600"
                        aria-hidden="true"
                      />
                      <p className="mt-3 text-sm text-gray-500">Loading dashboard...</p>
                    </div>
                  )}

                  {embedError && !embedLoading && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white p-8 text-center">
                      <p className="text-base font-medium text-gray-800">
                        Unable to load Fabric dashboard
                      </p>
                      <p className="mt-2 max-w-xl text-sm text-gray-500">{embedError}</p>
                      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                        <button
                          onClick={retryEmbed}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                          Retry
                        </button>
                        <a
                          href={fabricReportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Open in new tab
                        </a>
                      </div>
                    </div>
                  )}

                  <iframe
                    key={reloadKey}
                    title="VBC_POST_CALL_FABRIC"
                    src={fabricReportUrl}
                    className="h-full w-full border-0"
                    loading="eager"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allow="fullscreen"
                    onLoad={() => {
                      setEmbedLoading(false);
                      setEmbedError("");
                    }}
                    onError={() => {
                      setEmbedLoading(false);
                      setEmbedError(
                        "The dashboard did not load due to a network or access issue."
                      );
                    }}
                    allowFullScreen
                  />
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white p-8 text-center">
                  <p className="text-base font-medium text-gray-800">
                    Fabric dashboard is not configured.
                  </p>
                  <p className="mt-2 max-w-xl text-sm text-gray-500">
                    Add a valid `FABRIC_REPORT_URL` to show the patient dashboard here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white py-16 shadow-sm">
          <div className="text-center">
            <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-blue-100 border-t-blue-600" />
            <p className="mt-3 text-sm text-gray-500">Loading VBC gap analysis...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      {!error && !isLoading && !hasAnyData && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
          No VBC gap data was recorded for this appointment.
        </div>
      )}

      {!error && !isLoading && hasAnyData && (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Addressed Gaps */}
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h4 className="text-sm font-semibold text-green-800">
              Addressed ({addressedGaps.length})
            </h4>
          </div>
          {addressedGaps.length === 0 ? (
            <p className="text-sm text-green-700">No gaps were addressed in this session.</p>
          ) : (
            <ul className="space-y-2">
              {addressedGaps.map((gap, i) => (
                <li key={i} className="rounded-lg border border-green-200 bg-white/70 px-3 py-2 text-sm text-green-800">
                  <div className="flex items-start gap-2">
                  <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-green-600 text-white text-[10px] flex items-center justify-center font-bold">✓</span>
                  <div>
                    <div>{normalizeGapLabel(gap)}</div>
                    {normalizeGapEvidence(gap) && (
                      <div className="mt-1 text-xs text-green-700/80">{normalizeGapEvidence(gap)}</div>
                    )}
                    {normalizeGapDueDate(gap) && (
                      <div className="mt-1 text-[11px] text-green-700/70">Due {normalizeGapDueDate(gap)}</div>
                    )}
                  </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Missed Gaps */}
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h4 className="text-sm font-semibold text-red-800">
              Missed ({missedGaps.length})
            </h4>
          </div>
          {missedGaps.length === 0 ? (
            <p className="text-sm text-red-700">All gaps were addressed — great job!</p>
          ) : (
            <ul className="space-y-2">
              {missedGaps.map((gap, i) => (
                <li key={i} className="rounded-lg border border-red-200 bg-white/70 px-3 py-2 text-sm text-red-800">
                  <div className="flex items-start gap-2">
                  <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">✕</span>
                  <div>
                    <div>{normalizeGapLabel(gap)}</div>
                    {normalizeGapEvidence(gap) && (
                      <div className="mt-1 text-xs text-red-700/80">{normalizeGapEvidence(gap)}</div>
                    )}
                    {normalizeGapDueDate(gap) && (
                      <div className="mt-1 text-[11px] text-red-700/70">Due {normalizeGapDueDate(gap)}</div>
                    )}
                  </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      )}

      {/* Follow-up Actions */}
      {!error && !isLoading && followUpActions.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock3 className="h-5 w-5 text-blue-600" />
            <h4 className="text-sm font-semibold text-blue-800">Follow-up Actions</h4>
          </div>
          <ul className="space-y-2">
            {followUpActions.map((action, i) => {
              const workflowTask = buildWorkflowTask(
                {
                  nextBestActions: [typeof action === "string" ? { label: action } : action],
                  openGapCount: missedGaps.length,
                  addressedGapCount: addressedGaps.length,
                  priority: typeof action === "object" ? action.priority : "MEDIUM",
                },
                { referenceDate: new Date() }
              );

              return (
                <li key={i} className="rounded-lg border border-blue-200 bg-white/70 px-3 py-2 text-sm text-blue-800">
                  <div className="flex items-start gap-2">
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                    <div className="min-w-0">
                      <div>{workflowTask.action}</div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${getWorkflowBadgeClassName(
                            workflowTask.status
                          )}`}
                        >
                          {workflowTask.status}
                        </span>
                        <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                          {typeof action === "object" && action.priority ? action.priority : workflowTask.priority}
                        </span>
                        <span className="inline-flex rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[11px] font-medium text-gray-600">
                          {formatWorkflowOwner(workflowTask.owner)}
                        </span>
                        <span className="inline-flex rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[11px] font-medium text-gray-600">
                          Due {workflowTask.dueDate || "TBD"}
                        </span>
                      </div>
                      {workflowTask.reason && (
                        <div className="mt-2 text-xs text-blue-800/80">{workflowTask.reason}</div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {!error && !isLoading && notes && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h4 className="text-sm font-semibold text-slate-900">Clinical Notes</h4>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {notes}
          </p>
        </div>
      )}
    </div>
  );
};

export default VBCGapSummary;
