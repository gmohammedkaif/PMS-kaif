import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { addTenant, updateTenant, useProperties } from "../services/firestore";
import toast from "react-hot-toast";

const DEFAULT = {
  tenantName: "",
  phone: "",
  email: "",
  idProofNumber: "",
  propertyId: "",
  propertyName: "",
  assignedProperty: "",
  moveInDate: "",
  monthlyRent: "",
  securityDeposit: "",
  rentStatus: "Paid",
  tenantStatus: "Active",
};

export default function TenantModal({ tenant, onClose }) {
  const { user } = useAuth();
  const { data: properties } = useProperties();
  const [form, setForm] = useState(DEFAULT);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (tenant) setForm({ ...DEFAULT, ...tenant, propertyName: tenant.propertyName || tenant.assignedProperty || "" });
    else setForm(DEFAULT);
    setErrors({});
  }, [tenant]);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const selectProperty = (propertyId) => {
    const property = properties.find((p) => p.id === propertyId);
    setForm((f) => ({
      ...f,
      propertyId,
      propertyName: property?.propertyName || "",
      assignedProperty: property?.propertyName || "",
      monthlyRent: f.monthlyRent || property?.rentAmount || "",
    }));
    setErrors((e) => ({ ...e, propertyId: "", propertyName: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.tenantName.trim()) errs.tenantName = "Tenant name is required";
    if (!form.propertyId) errs.propertyId = "Please select a property";
    if (form.phone && !/^[0-9+\s\-()]{7,15}$/.test(form.phone)) errs.phone = "Enter a valid phone number";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Enter a valid email address";
    if (form.monthlyRent && Number(form.monthlyRent) < 0) errs.monthlyRent = "Rent must be a positive number";
    if (form.securityDeposit && Number(form.securityDeposit) < 0) errs.securityDeposit = "Deposit must be a positive number";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      const payload = { ...form, assignedProperty: form.propertyName };
      if (tenant?.id) {
        await updateTenant(tenant.id, payload);
        toast.success("Tenant updated!");
      } else {
        await addTenant(user.uid, payload);
        toast.success("Tenant added!");
      }
      onClose();
    } catch (error) {
      toast.error(error?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
            {tenant ? "Edit Tenant" : "Add New Tenant"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Tenant Name *</label>
              <input className={`input ${errors.tenantName ? "border-red-400 focus:ring-red-400" : ""}`} placeholder="Full name" value={form.tenantName} onChange={(e) => set("tenantName", e.target.value)} />
              {errors.tenantName && <p className="mt-1 text-xs text-red-500">{errors.tenantName}</p>}
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input className={`input ${errors.phone ? "border-red-400 focus:ring-red-400" : ""}`} placeholder="+91 98765 43210" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className={`input ${errors.email ? "border-red-400 focus:ring-red-400" : ""}`} placeholder="tenant@email.com" value={form.email} onChange={(e) => set("email", e.target.value)} />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>
            <div>
              <label className="label">ID Proof Number</label>
              <input className="input" placeholder="Aadhar / PAN / Passport" value={form.idProofNumber} onChange={(e) => set("idProofNumber", e.target.value)} />
            </div>
            <div>
              <label className="label">Assigned Property *</label>
              <select className={`input ${errors.propertyId ? "border-red-400 focus:ring-red-400" : ""}`} value={form.propertyId} onChange={(e) => selectProperty(e.target.value)}>
                <option value="">Select Property</option>
                {properties.map((p) => <option key={p.id} value={p.id}>{p.propertyName}{p.flatNumber ? ` - ${p.flatNumber}` : ""}</option>)}
              </select>
              {errors.propertyId && <p className="mt-1 text-xs text-red-500">{errors.propertyId}</p>}
            </div>
            <div>
              <label className="label">Move-in Date</label>
              <input type="date" className="input" value={form.moveInDate} onChange={(e) => set("moveInDate", e.target.value)} />
            </div>
            <div>
              <label className="label">Monthly Rent (₹)</label>
              <input type="number" className={`input ${errors.monthlyRent ? "border-red-400 focus:ring-red-400" : ""}`} placeholder="12000" value={form.monthlyRent} onChange={(e) => set("monthlyRent", e.target.value)} />
              {errors.monthlyRent && <p className="mt-1 text-xs text-red-500">{errors.monthlyRent}</p>}
            </div>
            <div>
              <label className="label">Security Deposit (₹)</label>
              <input type="number" className={`input ${errors.securityDeposit ? "border-red-400 focus:ring-red-400" : ""}`} placeholder="24000" value={form.securityDeposit} onChange={(e) => set("securityDeposit", e.target.value)} />
              {errors.securityDeposit && <p className="mt-1 text-xs text-red-500">{errors.securityDeposit}</p>}
            </div>
            <div>
              <label className="label">Rent Status</label>
              <select className="input" value={form.rentStatus} onChange={(e) => set("rentStatus", e.target.value)}>
                <option>Paid</option>
                <option>Pending</option>
              </select>
            </div>
            <div>
              <label className="label">Tenant Status</label>
              <select className="input" value={form.tenantStatus} onChange={(e) => set("tenantStatus", e.target.value)}>
                <option>Active</option>
                <option>Moved Out</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? "Saving..." : tenant ? "Save Changes" : "Add Tenant"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
