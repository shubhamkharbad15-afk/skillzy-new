import { Link } from "react-router-dom";
import Footer from "../components/Footer";

const About = () => {
  return (
    <div className="min-h-screen bg-transparent text-[#D1D0D0]">
      {/* Nav */}
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

      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#D1D0D0] mb-3">About</p>
          <h1 className="text-3xl font-bold tracking-tight text-[#D1D0D0] mb-4">
            Built for people who believe skills should travel with you.
          </h1>
          <p className="text-base text-[#988686] leading-relaxed max-w-2xl">
            Skillzy is a professional networking platform centered around what you actually know and want to learn — not who you already know or where you worked.
          </p>
        </div>

        {/* Two-column intro */}
        <div className="grid md:grid-cols-2 gap-8 mb-16 pb-16 border-b border-[#5C4E4E]/40">
          <div>
            <h2 className="text-sm font-bold text-[#D1D0D0] mb-3">Our focus</h2>
            <p className="text-sm text-[#988686] leading-relaxed">
              Most professional networks reward tenure and title. We think the more interesting question is: what are you building right now, and who should you be building it with? Skillzy matches you based on skills, interests, and goals — not your employment history.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#D1D0D0] mb-3">For everyone</h2>
            <p className="text-sm text-[#988686] leading-relaxed">
              Whether you're a student, a professional switching tracks, a freelancer, or someone who's been building the same thing for fifteen years — if you want to find people who understand what you're working on, Skillzy is for you.
            </p>
          </div>
        </div>

        {/* What you can do */}
        <div className="mb-16">
          <h2 className="text-lg font-bold text-[#D1D0D0] mb-6">What you can do on Skillzy</h2>
          <div className="space-y-4">
            {[
              { title: "Discover people by skill", body: "Search by specific skill, interest, or career goal. Skillzy uses semantic search to surface relevant people — not just keyword matches." },
              { title: "Join communities", body: "Find and join communities built around your domain. Get access to chat, events, challenges, and a leaderboard for your group." },
              { title: "Build connections", body: "Send connection requests to people you want to stay in touch with. Manage incoming requests and your growing network." },
              { title: "Participate in events and challenges", body: "Attend events organized within communities. Take on challenges to sharpen skills and earn recognition among peers." },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 p-5 bg-black rounded-lg border border-[#5C4E4E]/40">
                <div className="w-1.5 h-1.5 rounded-full bg-[#988686] mt-2 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-[#D1D0D0] mb-1">{item.title}</h3>
                  <p className="text-sm text-[#988686] leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h2 className="text-lg font-bold text-[#D1D0D0] mb-6">What we value</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { title: "Honest matching", body: "We surface connections based on real skill and interest overlap — not paid placement or follower counts." },
              { title: "Real communities", body: "Communities on Skillzy are built around actual domains, not marketing categories. Join one because it's relevant to your work." },
              { title: "Useful data", body: "We don't show you fake statistics or fabricated activity. Everything you see — member counts, leaderboards, points — comes from real usage." },
            ].map((v) => (
              <div key={v.title} className="p-5 border border-[#5C4E4E]/55 rounded-lg">
                <h3 className="text-sm font-semibold text-[#D1D0D0] mb-2">{v.title}</h3>
                <p className="text-xs text-[#988686] leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-[#D1D0D0] rounded-xl p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-3">Start building your network</h2>
          <p className="text-sm text-[#988686] mb-6 max-w-md mx-auto">
            Create a profile, add your skills, and find people who are working on the same problems.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-[#141111] text-black rounded-lg hover:bg-[#1c1818] transition-colors"
          >
            Create your free profile
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;
