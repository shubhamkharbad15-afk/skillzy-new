import { useState, useEffect, useMemo } from "react";
import { X, Plus, Loader2, User, Sparkles, Target, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../lib/api";
import { getOrgFieldMeta } from "../lib/profileFields";

const STEP_CONFIG = [
  { id: 1, label: "Basic info", icon: User, title: "About you", description: "Tell the Skillzy community who you are." },
  { id: 2, label: "Skills", icon: Sparkles, title: "What do you know?", description: "Add the skills you have. Others will find you based on these." },
  { id: 3, label: "Goals", icon: Target, title: "Interests and goals", description: "What are you interested in, and where are you headed?" }
];

const INPUT_CLASS =
  "w-full rounded-lg border border-[#5C4E4E]/55 bg-[#141111] px-3.5 py-2.5 text-sm text-[#D1D0D0] placeholder:text-[#6e6262] focus:outline-none focus:border-[#988686] focus:ring-1 focus:ring-[#988686]/40 transition-colors";

const ProfileSetup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [skills, setSkills] = useState([]);
  const [interests, setInterests] = useState([]);
  const [currentSkill, setCurrentSkill] = useState("");
  const [currentInterest, setCurrentInterest] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    bio: "",
    careerGoals: ""
  });

  const orgField = useMemo(() => getOrgFieldMeta(formData.title), [formData.title]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await fetchWithAuth("/users/me");
        setUser(userData);
      } catch (err) {
        setError("Failed to load your data. Please try logging in again.");
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addSkill = () => {
    const skill = currentSkill.trim();
    if (skill && !skills.includes(skill)) {
      setSkills(prev => [...prev, skill]);
      setCurrentSkill("");
    }
  };

  const addInterest = () => {
    const interest = currentInterest.trim();
    if (interest && !interests.includes(interest)) {
      setInterests(prev => [...prev, interest]);
      setCurrentInterest("");
    }
  };

  const canAdvanceStep1 = formData.title.trim() && formData.bio.trim();
  const canAdvanceStep2 = skills.length > 0;

  const handleComplete = async () => {
    setError("");
    if (!formData.title.trim() || !formData.bio.trim() || skills.length === 0 || interests.length === 0) {
      setError("Please fill in all required fields and add at least one skill and one interest.");
      return;
    }
    const profileData = {
      title: formData.title.trim(),
      company: formData.company.trim(),
      location: formData.location.trim(),
      bio: formData.bio.trim(),
      careerGoals: formData.careerGoals.trim(),
      skills,
      interests
    };
    try {
      setSaving(true);
      await fetchWithAuth("/users/me/profile", { method: "POST", body: JSON.stringify(profileData) });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const raw = err?.message || "";
      const friendly = raw.includes("401")
        ? "Your session expired. Please sign in again."
        : raw.includes("HTTP error")
        ? "Couldn't save your profile. Check your connection and try again."
        : (raw || "Failed to save your profile. Please try again.");
      setError(friendly);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#988686]" />
      </div>
    );
  }

  if (error && !saving && !user) {
    return (
      <div className="min-h-screen bg-black flex flex-col gap-4 items-center justify-center px-6">
        <p className="text-sm text-red-600 text-center">{error}</p>
        <button onClick={() => navigate("/login")} className="px-4 py-2 text-sm font-medium bg-[#D1D0D0] text-black rounded-lg">
          Go to sign in
        </button>
      </div>
    );
  }

  const currentStepConfig = STEP_CONFIG[step - 1];

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <header className="bg-[#141111] border-b border-[#5C4E4E]/55 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#D1D0D0] rounded-lg flex items-center justify-center">
              <span className="text-black font-black text-xs">S</span>
            </div>
            <span className="text-base font-bold text-[#D1D0D0]">Skillzy</span>
          </div>
          <span className="text-xs text-[#988686]">Profile setup</span>
        </div>
      </header>

      <div className="flex-1 flex items-start justify-center py-10 px-4">
        <div className="w-full max-w-2xl">
          <div className="mb-8">
            <div className="flex items-center gap-0">
              {STEP_CONFIG.map((s, index) => (
                <div key={s.id} className="flex items-center flex-1">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step > s.id
                        ? "bg-emerald-500 text-white"
                        : step === s.id
                        ? "bg-[#D1D0D0] text-black"
                        : "bg-[#5C4E4E]/35 text-[#988686]"
                    }`}>
                      {step > s.id ? <Check className="w-4 h-4" /> : s.id}
                    </div>
                    <span className={`text-xs font-medium hidden sm:block ${
                      step === s.id ? "text-[#D1D0D0]" : "text-[#988686]"
                    }`}>{s.label}</span>
                  </div>
                  {index < STEP_CONFIG.length - 1 && (
                    <div className={`flex-1 h-px mx-3 ${step > s.id ? "bg-emerald-500/60" : "bg-[#5C4E4E]/55"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#141111] rounded-2xl border border-[#5C4E4E]/55 shadow-sm">
            <div className="px-6 sm:px-8 py-6 border-b border-[#5C4E4E]/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#D1D0D0] rounded-xl flex items-center justify-center shrink-0">
                  <currentStepConfig.icon className="w-5 h-5 text-[#988686]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#D1D0D0]">{currentStepConfig.title}</h2>
                  <p className="text-sm text-[#988686]">{currentStepConfig.description}</p>
                </div>
              </div>
              {user?.first_name && step === 1 && (
                <p className="mt-3 text-sm text-[#D1D0D0]">
                  Welcome, <strong>{user.first_name}</strong>. Let's get your profile set up.
                </p>
              )}
            </div>

            <div className="px-6 sm:px-8 py-6 space-y-5">
              {step === 1 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[#D1D0D0] mb-1.5">
                      Title <span className="text-[#988686] font-normal" aria-hidden="true">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="Student, Software Engineer, Designer…"
                      className={INPUT_CLASS}
                      required
                    />
                    <p className="text-xs text-[#6e6262] mt-1.5">Your role — student, professional, freelancer, or anything in between.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#988686] mb-1.5">{orgField.label}</label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => handleInputChange("company", e.target.value)}
                        placeholder={orgField.placeholder}
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#988686] mb-1.5">Location</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                        placeholder="e.g. Pune, Maharashtra"
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#D1D0D0] mb-1.5">
                      Bio <span className="text-[#988686] font-normal" aria-hidden="true">*</span>
                    </label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => handleInputChange("bio", e.target.value)}
                      placeholder="Tell others what you know, what you're learning, and what you'd like to connect with people about."
                      rows={4}
                      className={`${INPUT_CLASS} resize-none`}
                      required
                    />
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[#D1D0D0] mb-1.5">
                      Add a skill <span className="text-[#988686] font-normal" aria-hidden="true">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentSkill}
                        onChange={(e) => setCurrentSkill(e.target.value)}
                        placeholder="React, Python, Product Management…"
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                        className={`${INPUT_CLASS} flex-1`}
                      />
                      <button
                        type="button"
                        onClick={addSkill}
                        className="px-4 py-2.5 bg-[#D1D0D0] text-black text-sm font-medium rounded-lg hover:bg-[#e8e7e7] transition-colors"
                        aria-label="Add skill"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-[#6e6262] mt-1.5">Press Enter or click + to add</p>
                  </div>
                  {skills.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-[#D1D0D0] mb-2">Your skills ({skills.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {skills.map(skill => (
                          <span key={skill} className="inline-flex items-center gap-1.5 bg-[#D1D0D0] text-black text-xs font-medium px-3 py-1.5 rounded-md border border-[#5C4E4E]/55">
                            {skill}
                            <button type="button" onClick={() => setSkills(prev => prev.filter(s => s !== skill))} className="text-black/50 hover:text-red-600 transition-colors">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {skills.length === 0 && (
                    <div className="py-6 border border-dashed border-[#5C4E4E]/55 rounded-lg text-center text-sm text-[#988686]">
                      No skills added yet. Add at least one to continue.
                    </div>
                  )}
                </>
              )}

              {step === 3 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[#D1D0D0] mb-1.5">
                      Add an interest <span className="text-[#988686] font-normal" aria-hidden="true">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentInterest}
                        onChange={(e) => setCurrentInterest(e.target.value)}
                        placeholder="AI, open source, design, startups…"
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addInterest(); } }}
                        className={`${INPUT_CLASS} flex-1`}
                      />
                      <button
                        type="button"
                        onClick={addInterest}
                        className="px-4 py-2.5 bg-[#D1D0D0] text-black text-sm font-medium rounded-lg hover:bg-[#e8e7e7] transition-colors"
                        aria-label="Add interest"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-[#6e6262] mt-1.5">Press Enter or click + to add</p>
                  </div>
                  {interests.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-[#D1D0D0] mb-2">Your interests ({interests.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {interests.map(interest => (
                          <span key={interest} className="inline-flex items-center gap-1.5 bg-[#5C4E4E]/35 text-[#D1D0D0] text-xs font-medium px-3 py-1.5 rounded-md border border-[#5C4E4E]">
                            {interest}
                            <button type="button" onClick={() => setInterests(prev => prev.filter(i => i !== interest))} className="text-[#988686] hover:text-red-400 transition-colors">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {interests.length === 0 && (
                    <div className="py-6 border border-dashed border-[#5C4E4E]/55 rounded-lg text-center text-sm text-[#988686]">
                      No interests added yet. Add at least one to continue.
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-[#988686] mb-1.5">
                      Goals <span className="text-[#6e6262] font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={formData.careerGoals}
                      onChange={(e) => handleInputChange("careerGoals", e.target.value)}
                      placeholder="What do you want to learn or achieve in the next year?"
                      rows={3}
                      className={`${INPUT_CLASS} resize-none`}
                    />
                  </div>
                </>
              )}

              {error && !saving && (
                <div className="p-3 bg-red-950/40 border border-red-900/50 text-red-300 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>

            <div className="px-6 sm:px-8 py-5 border-t border-[#5C4E4E]/40 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(prev => Math.max(1, prev - 1))}
                disabled={step === 1 || saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#988686] border border-[#5C4E4E]/55 rounded-lg hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <div className="flex items-center gap-2">
                {STEP_CONFIG.map(s => (
                  <div
                    key={s.id}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      step === s.id ? "bg-[#D1D0D0] w-4" : step > s.id ? "bg-emerald-400" : "bg-[#5C4E4E]"
                    }`}
                  />
                ))}
              </div>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep(prev => Math.min(3, prev + 1))}
                  disabled={saving || (step === 1 && !canAdvanceStep1) || (step === 2 && !canAdvanceStep2)}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold bg-[#D1D0D0] text-black rounded-lg hover:bg-[#e8e7e7] transition-colors disabled:opacity-60"
                >
                  {step === 1 ? "Continue to skills" : "Continue to goals"} <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={saving || interests.length === 0}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold bg-[#5C4E4E] text-[#D1D0D0] rounded-lg hover:bg-[#6a5a5a] transition-colors disabled:opacity-60"
                >
                  {saving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                  ) : (
                    <><Check className="w-4 h-4" /> Save profile</>
                  )}
                </button>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-[#988686] mt-4">
            You can edit everything later from your profile.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
