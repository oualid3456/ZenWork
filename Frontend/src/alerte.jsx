import React, { useState } from 'react';
import { supabase } from './supabaseClient';

const AlerteBurnout = () => {
  const [score, setScore] = useState(5);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const envoyerAlerte = async () => {
    setLoading(true);
    setMessage("");

    try {
      // 1. Logique métier : On ne déclenche l'alerte que si score >= 8
      if (score >= 8) {
        
        // Mapping du score (8-10) vers niveau_urgence (1-3)
        // Score 8 -> Urgence 1 | Score 9 -> Urgence 2 | Score 10 -> Urgence 3
        const niveauUrgence = score - 7; 

        const { error } = await supabase
          .from('alerte_burnout') 
          .insert([
            { 
              utilisateur_id: null, // À remplacer par l'ID de l'user connecté plus tard
              niveau_urgence: niveauUrgence,
              statut: 'NOUVEAU' // Valeur par défaut conforme au SQL
            }
          ]);

        if (error) throw error;
        setMessage(`🚨 ALERTE ENVOYÉE ! Urgence niveau ${niveauUrgence}/3.`);
      } else {
        setMessage("✅ Votre score a été enregistré.");
      }
    } catch (error) {
      setMessage("❌ Erreur base de données : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- STYLE ---
  const styles = {
    container: {
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      padding: '25px',
      borderRadius: '15px',
      backgroundColor: '#fff',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      maxWidth: '450px',
      margin: '20px auto',
      textAlign: 'center',
      border: score >= 8 ? '3px solid #e53935' : '3px solid #4caf50'
    },
    scoreLabel: { fontSize: '1.2rem', marginBottom: '10px', display: 'block' },
    scoreValue: { 
        fontSize: '3rem', 
        fontWeight: 'bold', 
        color: score >= 8 ? '#e53935' : '#4caf50' 
    },
    slider: { width: '100%', margin: '25px 0', accentColor: score >= 8 ? '#e53935' : '#4caf50' },
    btn: {
      padding: '12px 24px',
      fontSize: '1rem',
      fontWeight: 'bold',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      backgroundColor: score >= 8 ? '#e53935' : '#4caf50',
      transition: 'transform 0.1s'
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={{color: '#333'}}>Auto-évaluation</h2>
      <span style={styles.scoreLabel}>Niveau de détresse ressenti :</span>
      <div style={styles.scoreValue}>{score}/10</div>

      <input 
        type="range" min="0" max="10" 
        value={score} 
        onChange={(e) => setScore(parseInt(e.target.value))}
        style={styles.slider}
      />

      <button style={styles.btn} onClick={envoyerAlerte} disabled={loading}>
        {loading ? "Traitement..." : "Soumettre au RH"}
      </button>

      {message && (
        <div style={{
            marginTop: '20px', 
            padding: '10px', 
            borderRadius: '5px',
            backgroundColor: score >= 8 ? '#ffebee' : '#e8f5e9',
            color: score >= 8 ? '#c62828' : '#2e7d32',
            fontWeight: 'bold'
        }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default AlerteBurnout;