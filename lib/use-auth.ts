/**
 * useAuth - Hook para detectar el estado de autenticación
 * 
 * Este hook usa onAuthStateChanged de Firebase para detectar
 * si el usuario ha iniciado sesión. Retorna el objeto usuario
 * cuando está logueado y null cuando no lo está.
 */
"use client";

import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { auth } from "./firebase-client";
import { onAuthStateChanged } from "firebase/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
}