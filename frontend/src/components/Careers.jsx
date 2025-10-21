// frontend/src/pages/Careers.jsx
import { useState } from "react";

const POSITIONS = [
  "Server / Waiter / Waitress",
  "Bartender",
  "Chef",
  "Front Desk Attendant / Receptionist",
  "Housekeeper / Room Attendant",
];

const LEGAL_STATUSES = [
  "U.S. Citizen",
  "Permanent Resident",
  "Work Authorization",
];

export default function Careers() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    age: "",
    experienceYears: "",
    legalStatus: "",
    position: "",
    resume: null,
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const onChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "resume") {
      setForm((f) => ({ ...f, resume: files?.[0] || null }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const validate = () => {
    if (!form.name.trim()) return "Please enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return "Please enter a valid email.";
    if (!form.phone.trim()) return "Please enter your phone number.";
    if (!form.age || Number(form.age) < 14) return "Please enter a valid age (14+).";
    if (form.experienceYears === "" || Number(form.experienceYears) < 0)
      return "Please enter years of experience (0 or more).";
    if (!form.legalStatus) return "Please select your legal status.";
    if (!form.position) return "Please select a position.";
    if (!form.resume) return "Please upload your resume (PDF/DOC).";
    const okTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!okTypes.includes(form.resume.type)) return "Resume must be PDF/DOC/DOCX.";
    if (form.resume.size > 5 * 1024 * 1024) return "Resume must be under 5 MB.";
    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    const err = validate();
    if (err) return setMsg(err);
    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      const res = await fetch("/api/careers/apply", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      setMsg("Application submitted! You’ll receive a confirmation email shortly.");
      setForm({
        name: "", email: "", phone: "", age: "",
        experienceYears: "", legalStatus: "", position: "", resume: null
      });
      const input = document.getElementById("resumeInput");
      if (input) input.value = "";
    } catch (e2) {
      setMsg(e2.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1f1f1f] text-white">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Careers</h1>
        <p className="text-white/80 mb-8">Apply to join our restaurant or motel team.</p>

        {msg && (
          <div className="mb-6 p-4 rounded-lg bg-white/10 border border-white/15">{msg}</div>
        )}

        <form onSubmit={onSubmit} className="bg-[#2b2b2b] rounded-2xl p-6 md:p-8 shadow-xl space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block mb-2 text-sm text-white/80">Full Name</label>
              <input name="name" value={form.name} onChange={onChange}
                className="w-full rounded-lg bg-[#1d1d1d] border border-white/10 p-3 focus:ring-2 focus:ring-[#F56A00]" />
            </div>
            <div>
              <label className="block mb-2 text-sm text-white/80">Email</label>
              <input type="email" name="email" value={form.email} onChange={onChange}
                className="w-full rounded-lg bg-[#1d1d1d] border border-white/10 p-3 focus:ring-2 focus:ring-[#F56A00]" />
            </div>
            <div>
              <label className="block mb-2 text-sm text-white/80">Phone</label>
              <input name="phone" value={form.phone} onChange={onChange}
                className="w-full rounded-lg bg-[#1d1d1d] border border-white/10 p-3 focus:ring-2 focus:ring-[#F56A00]" />
            </div>
            <div>
              <label className="block mb-2 text-sm text-white/80">Age</label>
              <input type="number" min="14" name="age" value={form.age} onChange={onChange}
                className="w-full rounded-lg bg-[#1d1d1d] border border-white/10 p-3 focus:ring-2 focus:ring-[#F56A00]" />
            </div>
            <div>
              <label className="block mb-2 text-sm text-white/80">Years of Experience</label>
              <input type="number" min="0" name="experienceYears" value={form.experienceYears} onChange={onChange}
                className="w-full rounded-lg bg-[#1d1d1d] border border-white/10 p-3 focus:ring-2 focus:ring-[#F56A00]" />
            </div>
            <div>
              <label className="block mb-2 text-sm text-white/80">Legal Status</label>
              <select name="legalStatus" value={form.legalStatus} onChange={onChange}
                className="w-full rounded-lg bg-[#1d1d1d] border border-white/10 p-3 focus:ring-2 focus:ring-[#F56A00]">
                <option value="">Select one</option>
                {LEGAL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block mb-2 text-sm text-white/80">Position</label>
              <select name="position" value={form.position} onChange={onChange}
                className="w-full rounded-lg bg-[#1d1d1d] border border-white/10 p-3 focus:ring-2 focus:ring-[#F56A00]">
                <option value="">Select position</option>
                {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block mb-2 text-sm text-white/80">Resume (PDF/DOC/DOCX)</label>
              <input id="resumeInput" type="file" name="resume"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={onChange}
                className="w-full rounded-lg bg-[#1d1d1d] border border-white/10 p-3" />
              <p className="text-xs text-white/50 mt-1">Max 5 MB.</p>
            </div>
          </div>

          <button type="submit" disabled={busy}
            className="w-full md:w-auto px-8 py-3 rounded-xl bg-[#F56A00] hover:bg-[#d65c00] font-semibold transition disabled:opacity-60">
            {busy ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
}

