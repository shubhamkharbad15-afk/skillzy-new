const PrivacyPolicy = () => {
  return (
    <main className="section">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Privacy Policy</h1>
        <div className="card p-6 space-y-5 text-gray-700 dark:text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mb-2">Information Collection and Use</h2>
            <p>We collect information you provide to personalize your experience. This is placeholder text describing the types of information and how it's used.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2">Data Storage and Security</h2>
            <p>Your data is stored securely with appropriate safeguards. Placeholder details on retention and protection practices.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2">Cookies</h2>
            <p>We use cookies to improve functionality and analyze usage. You may manage cookie preferences in your browser.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2">User Rights and Control</h2>
            <p>You may access, update, or request deletion of your personal data where applicable.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2">Contact</h2>
            <p>For privacy-related inquiries, contact <a href="mailto:privacy@skillzy.app" className="underline">privacy@skillzy.app</a>.</p>
          </section>
        </div>
      </div>
    </main>
  );
};

export default PrivacyPolicy;


