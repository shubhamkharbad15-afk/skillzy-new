const About = () => {
  return (
    <main className="section">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">About Skillzy</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Skillzy is a platform to discover, learn, and grow your skills with a supportive community and curated resources.</p>
        </header>

        <section className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-2">Our Mission</h2>
            <p className="text-gray-600 dark:text-gray-300">Empower individuals to unlock their potential by connecting them with relevant learning paths, mentors, and hands-on opportunities.</p>
          </div>
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-2">Our Vision</h2>
            <p className="text-gray-600 dark:text-gray-300">A world where everyone can access personalized upskilling experiences and build meaningful professional connections.</p>
          </div>
        </section>

        <section className="card p-6 mb-10">
          <h2 className="text-xl font-semibold mb-3">What We Offer</h2>
          <ul className="list-disc pl-6 space-y-1 text-gray-600 dark:text-gray-300">
            <li>Personalized match-making based on your skills and interests</li>
            <li>Curated challenges, events, and community activities</li>
            <li>Simple tools to track progress and connect with peers</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {["Learning First", "Community", "Integrity"].map((title) => (
              <div key={title} className="card p-5">
                <h3 className="font-medium mb-1">{title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Placeholder description highlighting how this value is reflected at Skillzy.</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default About;


