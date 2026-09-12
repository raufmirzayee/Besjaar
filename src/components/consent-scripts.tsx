import { useEffect, useState } from "react";

import { CONSENT_EVENT, hasConsent } from "@/lib/consent";
import { usePublicSetting } from "@/lib/use-public-settings";

/**
 * Loads tracking scripts ONLY after the visitor allowed the matching cookie
 * category. Nothing is injected before consent, and scripts are not removed on
 * withdrawal without a reload — we therefore reload the page when consent for a
 * previously loaded category is revoked.
 */
export function ConsentScripts() {
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  // From the public settings rather than the build-time environment, so
  // changing a measurement id in the admin takes effect without a redeploy.
  // Nothing loads before consent either way, so waiting for this to arrive
  // costs nothing: the scripts are gated on a click that has not happened yet.
  const gaId = usePublicSetting("integrations.ga_measurement_id");
  const pixelId = usePublicSetting("integrations.meta_pixel_id");

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
    const id = gaId;
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
  }, [analytics, gaId]);

  useEffect(() => {
    if (!marketing) return;
    if (!pixelId || document.getElementById("meta-pixel")) return;

    const inline = document.createElement("script");
    inline.id = "meta-pixel";
    inline.text = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`;
    document.head.appendChild(inline);
  }, [marketing, pixelId]);

  return null;
}
