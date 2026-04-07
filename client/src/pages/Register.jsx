import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api";
import { useAuth } from "../context/AuthContext";

const NightSkyBg = () => (
  <div className="auth-bg">
    <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sky2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#180840"/>
          <stop offset="35%" stopColor="#2d1060"/>
          <stop offset="65%" stopColor="#4a1a8a"/>
          <stop offset="100%" stopColor="#6e38b8"/>
        </linearGradient>
        <linearGradient id="m1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1c0c40"/><stop offset="100%" stopColor="#0d0520"/>
        </linearGradient>
        <linearGradient id="m2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#140930"/><stop offset="100%" stopColor="#080315"/>
        </linearGradient>
        <linearGradient id="t2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0d0828"/><stop offset="100%" stopColor="#040110"/>
        </linearGradient>
        <filter id="g2"><feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width="800" height="500" fill="url(#sky2)"/>
      {[[55,22],[140,38],[225,14],[315,42],[385,18],[460,32],[548,12],[635,40],[715,16],[770,48],[40,58],[180,62],[330,52],[490,66],[660,48],[95,78],[248,72],[418,80],[568,68],[728,76]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r={i%5===0?1.8:1.1} fill="white" opacity={0.4+0.45*(i%4)/4} filter="url(#g2)"/>
      ))}
      <path d="M0,240 L90,155 L180,185 L270,115 L360,160 L450,100 L540,145 L630,125 L720,165 L800,135 L800,500 L0,500Z" fill="url(#m1)" opacity="0.85"/>
      <path d="M0,290 L70,215 L145,248 L230,188 L315,228 L400,178 L485,215 L570,195 L655,225 L740,205 L800,220 L800,500 L0,500Z" fill="url(#m2)"/>
      <g fill="url(#t2)">
        {[[0,28],[20,35],[45,22],[70,18],[100,15],[130,12],[160,10],[195,8],[230,12],[265,14]].map(([x,w],i)=>(
          <polygon key={i} points={`${x},500 ${x+w/2},${418-i*5} ${x+w},500`}/>
        ))}
      </g>
      <g fill="url(#t2)">
        {[[800,28],[775,35],[748,22],[720,18],[688,15],[655,12],[620,10],[582,8],[543,12],[504,14]].map(([x,w],i)=>(
          <polygon key={i} points={`${x},500 ${x-w/2},${418-i*5} ${x-w},500`}/>
        ))}
      </g>
    </svg>
  </div>
);

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) return setError("Password must be at least 6 characters");
    setLoading(true);
    try {
      const { data } = await registerUser(form);
      login(data); navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <NightSkyBg />
      <div className="auth-overlay" />
      <div className="auth-card">
        <div className="auth-card-glow" />
        <div className="auth-logo-wrap">💬</div>
        <p className="auth-app-name">ChatApp</p>
        <h1>Create Account</h1>
        <p>Join and start chatting today</p>

        {error && <div className="error-msg">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input type="text" placeholder="Full Name"
              value={form.name} onChange={e => setForm({...form, name: e.target.value})} required/>
            <span className="form-group-icon">👤</span>
          </div>
          <div className="form-group">
            <input type="email" placeholder="Email address"
              value={form.email} onChange={e => setForm({...form, email: e.target.value})} required/>
            <span className="form-group-icon">✉️</span>
          </div>
          <div className="form-group">
            <input type="password" placeholder="Password (min 6 chars)"
              value={form.password} onChange={e => setForm({...form, password: e.target.value})} required/>
            <span className="form-group-icon">🔒</span>
          </div>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <div className="auth-link">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
