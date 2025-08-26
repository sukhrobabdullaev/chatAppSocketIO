// Utility function to detect URLs in text
export const detectUrls = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
};

// Utility function to check if URL is a supported platform for rich previews
export const isSupportedPlatform = (url) => {
  const supportedDomains = [
    "youtube.com",
    "youtu.be",
    "linkedin.com",
    "twitter.com",
    "x.com",
    "github.com",
    "instagram.com",
    "facebook.com",
    "medium.com",
    "dev.to",
  ];

  return supportedDomains.some((domain) => url.includes(domain));
};

// Extract domain name for display
export const extractDomain = (url) => {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
};
