import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import styles from "./startQuestionnaire.module.css";

function StartQuestionnaire({ user }) {
  const [questionnaireId, setQuestionnaireId] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  // un tableau contenant l'ensemble des questions dans l'ordre
  const questions = [
    // questions a propose de l'etat psychologique de la personne
    'À quel point vous sentez-vous "heureux(se)" ?',
    'À quel point vous sentez-vous fatigué(e) ?',
    'À quel point vous sentez-vous déprimé(e) ?',
    'À quel point vous passez-vous journées ?',
    'À quel point vous sentez-vous épuisé(e) ?',
    'À quel point vous sentez-vous émotionnellement vidé(e) ?',
    'À quel point vous sentez-vous malheureux(se) ?',
    'À quel point vous sentez-vous "à bout" ?',
    // questions a propos de l'equilibre entre la vie professionelle et la vie eprsonelle
    'À quel point avez-vous des difficultés a dormir.',
    'À quel point sentez-vous que votre travail interfère avec votre vie privée.',
    "À quel point l'énergie drainée par votre travail a un effet négatif sur votre vie privée.",
    'À quel point vous occupez-vous de vos tâches liées au travail en dehors de vos horraires de travail.',
    // questions a propos de l'environnement de travail
    'À quel point les employées peuvent faire confiance aux informations provenant de la direction ?',
    "À quel point puis-je m'organiser librement dans ma façon de réalisé mon travail ?",
    "À quel point entretenez vous de bonne relation avec vos collègues de travail ?",
    'À quel point êtes vous satisfait de votre travail ?',
    'À quel point les conflits sont-ils résolus équitablement ?',
    'À quel point le travail est-il réparti équitablement ?',
    'À quel point votre travail est-il reconnu et apprécié par la direction ?',
    "À quel point ête vous serein(e) par rapport à l'avenir de votre emploi ?",
    'Veuillez-indiquer votre niveau de stress de 1 a 10',
    'Commentaires libres (facultatif)'
  ];

  useEffect(() => {
    async function fetchActiveQuestionnaire() {
      setFetchLoading(true);
      const { data, error } = await supabase
        .from("questionnaire")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .single();

      if (data) {
        setQuestionnaireId(data.id);
        setTitle(data.titre);
        setDescription(data.description);
      }
      setFetchLoading(false);
    }

    fetchActiveQuestionnaire();
  }, []);

  const handleStartQuestionnaire = async () => {
  // si le titre ou la description sont vides, on arrête
    if (title == "" || description == "") {
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("questionnaire")
      .insert([
        {
          titre: title,
          description: description,
          structure_json: JSON.stringify(questions),
          active: true,
        },
      ])
      .select("*")
      .single();
    if (error) {
      console.error("Echec dans la création du questionnaire", error.message);
      return;
    }
    setQuestionnaireId(data.id);
  };
  
  const handleStopQuestionnaire = async () => {
    if (!questionnaireId) return;
    setLoading(true);

    const { error } = await supabase
      .from("questionnaire")
      .update({ active: false })
      .eq("id", questionnaireId);

    if (error) {
      console.error("Echec dans l'arrêt du questionnaire", error.message);
      setLoading(false);
      return;
    }

    setQuestionnaireId(null);
    setTitle("");
    setDescription("");
    setLoading(false);
  };

  if (fetchLoading) {
    return <p>Loading</p>;
  }

  if (questionnaireId == null) {
    return (
      <div className={styles.startQuestionnaireWrapper}>
        <div className={styles.container}>
          <h1 className={styles.h1}>Créer un questionnaire</h1>
          <input className={styles.input}
            type="text"
            placeholder="Titre du questionnaire"
            value={title}
            maxLength={50}
            onChange={(event) => setTitle(event.target.value)}
          />
          <textarea className={styles.textarea}
            placeholder="Description du questionnaire"
            value={description}
            maxLength={125}
            onChange={(event) => setDescription(event.target.value)}
          />
          <button className={styles.button} onClick={handleStartQuestionnaire} disabled={loading}>
            {loading ? "Loading" : "Lancer le questionnaire"}
          </button>
        </div>
      </div>
    );
  } else {
      return (
        <div className={styles.startQuestionnaireWrapper}>
          <div className={styles.container}>
            <h1 className={styles.h1}>Questionnaire en cours</h1>
            <p className={styles.p}>ID du questionnaire : {questionnaireId}</p>
            <p className={styles.p}>Titre du questionnaire : {title}</p>
            <p className={styles.p}>Description du questionnaire : {description}</p>
            <button className={styles.button} onClick={handleStopQuestionnaire}>Arrêter le questionnaire</button>
          </div>
        </div>
      );
  }
}

export default StartQuestionnaire;
