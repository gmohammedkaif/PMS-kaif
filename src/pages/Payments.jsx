import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { usePayments, useProperties, useTenants, addPayment, updatePayment, deletePayment, hasDuplicatePayment } from "../services/firestore";
import { Plus, CreditCard, Search, Filter, Edit2, Trash2, X, TrendingUp, TrendingDown } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const DEFAULT = {
  tenantId: "",
  tenantName: "",
  propertyId: "",
  propertyName: "",
  amount: "",
  paymentMonth: format(new Date(), "yyyy-MM"),
  paymentStatus: "Paid",
  paidDate: format(new Date(), "yyyy-MM-dd"),
  notes: "",
};

function PaymentModal({ payment, onClose }) {
  const { user } = useAuth();
  const { data: properties } = useProperties();
  const { data: tenants } = useTenants();
  const [form, setForm] = useState(DEFAULT);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm(payment ? { ...DEFAULT, ...payment } : DEFAULT);
    setErrors({});
  }, [payment]);

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
      amount: f.amount || tenant?.monthlyRent || "",
    }));
    setErrors((e) => ({ ...e, tenantId: "", tenantName: "", propertyId: "", propertyName: "" }));
  };

  const selectProperty = (propertyId) => {
    const property = properties.find((p) => p.id === propertyId);
    setForm((f) => ({ ...f, propertyId, propertyName: property?.propertyName || "", amount: f.amount || property?.rentAmount || "" }));
    setErrors((e) => ({ ...e, propertyId: "", propertyName: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.tenantId) errs.tenantId = "Please select a tenant";
    if (!form.propertyId) errs.propertyId = "Please select a property";
    if (!form.amount || Number(form.amount) <= 0) errs.amount = "Enter a valid amount greater than 0";
    if (!form.paymentMonth) errs.paymentMonth = "Payment month is required";
    if (form.paymentStatus === "Paid" && !form.paidDate) errs.paidDate = "Paid date is required";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      const duplicate = await hasDuplicatePayment(user.uid, form, payment?.id);
      if (duplicate) {
        toast.error("This tenant already has a payment for this property and month.");
        setLoading(false);
        return;
      }
      const submitForm = { ...form, paidDate: form.paymentStatus === "Pending" ? "" : form.paidDate };
      if (payment?.id) {
        await updatePayment(payment.id, submitForm);
        toast.success("Payment updated!");
      } else {
        await addPayment(user.uid, submitForm);
        toast.success("Payment recorded!");
      }
      onClose();
    } catch (error) {
      toast.error(error?.message || "Error saving payment");
    } finally {
      setLoading(false);
    }
  };

  const isPending = form.paymentStatus === "Pending";

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">{payment ? "Edit Payment" : "Record Payment"}</h3>
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
              <label className="label">Amount (₹) *</label>
              <input type="number" className={`input ${errors.amount ? "border-red-400 focus:ring-red-400" : ""}`} placeholder="12000" value={form.amount} onChange={(e) => set("amount", e.target.value)} />
              {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount}</p>}
            </div>
            <div>
              <label className="label">Payment Month *</label>
              <input type="month" className={`input ${errors.paymentMonth ? "border-red-400 focus:ring-red-400" : ""}`} value={form.paymentMonth} onChange={(e) => set("paymentMonth", e.target.value)} />
              {errors.paymentMonth && <p className="mt-1 text-xs text-red-500">{errors.paymentMonth}</p>}
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.paymentStatus} onChange={(e) => {
                const status = e.target.value;
                setForm((f) => ({ ...f, paymentStatus: status, paidDate: status === "Pending" ? "" : f.paidDate || format(new Date(), "yyyy-MM-dd") }));
                setErrors((err) => ({ ...err, paymentStatus: "", paidDate: "" }));
              }}>
                <option>Paid</option>
                <option>Pending</option>
              </select>
            </div>
            <div>
              <label className={`label ${isPending ? "opacity-50" : ""}`}>Date Paid</label>
              <input type="date" className={`input transition-opacity ${isPending ? "opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900" : ""} ${errors.paidDate ? "border-red-400 focus:ring-red-400" : ""}`} value={form.paidDate} onChange={(e) => set("paidDate", e.target.value)} disabled={isPending} />
              {isPending && <p className="mt-1 text-xs text-slate-400 italic">Not applicable for pending payments</p>}
              {errors.paidDate && <p className="mt-1 text-xs text-red-500">{errors.paidDate}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="label">Notes</label>
              <input className="input" placeholder="Optional notes..." value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">{loading ? "Saving..." : "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Payments() {
  const { data: payments, loading } = usePayments();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const filtered = payments.filter((p) => {
    const matchSearch = `${p.tenantName || ""} ${p.propertyName || ""}`.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || p.paymentStatus === filter;
    return matchSearch && matchFilter;
  });

  const totalCollected = payments.filter((p) => p.paymentStatus === "Paid").reduce((s, p) => s + Number(p.amount || 0), 0);
  const totalPending = payments.filter((p) => p.paymentStatus === "Pending").reduce((s, p) => s + Number(p.amount || 0), 0);
  const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

  const handleDelete = async (id) => {
    try { await deletePayment(id); toast.success("Deleted"); setDeleting(null); }
    catch (error) { toast.error(error?.message || "Failed"); }
  };

  return (
    <Layout title="Payments">
      <div className="max-w-7xl mx-auto space-y-5 animate-slide-up">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Payments</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{payments.length} records</p>
          </div>
          <button onClick={() => { setEditing(null); setModal(true); }} className="btn-primary shrink-0"><Plus className="w-4 h-4" /> Record Payment</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><CreditCard className="w-5 h-5 text-slate-600 dark:text-slate-400" /></div><div><p className="text-xs text-slate-500">Total Records</p><p className="font-bold text-slate-900 dark:text-white">{payments.length}</p></div></div>
          <div className="stat-card flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-emerald-600" /></div><div><p className="text-xs text-slate-500">Collected</p><p className="font-bold text-emerald-600 dark:text-emerald-400">{fmt(totalCollected)}</p></div></div>
          <div className="stat-card flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center"><TrendingDown className="w-5 h-5 text-red-500" /></div><div><p className="text-xs text-slate-500">Pending</p><p className="font-bold text-red-500">{fmt(totalPending)}</p></div></div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input className="input pl-10" placeholder="Search by tenant or property..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <div className="flex items-center gap-2"><Filter className="w-4 h-4 text-slate-400" />{["All", "Paid", "Pending"].map((f) => <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f ? "bg-brand-600 text-white" : "btn-secondary py-2"}`}>{f}</button>)}</div>
        </div>

        {loading ? (
          <div className="card p-4 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center"><CreditCard className="w-16 h-16 mx-auto mb-4 text-slate-300" /><h4 className="font-display text-lg font-bold text-slate-500 mb-2">No payments found</h4><button onClick={() => { setEditing(null); setModal(true); }} className="btn-primary mx-auto mt-4"><Plus className="w-4 h-4" /> Record First Payment</button></div>
        ) : (
          <div className="card overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-slate-50 dark:bg-slate-800/50 text-left">{["Tenant", "Property", "Month", "Amount", "Status", "Date Paid", ""].map((h) => <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{filtered.map((p) => <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"><td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{p.tenantName || "—"}</td><td className="px-4 py-3 text-slate-500">{p.propertyName || "—"}</td><td className="px-4 py-3 text-slate-600 dark:text-slate-400">{p.paymentMonth ? format(parseISO(`${p.paymentMonth}-01`), "MMM yyyy") : "—"}</td><td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">{p.amount ? fmt(p.amount) : "—"}</td><td className="px-4 py-3"><span className={p.paymentStatus === "Paid" ? "badge-paid" : "badge-pending"}>{p.paymentStatus}</span></td><td className="px-4 py-3 text-slate-500 text-sm">{p.paidDate || "—"}</td><td className="px-4 py-3"><div className="flex items-center gap-1"><button onClick={() => { setEditing(p); setModal(true); }} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button><button onClick={() => setDeleting(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button></div></td></tr>)}</tbody></table></div></div>
        )}
      </div>

      {modal && <PaymentModal payment={editing} onClose={() => { setModal(false); setEditing(null); }} />}
      {deleting && <div className="modal-overlay" onClick={() => setDeleting(null)}><div className="card w-full max-w-sm p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}><h4 className="font-display text-xl font-bold text-center mb-2 text-slate-900 dark:text-white">Delete Payment?</h4><p className="text-sm text-slate-500 text-center mb-6">This will remove the payment record for <strong>{deleting.tenantName}</strong>.</p><div className="flex gap-3"><button onClick={() => setDeleting(null)} className="btn-secondary flex-1 justify-center">Cancel</button><button onClick={() => handleDelete(deleting.id)} className="btn-danger flex-1 justify-center">Delete</button></div></div></div>}
    </Layout>
  );
}
