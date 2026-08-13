import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Users, Calendar, Target, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../lib/api";

const LandingPage = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetchWithAuth('/auth/is-admin', { redirectOn401: false });
        setIsAdmin(!!res?.isAdmin);
      } catch (_) {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-blue-400 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">Skillzy</span>
          </div>
          <nav className="hidden md:flex space-x-6">
            <a href="#features" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
              Features
            </a>
            <a href="#about" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
              About
            </a>
            <a href="#contact" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
              Contact
            </a>
            {/* Admin entry removed; Admin is accessible only within community view for community admins */}
          </nav>
          <Button
            onClick={() => navigate("/login")}
            variant="outline"
            className="border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-blue-400 bg-clip-text text-transparent">
              Connect. Collaborate. Grow.
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Join a community of like-minded professionals. Share goals, organize events, and build meaningful connections that propel your career forward.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate("/login")}
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-blue-400 hover:opacity-90 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Get Started <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900 px-8 py-3 rounded-xl"
                onClick={() => navigate("/about")}
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Skillzy?</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              More than just networking - build genuine relationships and accelerate your growth
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            <Card className="p-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-400 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Smart Matching</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Connect with professionals who share your goals, interests, and career aspirations through our intelligent matching system.
              </p>
            </Card>

            <Card className="p-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-400 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Event Organization</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Create and join professional events, workshops, and meetups. Build your network through meaningful in-person connections.
              </p>
            </Card>

            <Card className="p-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-400 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Goal Tracking</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Set career goals, track progress, and find accountability partners who will help you stay motivated and focused.
              </p>
            </Card>

            <Card className="p-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-400 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Skill Exchange</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Share your expertise and learn from others. Create a mutually beneficial ecosystem of knowledge and growth.
              </p>
            </Card>

            <Card className="p-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-400 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Communities</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Join specialized communities based on your industry, interests, or career stage. Find your tribe and grow together.
              </p>
            </Card>

            <Card className="p-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-400 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <ArrowRight className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Career Growth</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Access mentorship opportunities, career advice, and resources that help you advance in your professional journey.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <Card className="p-12 text-center bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 border border-indigo-100 dark:border-gray-600">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Network?</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of professionals who are already building meaningful connections and accelerating their careers.
            </p>
            <Button
              onClick={() => navigate("/login")}
              size="lg"
              className="bg-gradient-to-r from-indigo-600 to-blue-400 hover:opacity-90 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Start Connecting Today <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-blue-400 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">Skillzy</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            © 2025 Skillzy. Connecting professionals, one relationship at a time.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
