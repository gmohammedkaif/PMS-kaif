import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, where, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

// Generic hook to listen to a user-scoped collection
function useCollection(colName) {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, colName),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setData(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [user, colName]);

  return { data, loading };
}

// Properties
export function useProperties() {
  return useCollection("properties");
}
export async function addProperty(uid, data) {
  return addDoc(collection(db, "properties"), { ...data, uid, createdAt: serverTimestamp() });
}
export async function updateProperty(id, data) {
  return updateDoc(doc(db, "properties", id), data);
}
export async function deleteProperty(id) {
  return deleteDoc(doc(db, "properties", id));
}

// Tenants
export function useTenants() {
  return useCollection("tenants");
}
export async function addTenant(uid, data) {
  return addDoc(collection(db, "tenants"), { ...data, uid, createdAt: serverTimestamp() });
}
export async function updateTenant(id, data) {
  return updateDoc(doc(db, "tenants", id), data);
}
export async function deleteTenant(id) {
  return deleteDoc(doc(db, "tenants", id));
}

// Leases
export function useLeases() {
  return useCollection("leases");
}
export async function addLease(uid, data) {
  return addDoc(collection(db, "leases"), { ...data, uid, createdAt: serverTimestamp() });
}
export async function updateLease(id, data) {
  return updateDoc(doc(db, "leases", id), data);
}
export async function deleteLease(id) {
  return deleteDoc(doc(db, "leases", id));
}

// Payments
export function usePayments() {
  return useCollection("payments");
}
export async function addPayment(uid, data) {
  return addDoc(collection(db, "payments"), { ...data, uid, createdAt: serverTimestamp() });
}
export async function updatePayment(id, data) {
  return updateDoc(doc(db, "payments", id), data);
}
export async function deletePayment(id) {
  return deleteDoc(doc(db, "payments", id));
}
