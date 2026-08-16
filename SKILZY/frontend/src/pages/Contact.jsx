import { useState } from "react";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <main className="section">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Contact</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">We'd love to hear from you. Send us a message or reach out via email.</p>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          <form onSubmit={handleSubmit} className="card p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input className="input" value={form.name} onChange={(e)=>setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" className="input" value={form.email} onChange={(e)=>setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <input className="input" value={form.subject} onChange={(e)=>setForm({ ...form, subject: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Message</label>
              <textarea className="input h-28" value={form.message} onChange={(e)=>setForm({ ...form, message: e.target.value })} required />
            </div>
            <button type="submit" className="btn-primary">Send Message</button>
            {sent && <div className="text-sm text-green-600">Your message has been sent (placeholder).</div>}
          </form>

          <aside className="card p-6 space-y-3">
            <h2 className="text-xl font-semibold">Get in touch</h2>
            <p className="text-gray-600 dark:text-gray-300">Email: <a href="mailto:support@skillzy.app" className="underline">support@skillzy.app</a></p>
            <div className="pt-2">
              <h3 className="font-medium mb-2">Follow us</h3>
              <div className="flex items-center gap-4 text-sm">
                <a href="#" className="hover:underline">Twitter</a>
                <a href="#" className="hover:underline">LinkedIn</a>
                <a href="#" className="hover:underline">GitHub</a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default Contact;


