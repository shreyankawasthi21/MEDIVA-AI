import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { User, Stethoscope, ArrowRight, Loader2, Mail, Lock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MedivaLogo } from "@/components/Brand";
import { useAuth } from "@/context/AuthContext";
import { getSpecialties } from "@/lib/api";

const DEMO = {
  patient: { email: "patient@mediva.ai", password: "password123" },
  doctor: { email: "doctor@mediva.ai", password: "password123" },
};

const SLIDES = [
  {
    image:
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1000&q=80",
    caption: "Advanced Clinical Intelligence for Modern Care",
  },
  {
    image:
      "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=1000&q=80",
    caption: "Seamless Patient & Physician Collaboration",
  },
  {
    image:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1000&q=80",
    caption: "Real-Time Medical Monitoring & Diagnostics",
  },
];

function Slideshow() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((i) => (i + 1) % SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="relative hidden h-full min-h-[560px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-sm lg:block"
      data-testid="login-slideshow"
    >
      {SLIDES.map((slide, i) => (
        <div
          key={slide.image}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            i === active ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={slide.image}
            alt={slide.caption}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-8">
            <p className="text-xl font-semibold text-white">{slide.caption}</p>
          </div>
        </div>
      ))}
      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Go to slide ${i + 1}`}
            data-testid={`login-slideshow-dot-${i}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === active ? "w-6 bg-sky-500" : "w-2 bg-white/50 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const [tab, setTab] = useState("patient");

  useEffect(() => {
    if (ready && user) {
      navigate(user.role === "doctor" ? "/doctor/dashboard" : "/patient/dashboard", {
        replace: true,
      });
    }
  }, [ready, user, navigate]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/">
            <MedivaLogo />
          </Link>
          <Link to="/book">
            <Button variant="outline" className="border-slate-300" data-testid="login-book-button">
              Book Appointment
            </Button>
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:py-14 lg:grid-cols-2 lg:items-center lg:gap-12">
        <Slideshow />

        <div className="mx-auto flex w-full max-w-md flex-col">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Secure sign in</h1>
            <p className="mt-1 text-sm text-slate-500">Choose your portal to continue</p>
          </div>

          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-xl border border-slate-200 bg-white p-1">
              <TabsTrigger
                value="patient"
                data-testid="tab-patient-portal"
                className="rounded-lg data-[state=active]:bg-sky-600 data-[state=active]:text-white"
              >
                <User className="mr-2 h-4 w-4" /> Patient Portal
              </TabsTrigger>
              <TabsTrigger
                value="doctor"
                data-testid="tab-doctor-portal"
                className="rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white"
              >
                <Stethoscope className="mr-2 h-4 w-4" /> Doctor / Staff
              </TabsTrigger>
            </TabsList>

            <TabsContent value="patient" className="mt-5">
              <PatientPanel navigate={navigate} />
            </TabsContent>
            <TabsContent value="doctor" className="mt-5">
              <DoctorPanel navigate={navigate} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function Panel({ children }) {
  return (
    <div className="animate-fade-up rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {children}
    </div>
  );
}

function DevLoginButton({ onClick, loading, label, testid }) {
  return (
    <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
        <Zap className="h-3 w-3" /> Demo access (dev only)
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={onClick}
        disabled={loading}
        className="h-10 w-full border-slate-300 text-slate-700"
        data-testid={testid}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : label}
      </Button>
    </div>
  );
}

function PatientPanel({ navigate }) {
  const { loginPatient, signupPatient, devLogin } = useAuth();
  const [mode, setMode] = useState("login"); // login | signup
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  async function handlePatientSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password.trim())
      return toast.error("Please enter your email and password.");
    if (mode === "signup" && !fullName.trim())
      return toast.error("Please enter your full name.");

    setLoading(true);
    try {
      if (mode === "signup") {
        await signupPatient(email, password, fullName);
        toast.success("Account created!");
      } else {
        await loginPatient(email, password);
        toast.success("Signed in!");
      }
      navigate("/patient/dashboard", { replace: true });
    } catch (err) {
      toast.error(err?.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin() {
    setDemoLoading(true);
    try {
      await devLogin(DEMO.patient.email, DEMO.patient.password);
      toast.success("Signed in as demo patient");
      navigate("/patient/dashboard", { replace: true });
    } catch (err) {
      toast.error(err?.message || "Demo login unavailable");
    } finally {
      setDemoLoading(false);
    }
  }

  return (
    <Panel>
      <form onSubmit={handlePatientSubmit} className="space-y-4">
        {mode === "signup" && (
          <div className="space-y-1.5">
            <Label htmlFor="p-name">Full name</Label>
            <Input
              id="p-name"
              data-testid="patient-fullname"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Aarav Sharma"
              className="h-11"
            />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="p-email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="p-email"
              type="email"
              data-testid="patient-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="h-11 pl-9"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="p-password"
              type="password"
              data-testid="patient-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 pl-9"
            />
          </div>
        </div>
        <Button
          type="submit"
          disabled={loading}
          data-testid="patient-submit"
          className="h-11 w-full bg-sky-600 hover:bg-sky-700"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : mode === "signup" ? (
            "Create Account"
          ) : (
            "Sign In"
          )}
        </Button>
        <p className="text-center text-sm text-slate-500">
          {mode === "signup" ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="font-medium text-sky-600 hover:underline"
                data-testid="patient-switch-login"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              New patient?{" "}
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="font-medium text-sky-600 hover:underline"
                data-testid="patient-switch-signup"
              >
                Create account
              </button>
            </>
          )}
        </p>
        <DevLoginButton
          onClick={handleDemoLogin}
          loading={demoLoading}
          label="Continue as Demo Patient"
          testid="patient-demo-login"
        />
      </form>
    </Panel>
  );
}

function DoctorPanel({ navigate }) {
  const { loginDoctor, signupDoctor, devLogin } = useAuth();
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [specialties, setSpecialties] = useState([]);
  const [creds, setCreds] = useState({ email: "", password: "" });
  const [reg, setReg] = useState({
    full_name: "Dr. ",
    email: "",
    password: "",
    specialty_id: "",
    custom_specialty_name: "",
    years_of_experience: "",
    clinic_phone_number: "+91 123456789",
    consultation_fee: "500",
    advance_booking_fee: "200",
  });

  useEffect(() => {
    getSpecialties()
      .then(setSpecialties)
      .catch(() => {});
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await loginDoctor(creds.email, creds.password);
      toast.success("Welcome, Doctor.");
      navigate("/doctor/dashboard", { replace: true });
    } catch (err) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    if (!reg.full_name || !reg.email || !reg.password)
      return toast.error("Name, email and password are required.");
    setLoading(true);
    try {
      const { password, ...profile } = reg;
      await signupDoctor(profile, password);
      toast.success("Clinical account created!");
      navigate("/doctor/dashboard", { replace: true });
    } catch (err) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDemo() {
    setDemoLoading(true);
    try {
      await devLogin(DEMO.doctor.email, DEMO.doctor.password);
      toast.success("Signed in as demo doctor");
      navigate("/doctor/dashboard", { replace: true });
    } catch (err) {
      toast.error(err.message || "Demo login unavailable");
    } finally {
      setDemoLoading(false);
    }
  }

  return (
    <Panel>
      {mode === "login" ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="d-email">Hospital email</Label>
            <Input
              id="d-email"
              type="email"
              data-testid="doctor-login-email"
              value={creds.email}
              onChange={(e) => setCreds({ ...creds, email: e.target.value })}
              placeholder="doctor@mediva.ai"
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="d-pass">Password</Label>
            <Input
              id="d-pass"
              type="password"
              data-testid="doctor-login-password"
              value={creds.password}
              onChange={(e) => setCreds({ ...creds, password: e.target.value })}
              placeholder="••••••••"
              className="h-11"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            data-testid="doctor-login-submit"
            className="h-11 w-full bg-slate-900 hover:bg-slate-800"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in to Clinical Portal"}
          </Button>
          <p className="text-center text-sm text-slate-500">
            New clinician?{" "}
            <button
              type="button"
              onClick={() => setMode("register")}
              className="font-medium text-sky-600 hover:underline"
              data-testid="doctor-switch-register"
            >
              Register
            </button>
          </p>
          <DevLoginButton
            onClick={handleDemo}
            loading={demoLoading}
            label="Continue as Demo Doctor"
            testid="doctor-demo-login"
          />
        </form>
      ) : (
        <form onSubmit={handleSignup} className="space-y-3.5">
          <div className="space-y-1.5">
            <Label>Full name</Label>
            <Input
              data-testid="doctor-reg-name"
              value={reg.full_name}
              onChange={(e) => setReg({ ...reg, full_name: e.target.value })}
              placeholder="Dr. Shourya"
              className="h-11"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                data-testid="doctor-reg-email"
                value={reg.email}
                onChange={(e) => setReg({ ...reg, email: e.target.value })}
                placeholder="name@mediva.ai"
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input
                type="password"
                data-testid="doctor-reg-password"
                value={reg.password}
                onChange={(e) => setReg({ ...reg, password: e.target.value })}
                placeholder="••••••••"
                className="h-11"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Specialization</Label>
            <Select
              value={reg.specialty_id}
              onValueChange={(v) => setReg({ ...reg, specialty_id: v })}
            >
              <SelectTrigger data-testid="doctor-reg-specialty" className="h-11">
                <SelectValue placeholder="Select a known specialty" />
              </SelectTrigger>
              <SelectContent>
                {specialties.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              data-testid="doctor-reg-custom-specialty"
              value={reg.custom_specialty_name}
              onChange={(e) => setReg({ ...reg, custom_specialty_name: e.target.value })}
              placeholder="Or type custom, e.g. Ophthalmology / Eye Surgeon"
              className="h-11"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Years of experience</Label>
              <Input
                type="number"
                data-testid="doctor-reg-experience"
                value={reg.years_of_experience}
                onChange={(e) => setReg({ ...reg, years_of_experience: e.target.value })}
                placeholder="8"
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Clinic phone</Label>
              <Input
                data-testid="doctor-reg-phone"
                value={reg.clinic_phone_number}
                onChange={(e) => setReg({ ...reg, clinic_phone_number: e.target.value })}
                className="h-11"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Consultation fee (₹)</Label>
              <Input
                type="number"
                data-testid="doctor-reg-fee"
                value={reg.consultation_fee}
                onChange={(e) => setReg({ ...reg, consultation_fee: e.target.value })}
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Advance fee (₹)</Label>
              <Input
                type="number"
                data-testid="doctor-reg-advance"
                value={reg.advance_booking_fee}
                onChange={(e) => setReg({ ...reg, advance_booking_fee: e.target.value })}
                className="h-11"
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading}
            data-testid="doctor-reg-submit"
            className="h-11 w-full bg-slate-900 hover:bg-slate-800"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Create Clinical Account <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
          <p className="text-center text-sm text-slate-500">
            Already registered?{" "}
            <button
              type="button"
              onClick={() => setMode("login")}
              className="font-medium text-sky-600 hover:underline"
            >
              Sign in
            </button>
          </p>
        </form>
      )}
    </Panel>
  );
}
