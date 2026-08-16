import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const GoogleIcon = (props) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
        <title>Google</title>
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.6 1.84-4.83 1.84-5.61 0-10.2-4.59-10.2-10.2s4.59-10.2 10.2-10.2c3.08 0 5.23 1.25 6.4 2.31l2.5-2.5C19.63 1.99 16.47 0 12.48 0 5.88 0 0 5.88 0 12.48s5.88 12.48 12.48 12.48c7.28 0 12.1-5.04 12.1-12.48 0-.85-.07-1.65-.2-2.4H12.48z" />
    </svg>
);

const LoginPage = () => {
    const navigate = useNavigate();
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
        try {
            localStorage.setItem('authToken', token);
        } catch (_) {}
        try {
            sessionStorage.setItem('authToken', token);
        } catch (_) {}
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
                throw new Error(errorData.detail || "Login failed");
            }
            const data = await response.json();
            handleAuthSuccess(data.access_token, '/dashboard');
        } catch (error) {
            setError(error.message || "Login failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
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
        } catch (error) {
            setError(error.message || "Registration failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = `${API_URL}/auth/google/login`;
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
            <div className="w-full max-w-md">
                <div className="text-center mb-8 relative">
                    <div className="flex items-center justify-center space-x-2 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-400 rounded-xl flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold">Skillzy</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">Welcome back! Let's get you connected.</p>
                </div>
                <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl text-center">Get Started</CardTitle>
                        <CardDescription className="text-center text-gray-600 dark:text-gray-400">Sign in to your account or create a new one</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (<div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>)}
                        <Button variant="outline" className="w-full flex items-center justify-center gap-2 mb-6" onClick={handleGoogleLogin}>
                            <GoogleIcon className="w-5 h-5" /> Sign in with Google
                        </Button>
                        <div className="relative mb-6">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-500 dark:bg-gray-800 dark:text-gray-400">Or continue with email</span></div>
                        </div>
                        <Tabs defaultValue="login" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-6">
                                <TabsTrigger value="login">Sign In</TabsTrigger>
                                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                            </TabsList>
                            <TabsContent value="login">
                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} placeholder="your.email@example.com" required className="bg-gray-50 dark:bg-gray-700" /></div>
                                    <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} placeholder="Enter your password" required className="bg-gray-50 dark:bg-gray-700" /></div>
                                    <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-400 text-white">{isLoading ? "Signing In..." : "Sign In"}</Button>
                                </form>
                            </TabsContent>
                            <TabsContent value="signup">
                                <form onSubmit={handleSignup} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2"><Label htmlFor="first-name">First Name</Label><Input id="first-name" value={formData.firstName} onChange={(e) => handleInputChange('firstName', e.target.value)} placeholder="John" required className="bg-gray-50 dark:bg-gray-700" /></div>
                                        <div className="space-y-2"><Label htmlFor="last-name">Last Name</Label><Input id="last-name" value={formData.lastName} onChange={(e) => handleInputChange('lastName', e.target.value)} placeholder="Doe" required className="bg-gray-50 dark:bg-gray-700" /></div>
                                    </div>
                                    <div className="space-y-2"><Label htmlFor="signup-email">Email</Label><Input id="signup-email" type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} placeholder="your.email@example.com" required className="bg-gray-50 dark:bg-gray-700" /></div>
                                    <div className="space-y-2"><Label htmlFor="signup-password">Password</Label><Input id="signup-password" type="password" value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} placeholder="Create a strong password" required className="bg-gray-50 dark:bg-gray-700" /></div>
                                    <div className="space-y-2"><Label htmlFor="confirm-password">Confirm Password</Label><Input id="confirm-password" type="password" value={formData.confirmPassword} onChange={(e) => handleInputChange('confirmPassword', e.target.value)} placeholder="Confirm your password" required className="bg-gray-50 dark:bg-gray-700" /></div>
                                    <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-400 text-white">{isLoading ? "Creating Account..." : "Create Account"}</Button>
                                </form>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default LoginPage;