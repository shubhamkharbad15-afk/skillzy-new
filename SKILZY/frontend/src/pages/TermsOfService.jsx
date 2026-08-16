import { Link } from "react-router-dom";
import Footer from "../components/Footer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-transparent text-[#D1D0D0] flex flex-col">
      <header className="border-b border-[#5C4E4E]/55">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#D1D0D0] rounded-lg flex items-center justify-center">
              <span className="text-black font-black text-xs">S</span>
            </div>
            <span className="text-base font-bold tracking-tight">Skillzy</span>
          </Link>
          <Link to="/login" className="px-4 py-2 text-sm font-semibold bg-[#D1D0D0] text-black rounded-lg hover:bg-[#e8e7e7] transition-colors">
            Get started
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16 flex-1 w-full">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#D1D0D0] mb-3">Legal</p>
        <h1 className="text-3xl font-bold tracking-tight mb-4">Terms of Service</h1>
        <p className="text-sm text-[#988686] mb-10 max-w-2xl leading-relaxed">
          These terms govern use of Skillzy. This is product-aligned placeholder language and should be reviewed by counsel before launch.
        </p>

        <div className="space-y-8 text-sm text-[#988686] leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-[#D1D0D0] mb-2">Acceptance</h2>
            <p>By creating an account or using Skillzy, you agree to these Terms. If you do not agree, do not use the platform.</p>
          </section>
          <section>
            <h2 className="text-base font-bold text-[#D1D0D0] mb-2">Account responsibilities</h2>
            <p>You are responsible for your account credentials, the accuracy of your profile, and the content you post in communities, chat, events, and challenges.</p>
          </section>
          <section>
            <h2 className="text-base font-bold text-[#D1D0D0] mb-2">Acceptable use</h2>
            <p>Do not harass others, spam communities, attempt unauthorized access, or misuse Skillzy for illegal activity. Community admins and platform admins may remove content or members that violate these rules.</p>
          </section>
          <section>
            <h2 className="text-base font-bold text-[#D1D0D0] mb-2">Platform features</h2>
            <p>Matching, communities, chat, events, challenges, notifications, and store credits are provided as-is and may change as the product evolves.</p>
          </section>
          <section>
            <h2 className="text-base font-bold text-[#D1D0D0] mb-2">Limitation of liability</h2>
            <p>To the extent permitted by law, Skillzy is not liable for indirect or consequential damages arising from use of the platform.</p>
          </section>
          <section>
            <h2 className="text-base font-bold text-[#D1D0D0] mb-2">Contact</h2>
            <p>Questions about these Terms: <a href="mailto:legal@skillzy.app" className="underline text-[#D1D0D0]">legal@skillzy.app</a></p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;
