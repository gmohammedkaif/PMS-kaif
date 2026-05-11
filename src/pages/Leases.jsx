import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { useLeases, useProperties, useTenants, addLease, updateLease, deleteLease } from "../services/firestore";
import { Plus, FileText, Edit2, Trash2, X, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { differenceInDays, differenceInMonths, parseISO, format } from "date-fns";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const DEFAULT = { tenantId: "", tenantName: "", propertyId: "", propertyName: "", startDate: "", endDate: "", depositAmount: "", leaseStatus: "Active" };

function LeaseModal({ lease, onClose }) {
  const { user } = useAuth();
  const { data: properties } = useProperties();
  const { data: tenants } = useTenants();
  const [form, setForm] = useState(DEFAULT);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (lease) setForm({ ...DEFAULT, ...lease });
    else setForm(DEFAULT);
    setErrors({});
  }, [lease]);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.tenantName) errs.tenantName = "Please select a tenant";
    if (!form.propertyName) errs.propertyName = "Please select a property";
    if (!form.startDate) errs.startDate = "Start date is required";
    if (!form.endDate) errs.endDate = "End date is required";
    if (form.startDate && form.endDate && form.endDate <= form.startDate) errs.endDate = "End date must be after start date";
    if (form.depositAmount && Number(form.depositAmount) < 0) errs.depositAmount = "Deposit must be a positive number";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      if (lease?.id) { await updateLease(lease.id, form); toast.success("Lease updated!"); }
      else { await addLease(user.uid, form); toast.success("Lease created!"); }
      onClose();
    } catch { toast.error("Error saving lease"); }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">{lease ? "Edit Lease" : "Create Lease Agreement"}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Tenant</label>
              <select className={`input ${errors.tenantName ? "border-red-400 focus:ring-red-400" : ""}`} value={form.tenantName} onChange={e => set("tenantName", e.target.value)}>
                <option value="">Select Tenant</option>
                {tenants.map(t => <option key={t.id} value={t.tenantName}>{t.tenantName}</option>)}
              </select>
              {errors.tenantName && <p className="mt-1 text-xs text-red-500">{errors.tenantName}</p>}
            </div>
            <div>
              <label className="label">Property</label>
              <select className={`input ${errors.propertyName ? "border-red-400 focus:ring-red-400" : ""}`} value={form.propertyName} onChange={e => {
                const p = properties.find(p => p.propertyName === e.target.value);
                setForm(f => ({ ...f, propertyName: e.target.value, propertyId: p?.id || "" }));
                setErrors(err => ({ ...err, propertyName: "" }));
              }}>
                <option value="">Select Property</option>
                {properties.map(p => <option key={p.id} value={p.propertyName}>{p.propertyName}</option>)}
              </select>
              {errors.propertyName && <p className="mt-1 text-xs text-red-500">{errors.propertyName}</p>}
            </div>
            <div>
              <label className="label">Start Date</label>
              <input type="date" className={`input ${errors.startDate ? "border-red-400 focus:ring-red-400" : ""}`} value={form.startDate} onChange={e => set("startDate", e.target.value)} />
              {errors.startDate && <p className="mt-1 text-xs text-red-500">{errors.startDate}</p>}
            </div>
            <div>
              <label className="label">End Date</label>
              <input type="date" className={`input ${errors.endDate ? "border-red-400 focus:ring-red-400" : ""}`} value={form.endDate} onChange={e => set("endDate", e.target.value)} />
              {errors.endDate && <p className="mt-1 text-xs text-red-500">{errors.endDate}</p>}
            </div>
            <div>
              <label className="label">Security Deposit (₹)</label>
              <input type="number" className={`input ${errors.depositAmount ? "border-red-400 focus:ring-red-400" : ""}`} placeholder="24000" value={form.depositAmount} onChange={e => set("depositAmount", e.target.value)} />
              {errors.depositAmount && <p className="mt-1 text-xs text-red-500">{errors.depositAmount}</p>}
            </div>
            <div>
              <label className="label">Lease Status</label>
              <select className="input" value={form.leaseStatus} onChange={e => set("leaseStatus", e.target.value)}>
                <option>Active</option>
                <option>Expired</option>
                <option>Renewed</option>
                <option>Terminated</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">{loading ? "Saving..." : lease ? "Update" : "Create Lease"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Leases() {
  const { data: leases, loading } = useLeases();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const handleDelete = async (id) => {
    try { await deleteLease(id); toast.success("Lease deleted"); setDeleting(null); }
    catch { toast.error("Failed to delete"); }
  };

  const getLeaseStatus = (endDate) => {
    if (!endDate) return { label: "—", color: "text-slate-400", days: null };
    const days = differenceInDays(parseISO(endDate), new Date());
    if (days < 0) return { label: `Expired ${Math.abs(days)}d ago`, color: "text-red-500", icon: AlertTriangle, urgent: true };
    if (days <= 30) return { label: `${days}d left`, color: "text-red-500", icon: AlertTriangle, urgent: true };
    if (days <= 60) return { label: `${days}d left`, color: "text-amber-500", icon: AlertTriangle, urgent: false };
    return { label: `${Math.floor(days / 30)}mo left`, color: "text-emerald-500", icon: CheckCircle, urgent: false };
  };

  return (
    <Layout title="Leases">
      <div className="max-w-6xl mx-auto space-y-5 animate-slide-up">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Lease Agreements</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{leases.filter(l => l.leaseStatus === "Active").length} active leases</p>
          </div>
          <button onClick={() => { setEditing(null); setModal(true); }} className="btn-primary shrink-0">
            <Plus className="w-4 h-4" /> New Lease
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="card p-5 animate-pulse h-24" />)}</div>
        ) : leases.length === 0 ? (
          <div className="card p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h4 className="font-display text-lg font-bold text-slate-500 mb-2">No lease agreements yet</h4>
            <button onClick={() => { setEditing(null); setModal(true); }} className="btn-primary mx-auto mt-4">
              <Plus className="w-4 h-4" /> Create First Lease
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {leases.map(l => {
              const s = getLeaseStatus(l.endDate);
              const months = l.startDate && l.endDate ? differenceInMonths(parseISO(l.endDate), parseISO(l.startDate)) : null;
              const monthsLeft = l.endDate ? differenceInMonths(parseISO(l.endDate), new Date()) : null;
              return (
                <div key={l.id} className={`card p-5 hover:shadow-md transition-all duration-300 ${s.urgent ? "border-red-200 dark:border-red-800/50" : ""}`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-11 h-11 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="font-display font-bold text-slate-900 dark:text-white">{l.tenantName || "Unknown Tenant"}</h4>
                          <span className={l.leaseStatus === "Active" ? "badge-rented" : l.leaseStatus === "Expired" ? "badge-pending" : "badge-paid"}>{l.leaseStatus}</span>
                        </div>
                        <p className="text-sm text-slate-500 mb-2">{l.propertyName || "—"}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-500">
                          <div><span className="block text-slate-400 mb-0.5">Start</span><span className="font-medium text-slate-700 dark:text-slate-300">{l.startDate ? format(parseISO(l.startDate), "dd MMM yyyy") : "—"}</span></div>
                          <div><span className="block text-slate-400 mb-0.5">End</span><span className="font-medium text-slate-700 dark:text-slate-300">{l.endDate ? format(parseISO(l.endDate), "dd MMM yyyy") : "—"}</span></div>
                          <div><span className="block text-slate-400 mb-0.5">Duration</span><span className="font-medium text-slate-700 dark:text-slate-300">{months ? `${months} months` : "—"}</span></div>
                          <div><span className="block text-slate-400 mb-0.5">Deposit</span><span className="font-medium text-slate-700 dark:text-slate-300">{l.depositAmount ? `₹${Number(l.depositAmount).toLocaleString("en-IN")}` : "—"}</span></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {s.icon && (
                        <div className={`flex items-center gap-1.5 text-sm font-semibold ${s.color}`}>
                          <s.icon className="w-4 h-4" />
                          <span>{s.label}</span>
                        </div>
                      )}
                      <button onClick={() => { setEditing(l); setModal(true); }}
                        className="p-2 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleting(l)}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {l.startDate && l.endDate && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Lease Progress</span>
                        <span>{monthsLeft !== null ? `${Math.max(0, monthsLeft)} months remaining` : ""}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${s.urgent ? "bg-red-400" : "bg-brand-500"}`}
                          style={{ width: `${Math.min(100, Math.max(0, ((differenceInDays(new Date(), parseISO(l.startDate)) / differenceInDays(parseISO(l.endDate), parseISO(l.startDate))) * 100)))}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modal && <LeaseModal lease={editing} onClose={() => { setModal(false); setEditing(null); }} />}

      {deleting && (
        <div className="modal-overlay" onClick={() => setDeleting(null)}>
          <div className="card w-full max-w-sm p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <h4 className="font-display text-xl font-bold text-slate-900 dark:text-white text-center mb-2">Delete Lease?</h4>
            <p className="text-sm text-slate-500 text-center mb-6">Remove lease for <strong>{deleting.tenantName}</strong>?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleting(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={() => handleDelete(deleting.id)} className="btn-danger flex-1 justify-center">Delete</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
