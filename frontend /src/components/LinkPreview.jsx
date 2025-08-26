import { useState, useEffect } from "react";
import { ExternalLink, Globe, Play } from "lucide-react";
import { axiosInstance } from "../lib/axios";

const LinkPreview = ({ url }) => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        setLoading(true);
        setError(false);

        const response = await axiosInstance.post("/link/preview", { url });
        setPreview(response.data);
      } catch (err) {
        console.error("Error fetching link preview:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [url]);

  // Helper function to detect if it's a video platform
  const isVideoContent = (url, type) => {
    return (
      url.includes("youtube.com") ||
      url.includes("youtu.be") ||
      type === "video" ||
      url.includes("vimeo.com")
    );
  };

  if (loading) {
    return (
      <div className="border border-base-300 rounded-lg p-3 mt-2 animate-pulse bg-base-100">
        <div className="flex gap-3">
          <div className="w-20 h-16 bg-base-300 rounded"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-base-300 rounded w-3/4"></div>
            <div className="h-3 bg-base-300 rounded w-full"></div>
            <div className="h-3 bg-base-300 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !preview) {
    return (
      <div className="border border-base-300 rounded-lg p-3 mt-2 bg-base-100">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-primary hover:text-primary-focus transition-colors"
        >
          <Globe size={16} />
          <span className="text-sm truncate flex-1">{url}</span>
          <ExternalLink size={14} />
        </a>
      </div>
    );
  }

  return (
    <div className="border border-base-300 rounded-lg overflow-hidden mt-2 bg-base-100 hover:border-base-400 transition-colors max-w-md">
      <a
        href={preview.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block hover:bg-base-50 transition-colors"
      >
        <div className="flex">
          {preview.image && (
            <div className="w-20 h-16 flex-shrink-0 relative">
              <img
                src={preview.image}
                alt={preview.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
              {/* Play icon overlay for video content */}
              {isVideoContent(preview.url, preview.type) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                  <Play size={16} className="text-white fill-white" />
                </div>
              )}
            </div>
          )}
          <div className="flex-1 p-3 min-w-0">
            <div className="text-xs text-base-content/60 mb-1 flex items-center gap-1">
              <Globe size={12} />
              <span className="truncate">{preview.siteName}</span>
            </div>
            <h4 className="font-medium text-sm text-base-content line-clamp-2 mb-1">
              {preview.title}
            </h4>
            {preview.description && (
              <p className="text-xs text-base-content/70 line-clamp-2 mb-2">
                {preview.description}
              </p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-primary truncate">
                {new URL(preview.url).hostname}
              </span>
              <ExternalLink
                size={12}
                className="text-base-content/40 flex-shrink-0 ml-2"
              />
            </div>
          </div>
        </div>
      </a>
    </div>
  );
};

export default LinkPreview;
