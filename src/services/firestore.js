import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const COLLECTIONS = ["properties", "tenants", "leases", "payments"];

const sortByCreatedAtDesc = (items) =>
  [...items].sort((a, b) => {
    const aTime = a.createdAt?.seconds || 0;
    const bTime = b.createdAt?.seconds || 0;
    return bTime - aTime;
  });

function getFirestoreErrorMessage(error) {
  if (error?.code === "permission-denied") {
    return "Firestore permission denied. Please check your security rules.";
  }
  if (error?.code === "failed-precondition") {
    return "Firestore index is missing or still building. Try again after the index is ready.";
  }
  if (error?.code === "unavailable") {
    return "Network issue while reading Firestore. Please check your internet connection.";
  }
  return error?.message || "Something went wrong while reading Firestore.";
}

function useCollection(colName) {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.uid) {
      setData([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    setError(null);

    // Client-side sorting avoids composite-index errors caused by where + orderBy.
    const q = query(collection(db, colName), where("uid", "==", user.uid));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setData(sortByCreatedAtDesc(rows));
        setLoading(false);
      },
      (err) => {
        const message = getFirestoreErrorMessage(err);
        setError(message);
        setLoading(false);
        toast.error(message);
      }
    );

    return () => unsub();
  }, [user?.uid, colName]);

  return { data, loading, error };
}

const clean = (data) =>
  Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));

export function isActiveTenant(tenant) {
  return (tenant?.tenantStatus || "Active") === "Active";
}

export function isActiveLease(lease) {
  if (!lease) return false;
  if ((lease.leaseStatus || "Active") !== "Active") return false;
  if (!lease.endDate) return true;
  return new Date(lease.endDate) >= new Date(new Date().toDateString());
}

export function getPropertyStatus(propertyId, tenants = [], leases = []) {
  const hasActiveTenant = tenants.some((t) => t.propertyId === propertyId && isActiveTenant(t));
  const hasActiveLease = leases.some((l) => l.propertyId === propertyId && isActiveLease(l));
  return hasActiveTenant || hasActiveLease ? "Rented" : "Vacant";
}

export function hydratePropertyStatus(properties = [], tenants = [], leases = []) {
  return properties.map((property) => ({
    ...property,
    derivedStatus: getPropertyStatus(property.id, tenants, leases),
  }));
}

export async function getUserCollection(colName, uid) {
  const q = query(collection(db, colName), where("uid", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function hasDuplicatePayment(uid, { tenantId, propertyId, paymentMonth }, ignoreId) {
  if (!uid || !tenantId || !propertyId || !paymentMonth) return false;
  const allPayments = await getUserCollection("payments", uid);
  return allPayments.some(
    (payment) =>
      payment.id !== ignoreId &&
      payment.tenantId === tenantId &&
      payment.propertyId === propertyId &&
      payment.paymentMonth === paymentMonth
  );
}

export async function deletePropertyCascade(propertyId, uid) {
  if (!propertyId || !uid) throw new Error("Missing property or user id");
  const batch = writeBatch(db);

  const [tenants, leases, payments] = await Promise.all([
    getUserCollection("tenants", uid),
    getUserCollection("leases", uid),
    getUserCollection("payments", uid),
  ]);

  tenants.filter((item) => item.propertyId === propertyId).forEach((item) => batch.delete(doc(db, "tenants", item.id)));
  leases.filter((item) => item.propertyId === propertyId).forEach((item) => batch.delete(doc(db, "leases", item.id)));
  payments.filter((item) => item.propertyId === propertyId).forEach((item) => batch.delete(doc(db, "payments", item.id)));
  batch.delete(doc(db, "properties", propertyId));

  await batch.commit();
}

export function useProperties() { return useCollection("properties"); }
export async function addProperty(uid, data) {
  return addDoc(collection(db, "properties"), clean({ ...data, status: undefined, uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
}
export async function updateProperty(id, data) {
  return updateDoc(doc(db, "properties", id), clean({ ...data, status: undefined, updatedAt: serverTimestamp() }));
}
export async function deleteProperty(id) { return deleteDoc(doc(db, "properties", id)); }

export function useTenants() { return useCollection("tenants"); }
export async function addTenant(uid, data) {
  return addDoc(collection(db, "tenants"), clean({ ...data, uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
}
export async function updateTenant(id, data) {
  return updateDoc(doc(db, "tenants", id), clean({ ...data, updatedAt: serverTimestamp() }));
}
export async function deleteTenant(id) { return deleteDoc(doc(db, "tenants", id)); }

export function useLeases() { return useCollection("leases"); }
export async function addLease(uid, data) {
  return addDoc(collection(db, "leases"), clean({ ...data, uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
}
export async function updateLease(id, data) {
  return updateDoc(doc(db, "leases", id), clean({ ...data, updatedAt: serverTimestamp() }));
}
export async function deleteLease(id) { return deleteDoc(doc(db, "leases", id)); }

export function usePayments() { return useCollection("payments"); }
export async function addPayment(uid, data) {
  return addDoc(collection(db, "payments"), clean({ ...data, uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
}
export async function updatePayment(id, data) {
  return updateDoc(doc(db, "payments", id), clean({ ...data, updatedAt: serverTimestamp() }));
}
export async function deletePayment(id) { return deleteDoc(doc(db, "payments", id)); }
