import Layout from "../components/Layout";
import { useProperties, hydratePropertyStatus, isActiveLease } from "../services/firestore";
import { useTenants } from "../services/firestore";
import { useLeases } from "../services/firestore";
import { usePayments } from "../services/firestore";
import { Home, Users, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, IndianRupee, Building, DoorOpen } from "lucide-react";
import { differenceInDays, parseISO, format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="stat-card flex items-start justify-between gap-4">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white font-display">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const COLORS = ["#0ea5e9","#f59e0b","#10b981","#ef4444"];

export default function Dashboard() {
  const { data: rawProperties } = useProperties();
  const { data: tenants } = useTenants();
  const { data: leases } = useLeases();
  const { data: payments } = usePayments();
  const properties = hydratePropertyStatus(rawProperties, tenants, leases);

  const activeTenants = tenants.filter(t => (t.tenantStatus || "Active") === "Active");
  const activeLeases = leases.filter(isActiveLease);
  const rented = properties.filter(p => p.derivedStatus === "Rented").length;
  const vacant = properties.filter(p => p.derivedStatus === "Vacant").length;
  const totalRent = activeTenants.reduce((s, t) => s + Number(t.monthlyRent || 0), 0);
  const collected = payments.filter(p => p.paymentStatus === "Paid").reduce((s, p) => s + Number(p.amount || 0), 0);
  const pending = payments.filter(p => p.paymentStatus === "Pending").reduce((s, p) => s + Number(p.amount || 0), 0);

  const expiringSoon = activeLeases.filter(l => {
    if (!l.endDate) return false;
    const days = differenceInDays(parseISO(l.endDate), new Date());
    return days >= 0 && days <= 60;
  });

  // Bar chart: payments by month
  const barData = MONTHS.map((m, i) => ({
    month: m,
    collected: payments.filter(p => p.paymentStatus === "Paid" && new Date(p.paidDate || p.createdAt?.seconds * 1000 || 0).getMonth() === i).reduce((s, p) => s + Number(p.amount || 0), 0),
    pending: payments.filter(p => p.paymentStatus === "Pending" && new Date(p.createdAt?.seconds * 1000 || 0).getMonth() === i).reduce((s, p) => s + Number(p.amount || 0), 0),
  })).slice(0, new Date().getMonth() + 1);

  const pieData = [
    { name: "Rented", value: rented || 0 },
    { name: "Vacant", value: vacant || 0 },
  ].filter(d => d.value > 0);

  const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

  const recentTenants = [...tenants].slice(0, 5);

  return (
    <Layout title="Dashboard">
      <div className="space-y-6 max-w-7xl mx-auto animate-slide-up">
        {/* Stats Row 1 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Properties" value={properties.length} icon={Building}
            color="bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400" />
          <StatCard label="Rented" value={rented} icon={CheckCircle}
            color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" />
          <StatCard label="Vacant" value={vacant} icon={DoorOpen}
            color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" />
          <StatCard label="Total Tenants" value={tenants.length} icon={Users}
            color="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" />
        </div>

        {/* Stats Row 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Monthly Rent Expected" value={fmt(totalRent)} icon={IndianRupee}
            color="bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400" />
          <StatCard label="Rent Collected" value={fmt(collected)} icon={TrendingUp}
            color="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" />
          <StatCard label="Pending Rent" value={fmt(pending)} icon={TrendingDown}
            color="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Bar chart */}
          <div className="card p-5 lg:col-span-2">
            <h3 className="font-display font-bold text-slate-900 dark:text-white mb-4 text-lg">
              Payment Overview {new Date().getFullYear()}
            </h3>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v >= 1000 ? (v/1000)+"k" : v}`} />
                  <Tooltip formatter={(v) => [`₹${v.toLocaleString("en-IN")}`, ""]} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }} />
                  <Bar dataKey="collected" name="Collected" fill="#0ea5e9" radius={[6,6,0,0]} />
                  <Bar dataKey="pending" name="Pending" fill="#fca5a5" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-56 flex items-center justify-center text-slate-400 text-sm">No payment data yet</div>
            )}
          </div>

          {/* Pie chart */}
          <div className="card p-5">
            <h3 className="font-display font-bold text-slate-900 dark:text-white mb-4 text-lg">Occupancy</h3>
            {properties.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? "#0ea5e9" : "#fbbf24"} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ borderRadius: 12, fontSize: 13 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                  <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-brand-500" /><span className="text-slate-600 dark:text-slate-400">Rented ({rented})</span></div>
                  <div className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full bg-amber-400" /><span className="text-slate-600 dark:text-slate-400">Vacant ({vacant})</span></div>
                </div>
              </>
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-400 text-sm">No properties yet</div>
            )}
          </div>
        </div>

        {/* Expiring Leases + Recent Tenants */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Expiring Leases */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg">Leases Expiring Soon</h3>
              {expiringSoon.length > 0 && (
                <span className="ml-auto badge-pending">{expiringSoon.length}</span>
              )}
            </div>
            {expiringSoon.length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-300" />
                <p className="text-sm">No leases expiring within 60 days</p>
              </div>
            ) : (
              <div className="space-y-3">
                {expiringSoon.map(l => {
                  const days = differenceInDays(parseISO(l.endDate), new Date());
                  return (
                    <div key={l.id} className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{l.tenantName || "Tenant"}</p>
                        <p className="text-xs text-slate-500">{l.propertyName || "Property"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-amber-600 dark:text-amber-400">{days === 0 ? "Today!" : `${days}d left`}</p>
                        <p className="text-xs text-slate-400">{format(parseISO(l.endDate), "dd MMM yyyy")}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Tenants */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg">Recent Tenants</h3>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            {recentTenants.length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No tenants added yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTenants.map(t => (
                  <div key={t.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-bold">
                        {(t.tenantName || "T")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t.tenantName}</p>
                        <p className="text-xs text-slate-500">{t.propertyName || t.assignedProperty || "—"}</p>
                      </div>
                    </div>
                    <span className={t.rentStatus === "Paid" ? "badge-paid" : "badge-pending"}>
                      {t.rentStatus || "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
