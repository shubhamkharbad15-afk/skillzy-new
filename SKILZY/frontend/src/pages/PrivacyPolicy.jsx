import { Link } from "react-router-dom";
import Footer from "../components/Footer";

const PrivacyPolicy = () => {
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
        <h1 className="text-3xl font-bold tracking-tight mb-4">Privacy Policy</h1>
        <p className="text-sm text-[#988686] mb-10 max-w-2xl leading-relaxed">
          This page summarizes how Skillzy handles account and profile information. Replace placeholder sections with your final legal language before production launch.
        </p>

        <div className="space-y-8 text-sm text-[#988686] leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-[#D1D0D0] mb-2">Information we collect</h2>
            <p>We collect account details you provide (such as name and email), profile fields (skills, interests, bio), and activity needed to operate matching, communities, events, challenges, and notifications.</p>
          </section>
          <section>
            <h2 className="text-base font-bold text-[#D1D0D0] mb-2">How we use information</h2>
            <p>Data is used to authenticate you, personalize discovery, power community features, send notifications you enable, and keep the platform secure.</p>
          </section>
          <section>
            <h2 className="text-base font-bold text-[#D1D0D0] mb-2">Storage and security</h2>
            <p>Profile and application data are stored in our database with access controls. Secrets such as database credentials and OAuth client secrets stay on the server and are never exposed to the browser.</p>
          </section>
          <section>
            <h2 className="text-base font-bold text-[#D1D0D0] mb-2">Your controls</h2>
            <p>You can update profile information and notification preferences from Settings. Contact us to request account deletion where applicable.</p>
          </section>
          <section>
            <h2 className="text-base font-bold text-[#D1D0D0] mb-2">Contact</h2>
            <p>Privacy questions: <a href="mailto:privacy@skillzy.app" className="underline text-[#D1D0D0]">privacy@skillzy.app</a></p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
