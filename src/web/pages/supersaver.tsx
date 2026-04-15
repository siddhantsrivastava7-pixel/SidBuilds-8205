import { useEffect, useState } from "react";
import SuperSaverDesktop from "./supersaver.desktop";
import SuperSaverMobile from "./supersaver.mobile";

export default function SuperSaver() {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (isDesktop === null) return null;
  return isDesktop ? <SuperSaverDesktop /> : <SuperSaverMobile />;
}
