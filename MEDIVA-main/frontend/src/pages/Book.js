import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import dayjs from "dayjs";
import {
  Sparkles,
  Stethoscope,
  Phone,
  IndianRupee,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MedivaLogo, StatusPill } from "@/components/Brand";
import { useAuth } from "@/context/AuthContext";
import { getSpecialties, getDoctorFull, createAppointment } from "@/lib/api";
import { detectSpecialty } from "@/lib/triage";
import { initials } from "@/lib/format";

export default function Book() {
  const navigate = useNavigate();
  const { user, signupPatient } = useAuth();

  const [specialties, setSpecialties] = useState([]);
  const [doctorCache, setDoctorCache] = useState({});
  const [form, setForm] = useState({
    full_name: "",
    phone_number: "+91 ",
    email: "",
    condition: "",
  });
  const [when, setWhen] = useState(dayjs().add(1, "day").hour(10).minute(0).format("YYYY-MM-DDTHH:mm"));
  const [paying, setPaying] = useState(false);

  // Prefill when the visitor is already an authenticated patient
  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        full_name: f.full_name || user.full_name || "",
        email: f.email || user.email || "",
        phone_number: f.phone_number?.trim() && f.phone_number !== "+91 " ? f.phone_number : user.phone_number || "+91 ",
      }));
    }
  }, [user]);

  useEffect(() => {
    getSpecialties()
      .then(setSpecialties)
      .catch(() => toast.error("Could not load specialties"));
  }, []);

  const detection = useMemo(
    () => detectSpecialty(form.condition, specialties),
    [form.condition, specialties]
  );

  const matchedDoctor = useMemo(() => {
    if (!detection.specialty) return null;
    return doctorCache[detection.specialty.id] || null;
  }, [detection.specialty, doctorCache]);

  useEffect(() => {
    const sp = detection.specialty;
    if (sp && !doctorCache[sp.id]) {
      getDoctorFull(sp.id)
        .then((d) => d && setDoctorCache((prev) => ({ ...prev, [sp.id]: d })))
        .catch(() => {});
    }
  }, [detection.specialty, doctorCache]);

  const advanceFee = matchedDoctor?.doctor?.advance_booking_fee ?? 200;
  const consultFee = matchedDoctor?.doctor?.consultation_fee ?? 500;

  const canBook =
    form.full_name.trim() &&
    form.email.trim() &&
    form.condition.trim().length > 4 &&
    matchedDoctor;

  async function doBooking(profile) {
    await createAppointment({
      patient_id: profile.id,
      doctor_id: matchedDoctor.doctor.id,
      appointment_datetime: dayjs(when).toISOString(),
      problem_description: form.condition,
      detected_specialty: detection.specialty?.name || "General",
      advance_fee_paid: advanceFee,
    });
    toast.success("Payment received · Appointment confirmed!");
    navigate("/patient/dashboard", { replace: true });
  }

  async function handlePayAndBook() {
    if (!canBook) {
      toast.error("Please complete your details and describe your condition.");
      return;
    }
    setPaying(true);
    try {
      // Simulated payment gateway delay
      await new Promise((r) => setTimeout(r, 1200));

      if (user) {
        // Already authenticated patient — book directly
        await doBooking(user);
        return;
      }
      // Not authenticated: provision a patient account for this booking
      const guestPassword = `${Math.random().toString(36).slice(2)}Aa1!`;
      const profile = await signupPatient(form.email, guestPassword, form.full_name);
      await doBooking(profile);
    } catch (err) {
      toast.error(err.message || "Booking failed. Please try again.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/">
            <MedivaLogo />
          </Link>
          <Link to="/login">
            <Button variant="ghost" className="text-slate-700" data-testid="book-login-button">
              Sign in
            </Button>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-sky-600" /> Smart Symptom Triage
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Book your appointment
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Describe your condition — we'll match you to the right specialist automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Left: form */}
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Your details</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Full name</Label>
                  <Input
                    data-testid="book-name"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    placeholder="Aarav Sharma"
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Indian mobile number</Label>
                  <Input
                    data-testid="book-phone"
                    value={form.phone_number}
                    onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                    placeholder="+91 9876543210"
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    data-testid="book-email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@email.com"
                    className="h-11"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-1.5">
                <Label>Describe your condition</Label>
                <Textarea
                  data-testid="book-condition"
                  value={form.condition}
                  onChange={(e) => setForm({ ...form, condition: e.target.value })}
                  placeholder="e.g. severe eye redness, burning, and blurred vision"
                  className="min-h-28 resize-none"
                />
                {form.condition.trim().length > 4 && (
                  <div
                    className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2"
                    data-testid="book-detected-specialty"
                  >
                    <Sparkles className="h-4 w-4 text-sky-600" />
                    <span className="text-sm text-slate-700">Assigned Specialty:</span>
                    <span className="text-sm font-semibold text-sky-700">
                      {detection.specialty?.name || "General Medicine"}
                    </span>
                    {detection.matchedKeywords.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {detection.matchedKeywords.map((k) => (
                          <StatusPill key={k} tone="sky">
                            {k}
                          </StatusPill>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-1.5">
                <Label>Preferred date &amp; time</Label>
                <Input
                  type="datetime-local"
                  data-testid="book-datetime"
                  value={when}
                  onChange={(e) => setWhen(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>
          </div>

          {/* Right: matched doctor + payment */}
          <div className="lg:col-span-2">
            <div className="sticky top-6 space-y-4">
              {matchedDoctor ? (
                <div
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm animate-fade-up"
                  data-testid="book-doctor-card"
                >
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                    <Stethoscope className="h-3.5 w-3.5" /> Matched Specialist
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                      {initials(matchedDoctor.profile?.full_name || "Dr")}
                    </div>
                    <div>
                      <div className="text-base font-semibold text-slate-900">
                        {matchedDoctor.profile?.full_name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {matchedDoctor.doctor?.custom_specialty_name ||
                          matchedDoctor.specialty?.name}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg bg-slate-50 p-2.5">
                      <div className="text-xs text-slate-400">Experience</div>
                      <div className="font-semibold text-slate-800">
                        {matchedDoctor.doctor?.years_of_experience} yrs
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2.5">
                      <div className="text-xs text-slate-400">Consultation</div>
                      <div className="flex items-center font-semibold text-slate-800">
                        <IndianRupee className="h-3.5 w-3.5" />
                        {consultFee}
                      </div>
                    </div>
                  </div>
                  <a
                    href={`tel:${(matchedDoctor.doctor?.clinic_phone_number || "").replace(/\s/g, "")}`}
                    className="mt-3 flex items-center gap-2 text-sm text-sky-700 hover:underline"
                    data-testid="book-doctor-phone"
                  >
                    <Phone className="h-4 w-4" /> {matchedDoctor.doctor?.clinic_phone_number}
                  </a>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                  Describe your condition to see your matched specialist.
                </div>
              )}

              {/* Payment / verification */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Advance Booking Fee</span>
                  <span className="flex items-center text-lg font-semibold text-slate-900">
                    <IndianRupee className="h-4 w-4" />
                    {advanceFee}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Reserves your slot. Balance ₹{consultFee - advanceFee} due at the clinic.
                </p>
                <Button
                  onClick={handlePayAndBook}
                  disabled={!canBook || paying}
                  data-testid="book-pay-confirm"
                  className="mt-4 h-11 w-full bg-sky-600 hover:bg-sky-700"
                >
                  {paying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Processing…
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" /> Pay Advance Fee &amp; Confirm
                    </>
                  )}
                </Button>
                <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  {user ? "Signed in — secure checkout" : "Secure checkout"}
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-500">
                <CalendarClock className="h-3.5 w-3.5" /> Booking unlocks your patient portal &amp; MRN.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
