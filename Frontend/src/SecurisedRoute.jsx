import { Navigate, useParams } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { useEffect, useState } from "react";

function SecurisedRoute({ children }) {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  // loading car l'operation peut potentiellement prendre du temps
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchUser() {
      const { data: { session } } = await supabase.auth.getSession();
      // on verifie que la session existe et qu'il y ai bien un utilisateur connecte
      if (session && session.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    }
    fetchUser();
    // onAuthStateChange comme un addEventListener en js classique
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && session.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);
  if (loading) return null;
  // on renvoit null si c'est pas le bon id (a ameliorer avec une page d'erreur specifique)
  if (!user || user.id !== id) return null;
  return children;
}

export default SecurisedRoute;