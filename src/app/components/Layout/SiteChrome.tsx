"use client";
import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";

// The Live Test lobby/play screens are a focused, fixed-viewport "exam mode" —
// no page scroll, no site chrome. The global Header/Footer (and the <main
// pt-20> offset) were pushing that content past 100dvh and forcing the whole
// page to scroll, defeating the point. Those two routes render standalone.
function isFullscreenTestRoute(pathname: string): boolean {
  return /^\/test\/[^/]+\/(lobby|play)(\/|$)/.test(pathname);
}

export default function SiteChrome({
  navData,
  contactData,
  children,
}: {
  navData: any;
  contactData: any;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (isFullscreenTestRoute(pathname || "")) {
    return <>{children}</>;
  }
  return (
    <>
      <Header navData={navData} contactData={contactData} />
      <main className="pt-20">{children}</main>
      <Footer data={contactData} navLinks={navData} />
    </>
  );
}
