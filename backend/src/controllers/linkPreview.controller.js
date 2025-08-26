import axios from "axios";
import * as cheerio from "cheerio";

export const getLinkPreview = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    // Validate URL format
    const urlRegex =
      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!urlRegex.test(url)) {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    // Ensure URL has protocol
    const fullUrl = url.startsWith("http") ? url : `https://${url}`;

    // Fetch the webpage
    const response = await axios.get(fullUrl, {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    const $ = cheerio.load(response.data);

    // Extract meta information
    const preview = {
      url: fullUrl,
      title:
        $('meta[property="og:title"]').attr("content") ||
        $('meta[name="twitter:title"]').attr("content") ||
        $("title").text() ||
        "No title",
      description:
        $('meta[property="og:description"]').attr("content") ||
        $('meta[name="twitter:description"]').attr("content") ||
        $('meta[name="description"]').attr("content") ||
        "",
      image:
        $('meta[property="og:image"]').attr("content") ||
        $('meta[name="twitter:image"]').attr("content") ||
        "",
      siteName:
        $('meta[property="og:site_name"]').attr("content") ||
        new URL(fullUrl).hostname,
      type: $('meta[property="og:type"]').attr("content") || "website",
    };

    // Clean up the data
    preview.title = preview.title.trim().substring(0, 100);
    preview.description = preview.description.trim().substring(0, 200);

    // Make image URL absolute if it's relative
    if (preview.image && !preview.image.startsWith("http")) {
      const baseUrl = new URL(fullUrl);
      preview.image = new URL(preview.image, baseUrl.origin).href;
    }

    res.status(200).json(preview);
  } catch (error) {
    console.error("Error in getLinkPreview:", error.message);
    res.status(500).json({ error: "Failed to fetch link preview" });
  }
};
