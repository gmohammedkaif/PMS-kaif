import { useState } from "react";
import Layout from "../components/Layout";
import PropertyModal from "../components/PropertyModal";
import { useProperties, deleteProperty } from "../services/firestore";
import { Plus, Search, Edit2, Trash2, Home, MapPin, IndianRupee, Filter, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function Properties() {
  const { data: properties, loading } = useProperties();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const navigate = useNavigate();

  const filtered = properties.filter(p => {
    const matchSearch = p.propertyName?.toLowerCase().includes(search.toLowerCase()) ||
      p.city?.toLowerCase().includes(search.toLowerCase()) ||
      p.address?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || p.status === filter;
    return matchSearch && matchFilter;
  });

  const handleDelete = async (id) => {
    try {
      await deleteProperty(id);
      toast.success("Property deleted");
      setDeleting(null);
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <Layout title="Properties">
      <div className="max-w-7xl mx-auto space-y-5 animate-slide-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white">My Properties</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{properties.length} total • {properties.filter(p=>p.status==="Rented").length} rented • {properties.filter(p=>p.status==="Vacant").length} vacant</p>
          </div>
          <button onClick={() => { setEditing(null); setModal(true); }} className="btn-primary shrink-0">
            <Plus className="w-4 h-4" /> Add Property
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="input pl-10" placeholder="Search properties..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            {["All","Rented","Vacant"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f ? "bg-brand-600 text-white shadow-sm" : "btn-secondary py-2"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-5 animate-pulse space-y-3">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-full" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <Home className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
            <h4 className="font-display text-lg font-bold text-slate-500 dark:text-slate-400 mb-2">
              {search || filter !== "All" ? "No properties match your filters" : "No properties yet"}
            </h4>
            <p className="text-sm text-slate-400 mb-6">Click "Add Property" to get started</p>
            {!search && filter === "All" && (
              <button onClick={() => { setEditing(null); setModal(true); }} className="btn-primary mx-auto">
                <Plus className="w-4 h-4" /> Add Your First Property
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(p => (
              <div key={p.id} className="card p-5 hover:shadow-md transition-all duration-300 group flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
                    <Home className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <span className={p.status === "Rented" ? "badge-rented" : "badge-vacant"}>
                    <span className={`w-1.5 h-1.5 rounded-full ${p.status === "Rented" ? "bg-emerald-500" : "bg-amber-500"}`} />
                    {p.status}
                  </span>
                </div>

                <h4 className="font-display font-bold text-slate-900 dark:text-white text-lg mb-0.5 leading-tight">{p.propertyName}</h4>
                <p className="text-xs text-brand-600 dark:text-brand-400 font-medium mb-3">{p.propertyType}{p.flatNumber ? ` • ${p.flatNumber}` : ""}</p>

                {p.address && (
                  <div className="flex items-start gap-1.5 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{p.address}{p.city ? `, ${p.city}` : ""}</p>
                  </div>
                )}

                <div className="mt-auto">
                  {p.rentAmount && (
                    <div className="flex items-center gap-1 mb-4 text-emerald-600 dark:text-emerald-400">
                      <IndianRupee className="w-3.5 h-3.5" />
                      <span className="font-bold text-sm">{Number(p.rentAmount).toLocaleString("en-IN")}</span>
                      <span className="text-xs text-slate-400">/month</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button onClick={() => navigate(`/properties/${p.id}`)}
                      className="flex-1 btn-secondary py-2 text-xs justify-center">
                      View Details <ChevronRight className="w-3 h-3" />
                    </button>
                    <button onClick={() => { setEditing(p); setModal(true); }}
                      className="p-2 rounded-xl text-slate-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleting(p)}
                      className="p-2 rounded-xl text-slate-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <PropertyModal property={editing} onClose={() => { setModal(false); setEditing(null); }} />
      )}

      {/* Delete confirm */}
      {deleting && (
        <div className="modal-overlay" onClick={() => setDeleting(null)}>
          <div className="card w-full max-w-sm p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h4 className="font-display text-xl font-bold text-slate-900 dark:text-white text-center mb-2">Delete Property?</h4>
            <p className="text-sm text-slate-500 text-center mb-6">
              Are you sure you want to delete <strong>"{deleting.propertyName}"</strong>? This cannot be undone.
            </p>
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
