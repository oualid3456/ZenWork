import { supabase } from './supabaseClient';

const envoyerScore = async (score, userId) => {
  // 1. Sauvegarde le score normalement
  const { error } = await supabase
    .from('reponses_bienetre')
    .insert([{ utilisateur_id: userId, score: score }]);

  // logique alerte: si score > 8
  if (score >= 8) {
    await envoyerAlerteRH(userId, score);
  }
};

const envoyerAlerteRH = async (userId, score) => {
  // On insère une ligne dans une table 'alertes' que le RH consulte
  const { error } = await supabase
    .from('alertes_burnout')
    .insert([{ 
        utilisateur_id: userId, 
        message: "Risque de détresse élevé", 
        score_detecte: score 
    }]);
    
  if (!error) console.log("Alerte envoyée au RH !");
};