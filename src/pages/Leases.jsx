import { useEffect, useState } from "react";
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
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const selectTenant = (tenantId) => {
    const tenant = tenants.find((t) => t.id === tenantId);
    setForm((f) => ({
      ...f,
      tenantId,
      tenantName: tenant?.tenantName || "",
      propertyId: tenant?.propertyId || f.propertyId,
      propertyName: tenant?.propertyName || tenant?.assignedProperty || f.propertyName,
      depositAmount: f.depositAmount || tenant?.securityDeposit || "",
    }));
    setErrors((e) => ({ ...e, tenantId: "", tenantName: "", propertyId: "", propertyName: "" }));
  };

  const selectProperty = (propertyId) => {
    const property = properties.find((p) => p.id === propertyId);
    setForm((f) => ({ ...f, propertyId, propertyName: property?.propertyName || "" }));
    setErrors((e) => ({ ...e, propertyId: "", propertyName: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.tenantId) errs.tenantId = "Please select a tenant";
    if (!form.propertyId) errs.propertyId = "Please select a property";
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
      if (lease?.id) {
        await updateLease(lease.id, form);
        toast.success("Lease updated!");
      } else {
        await addLease(user.uid, form);
        toast.success("Lease created!");
      }
      onClose();
    } catch (error) {
      toast.error(error?.message || "Error saving lease");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">{lease ? "Edit Lease" : "Create Lease Agreement"}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Tenant *</label>
              <select className={`input ${errors.tenantId ? "border-red-400 focus:ring-red-400" : ""}`} value={form.tenantId} onChange={(e) => selectTenant(e.target.value)}>
                <option value="">Select Tenant</option>
                {tenants.map((t) => <option key={t.id} value={t.id}>{t.tenantName}</option>)}
              </select>
              {errors.tenantId && <p className="mt-1 text-xs text-red-500">{errors.tenantId}</p>}
            </div>
            <div>
              <label className="label">Property *</label>
              <select className={`input ${errors.propertyId ? "border-red-400 focus:ring-red-400" : ""}`} value={form.propertyId} onChange={(e) => selectProperty(e.target.value)}>
                <option value="">Select Property</option>
                {properties.map((p) => <option key={p.id} value={p.id}>{p.propertyName}{p.flatNumber ? ` - ${p.flatNumber}` : ""}</option>)}
              </select>
              {errors.propertyId && <p className="mt-1 text-xs text-red-500">{errors.propertyId}</p>}
            </div>
            <div>
              <label className="label">Start Date *</label>
              <input type="date" className={`input ${errors.startDate ? "border-red-400 focus:ring-red-400" : ""}`} value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
              {errors.startDate && <p className="mt-1 text-xs text-red-500">{errors.startDate}</p>}
            </div>
            <div>
              <label className="label">End Date *</label>
              <input type="date" className={`input ${errors.endDate ? "border-red-400 focus:ring-red-400" : ""}`} value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
              {errors.endDate && <p className="mt-1 text-xs text-red-500">{errors.endDate}</p>}
            </div>
            <div>
              <label className="label">Deposit Amount (₹)</label>
              <input type="number" className={`input ${errors.depositAmount ? "border-red-400 focus:ring-red-400" : ""}`} value={form.depositAmount} onChange={(e) => set("depositAmount", e.target.value)} placeholder="25000" />
              {errors.depositAmount && <p className="mt-1 text-xs text-red-500">{errors.depositAmount}</p>}
            </div>
            <div>
              <label className="label">Lease Status</label>
              <select className="input" value={form.leaseStatus} onChange={(e) => set("leaseStatus", e.target.value)}>
                <option>Active</option>
                <option>Expired</option>
                <option>Terminated</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">{loading ? "Saving..." : lease ? "Save Changes" : "Create Lease"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function leaseMeta(lease) {
  if (!lease.endDate) return { label: "No end date", className: "badge-pending", Icon: Clock };
  const days = differenceInDays(parseISO(lease.endDate), new Date());
  if (days < 0) return { label: `Expired ${Math.abs(days)}d ago`, className: "badge-pending", Icon: AlertTriangle };
  if (days <= 60) return { label: `${days}d left`, className: "badge-vacant", Icon: AlertTriangle };
  return { label: `${differenceInMonths(parseISO(lease.endDate), new Date())} months left`, className: "badge-rented", Icon: CheckCircle };
}

export default function Leases() {
  const { data: leases, loading } = useLeases();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const filtered = leases.filter((lease) => {
    const text = `${lease.tenantName || ""} ${lease.propertyName || ""}`.toLowerCase();
    const matchSearch = text.includes(search.toLowerCase());
    const matchFilter = filter === "All" || (lease.leaseStatus || "Active") === filter;
    return matchSearch && matchFilter;
  });

  const handleDelete = async (id) => {
    try {
      await deleteLease(id);
      toast.success("Lease deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(error?.message || "Failed to delete lease");
    }
  };

  return (
    <Layout title="Leases">
      <div className="max-w-7xl mx-auto space-y-5 animate-slide-up">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Lease Agreements</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{leases.length} total agreements</p>
          </div>
          <button onClick={() => { setEditing(null); setModal(true); }} className="btn-primary shrink-0"><Plus className="w-4 h-4" /> Create Lease</button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input className="input" placeholder="Search tenant or property..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="flex gap-2 flex-wrap">
            {["All", "Active", "Expired", "Terminated"].map((item) => (
              <button key={item} onClick={() => setFilter(item)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === item ? "bg-brand-600 text-white" : "btn-secondary py-2"}`}>{item}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="card p-4 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-14 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h4 className="font-display text-lg font-bold text-slate-500 mb-2">No leases found</h4>
            <button onClick={() => { setEditing(null); setModal(true); }} className="btn-primary mx-auto mt-4"><Plus className="w-4 h-4" /> Create First Lease</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((lease) => {
              const meta = leaseMeta(lease);
              const Icon = meta.Icon;
              return (
                <div key={lease.id} className="card p-5 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-slate-900 dark:text-white">{lease.tenantName || "Tenant"}</h4>
                        <p className="text-sm text-slate-500">{lease.propertyName || "Property"}</p>
                      </div>
                    </div>
                    <span className={lease.leaseStatus === "Active" ? "badge-rented" : "badge-pending"}>{lease.leaseStatus || "Active"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"><p className="text-xs text-slate-400">Start</p><p className="text-sm font-semibold">{lease.startDate ? format(parseISO(lease.startDate), "dd MMM yyyy") : "—"}</p></div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"><p className="text-xs text-slate-400">End</p><p className="text-sm font-semibold">{lease.endDate ? format(parseISO(lease.endDate), "dd MMM yyyy") : "—"}</p></div>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className={meta.className}><Icon className="w-3.5 h-3.5" /> {meta.label}</span>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditing(lease); setModal(true); }} className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => setDeleting(lease)} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modal && <LeaseModal lease={editing} onClose={() => { setModal(false); setEditing(null); }} />}
      {deleting && (
        <div className="modal-overlay" onClick={() => setDeleting(null)}>
          <div className="card w-full max-w-sm p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h4 className="font-display text-xl font-bold text-center mb-2 text-slate-900 dark:text-white">Delete Lease?</h4>
            <p className="text-sm text-slate-500 text-center mb-6">This will remove the lease for <strong>{deleting.tenantName}</strong>.</p>
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
