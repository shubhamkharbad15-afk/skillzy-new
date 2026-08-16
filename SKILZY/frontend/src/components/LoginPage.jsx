import { useState } from "react";
import { useNavigate } from "react-router-dom";

const GoogleIcon = (props) => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>Google</title>
    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.6 1.84-4.83 1.84-5.61 0-10.2-4.59-10.2-10.2s4.59-10.2 10.2-10.2c3.08 0 5.23 1.25 6.4 2.31l2.5-2.5C19.63 1.99 16.47 0 12.48 0 5.88 0 0 5.88 0 12.48s5.88 12.48 12.48 12.48c7.28 0 12.1-5.04 12.1-12.48 0-.85-.07-1.65-.2-2.4H12.48z" />
  </svg>
);

const LoginPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("login");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "", password: "", firstName: "", lastName: "", confirmPassword: ""
  });
  const [error, setError] = useState("");
  const API_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleAuthSuccess = (token, redirectPath = '/dashboard') => {
    try { localStorage.setItem('authToken', token); } catch (_) {}
    try { sessionStorage.setItem('authToken', token); } catch (_) {}
    navigate(redirectPath);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.append('username', formData.email);
      params.append('password', formData.password);
      const response = await fetch(`${API_URL}/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Incorrect email or password");
      }
      const data = await response.json();
      handleAuthSuccess(data.access_token, '/dashboard');
    } catch (err) {
      setError(err.message || "Sign in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      setIsLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Registration failed");
      }
      const data = await response.json();
      handleAuthSuccess(data.access_token, '/profile-setup');
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google/login`;
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 bg-[#D1D0D0] rounded-xl flex items-center justify-center">
              <span className="text-black font-black text-sm">S</span>
            </div>
            <span className="text-xl font-bold text-[#D1D0D0]">Skillzy</span>
          </a>
          <p className="text-sm text-[#988686]">
            {tab === "login" ? "Welcome back" : "Create your account"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#141111] rounded-2xl border border-[#5C4E4E]/55 shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-[#5C4E4E]/40">
            <button
              onClick={() => { setTab("login"); setError(""); }}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                tab === "login"
                  ? "text-[#D1D0D0] border-b-2 border-[#D1D0D0]"
                  : "text-[#988686] hover:text-[#D1D0D0]"
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => { setTab("signup"); setError(""); }}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                tab === "signup"
                  ? "text-[#D1D0D0] border-b-2 border-[#D1D0D0]"
                  : "text-[#988686] hover:text-[#D1D0D0]"
              }`}
            >
              Create account
            </button>
          </div>

          <div className="p-6">
            {/* Google OAuth */}
            <button
              onClick={handleGoogleLogin}
              type="button"
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-[#5C4E4E]/55 rounded-lg text-sm font-medium text-[#D1D0D0] hover:bg-black transition-colors mb-5"
            >
              <GoogleIcon className="w-4 h-4 fill-gray-600" />
              Continue with Google
            </button>

            {/* Divider */}
            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#5C4E4E]/40" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#141111] px-3 text-xs text-[#988686] font-medium">or</span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Login form */}
            {tab === "login" && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="login-email" className="block text-xs font-semibold text-[#D1D0D0] mb-1.5">
                    Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-lg border border-[#5C4E4E]/55 bg-[#141111] px-3.5 py-2.5 text-sm text-[#D1D0D0] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#988686] focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="login-password" className="block text-xs font-semibold text-[#D1D0D0] mb-1.5">
                    Password
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Your password"
                    required
                    className="w-full rounded-lg border border-[#5C4E4E]/55 bg-[#141111] px-3.5 py-2.5 text-sm text-[#D1D0D0] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#988686] focus:border-transparent transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-[#D1D0D0] text-black text-sm font-semibold rounded-lg hover:bg-[#e8e7e7] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </button>
              </form>
            )}

            {/* Signup form */}
            {tab === "signup" && (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="first-name" className="block text-xs font-semibold text-[#D1D0D0] mb-1.5">
                      First name
                    </label>
                    <input
                      id="first-name"
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="Jane"
                      required
                      className="w-full rounded-lg border border-[#5C4E4E]/55 bg-[#141111] px-3.5 py-2.5 text-sm text-[#D1D0D0] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#988686] focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="last-name" className="block text-xs font-semibold text-[#D1D0D0] mb-1.5">
                      Last name
                    </label>
                    <input
                      id="last-name"
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Smith"
                      required
                      className="w-full rounded-lg border border-[#5C4E4E]/55 bg-[#141111] px-3.5 py-2.5 text-sm text-[#D1D0D0] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#988686] focus:border-transparent transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="signup-email" className="block text-xs font-semibold text-[#D1D0D0] mb-1.5">
                    Email
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-lg border border-[#5C4E4E]/55 bg-[#141111] px-3.5 py-2.5 text-sm text-[#D1D0D0] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#988686] focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="signup-password" className="block text-xs font-semibold text-[#D1D0D0] mb-1.5">
                    Password <span className="text-[#988686] font-normal">(min 6 characters)</span>
                  </label>
                  <input
                    id="signup-password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Create a strong password"
                    required
                    className="w-full rounded-lg border border-[#5C4E4E]/55 bg-[#141111] px-3.5 py-2.5 text-sm text-[#D1D0D0] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#988686] focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="confirm-password" className="block text-xs font-semibold text-[#D1D0D0] mb-1.5">
                    Confirm password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Repeat your password"
                    required
                    className="w-full rounded-lg border border-[#5C4E4E]/55 bg-[#141111] px-3.5 py-2.5 text-sm text-[#D1D0D0] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#988686] focus:border-transparent transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-[#D1D0D0] text-black text-sm font-semibold rounded-lg hover:bg-[#e8e7e7] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Creating account..." : "Create account"}
                </button>
                <p className="text-xs text-[#988686] text-center">
                  By creating an account you agree to our{" "}
                  <a href="/terms" className="underline hover:text-[#988686]">Terms</a> and{" "}
                  <a href="/privacy" className="underline hover:text-[#988686]">Privacy Policy</a>.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
