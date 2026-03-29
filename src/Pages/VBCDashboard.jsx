import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "wouter";
import { PageNavigation } from "../components/ui/page-navigation";
import { fetchVbcDetailsConfig } from "../api/vbcSummary";
import { FABRIC_REPORT_URL } from "../constants";

const ALLOWED_FABRIC_HOST = "app.fabric.microsoft.com";

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
  } catch (error) {
    return "";
  }
};

const VBCDashboard = () => {
  const [searchParams] = useSearchParams();
  const appointmentId = (searchParams.get("appointmentId") || "").trim();
  const patientName = (
    searchParams.get("patientName") ||
    searchParams.get("patient") ||
    ""
  ).trim();
  const date = (searchParams.get("date") || "").trim();
  const selectedMetricKey = (searchParams.get("metric") || "").trim().toLowerCase();

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [scopedEmbedUrl, setScopedEmbedUrl] = useState("");

  const configuredFabricUrl = (FABRIC_REPORT_URL || "").trim();
  const selectedReportUrl = (scopedEmbedUrl || configuredFabricUrl).trim();
  const fabricReportUrl = useMemo(
    () => buildFabricEmbedUrl(selectedReportUrl),
    [selectedReportUrl]
  );
  const hasConfigError = fabricReportUrl.length === 0;

  useEffect(() => {
    const controller = new AbortController();

    const loadScopedDetails = async () => {
      setScopedEmbedUrl("");

      if (!appointmentId && !patientName && !selectedMetricKey) return;

      try {
        const scopedConfig = await fetchVbcDetailsConfig(
          {
            appointmentId,
            date,
            metric: selectedMetricKey,
            patientName,
          },
          { signal: controller.signal }
        );

        const embed = scopedConfig?.embed || {};
        if (embed.embedUrl || scopedConfig?.embedUrl) {
          setScopedEmbedUrl(embed.embedUrl || scopedConfig.embedUrl);
          return;
        }

        if ((embed.filter || scopedConfig?.filter) && configuredFabricUrl) {
          const parsed = new URL(configuredFabricUrl);
          parsed.searchParams.set("filter", embed.filter || scopedConfig.filter);
          setScopedEmbedUrl(parsed.toString());
        }
      } catch (error) {
        if (error?.name !== "AbortError") {
          setScopedEmbedUrl("");
        }
      }
    };

    loadScopedDetails();
    return () => controller.abort();
  }, [appointmentId, configuredFabricUrl, date, patientName, selectedMetricKey]);

  useEffect(() => {
    setIsLoading(true);
    setLoadError("");
  }, [fabricReportUrl, reloadKey]);

  useEffect(() => {
    if (!fabricReportUrl || !isLoading) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsLoading(false);
      setLoadError(
        "The report is taking longer than expected. Check access or retry."
      );
    }, 20000);

    return () => window.clearTimeout(timeoutId);
  }, [fabricReportUrl, isLoading, reloadKey]);

  const retryEmbed = () => {
    setReloadKey((previousValue) => previousValue + 1);
  };

  return (
    <div className="px-4 pb-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <PageNavigation
          title="Visit Details"
          subtitle="Power BI dashboard"
          showBackButton={true}
          rightSlot={
            <Link
              href="/vbc"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to Summary
            </Link>
          }
        />

        <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm sm:p-3">
          <div className="relative h-[calc(100vh-230px)] min-h-[500px] max-h-[760px] overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
            {hasConfigError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white p-8 text-center">
                <p className="text-base font-medium text-gray-800">
                  Fabric report URL is invalid.
                </p>
                <p className="mt-2 max-w-xl text-sm text-gray-500">
                  Check `FABRIC_REPORT_URL` in `src/constants/index.js`.
                </p>
              </div>
            ) : (
              <>
                {isLoading && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/90 backdrop-blur-[1px]">
                    <span
                      className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600"
                      aria-hidden="true"
                    />
                    <p className="mt-3 text-sm text-gray-500">Loading report...</p>
                  </div>
                )}

                {loadError && !isLoading && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white p-8 text-center">
                    <p className="text-base font-medium text-gray-800">
                      Unable to load Fabric report
                    </p>
                    <p className="mt-2 max-w-xl text-sm text-gray-500">{loadError}</p>
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
                  title="VBC_CARE"
                  src={fabricReportUrl}
                  className="h-full w-full border-0"
                  loading="eager"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="fullscreen"
                  onLoad={() => {
                    setIsLoading(false);
                    setLoadError("");
                  }}
                  onError={() => {
                    setIsLoading(false);
                    setLoadError("The report did not load due to a network or access issue.");
                  }}
                  allowFullScreen
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VBCDashboard;
