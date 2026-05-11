import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { useProperties, useTenants, useLeases, usePayments, addPayment, updatePayment, deletePayment } from "../services/firestore";
import { ArrowLeft, Home, MapPin, IndianRupee, User, Phone, Mail, Calendar, FileText, CheckCircle, Clock, Plus, Trash2, Edit2, AlertTriangle } from "lucide-react";
import { differenceInDays, differenceInMonths, parseISO, format } from "date-fns";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: properties } = useProperties();
  const { data: tenants } = useTenants();
  const { data: leases } = useLeases();
  const { data: payments } = usePayments();

  const property = properties.find(p => p.id === id);
  const tenant = tenants.find(t => t.assignedProperty === property?.propertyName);
  const lease = leases.find(l => l.propertyId === id || l.propertyName === property?.propertyName);
  const propPayments = payments.filter(p => p.propertyId === id || p.propertyName === property?.propertyName);

  const [addingPayment, setAddingPayment] = useState(false);
  const [payForm, setPayForm] = useState({ amount: "", paymentMonth: format(new Date(), "yyyy-MM"), paymentStatus: "Paid", paidDate: format(new Date(), "yyyy-MM-dd"), notes: "" });
  const [loading, setLoading] = useState(false);

  if (!property) {
    return (
      <Layout title="Property Details">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Home className="w-16 h-16 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Property not found</p>
            <button onClick={() => navigate("/properties")} className="btn-primary mt-4 mx-auto">Back to Properties</button>
          </div>
        </div>
      </Layout>
    );
  }

  const leaseDaysLeft = lease?.endDate ? differenceInDays(parseISO(lease.endDate), new Date()) : null;
  const leaseMonthsLeft = lease?.endDate ? differenceInMonths(parseISO(lease.endDate), new Date()) : null;

  const handleAddPayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addPayment(user.uid, { ...payForm, propertyId: id, propertyName: property.propertyName, tenantName: tenant?.tenantName || "" });
      toast.success("Payment recorded!");
      setAddingPayment(false);
      setPayForm({ amount: "", paymentMonth: format(new Date(), "yyyy-MM"), paymentStatus: "Paid", paidDate: format(new Date(), "yyyy-MM-dd"), notes: "" });
    } catch { toast.error("Failed to add payment"); }
    setLoading(false);
  };

  return (
    <Layout title="Property Details">
      <div className="max-w-5xl mx-auto space-y-5 animate-slide-up">
        {/* Back */}
        <button onClick={() => navigate("/properties")} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Properties
        </button>

        {/* Property Header */}
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                <Home className="w-7 h-7 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">{property.propertyName}</h2>
                <p className="text-brand-600 dark:text-brand-400 font-medium text-sm">{property.propertyType}{property.flatNumber ? ` • ${property.flatNumber}` : ""}</p>
                {property.address && (
                  <div className="flex items-center gap-1.5 mt-1 text-slate-500 text-sm">
                    <MapPin className="w-3.5 h-3.5" />
                    {property.address}{property.city ? `, ${property.city}` : ""}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={property.status === "Rented" ? "badge-rented text-sm px-3 py-1.5" : "badge-vacant text-sm px-3 py-1.5"}>
                <span className={`w-2 h-2 rounded-full ${property.status === "Rented" ? "bg-emerald-500" : "bg-amber-500"}`} />
                {property.status}
              </span>
            </div>
          </div>

          {property.rentAmount && (
            <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-emerald-600" />
              <span className="font-bold text-xl text-emerald-700 dark:text-emerald-400">{Number(property.rentAmount).toLocaleString("en-IN")}</span>
              <span className="text-emerald-600 dark:text-emerald-500 text-sm">/month</span>
            </div>
          )}

          {property.description && (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{property.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Tenant Info */}
          <div className="card p-5">
            <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-brand-500" /> Tenant Information
            </h3>
            {tenant ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold">
                    {tenant.tenantName[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{tenant.tenantName}</p>
                    <p className="text-xs text-slate-500">{tenant.tenantStatus || "Active"}</p>
                  </div>
                  <span className={`ml-auto ${tenant.rentStatus === "Paid" ? "badge-paid" : "badge-pending"}`}>{tenant.rentStatus}</span>
                </div>
                {[
                  { icon: Phone, label: tenant.phone },
                  { icon: Mail, label: tenant.email },
                  { icon: Calendar, label: tenant.moveInDate ? `Moved in: ${format(parseISO(tenant.moveInDate), "dd MMM yyyy")}` : null },
                ].filter(r => r.label).map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span>{label}</span>
                  </div>
                ))}
                {tenant.securityDeposit && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <IndianRupee className="w-4 h-4 text-slate-400" />
                    <span>Security Deposit: ₹{Number(tenant.securityDeposit).toLocaleString("en-IN")}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400">
                <User className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No tenant assigned</p>
                <p className="text-xs mt-1">This property is vacant</p>
              </div>
            )}
          </div>

          {/* Lease Info */}
          <div className="card p-5">
            <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-500" /> Lease Agreement
            </h3>
            {lease ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <p className="text-xs text-slate-400 mb-0.5">Start Date</p>
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                      {lease.startDate ? format(parseISO(lease.startDate), "dd MMM yyyy") : "—"}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <p className="text-xs text-slate-400 mb-0.5">End Date</p>
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                      {lease.endDate ? format(parseISO(lease.endDate), "dd MMM yyyy") : "—"}
                    </p>
                  </div>
                </div>

                {leaseDaysLeft !== null && (
                  <div className={`p-3 rounded-xl border flex items-center gap-2 ${
                    leaseDaysLeft < 0 ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 text-red-600" :
                    leaseDaysLeft <= 60 ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 text-amber-600" :
                    "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800 text-emerald-600"
                  }`}>
                    {leaseDaysLeft < 0 ? <AlertTriangle className="w-4 h-4" /> : leaseDaysLeft <= 60 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    <span className="text-sm font-medium">
                      {leaseDaysLeft < 0 ? `Expired ${Math.abs(leaseDaysLeft)} days ago` :
                       `${leaseDaysLeft} days left (${leaseMonthsLeft} months)`}
                    </span>
                  </div>
                )}

                {lease.depositAmount && (
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <span className="text-sm text-slate-500">Security Deposit</span>
                    <span className="font-semibold text-sm">₹{Number(lease.depositAmount).toLocaleString("en-IN")}</span>
                  </div>
                )}

                <span className={`inline-flex ${lease.leaseStatus === "Active" ? "badge-rented" : "badge-pending"}`}>
                  {lease.leaseStatus || "Active"}
                </span>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No lease agreement found</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment History */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-emerald-500" /> Payment History
            </h3>
            <button onClick={() => setAddingPayment(true)} className="btn-primary py-2 text-sm">
              <Plus className="w-3.5 h-3.5" /> Add Payment
            </button>
          </div>

          {addingPayment && (
            <form onSubmit={handleAddPayment} className="mb-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300">Record New Payment</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="label text-xs">Amount (₹)</label>
                  <input type="number" className="input text-sm" placeholder="12000" value={payForm.amount}
                    onChange={e => setPayForm(f => ({...f, amount: e.target.value}))} required />
                </div>
                <div>
                  <label className="label text-xs">Month</label>
                  <input type="month" className="input text-sm" value={payForm.paymentMonth}
                    onChange={e => setPayForm(f => ({...f, paymentMonth: e.target.value}))} required />
                </div>
                <div>
                  <label className="label text-xs">Status</label>
                  <select className="input text-sm" value={payForm.paymentStatus}
                    onChange={e => setPayForm(f => ({...f, paymentStatus: e.target.value}))}>
                    <option>Paid</option>
                    <option>Pending</option>
                  </select>
                </div>
                <div>
                  <label className="label text-xs">Paid Date</label>
                  <input type="date" className="input text-sm" value={payForm.paidDate}
                    onChange={e => setPayForm(f => ({...f, paidDate: e.target.value}))} />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setAddingPayment(false)} className="btn-secondary py-2 text-sm">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary py-2 text-sm">
                  {loading ? "Saving..." : "Save Payment"}
                </button>
              </div>
            </form>
          )}

          {propPayments.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Clock className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">No payment records yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <th className="pb-3 font-semibold">Month</th>
                    <th className="pb-3 font-semibold">Amount</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Date Paid</th>
                    <th className="pb-3 font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[...propPayments].sort((a,b) => b.paymentMonth?.localeCompare(a.paymentMonth)).map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 font-medium text-slate-800 dark:text-slate-200">
                        {p.paymentMonth ? format(parseISO(p.paymentMonth + "-01"), "MMM yyyy") : "—"}
                      </td>
                      <td className="py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                        ₹{Number(p.amount || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3">
                        <span className={p.paymentStatus === "Paid" ? "badge-paid" : "badge-pending"}>
                          {p.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500">{p.paidDate || "—"}</td>
                      <td className="py-3">
                        <button onClick={async () => { await deletePayment(p.id); toast.success("Deleted"); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
