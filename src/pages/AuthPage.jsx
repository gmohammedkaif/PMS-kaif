import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { Building2, Mail, Lock, User, Eye, EyeOff, ArrowRight, Home } from "lucide-react";

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
        toast.success("Welcome back!");
      } else {
        if (!name.trim()) { toast.error("Please enter your name"); setLoading(false); return; }
        await register(name, email, password);
        toast.success("Account created successfully!");
      }
      navigate("/dashboard");
    } catch (err) {
      const msg = err.code === "auth/user-not-found" ? "Account not found" :
                  err.code === "auth/wrong-password" ? "Incorrect password" :
                  err.code === "auth/email-already-in-use" ? "Email already registered" :
                  err.code === "auth/weak-password" ? "Password must be 6+ characters" :
                  "Something went wrong. Try again.";
      toast.error(msg);
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      toast.success("Welcome!");
      navigate("/dashboard");
    } catch {
      toast.error("Google sign-in failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900 flex-col items-center justify-center p-12">
        {/* Geometric patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="absolute inset-0 opacity-5">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute border border-white rounded-xl"
              style={{ width: 60 + i * 30, height: 60 + i * 30, top: `${Math.sin(i) * 50 + 50}%`, left: `${Math.cos(i) * 50 + 50}%`, transform: `translate(-50%, -50%) rotate(${i * 18}deg)`, opacity: 0.3 }} />
          ))}
        </div>

        <div className="relative z-10 text-center text-white">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center shadow-lg">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="font-display text-5xl font-bold mb-4 leading-tight">
            PropManager
            <span className="block text-brand-300 text-3xl font-medium mt-1">Pro</span>
          </h1>
          <p className="text-brand-200 text-lg mb-10 max-w-sm mx-auto leading-relaxed">
            The complete platform to manage all your rental properties, tenants, and leases in one place.
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
            {[
              { icon: Home, label: "Manage Properties" },
              { icon: User, label: "Track Tenants" },
              { icon: Mail, label: "Rent Reminders" },
              { icon: Lock, label: "Secure & Private" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-brand-200 bg-white/10 backdrop-blur rounded-xl px-3 py-2.5">
                <Icon className="w-4 h-4 text-brand-300 shrink-0" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 justify-center mb-8">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="font-display text-2xl font-bold text-brand-700 dark:text-brand-400">PropManager Pro</span>
          </div>

          <div className="card p-8">
            <div className="mb-8">
              <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {mode === "login" ? "Welcome back" : "Create account"}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {mode === "login" ? "Sign in to manage your properties" : "Start managing your properties today"}
              </p>
            </div>

            {/* Google Button */}
            <button onClick={handleGoogle} disabled={loading}
              className="w-full flex items-center justify-center gap-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium py-3 rounded-xl transition-all duration-200 mb-6 shadow-sm">
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs text-slate-400 font-medium">OR</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === "register" && (
                <div>
                  <label className="label">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input className="input pl-10" placeholder="John Doe" value={name}
                      onChange={(e) => setName(e.target.value)} required />
                  </div>
                </div>
              )}

              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="email" className="input pl-10" placeholder="you@example.com" value={email}
                    onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type={showPass ? "text" : "password"} className="input pl-10 pr-10"
                    placeholder="••••••••" value={password}
                    onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="btn-primary w-full justify-center py-3 text-base disabled:opacity-60">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    {mode === "login" ? "Signing in..." : "Creating account..."}
                  </span>
                ) : (
                  <>
                    {mode === "login" ? "Sign In" : "Create Account"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
