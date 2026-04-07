import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api";
import { useAuth } from "../context/AuthContext";

const NightSkyBg = () => (
  <div className="auth-bg">
    <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#180840"/>
          <stop offset="35%" stopColor="#2d1060"/>
          <stop offset="65%" stopColor="#4a1a8a"/>
          <stop offset="100%" stopColor="#6e38b8"/>
        </linearGradient>
        <linearGradient id="mtn1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1c0c40"/><stop offset="100%" stopColor="#0d0520"/>
        </linearGradient>
        <linearGradient id="mtn2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#140930"/><stop offset="100%" stopColor="#080315"/>
        </linearGradient>
        <linearGradient id="tr" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0d0828"/><stop offset="100%" stopColor="#040110"/>
        </linearGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width="800" height="500" fill="url(#sky)"/>
      {/* Stars */}
      {[[50,25],[130,40],[210,18],[300,45],[370,20],[450,35],[540,15],[620,42],[700,18],[760,50],[35,60],[175,65],[320,55],[480,68],[650,50],[90,80],[240,75],[410,82],[560,70],[720,78],[30,20],[100,10],[280,30],[520,12],[680,28],[150,50],[350,38],[600,22]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r={i%5===0?1.8:i%3===0?1.3:1} fill="white" opacity={0.35+0.5*(i%4)/4} filter="url(#glow)"/>
      ))}
      {/* Back mountains */}
      <path d="M0,240 L90,155 L180,185 L270,115 L360,160 L450,100 L540,145 L630,125 L720,165 L800,135 L800,500 L0,500Z" fill="url(#mtn1)" opacity="0.85"/>
      {/* Front mountains */}
      <path d="M0,290 L70,215 L145,248 L230,188 L315,228 L400,178 L485,215 L570,195 L655,225 L740,205 L800,220 L800,500 L0,500Z" fill="url(#mtn2)"/>
      {/* Trees left */}
      <g fill="url(#tr)">
        {[[0,28],[20,35],[45,22],[70,18],[100,15],[130,12],[160,10],[195,8],[230,12],[265,14]].map(([x,w],i)=>(
          <polygon key={i} points={`${x},500 ${x+w/2},${420-i*5} ${x+w},500`}/>
        ))}
      </g>
      {/* Trees right */}
      <g fill="url(#tr)">
        {[[800,28],[775,35],[748,22],[720,18],[688,15],[655,12],[620,10],[582,8],[543,12],[504,14]].map(([x,w],i)=>(
          <polygon key={i} points={`${x},500 ${x-w/2},${420-i*5} ${x-w},500`}/>
        ))}
      </g>
    </svg>
  </div>
);

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const { data } = await loginUser(form);
      login(data); navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
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
        <h1>Login</h1>
        <p>Sign in to your account</p>

        {error && <div className="error-msg">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input type="email" placeholder="Username"
              value={form.email} onChange={e => setForm({...form, email: e.target.value})} required/>
            <span className="form-group-icon">👤</span>
          </div>
          <div className="form-group">
            <input type={showPw ? "text" : "password"} placeholder="Password"
              value={form.password} onChange={e => setForm({...form, password: e.target.value})} required/>
            <span className="form-group-icon" style={{cursor:"pointer",pointerEvents:"all"}} onClick={()=>setShowPw(!showPw)}>🔒</span>
          </div>



          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="auth-link">
          Don't have an account? <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
}
