import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, signup } from "../../services/authService";

const AuthForm = () => {
  const navigate  = useNavigate();
  const [mode,     setMode]     = useState("login");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const isLogin = mode === "login";

  const handleSubmit = async () => {
  setError("");
  if (!email || !password) {
    setError("Please fill all fields");
    return;
  }

  try {
    setLoading(true);

    if (isLogin) {
      // ✅ LOGIN FLOW
      const res = await login({ email, password });

      localStorage.setItem("access", res.access);
      localStorage.setItem("refresh", res.refresh);
      localStorage.setItem("user", JSON.stringify(res.user));

      navigate("/monitor");
    } else {
      // ✅ SIGNUP FLOW
      await signup({ email, password });

      // 👉 DO NOT store tokens
      // 👉 DO NOT navigate to monitor

      // 👉 Switch to login screen
      setMode("login");
      setPassword("");
      setError("Account created! Please sign in.");
    }

  } catch {
    setError("Authentication failed. Check your credentials.");
  } finally {
    setLoading(false);
  }
};

  

  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      <div className="mb-1">
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
          {isLogin ? "Welcome back" : "Create account"}
        </p>
        <h3 className="text-base font-semibold text-zinc-100">
          {isLogin ? "Sign in to continue" : "Start monitoring today"}
        </h3>
      </div>

      

      

      {/* Email */}
      <input
        type="email"
        placeholder="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5
          text-xs text-zinc-200 placeholder-zinc-600
          focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20
          transition-colors"
      />

      {/* Password */}
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5
          text-xs text-zinc-200 placeholder-zinc-600
          focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20
          transition-colors"
      />

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40
          disabled:cursor-not-allowed text-white text-xs font-medium py-2.5 rounded-lg
          transition-colors"
      >
        {loading ? "Please wait..." : isLogin ? "Sign in" : "Create account"}
      </button>

      {/* Toggle */}
      <p className="text-center text-xs text-zinc-600">
        {isLogin ? "Don't have an account?" : "Already have an account?"}
        <button
          onClick={() => { setMode(isLogin ? "signup" : "login"); setError(""); }}
          className="ml-1.5 text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          {isLogin ? "Sign up" : "Sign in"}
        </button>
      </p>

      

      
    </div>
  );
};

export default AuthForm;