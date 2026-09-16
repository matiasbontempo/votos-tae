import type { MetadataRoute } from "next";

import { VOTE_PATH } from "@/lib/constants";
import { siteUrl } from "@/lib/site";

/** Solo la landing es para buscadores: la votacion y el panel, no. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", VOTE_PATH, "/api"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
