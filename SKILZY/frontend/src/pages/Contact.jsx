import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Twitter, Linkedin, Github } from "lucide-react";
import Footer from "../components/Footer";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setForm({ name: "", email: "", subject: "", message: "" });
    setTimeout(() => setSent(false), 4000);
  };

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
        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#D1D0D0] mb-3">Contact</p>
          <h1 className="text-3xl font-bold tracking-tight text-[#D1D0D0] mb-4">Get in touch</h1>
          <p className="text-base text-[#988686] max-w-xl leading-relaxed">
            Have a question, a feature request, or want to report an issue? We'd like to hear from you.
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-10">
          {/* Form */}
          <div className="md:col-span-3">
            {sent ? (
              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-sm font-semibold text-emerald-800">Message received</p>
                <p className="text-xs text-emerald-700 mt-1">Thanks for reaching out. We'll get back to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-text">Name</label>
                    <input
                      className="input-clean"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div>
                    <label className="label-text">Email</label>
                    <input
                      type="email"
                      className="input-clean"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="label-text">Subject</label>
                  <input
                    className="input-clean"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="What's this about?"
                  />
                </div>
                <div>
                  <label className="label-text">Message</label>
                  <textarea
                    className="input-clean resize-none"
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Write your message here..."
                    required
                  />
                </div>
                <button type="submit" className="btn-primary">
                  Send message
                </button>
              </form>
            )}
          </div>

          {/* Contact info */}
          <aside className="md:col-span-2 space-y-6">
            <div className="p-5 bg-black rounded-lg border border-[#5C4E4E]/40">
              <h2 className="text-sm font-bold text-[#D1D0D0] mb-3">Direct email</h2>
              <a href="mailto:support@skillzy.app" className="flex items-center gap-2 text-sm text-[#D1D0D0] hover:text-[#D1D0D0] transition-colors">
                <Mail className="w-4 h-4" />
                support@skillzy.app
              </a>
            </div>

            <div className="p-5 bg-black rounded-lg border border-[#5C4E4E]/40">
              <h2 className="text-sm font-bold text-[#D1D0D0] mb-3">Follow the project</h2>
              <div className="space-y-2">
                <a href="#" className="flex items-center gap-2 text-sm text-[#988686] hover:text-[#D1D0D0] transition-colors">
                  <Twitter className="w-4 h-4" /> Twitter / X
                </a>
                <a href="#" className="flex items-center gap-2 text-sm text-[#988686] hover:text-[#D1D0D0] transition-colors">
                  <Linkedin className="w-4 h-4" /> LinkedIn
                </a>
                <a href="#" className="flex items-center gap-2 text-sm text-[#988686] hover:text-[#D1D0D0] transition-colors">
                  <Github className="w-4 h-4" /> GitHub
                </a>
              </div>
            </div>

            <div className="p-5 bg-black rounded-lg border border-[#5C4E4E]/40">
              <h2 className="text-sm font-bold text-[#D1D0D0] mb-2">Response time</h2>
              <p className="text-xs text-[#988686] leading-relaxed">We aim to respond within 2 business days. For urgent platform issues, please include your account email.</p>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
