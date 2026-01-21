import { BookOpen, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchRecommendationByAppointment } from "../../api/recommendations";
import LoadingCard from "./LoadingCard";

const UpToDate = ({ appId, username, data }) => {
  // Fetch fallback data if component not provided `data`
  const { data: upToDate, isLoading, error } = useQuery({
    queryKey: ["recommendations", appId, username],
    queryFn: () =>
      fetchRecommendationByAppointment(
        `${username}_${appId}_recommendations`,
        username
      ),
  });

  const upToDateResult = data?.uptodate_results || upToDate?.data?.uptodate_results;

  const cleanSnippet = (s = "") => s.replace(/&hellip;/g, "…").replace(/\s+/g, " ");

  // If the parent didn't provide `data`, show loading / error states from the query
  if (!data && isLoading) {
    return <LoadingCard message="From symptoms to strategy… aligning recommendations." />;
  }

  if (!data && error) {
    return <LoadingCard />;
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center gap-2">
        <BookOpen size={20} />
        <h2 className="text-lg font-semibold">UpToDate — Recommendations</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(upToDateResult?.results || []).map((r, idx) => (
          <article
            key={idx}
            className="border rounded-lg p-4 shadow-sm bg-white dark:bg-slate-800">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {r.title}
                </h3>
                <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                  {cleanSnippet(r.snippet).length > 240
                    ? `${cleanSnippet(r.snippet).slice(0, 240)}…`
                    : cleanSnippet(r.snippet)}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                      {r.contentMeta?.audience || "patient"}
                    </span>
                    <span className="text-xs text-muted-foreground">{r.contentMeta?.contentType}</span>
                  </div>
                  <a
                    href={r.webapp_link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-sky-600 hover:underline">
                    Open <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default UpToDate;