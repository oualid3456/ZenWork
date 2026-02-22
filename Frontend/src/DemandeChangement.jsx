import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

export default function DemandeChangement() {
  const [demandes, setDemandes] = useState([]);
  const [typeDemande, setTypeDemande] = useState("HORAIRE");
  const [motif, setMotif] = useState("");
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);


  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUser(data.user);
    });
  }, []);


  const fetchDemandes = async () => {
    const { data, error } = await supabase
      .from("demande_changement")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("Erreur chargement: " + error.message);
      return;
    }
    setDemandes(data || []);
  };

  useEffect(() => {
    fetchDemandes();
  }, []);


  const handleAdd = async (e) => {
    e.preventDefault();
    if (!user) {
      setMessage("Vous devez etre connecte.");
      return;
    }

    const { error } = await supabase.from("demande_changement").insert({
      utilisateur_id: user.id,
      type_demande: typeDemande,
      motif: motif,
      statut: "EN_ATTENTE",
    });

    if (error) {
      setMessage("Erreur ajout: " + error.message);
      return;
    }

    setMessage("Demande ajoutee !");
    setMotif("");
    fetchDemandes();
  };

  // Accept a demande
  const handleAccept = async (id) => {
    if (!user) return;
    const { error } = await supabase
      .from("demande_changement")
      .update({
        statut: "ACCEPTEE",
        valide_par: user.id,
        date_traitement: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      setMessage("Erreur acceptation: " + error.message);
      return;
    }
    setMessage("Demande acceptee !");
    fetchDemandes();
  };


  const handleRefuse = async (id) => {
    if (!user) return;
    const { error } = await supabase
      .from("demande_changement")
      .update({
        statut: "REFUSEE",
        valide_par: user.id,
        date_traitement: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      setMessage("Erreur refus: " + error.message);
      return;
    }
    setMessage("Demande refusee !");
    fetchDemandes();
  };

  return (
    <div>
      <h2>Demande de Changement</h2>

      {user ? <p>Connecte: {user.email}</p> : <p>Non connecte</p>}

      {message && <p><b>{message}</b></p>}

      <hr />
      <h3>Nouvelle demande</h3>
      <form onSubmit={handleAdd}>
        <label>Type: </label>
        <select value={typeDemande} onChange={(e) => setTypeDemande(e.target.value)}>
          <option value="CONGE">CONGE</option>
          <option value="HORAIRE">HORAIRE</option>
          <option value="ECHANGE">ECHANGE</option>
        </select>
        <br />
        <label>Motif: </label>
        <input
          type="text"
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
          placeholder="Motif de la demande"
          required
        />
        <br />
        <button type="submit">Envoyer la demande</button>
      </form>

      <hr />
      <h3>Liste des demandes</h3>
      <button onClick={fetchDemandes}>Rafraichir</button>

      <table border="1">
        <thead>
          <tr>
            <th>ID</th>
            <th>Type</th>
            <th>Motif</th>
            <th>Statut</th>
            <th>Date creation</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {demandes.map((d) => (
            <tr key={d.id}>
              <td>{d.id}</td>
              <td>{d.type_demande}</td>
              <td>{d.motif}</td>
              <td>{d.statut}</td>
              <td>{d.created_at ? new Date(d.created_at).toLocaleString() : "-"}</td>
              <td>
                {d.statut === "EN_ATTENTE" ? (
                  <>
                    <button onClick={() => handleAccept(d.id)}>Accepter</button>
                    <button onClick={() => handleRefuse(d.id)}>Refuser</button>
                  </>
                ) : (
                  d.statut
                )}
              </td>
            </tr>
          ))}
          {demandes.length === 0 && (
            <tr>
              <td colSpan="6">Aucune demande</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
