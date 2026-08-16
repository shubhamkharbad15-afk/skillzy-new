import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-[#5C4E4E]/55 py-8 px-6 mt-auto bg-transparent">
      <div className="mx-auto w-full max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-[#D1D0D0] rounded flex items-center justify-center">
            <span className="text-black font-black text-[10px]">S</span>
          </div>
          <span className="text-sm font-semibold text-[#D1D0D0]">Skillzy</span>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#988686]">
          <Link to="/about" className="hover:text-[#D1D0D0] transition-colors">About</Link>
          <Link to="/contact" className="hover:text-[#D1D0D0] transition-colors">Contact</Link>
          <Link to="/privacy" className="hover:text-[#D1D0D0] transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-[#D1D0D0] transition-colors">Terms</Link>
        </nav>
        <p className="text-xs text-[#5C4E4E]">© {new Date().getFullYear()} Skillzy</p>
      </div>
    </footer>
  );
};

export default Footer;
