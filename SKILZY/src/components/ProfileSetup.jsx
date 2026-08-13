import { useState, useEffect } from "react";
import {
    Users,
    ArrowRight,
    X,
    Plus,
    Sparkles,
    Target,
    User,
    Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../lib/api";

const ProfileSetup = () => {
    const navigate = useNavigate();

    const [step, setStep] = useState(1);

    const [skills, setSkills] = useState([]);
    const [interests, setInterests] = useState([]);

    const [currentSkill, setCurrentSkill] = useState("");
    const [currentInterest, setCurrentInterest] = useState("");

    // User data, loading and errors
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Profile form data
    const [formData, setFormData] = useState({
        title: "",
        company: "",
        location: "",
        bio: "",
        careerGoals: ""
    });

    // --------------------------------------------------
    // FETCH CURRENT USER
    // --------------------------------------------------

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                console.log("Fetching current user...");

                const userData = await fetchWithAuth("/users/me");

                console.log("Current user:", userData);

                setUser(userData);
            } catch (err) {
                console.error("Failed to fetch user data:", err);

                setError(
                    "Failed to load your data. Please try logging in again."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    // --------------------------------------------------
    // FORM INPUT
    // --------------------------------------------------

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value
        }));
    };

    // --------------------------------------------------
    // SKILLS
    // --------------------------------------------------

    const addSkill = () => {
        const skill = currentSkill.trim();

        if (skill && !skills.includes(skill)) {
            setSkills((prev) => [...prev, skill]);
            setCurrentSkill("");
        }
    };

    const removeSkill = (skill) => {
        setSkills((prev) => prev.filter((s) => s !== skill));
    };

    // --------------------------------------------------
    // INTERESTS
    // --------------------------------------------------

    const addInterest = () => {
        const interest = currentInterest.trim();

        if (interest && !interests.includes(interest)) {
            setInterests((prev) => [...prev, interest]);
            setCurrentInterest("");
        }
    };

    const removeInterest = (interest) => {
        setInterests((prev) =>
            prev.filter((i) => i !== interest)
        );
    };

    // --------------------------------------------------
    // STEPS
    // --------------------------------------------------

    const nextStep = () => {
        if (step < 3) {
            setStep((prev) => prev + 1);
        }
    };

    const prevStep = () => {
        if (step > 1) {
            setStep((prev) => prev - 1);
        }
    };

    // --------------------------------------------------
    // COMPLETE PROFILE
    // --------------------------------------------------

    const handleComplete = async () => {
        // Clear previous error
        setError("");

        // Validate required fields
        if (
            !formData.title.trim() ||
            !formData.bio.trim() ||
            skills.length === 0 ||
            interests.length === 0
        ) {
            alert(
                "Please fill in required fields and add at least one skill and interest."
            );
            return;
        }

        const profileData = {
            ...formData,
            title: formData.title.trim(),
            company: formData.company.trim(),
            location: formData.location.trim(),
            bio: formData.bio.trim(),
            careerGoals: formData.careerGoals.trim(),
            skills,
            interests
        };

        console.log(
            "📤 Sending profile data to backend:",
            profileData
        );

        try {
            setSaving(true);

            // --------------------------------------------
            // SAVE PROFILE
            // --------------------------------------------

            const response = await fetchWithAuth(
                "/users/me/profile",
                {
                    method: "POST",
                    body: JSON.stringify(profileData)
                }
            );

            console.log(
                "✅ Profile saved successfully:",
                response
            );

            // --------------------------------------------
            // PROFILE SAVED
            // NOW GO TO DASHBOARD
            // --------------------------------------------

            alert("Profile setup complete!");

            console.log(
                "🚀 Profile completed. Navigating to dashboard..."
            );

            navigate("/dashboard", {
                replace: true
            });

        } catch (err) {
            console.error(
                "❌ Failed to save profile:",
                err
            );

            const errorMessage =
                err?.message ||
                "Sorry, we couldn't save your profile. Please try again.";

            console.error(
                "Backend error:",
                errorMessage
            );

            setError(errorMessage);

            alert(
                `Profile save failed:\n\n${errorMessage}`
            );

        } finally {
            setSaving(false);
        }
    };

    // --------------------------------------------------
    // STEP ICONS
    // --------------------------------------------------

    const stepIcons = [
        User,
        Sparkles,
        Target
    ];

    const StepIcon = stepIcons[step - 1];

    // --------------------------------------------------
    // LOADING
    // --------------------------------------------------

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
            </div>
        );
    }

    // --------------------------------------------------
    // ERROR LOADING USER
    // --------------------------------------------------

    if (error && !saving) {
        return (
            <div className="min-h-screen flex flex-col gap-4 items-center justify-center text-red-400 bg-slate-900 px-6">

                <p className="text-center">
                    {error}
                </p>

                <button
                    onClick={() => navigate("/login")}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md"
                >
                    Go to Login
                </button>

            </div>
        );
    }

    // --------------------------------------------------
    // UI
    // --------------------------------------------------

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center p-4">

            {/* Background effects */}

            <div className="absolute inset-0 overflow-hidden pointer-events-none">

                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-full blur-3xl animate-pulse"></div>

                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-500/10 to-orange-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-500/5 to-cyan-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>

            </div>

            <div className="w-full max-w-2xl relative z-10">

                {/* Header */}

                <div className="text-center mb-8">

                    <div className="flex items-center justify-center space-x-3 mb-6">

                        <div className="relative">

                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20">

                                <Users className="w-8 h-8 text-white" />

                            </div>

                            <div className="absolute -inset-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl blur animate-pulse"></div>

                        </div>

                        <div>

                            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">

                                Welcome, {user?.first_name || "User"}!

                            </h1>

                            <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mt-1"></div>

                        </div>

                    </div>

                    <p className="text-slate-400 text-lg">
                        Let's create your perfect professional profile
                    </p>

                </div>

                {/* Step indicator */}

                <div className="flex justify-center mb-10">

                    <div className="flex items-center space-x-4">

                        {[1, 2, 3].map((i) => {

                            const IconComponent =
                                stepIcons[i - 1];

                            return (
                                <div
                                    key={i}
                                    className="flex items-center"
                                >

                                    <div
                                        className={`relative transition-all duration-500 ${
                                            i <= step
                                                ? "transform scale-110"
                                                : ""
                                        }`}
                                    >

                                        <div
                                            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                                                i <= step
                                                    ? "bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-xl shadow-blue-500/25"
                                                    : "bg-slate-800 text-slate-500 shadow-lg border border-slate-700"
                                            }`}
                                        >

                                            <IconComponent className="w-5 h-5" />

                                        </div>

                                        {i <= step && (
                                            <div className="absolute -inset-1 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-2xl blur animate-pulse"></div>
                                        )}

                                    </div>

                                    {i < 3 && (
                                        <div
                                            className={`w-12 h-1 mx-2 rounded-full transition-all duration-500 ${
                                                i < step
                                                    ? "bg-gradient-to-r from-blue-500 to-purple-500"
                                                    : "bg-slate-700"
                                            }`}
                                        ></div>
                                    )}

                                </div>
                            );

                        })}

                    </div>

                </div>

                {/* Main card */}

                <div className="bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden">

                    {/* Card header */}

                    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-8 border-b border-slate-700/50">

                        <div className="flex items-center space-x-3 mb-2">

                            <StepIcon className="w-6 h-6 text-blue-400" />

                            <h2 className="text-2xl font-bold text-white">

                                {step === 1 && "Basic Information"}

                                {step === 2 && "Skills & Expertise"}

                                {step === 3 && "Interests & Goals"}

                            </h2>

                        </div>

                        <p className="text-slate-400">

                            {step === 1 &&
                                "Tell us about your professional background"}

                            {step === 2 &&
                                "Share your expertise and capabilities"}

                            {step === 3 &&
                                "Define your interests and aspirations"}

                        </p>

                    </div>

                    {/* Form */}

                    <div className="p-8 space-y-6">

                        {/* STEP 1 */}

                        {step === 1 && (
                            <div className="space-y-6">

                                <div className="space-y-3">

                                    <label className="block text-sm font-semibold text-slate-300">
                                        Professional Title{" "}
                                        <span className="text-red-400">
                                            *
                                        </span>
                                    </label>

                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "title",
                                                e.target.value
                                            )
                                        }
                                        placeholder="e.g. Senior Software Engineer"
                                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                </div>

                                <div className="space-y-3">

                                    <label className="block text-sm font-semibold text-slate-300">
                                        Company
                                    </label>

                                    <input
                                        type="text"
                                        value={formData.company}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "company",
                                                e.target.value
                                            )
                                        }
                                        placeholder="e.g. Tech Corp"
                                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                </div>

                                <div className="space-y-3">

                                    <label className="block text-sm font-semibold text-slate-300">
                                        Location
                                    </label>

                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "location",
                                                e.target.value
                                            )
                                        }
                                        placeholder="e.g. San Francisco, CA"
                                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                </div>

                                <div className="space-y-3">

                                    <label className="block text-sm font-semibold text-slate-300">
                                        Bio{" "}
                                        <span className="text-red-400">
                                            *
                                        </span>
                                    </label>

                                    <textarea
                                        value={formData.bio}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "bio",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Tell us about yourself..."
                                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px] resize-none"
                                    />

                                </div>

                            </div>
                        )}

                        {/* STEP 2 */}

                        {step === 2 && (
                            <div className="space-y-6">

                                <div className="space-y-3">

                                    <label className="block text-sm font-semibold text-slate-300">
                                        Add Skills{" "}
                                        <span className="text-red-400">
                                            *
                                        </span>
                                    </label>

                                    <div className="flex space-x-3">

                                        <input
                                            type="text"
                                            value={currentSkill}
                                            onChange={(e) =>
                                                setCurrentSkill(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="e.g. React, Project Management"
                                            className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    addSkill();
                                                }
                                            }}
                                        />

                                        <button
                                            type="button"
                                            onClick={addSkill}
                                            className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>

                                    </div>

                                </div>

                                {skills.length > 0 && (
                                    <div className="space-y-3">

                                        <label className="block text-sm font-semibold text-slate-300">
                                            Your Skills
                                        </label>

                                        <div className="flex flex-wrap gap-3">

                                            {skills.map((skill) => (
                                                <div
                                                    key={skill}
                                                    className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 text-slate-200 px-4 py-2 rounded-xl border border-blue-500/30 flex items-center space-x-2"
                                                >

                                                    <span className="font-medium">
                                                        {skill}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeSkill(skill)
                                                        }
                                                        className="text-slate-400 hover:text-red-400"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>

                                                </div>
                                            ))}

                                        </div>

                                    </div>
                                )}

                            </div>
                        )}

                        {/* STEP 3 */}

                        {step === 3 && (
                            <div className="space-y-6">

                                <div className="space-y-3">

                                    <label className="block text-sm font-semibold text-slate-300">
                                        Add Interests{" "}
                                        <span className="text-red-400">
                                            *
                                        </span>
                                    </label>

                                    <div className="flex space-x-3">

                                        <input
                                            type="text"
                                            value={currentInterest}
                                            onChange={(e) =>
                                                setCurrentInterest(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="e.g. Entrepreneurship, AI"
                                            className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    addInterest();
                                                }
                                            }}
                                        />

                                        <button
                                            type="button"
                                            onClick={addInterest}
                                            className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>

                                    </div>

                                </div>

                                {interests.length > 0 && (
                                    <div className="space-y-3">

                                        <label className="block text-sm font-semibold text-slate-300">
                                            Your Interests
                                        </label>

                                        <div className="flex flex-wrap gap-3">

                                            {interests.map((interest) => (
                                                <div
                                                    key={interest}
                                                    className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 text-slate-200 px-4 py-2 rounded-xl border border-purple-500/30 flex items-center space-x-2"
                                                >

                                                    <span className="font-medium">
                                                        {interest}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeInterest(
                                                                interest
                                                            )
                                                        }
                                                        className="text-slate-400 hover:text-red-400"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>

                                                </div>
                                            ))}

                                        </div>

                                    </div>
                                )}

                                <div className="space-y-3">

                                    <label className="block text-sm font-semibold text-slate-300">
                                        Career Goals
                                    </label>

                                    <textarea
                                        value={formData.careerGoals}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "careerGoals",
                                                e.target.value
                                            )
                                        }
                                        placeholder="What are your career aspirations?"
                                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 min-h-[120px] resize-none"
                                    />

                                </div>

                            </div>
                        )}

                        {/* Error shown during save */}

                        {error && (
                            <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300">
                                {error}
                            </div>
                        )}

                        {/* Navigation */}

                        <div className="flex justify-between items-center pt-8 border-t border-slate-700/50">

                            <button
                                type="button"
                                onClick={prevStep}
                                disabled={step === 1 || saving}
                                className="px-6 py-3 bg-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-600/50 disabled:opacity-50"
                            >
                                Previous
                            </button>

                            {step < 3 ? (

                                <button
                                    type="button"
                                    onClick={nextStep}
                                    disabled={saving}
                                    className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl flex items-center space-x-2 disabled:opacity-50"
                                >

                                    <span>Next</span>

                                    <ArrowRight className="w-5 h-5" />

                                </button>

                            ) : (

                                <button
                                    type="button"
                                    onClick={handleComplete}
                                    disabled={saving}
                                    className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl flex items-center space-x-2 disabled:opacity-50"
                                >

                                    {saving ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>
                                                Complete Setup
                                            </span>

                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}

                                </button>

                            )}

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
};

export default ProfileSetup;