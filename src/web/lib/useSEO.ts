import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  jsonLd?: object;
}

export function useSEO({ title, description, canonical, ogImage, jsonLd }: SEOProps) {
  useEffect(() => {
    // Title
    document.title = title;

    // Helper: upsert a <meta> tag
    const setMeta = (selector: string, attr: string, value: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        const [attrName, attrVal] = selector.replace("meta[", "").replace("]", "").split("=");
        el.setAttribute(attrName.trim(), attrVal.replace(/"/g, "").trim());
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    // Helper: upsert a <link> tag
    const setLink = (rel: string, value: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement("link");
        el.rel = rel;
        document.head.appendChild(el);
      }
      el.href = value;
    };

    setMeta('meta[name="description"]', "content", description);
    setLink("canonical", canonical);

    // OG
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", description);
    setMeta('meta[property="og:url"]', "content", canonical);
    if (ogImage) setMeta('meta[property="og:image"]', "content", ogImage);

    // Twitter
    setMeta('meta[name="twitter:title"]', "content", title);
    setMeta('meta[name="twitter:description"]', "content", description);
    if (ogImage) setMeta('meta[name="twitter:image"]', "content", ogImage);

    // JSON-LD
    const JSONLD_ID = "jsonld-page";
    let ldEl = document.getElementById(JSONLD_ID);
    if (jsonLd) {
      if (!ldEl) {
        ldEl = document.createElement("script");
        ldEl.id = JSONLD_ID;
        (ldEl as HTMLScriptElement).type = "application/ld+json";
        document.head.appendChild(ldEl);
      }
      ldEl.textContent = JSON.stringify(jsonLd);
    } else if (ldEl) {
      ldEl.remove();
    }

    // Cleanup: restore defaults on unmount
    return () => {
      document.title = "SidBuilds — Products in Fintech & Developer Tooling";
    };
  }, [title, description, canonical, ogImage, jsonLd]);
}
