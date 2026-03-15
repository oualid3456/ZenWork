import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import styles from "./startQuestionnaire.module.css";
import Loading from "../Loading/Loading.jsx";

function StartQuestionnaire({ user }) {
  const [questionnaireId, setQuestionnaireId] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  // un tableau contenant l'ensemble des questions dans l'ordre
  const questions = [
    // emojis
    'À quel point vous sentez-vous "heureux(se)" ?',
    'À quel point vous sentez-vous fatigué(e) ?',
    'À quel point vous sentez-vous déprimé(e) ?',
    'À quel point vous sentez-vous "à bout" ?',
    'À quel point sentez-vous que votre travail interfère avec votre vie privée.',
    "À quel point entretenez vous de bonne relation avec vos collègues de travail ?",
    'À quel point êtes vous satisfait de votre travail ?',
    // de 1 a 10
    "Veuillez-indiquer votre niveau de stress de 1 a 10",
    "Veuillez-indiquer votre charge de travail de 1 a 10",
    // oui ou non
    "Vous sentez-vous isolez ?",
    // texte
    "Qu'est-ce qui vous cause le plus de stress au travail ?",
    'Commentaires libres (facultatif)'
  ];
  const [mode, setMode] = useState(null);
  // basique pour le questionnaire de base
  // custom pour si l'on veut créer son questionnaire
  const [customQuestions, setCustomQuestions] = useState([]);

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
    // si le titre ou la description sont vides, on arrete
    if (title == "" || description == "") {
      alert("Vous ne devez pas laisser de champ vide");
      return;
    }
    setLoading(true);
    const q = mode === "custom" ? customQuestions : questions;
    const { data, error } = await supabase
      .from("questionnaire")
      .insert([
        {
          titre: title,
          description: description,
          structure_json: JSON.stringify(q),
          active: true,
          default: mode === "basique",
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
    return <Loading />;
  }

  function createQuestion(question, type, optional) {
    return {
      question: question,
      type: type,
      optional: optional,
      validated: false,
    };
  }

  function addQuestion(question, type, optional, index, validated) {
    const updated = [...customQuestions];
    updated[index] = {
      question,
      type,
      optional,
      validated: validated ?? updated[index]?.validated ?? false,
    };
    setCustomQuestions(updated);
  }

  if (mode === "custom" && questionnaireId == null) {
    return (
      <div className={styles.startQuestionnaireWrapper}>
        <div className={styles.container}>
          <h2 className={styles.h2}>Créer votre questionnaire personnalisées</h2>
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
          {customQuestions.map((q, index) => (
            <div key={index}>
              <p>Question {index + 1}</p>
              <input
                type="text"
                value={q.question}
                onChange={(event) =>
                  addQuestion(event.target.value, q.type, q.optional, index, true)
                }
                maxLength={80}
              />
              <div>
                <label>
                  <input
                    type="radio"
                    name={`type-${index}`}
                    checked={q.type === "text"}
                    onChange={() =>
                      addQuestion(q.question, "text", q.optional, index, true)
                    }
                  />
                  Texte
                </label>
                <label>
                  <input
                    type="radio"
                    name={`type-${index}`}
                    checked={q.type === "yes_no"}
                    onChange={() =>
                      addQuestion(q.question, "yes_no", q.optional, index, true)
                    }
                  />
                  Oui/Non
                </label>
                <label>
                  <input
                    type="radio"
                    name={`type-${index}`}
                    checked={q.type === "1_to_10"}
                    onChange={() =>
                      addQuestion(q.question, "1_to_10", q.optional, index, true)
                    }
                  />
                  1 à 10
                </label>
                <label>
                  <input
                    type="radio"
                    name={`type-${index}`}
                    checked={q.type === "emoji"}
                    onChange={() =>
                      addQuestion(q.question, "emoji", q.optional, index, true)
                    }
                  />
                  Emoji
                </label>
              </div>
              <label>
                optional
                <input
                  type="checkbox"
                  checked={q.optional}
                  onChange={(e) =>
                    addQuestion(q.question, q.type, e.target.checked, index, true)
                  }
                />
              </label>
              <button
                onClick={() =>
                  addQuestion(q.question, q.type, q.optional, index, true)
                }
              >
              valider
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              setCustomQuestions([
                ...customQuestions,
                createQuestion("", "text", false)
              ])
            }
          >
          ajouter une question
          </button>      
          <button
            className={styles.button}
            disabled={loading}
            onClick={() => {
              const validateQuestion = customQuestions.filter(q => q.validated).length;
              if (validateQuestion < 5) {
                alert("Vous devez valider au moins 5 questions");
                return;
              }
              handleStartQuestionnaire();
            }}
          >
          {loading ? "Loading" : "Lancer le questionnaire"}
          </button>
        </div>
      </div>
    );
  }

  if (mode === "basique" && questionnaireId == null) {
    return (
      <div className={styles.startQuestionnaireWrapper}>
        <div className={styles.container}>
          <h2 className={styles.h2}>Créer votre questionnaire personnalisées</h2>
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
          <button
            className={styles.button}
            disabled={loading}
            onClick={() => {
              handleStartQuestionnaire();
            }}
          >
          {loading ? "Loading" : "Lancer le questionnaire"}
          </button>
        </div>
      </div>
    );
  }

  if (questionnaireId == null) {
    return (
      <div className={styles.startQuestionnaireWrapper}>
        <div className={styles.container}>
          <h1 className={styles.h1}>Créer un questionnaire</h1>
          <button
            className={styles.button}
            onClick={() => setMode("custom")}
          >
          Créer mon propre questionnaire
          </button>
          <button
            className={styles.button}
            onClick={() => setMode("basique")}
          >
          Utilisé le questionnaire par défaut
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
            <button className={styles.button} onClick={() => {handleStopQuestionnaire(); setMode(null)}}>Arrêter le questionnaire</button>
          </div>
        </div>
      );
  }
}

export default StartQuestionnaire;
