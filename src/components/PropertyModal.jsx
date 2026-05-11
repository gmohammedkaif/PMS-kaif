import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { addProperty, updateProperty } from "../services/firestore";
import toast from "react-hot-toast";

const TYPES = ["Apartment", "House", "Flat", "Villa", "Office", "Shop", "PG Room", "Other"];

const DEFAULT = {
  propertyName: "", propertyType: "Apartment", flatNumber: "", address: "", city: "",
  rentAmount: "", description: "",
};

export default function PropertyModal({ property, onClose }) {
  const { user } = useAuth();
  const [form, setForm] = useState(DEFAULT);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (property) setForm({ ...DEFAULT, ...property });
    else setForm(DEFAULT);
    setErrors({});
  }, [property]);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.propertyName.trim()) errs.propertyName = "Property name is required";
    if (form.rentAmount && Number(form.rentAmount) < 0) errs.rentAmount = "Rent amount must be a positive number";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      if (property?.id) {
        await updateProperty(property.id, form);
        toast.success("Property updated!");
      } else {
        await addProperty(user.uid, form);
        toast.success("Property added!");
      }
      onClose();
    } catch {
      toast.error("Something went wrong");
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
            {property ? "Edit Property" : "Add New Property"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Property Name *</label>
              <input className={`input ${errors.propertyName ? "border-red-400 focus:ring-red-400" : ""}`} placeholder="e.g. Sunrise Apartments Block A" value={form.propertyName} onChange={e => set("propertyName", e.target.value)} />
              {errors.propertyName && <p className="mt-1 text-xs text-red-500">{errors.propertyName}</p>}
            </div>
            <div>
              <label className="label">Property Type</label>
              <select className="input" value={form.propertyType} onChange={e => set("propertyType", e.target.value)}>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Flat / House Number</label>
              <input className="input" placeholder="e.g. A-204" value={form.flatNumber} onChange={e => set("flatNumber", e.target.value)} />
            </div>
            <div>
              <label className="label">City</label>
              <input className="input" placeholder="e.g. Chennai" value={form.city} onChange={e => set("city", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Full Address</label>
              <input className="input" placeholder="Street, Landmark, Area..." value={form.address} onChange={e => set("address", e.target.value)} />
            </div>
            <div>
              <label className="label">Rent Amount (₹/month)</label>
              <input type="number" className={`input ${errors.rentAmount ? "border-red-400 focus:ring-red-400" : ""}`} placeholder="e.g. 12000" value={form.rentAmount} onChange={e => set("rentAmount", e.target.value)} />
              {errors.rentAmount && <p className="mt-1 text-xs text-red-500">{errors.rentAmount}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="label">Description / Notes</label>
              <textarea className="input resize-none h-20" placeholder="Additional notes about this property..." value={form.description} onChange={e => set("description", e.target.value)} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? "Saving..." : property ? "Save Changes" : "Add Property"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
