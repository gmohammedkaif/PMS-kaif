import { useState } from "react";
import Layout from "../components/Layout";
import TenantModal from "../components/TenantModal";
import { useTenants, deleteTenant } from "../services/firestore";
import { Plus, Search, Edit2, Trash2, Users, Phone, Mail, Calendar, IndianRupee, Filter } from "lucide-react";
import toast from "react-hot-toast";
import { format, parseISO } from "date-fns";

export default function Tenants() {
  const { data: tenants, loading } = useTenants();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const filtered = tenants.filter(t => {
    const matchSearch = t.tenantName?.toLowerCase().includes(search.toLowerCase()) ||
      t.email?.toLowerCase().includes(search.toLowerCase()) ||
      (t.propertyName || t.assignedProperty || "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || t.tenantStatus === filter ||
      (filter === "Paid" && t.rentStatus === "Paid") ||
      (filter === "Pending" && t.rentStatus === "Pending");
    return matchSearch && matchFilter;
  });

  const handleDelete = async (id) => {
    try {
      await deleteTenant(id);
      toast.success("Tenant deleted");
      setDeleting(null);
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <Layout title="Tenants">
      <div className="max-w-7xl mx-auto space-y-5 animate-slide-up">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Tenants</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{tenants.filter(t => t.tenantStatus === "Active").length} active • {tenants.filter(t => t.tenantStatus === "Moved Out").length} moved out</p>
          </div>
          <button onClick={() => { setEditing(null); setModal(true); }} className="btn-primary shrink-0">
            <Plus className="w-4 h-4" /> Add Tenant
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="input pl-10" placeholder="Search tenants..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            {["All","Active","Moved Out","Paid","Pending"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${filter === f ? "bg-brand-600 text-white" : "btn-secondary py-2 text-xs"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="card divide-y divide-slate-100 dark:divide-slate-800">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 animate-pulse flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700" />
                <div className="flex-1 space-y-2"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"/><div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/4"/></div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
            <h4 className="font-display text-lg font-bold text-slate-500 dark:text-slate-400 mb-2">No tenants found</h4>
            <p className="text-sm text-slate-400 mb-6">Add your first tenant to get started</p>
            {!search && filter === "All" && (
              <button onClick={() => { setEditing(null); setModal(true); }} className="btn-primary mx-auto">
                <Plus className="w-4 h-4" /> Add Tenant
              </button>
            )}
          </div>
        ) : (
          <div className="card overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-left">
                    {["Tenant","Property","Contact","Move-in","Rent","Status",""].map(h => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {(t.tenantName || "T")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{t.tenantName}</p>
                            {t.idProofNumber && <p className="text-xs text-slate-400">ID: {t.idProofNumber}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-sm">{t.propertyName || t.assignedProperty || "—"}</td>
                      <td className="px-4 py-3">
                        {t.phone && <div className="flex items-center gap-1 text-xs text-slate-500"><Phone className="w-3 h-3"/>{t.phone}</div>}
                        {t.email && <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5"><Mail className="w-3 h-3"/>{t.email}</div>}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-sm">
                        {t.moveInDate ? format(parseISO(t.moveInDate), "dd MMM yyyy") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {t.monthlyRent && <p className="font-semibold text-emerald-600 text-sm">₹{Number(t.monthlyRent).toLocaleString("en-IN")}</p>}
                        {t.securityDeposit && <p className="text-xs text-slate-400">Dep: ₹{Number(t.securityDeposit).toLocaleString("en-IN")}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={t.tenantStatus === "Active" ? "badge-rented" : "badge-pending"}>{t.tenantStatus || "Active"}</span>
                          <span className={t.rentStatus === "Paid" ? "badge-paid" : "badge-pending"}>{t.rentStatus || "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditing(t); setModal(true); }}
                            className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleting(t)}
                            className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(t => (
                <div key={t.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold">
                        {(t.tenantName || "T")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{t.tenantName}</p>
                        <p className="text-xs text-slate-500">{t.propertyName || t.assignedProperty || "—"}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditing(t); setModal(true); }} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 transition-colors"><Edit2 className="w-4 h-4"/></button>
                      <button onClick={() => setDeleting(t)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={t.tenantStatus === "Active" ? "badge-rented" : "badge-pending"}>{t.tenantStatus}</span>
                    <span className={t.rentStatus === "Paid" ? "badge-paid" : "badge-pending"}>{t.rentStatus}</span>
                    {t.monthlyRent && <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">₹{Number(t.monthlyRent).toLocaleString("en-IN")}/mo</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {modal && <TenantModal tenant={editing} onClose={() => { setModal(false); setEditing(null); }} />}

      {deleting && (
        <div className="modal-overlay" onClick={() => setDeleting(null)}>
          <div className="card w-full max-w-sm p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h4 className="font-display text-xl font-bold text-slate-900 dark:text-white text-center mb-2">Remove Tenant?</h4>
            <p className="text-sm text-slate-500 text-center mb-6">Are you sure you want to remove <strong>"{deleting.tenantName}"</strong>?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleting(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={() => handleDelete(deleting.id)} className="btn-danger flex-1 justify-center">Remove</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
