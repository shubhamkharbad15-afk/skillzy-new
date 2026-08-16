import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center px-6 text-center">
      <div className="w-9 h-9 bg-[#D1D0D0] rounded-xl flex items-center justify-center mb-8">
        <span className="text-black font-black text-sm">S</span>
      </div>
      <p className="text-xs font-semibold uppercase tracking-widest text-[#988686] mb-4">404 — Not found</p>
      <h1 className="text-3xl font-bold tracking-tight text-[#D1D0D0] mb-3">
        This page doesn't exist.
      </h1>
      <p className="text-sm text-[#988686] mb-8 max-w-sm leading-relaxed">
        The URL <code className="bg-[#5C4E4E]/35 px-1.5 py-0.5 rounded text-xs font-mono">{location.pathname}</code> wasn't found. It may have been moved or deleted.
      </p>
      <Link to="/" className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-[#D1D0D0] text-black rounded-lg hover:bg-[#e8e7e7] transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Skillzy
      </Link>
    </div>
  );
};

export default NotFound;
