import { useState } from "react";
import { ArrowRight, Users, Calendar, Target, Zap, MessageSquare, Search, Network, CheckCircle, MapPin, Briefcase, Award, Shield, Layers, Clock, Sparkles, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Skillzy Landing Page
   Design principles from Dockit/editorial themes:
   - Strong typographic hierarchy drives scanning
   - Whitespace is structural, not decorative  
   - Sections have varied composition — no identical 6-card grids
   - Product UI preview grounds the experience in reality
   - Honest copy — no "unlock your potential" language
   - Single clear CTA per section
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

/* â”€â”€ Simulated product preview — represents real UI â”€â”€ */
const BuddyCard = ({ name, title, location, skills, score, initials, delay = "0ms" }) => (
  <div
    className="bg-[#141111] rounded-lg border border-[#5C4E4E]/55 p-3.5 shadow-sm"
    style={{ animationDelay: delay }}
  >
    <div className="flex items-start justify-between mb-2.5">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-[#D1D0D0] flex items-center justify-center text-black text-[10px] font-bold shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#D1D0D0] leading-tight">{name}</p>
          <p className="text-[10px] text-[#988686] truncate">{title}</p>
        </div>
      </div>
      <span className="text-[10px] font-bold tabular-nums text-[#988686] bg-[#5C4E4E]/35 px-1.5 py-0.5 rounded shrink-0">
        {score}%
      </span>
    </div>
    <div className="flex items-center gap-1 mb-2.5">
      <MapPin className="w-3 h-3 text-[#988686] shrink-0" />
      <span className="text-[10px] text-[#988686]">{location}</span>
    </div>
    <div className="flex flex-wrap gap-1 mb-3">
      {skills.map(s => (
        <span key={s} className="text-[10px] bg-[#5C4E4E]/35 text-[#988686] px-2 py-0.5 rounded font-medium">{s}</span>
      ))}
    </div>
    <button className="w-full py-1.5 text-[10px] font-semibold bg-[#D1D0D0] text-black rounded-md hover:bg-[#e8e7e7] transition-colors">
      Connect
    </button>
  </div>
);

const CommunityPreview = ({ name, domain, members, active }) => (
  <div className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${active ? 'bg-[#5C4E4E]/35 border-[#5C4E4E]' : 'bg-[#141111] border-[#5C4E4E]/55'}`}>
    <div className="flex items-center gap-2.5">
      <div className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold ${active ? 'bg-[#5C4E4E] text-[#D1D0D0]' : 'bg-[#5C4E4E]/35 text-[#988686]'}`}>
        {name[0]}
      </div>
      <div>
        <p className="text-xs font-semibold text-[#D1D0D0]">{name}</p>
        <p className="text-[10px] text-[#988686]">{domain}</p>
      </div>
    </div>
    {active ? (
      <span className="text-[10px] font-semibold text-[#D1D0D0] bg-[#5C4E4E]/45 px-2 py-0.5 rounded">Joined</span>
    ) : (
      <button className="text-[10px] font-medium text-[#988686] border border-[#5C4E4E] px-2 py-0.5 rounded hover:bg-black">Join</button>
    )}
  </div>
);

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-transparent text-[#D1D0D0] font-sans">

      {/* â”€â”€ HEADER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-sm border-b border-[#5C4E4E]/55">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#D1D0D0] rounded-lg flex items-center justify-center">
              <span className="text-black font-black text-sm">S</span>
            </div>
            <span className="text-lg font-bold tracking-tight">Skillzy</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#988686]">
            <a href="#how-it-works" className="hover:text-[#D1D0D0] transition-colors">How it works</a>
            <a href="#features" className="hover:text-[#D1D0D0] transition-colors">Features</a>
            <a href="/about" className="hover:text-[#D1D0D0] transition-colors">About</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="hidden sm:block px-4 py-2 text-sm font-medium text-[#D1D0D0] hover:text-[#D1D0D0] transition-colors"
            >
              Sign in
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 text-sm font-semibold bg-[#D1D0D0] text-black rounded-lg hover:bg-[#e8e7e7] transition-colors"
            >
              Get started
            </button>
          </div>
        </div>
      </header>

      {/* â”€â”€ HERO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="pt-16 pb-0 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left — copy */}
            <div className="max-w-lg">
              <div className="inline-flex items-center gap-2 bg-[#5C4E4E]/35 text-[#D1D0D0] text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-[#5C4E4E]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#988686]" />
                Skill-based professional networking
              </div>

              <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-[#D1D0D0] leading-[1.1] mb-5">
                Find people who<br />
                know what you're<br />
                trying to build.
              </h1>

              <p className="text-base text-[#988686] leading-relaxed mb-8 max-w-md">
                Skillzy matches you with professionals based on actual skills, shared interests, and career direction — then gives you the tools to do something with those connections.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <button
                  onClick={() => navigate("/login")}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold bg-[#D1D0D0] text-black rounded-lg hover:bg-[#e8e7e7] transition-colors"
                >
                  Create your profile
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center px-5 py-3 text-sm font-medium border border-[#5C4E4E] text-[#D1D0D0] rounded-lg hover:bg-black transition-colors"
                >
                  See how it works
                </a>
              </div>

              {/* Honest feature list */}
              <div className="flex flex-wrap gap-4 text-xs text-[#988686]">
                {[
                  "Semantic skill matching",
                  "Real community chat",
                  "Live events",
                  "Skill challenges",
                ].map(f => (
                  <span key={f} className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — product preview */}
            <div className="relative lg:h-[560px] flex items-end justify-center pb-0">
              {/* Browser chrome */}
              <div className="w-full max-w-md bg-black rounded-t-xl border border-[#5C4E4E]/55 border-b-0 shadow-xl overflow-hidden">
                {/* Browser bar */}
                <div className="flex items-center gap-1.5 px-4 py-3 bg-[#5C4E4E]/35 border-b border-[#5C4E4E]/55">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <div className="ml-3 flex-1 bg-[#141111] rounded text-[10px] text-[#988686] px-3 py-1 font-mono border border-[#5C4E4E]/55">
                    skillzy.app/dashboard
                  </div>
                </div>

                {/* App chrome */}
                <div className="flex h-[420px]">
                  {/* Mini sidebar */}
                  <div className="w-10 border-r border-[#5C4E4E]/55 bg-[#141111] flex flex-col items-center py-4 gap-4">
                    {[Search, Users, MessageSquare, Target, Calendar].map((Icon, i) => (
                      <div key={i} className={`w-7 h-7 rounded-md flex items-center justify-center ${i === 0 ? 'bg-[#D1D0D0] text-black' : 'text-[#988686] hover:bg-[#1c1818]'}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                    ))}
                  </div>

                  {/* Main content */}
                  <div className="flex-1 p-4 overflow-hidden bg-black">
                    <div className="flex items-center gap-2 bg-[#141111] border border-[#5C4E4E]/55 rounded-lg px-3 py-2 mb-4">
                      <Search className="w-3 h-3 text-[#988686] shrink-0" />
                      <span className="text-[10px] text-[#988686] font-medium">Search by skill, name, or interest...</span>
                    </div>

                    <p className="text-[9px] font-bold uppercase tracking-widest text-[#988686] mb-1">Find Buddies UI</p>
                    <p className="text-[9px] text-[#988686] mb-2.5">Illustrative product preview — live matches come from your network</p>

                    <div className="space-y-2">
                      <BuddyCard name="ML Engineer" title="NLP · model evaluation" location="Remote" skills={["PyTorch", "NLP"]} score={97} initials="ML" />
                      <BuddyCard name="Full-stack Developer" title="React · APIs" location="Hybrid" skills={["React", "FastAPI"]} score={91} initials="FS" />
                      <BuddyCard name="Product Designer" title="Systems · prototyping" location="Remote" skills={["Figma", "Systems"]} score={88} initials="PD" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€ STATS BAR (honest — describe the product, not fake numbers) â”€â”€ */}
      <section className="py-12 px-6 border-y border-[#5C4E4E]/40 bg-black">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Skill-based discovery", desc: "Search by what people actually know, not just their job title." },
              { label: "Real community chat", desc: "Messages persist across sessions and are scoped to each community." },
              { label: "Connection requests", desc: "Send, accept, and manage connections with full notification support." },
              { label: "Points & leaderboards", desc: "Earned from real activity — messages, events, challenges." },
            ].map((item) => (
              <div key={item.label} className="flex flex-col">
                <p className="text-sm font-semibold text-[#D1D0D0] mb-1">{item.label}</p>
                <p className="text-xs text-[#988686] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ HOW IT WORKS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#D1D0D0] mb-3">How it works</p>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#D1D0D0] mb-4">
              From signup to your first real connection in minutes.
            </h2>
            <p className="text-[#988686] text-sm leading-relaxed">
              No lengthy onboarding forms. Add your skills, and the platform starts working immediately.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-0 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-5 left-[16.67%] right-[16.67%] h-px bg-gray-200" />

            {[
              {
                step: "01",
                title: "Set up your profile",
                body: "Sign up with email or Google. Add your professional title, skills, and interests. This is what others see when you show up in search."
              },
              {
                step: "02",
                title: "Discover relevant people",
                body: "Search by skill or interest. Skillzy uses semantic matching to rank profiles by relevance — not recency. See who shares your domain."
              },
              {
                step: "03",
                title: "Build in community",
                body: "Join communities around your field. Chat with members, take on challenges, attend events, and track your participation on the leaderboard."
              },
            ].map((item, i) => (
              <div key={i} className="relative flex flex-col items-start pt-8 px-6 first:pl-0 last:pr-0">
                <div className="w-10 h-10 rounded-full border-2 border-[#5C4E4E]/55 bg-[#141111] flex items-center justify-center text-xs font-bold text-[#988686] mb-5 z-10">
                  {item.step}
                </div>
                <h3 className="text-base font-bold text-[#D1D0D0] mb-2">{item.title}</h3>
                <p className="text-sm text-[#988686] leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ FEATURES — varied composition â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section id="features" className="py-20 px-6 bg-black border-t border-[#5C4E4E]/40">
        <div className="max-w-6xl mx-auto space-y-16">

          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#D1D0D0] mb-3">Features</p>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#D1D0D0] mb-4">
              Everything you need. Nothing you don't.
            </h2>
          </div>

          {/* Feature A — large + text side by side */}
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#D1D0D0] bg-[#5C4E4E]/35 px-3 py-1.5 rounded-full border border-[#5C4E4E] mb-5">
                <Search className="w-3.5 h-3.5" /> Find Buddies
              </div>
              <h3 className="text-xl font-bold text-[#D1D0D0] mb-4 tracking-tight">
                Search by what matters.<br />Not who people used to be.
              </h3>
              <p className="text-sm text-[#988686] leading-relaxed mb-5">
                Skillzy uses semantic vector search to match your query against actual user profiles — skills, bios, interests, and career goals. Type "machine learning for robotics" and see the people doing exactly that.
              </p>
              <ul className="space-y-2">
                {["Vector-embedded profile matching", "Skill filter chips", "Real-time connection state (send / pending / connected)", "Match relevance score per profile"].map(p => (
                  <li key={p} className="flex items-start gap-2 text-sm text-[#988686]">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            {/* Product preview — match list */}
            <div className="bg-[#141111] rounded-xl border border-[#5C4E4E]/55 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-[#5C4E4E]/40 flex items-center justify-between">
                <p className="text-xs font-bold text-[#D1D0D0]">Find Buddies</p>
                <span className="text-[10px] text-[#988686] font-medium">UI preview</span>
              </div>
              <div className="p-4 space-y-2.5">
                {[
                  { name: "ML Engineer", title: "NLP · evaluation", skills: ["PyTorch", "NLP", "Python"], score: 97, initials: "ML" },
                  { name: "Full-stack Developer", title: "APIs · React", skills: ["React", "FastAPI", "Go"], score: 91, initials: "FS" },
                  { name: "Product Designer", title: "Systems · UI", skills: ["Figma", "Design Systems"], score: 88, initials: "PD" },
                ].map(u => (
                  <div key={u.name} className="flex items-center justify-between p-3 rounded-lg bg-black border border-[#5C4E4E]/40">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#D1D0D0] text-black text-[10px] font-bold flex items-center justify-center shrink-0">
                        {u.initials}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#D1D0D0]">{u.name}</p>
                        <div className="flex gap-1 mt-0.5">
                          {u.skills.slice(0,2).map(s => (
                            <span key={s} className="text-[9px] bg-gray-200 text-[#988686] px-1.5 py-0.5 rounded">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#988686] tabular-nums">{u.score}%</span>
                      <button className="text-[10px] font-semibold px-2.5 py-1 bg-[#D1D0D0] text-black rounded">Connect</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feature B — communities */}
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* Preview left */}
            <div className="bg-[#141111] rounded-xl border border-[#5C4E4E]/55 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-[#5C4E4E]/40">
                <p className="text-xs font-bold text-[#D1D0D0]">Communities</p>
                <p className="text-[10px] text-[#988686] mt-0.5">UI preview — member counts are illustrative</p>
              </div>
              <div className="p-4 space-y-2">
                <CommunityPreview name="AI Builders" domain="Machine Learning" members="example" active={true} />
                <CommunityPreview name="Web Dev Guild" domain="Frontend / Backend" members="example" active={false} />
                <CommunityPreview name="Design Systems" domain="UI / UX" members="example" active={false} />
                <CommunityPreview name="Open Source" domain="Engineering" members="example" active={false} />
              </div>
              <div className="px-4 py-3 border-t border-[#5C4E4E]/40 bg-black">
                <p className="text-[10px] text-[#988686] font-medium">23 communities available in your area of interest</p>
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#D1D0D0] bg-[#5C4E4E]/35 px-3 py-1.5 rounded-full border border-[#5C4E4E] mb-5">
                <Users className="w-3.5 h-3.5" /> Communities
              </div>
              <h3 className="text-xl font-bold text-[#D1D0D0] mb-4 tracking-tight">
                Groups organized around domains.<br />Not random interests.
              </h3>
              <p className="text-sm text-[#988686] leading-relaxed mb-5">
                Each community on Skillzy has a purpose. Chat with other members, view the activity leaderboard, attend community events, and participate in challenges — all in one place.
              </p>
              <ul className="space-y-2">
                {["Persistent community chat (real-time polling)", "Leaderboard calculated from real engagement", "Events and challenges scoped to community", "Admin panel for community management"].map(p => (
                  <li key={p} className="flex items-start gap-2 text-sm text-[#988686]">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Feature C — events + challenges — two small columns */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[#141111] p-6 rounded-xl border border-[#5C4E4E]/55">
              <div className="w-9 h-9 rounded-lg bg-[#D1D0D0] flex items-center justify-center mb-4">
                <Calendar className="w-5 h-5 text-[#988686]" />
              </div>
              <h3 className="text-base font-bold text-[#D1D0D0] mb-2">Events</h3>
              <p className="text-sm text-[#988686] leading-relaxed mb-4">
                Create and attend events inside your communities. RSVP, track attendees, and add events to your upcoming schedule — all database-backed, no fake counts.
              </p>
              <div className="space-y-1.5">
                {["RSVP with persistence", "Real attendee count", "Community-scoped events"].map(f => (
                  <p key={f} className="text-xs text-[#988686] flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-[#988686]" />{f}
                  </p>
                ))}
              </div>
            </div>

            <div className="bg-[#141111] p-6 rounded-xl border border-[#5C4E4E]/55">
              <div className="w-9 h-9 rounded-lg bg-[#D1D0D0] flex items-center justify-center mb-4">
                <Target className="w-5 h-5 text-[#988686]" />
              </div>
              <h3 className="text-base font-bold text-[#D1D0D0] mb-2">Challenges</h3>
              <p className="text-sm text-[#988686] leading-relaxed mb-4">
                Join skill challenges to practice, compete, and get recognized alongside peers. Participation is tracked, points are earned, and leaderboards are real.
              </p>
              <div className="space-y-1.5">
                {["Difficulty-tiered challenges", "Points for participation", "Real participant tracking"].map(f => (
                  <p key={f} className="text-xs text-[#988686] flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-[#988686]" />{f}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€ HONEST PRODUCT TRUTH SECTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="py-20 px-6 border-t border-[#5C4E4E]/40">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#D1D0D0] mb-3">Why Skillzy</p>
              <h2 className="text-2xl font-bold tracking-tight text-[#D1D0D0] mb-5">
                A network built around what you can do — not who you know.
              </h2>
              <div className="space-y-5">
                {[
                  { icon: Network, title: "Connections that mean something", body: "Every connection on Skillzy is based on overlapping skills and goals. When you message someone, there's a reason." },
                  { icon: Briefcase, title: "No fake activity, ever", body: "Leaderboards, community stats, and match scores are calculated from real data in real-time. Nothing is fabricated to make the platform look busy." },
                  { icon: Zap, title: "Built for people who build things", body: "Whether you're shipping code, designing products, writing, or managing — Skillzy works for anyone whose skills are their identity." },
                ].map(({ icon: Icon, title, body }) => (
                  <div key={title} className="flex gap-4">
                    <div className="w-9 h-9 rounded-lg bg-[#5C4E4E]/35 flex items-center justify-center shrink-0">
                      <Icon className="w-4.5 h-4.5 text-[#988686] w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[#D1D0D0] mb-1">{title}</h3>
                      <p className="text-sm text-[#988686] leading-relaxed">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notification + activity preview */}
            <div className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#988686]">Notification UI preview</p>
              <p className="text-[10px] text-[#988686] -mt-1 mb-2">Illustrative notification types — not live user data</p>
              {[
                { message: "Someone accepted your connection request", time: "Just now", dot: "bg-emerald-400" },
                { message: "New message in a community you joined", time: "Recently", dot: "bg-[#988686]" },
                { message: "You joined a challenge — points are tracked when you participate", time: "Today", dot: "bg-amber-400" },
                { message: "An event you RSVPâ€™d to is starting soon", time: "Today", dot: "bg-blue-400" },
                { message: "You received a new connection request", time: "Earlier", dot: "bg-emerald-400" },
              ].map((n, i) => (
                <div key={i} className="flex items-start gap-3 p-3.5 bg-[#141111] rounded-lg border border-[#5C4E4E]/55">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#D1D0D0] leading-snug">{n.message}</p>
                    <p className="text-[10px] text-[#988686] mt-1">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€ SKILL DOMAINS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="py-16 px-6 border-t border-[#5C4E4E]/40 overflow-hidden">
        <div className="max-w-6xl mx-auto mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#D1D0D0] mb-3">Skill domains</p>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#D1D0D0] mb-3">
            Bring the skills you actually use.
          </h2>
          <p className="text-sm text-[#988686] max-w-xl leading-relaxed">
            Profiles are indexed by real skills — so discovery stays specific, whether you write code, ship products, or design systems.
          </p>
        </div>
        <div className="relative">
          <div className="flex gap-3 animate-[marquee_40s_linear_infinite] w-max">
            {[
              "React", "Python", "Product Management", "Figma", "Machine Learning", "TypeScript",
              "System Design", "UX Research", "FastAPI", "Go", "Data Engineering", "DevOps",
              "Technical Writing", "Growth", "iOS", "Android", "Rust", "Design Systems",
              "React", "Python", "Product Management", "Figma", "Machine Learning", "TypeScript",
              "System Design", "UX Research", "FastAPI", "Go", "Data Engineering", "DevOps",
            ].map((skill, i) => (
              <span
                key={`${skill}-${i}`}
                className="shrink-0 px-4 py-2 text-sm font-medium bg-[#141111] border border-[#5C4E4E]/55 text-[#D1D0D0] rounded-lg"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
        <style>{`
          @keyframes marquee {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
        `}</style>
      </section>

      {/* â”€â”€ USE CASES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="py-20 px-6 bg-black border-t border-[#5C4E4E]/40">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#D1D0D0] mb-3">Who it's for</p>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#D1D0D0] mb-4">
              Built for people mid-build, not mid-scroll.
            </h2>
            <p className="text-sm text-[#988686] leading-relaxed">
              Whether you're shipping a side project, switching domains, or looking for collaborators — Skillzy is structured around action, not feeds.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Sparkles,
                title: "Builders & makers",
                body: "Find co-founders, collaborators, and reviewers who share your stack — not just your city.",
              },
              {
                icon: Layers,
                title: "Career switchers",
                body: "Surface people already working in the domain you're moving into, ranked by skill overlap.",
              },
              {
                icon: Trophy,
                title: "Community organizers",
                body: "Run events, challenges, and chat spaces with leaderboards that reflect real participation.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="relative pt-8">
                <div className="w-10 h-10 rounded-lg bg-[#5C4E4E]/35 border border-[#5C4E4E]/55 flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5 text-[#D1D0D0]" />
                </div>
                <h3 className="text-base font-bold text-[#D1D0D0] mb-2">{title}</h3>
                <p className="text-sm text-[#988686] leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ INSIDE THE PRODUCT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="py-20 px-6 border-t border-[#5C4E4E]/40">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#D1D0D0] mb-3">Inside Skillzy</p>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#D1D0D0] mb-4">
              More than a connection list.
            </h2>
            <p className="text-sm text-[#988686] leading-relaxed">
              Once you're in, the product stays useful — chat, events, challenges, and a rewards store tied to real activity.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: MessageSquare, title: "Community chat", desc: "Persistent threads scoped to each community you join." },
              { icon: Award, title: "Points & rewards", desc: "Earn points from activity and redeem them in the store." },
              { icon: Shield, title: "Admin tools", desc: "Community admins manage members, events, and challenges." },
              { icon: Clock, title: "Weekly pulse", desc: "Dashboards that surface what's active in your communities." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-5 rounded-xl border border-[#5C4E4E]/55 bg-[#141111] group hover:border-[#988686]/60 transition-colors">
                <Icon className="w-5 h-5 text-[#988686] mb-4 group-hover:text-[#D1D0D0] transition-colors" />
                <h3 className="text-sm font-semibold text-[#D1D0D0] mb-1.5">{title}</h3>
                <p className="text-xs text-[#988686] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ SIMPLE JOURNEY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="py-20 px-6 bg-black border-t border-[#5C4E4E]/40">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#D1D0D0] mb-3">Your first week</p>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#D1D0D0] mb-4">
                A clear path from profile to people.
              </h2>
              <p className="text-sm text-[#988686] leading-relaxed">
                No empty feed. No cold outreach scripts. Just skills in, matches out, and communities ready to join.
              </p>
            </div>
            <ol className="space-y-0">
              {[
                { day: "Day 1", title: "Add skills & interests", detail: "Your profile becomes searchable the moment you finish setup." },
                { day: "Day 2–3", title: "Browse matches & communities", detail: "Filter by skill, send connection requests, join a domain group." },
                { day: "Day 4+", title: "Show up in chat & events", detail: "Message members, RSVP to events, take a challenge — earn points as you go." },
              ].map((item, i, arr) => (
                <li key={item.day} className="flex gap-5">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-[#D1D0D0] text-black text-[10px] font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </div>
                    {i < arr.length - 1 && <div className="w-px flex-1 bg-[#5C4E4E]/55 my-1" />}
                  </div>
                  <div className="pb-8 last:pb-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#988686] mb-1">{item.day}</p>
                    <h3 className="text-sm font-semibold text-[#D1D0D0] mb-1">{item.title}</h3>
                    <p className="text-xs text-[#988686] leading-relaxed">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* â”€â”€ CTA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="py-16 px-6 bg-[#141111] border-t border-[#5C4E4E]/55">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[#D1D0D0] mb-4 tracking-tight">
            Ready to find the people you should actually know?
          </h2>
          <p className="text-[#988686] mb-8 text-sm leading-relaxed max-w-xl mx-auto">
            Create a free account, add your skills, and start discovering professionals who are working on the same things you are.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate("/login")}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold bg-[#D1D0D0] text-black rounded-lg hover:bg-[#e8e7e7] transition-colors"
            >
              Create free account
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="/about"
              className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium border border-[#5C4E4E] text-[#D1D0D0] rounded-lg hover:border-[#988686] hover:bg-[#1c1818] transition-colors"
            >
              Learn more about Skillzy
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#5C4E4E]/55 py-10 px-6 bg-black">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-6 h-6 bg-[#D1D0D0] rounded-md flex items-center justify-center">
                  <span className="text-black font-black text-xs">S</span>
                </div>
                <span className="text-sm font-bold">Skillzy</span>
              </div>
              <p className="text-xs text-[#988686] max-w-xs leading-relaxed">
                Professional networking built around skills, not status.
              </p>
            </div>
            <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#988686]">
              <a href="/about" className="hover:text-[#D1D0D0] transition-colors">About</a>
              <a href="/contact" className="hover:text-[#D1D0D0] transition-colors">Contact</a>
              <a href="/privacy" className="hover:text-[#D1D0D0] transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-[#D1D0D0] transition-colors">Terms</a>
            </nav>
            <p className="text-xs text-[#988686]">© {new Date().getFullYear()} Skillzy</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
