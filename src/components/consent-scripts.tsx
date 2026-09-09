import { useEffect, useState } from "react";

import { CONSENT_EVENT, hasConsent } from "@/lib/consent";

/**
 * Loads tracking scripts ONLY after the visitor allowed the matching cookie
 * category. Nothing is injected before consent, and scripts are not removed on
 * withdrawal without a reload — we therefore reload the page when consent for a
 * previously loaded category is revoked.
 */
export function ConsentScripts() {
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const sync = () => {
      setAnalytics(hasConsent("analytics"));
      setMarketing(hasConsent("marketing"));
    };
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, []);

  useEffect(() => {
    if (!analytics) return;
    const id = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
    if (!id || document.getElementById("ga-script")) return;

    const script = document.createElement("script");
    script.id = "ga-script";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(script);

    const inline = document.createElement("script");
    inline.id = "ga-inline";
    inline.text = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}',{anonymize_ip:true});`;
    document.head.appendChild(inline);
  }, [analytics]);

  useEffect(() => {
    if (!marketing) return;
    const pixelId = import.meta.env.VITE_META_PIXEL_ID as string | undefined;
    if (!pixelId || document.getElementById("meta-pixel")) return;

    const inline = document.createElement("script");
    inline.id = "meta-pixel";
    inline.text = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`;
    document.head.appendChild(inline);
  }, [marketing]);

  return null;
}
