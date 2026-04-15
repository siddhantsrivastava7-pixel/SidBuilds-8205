import { useEffect, useState } from "react";
import RecallDesktop from "./recall.desktop";
import RecallMobile from "./recall.mobile";

export default function Recall() {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (isDesktop === null) return null;
  return isDesktop ? <RecallDesktop /> : <RecallMobile />;
}
