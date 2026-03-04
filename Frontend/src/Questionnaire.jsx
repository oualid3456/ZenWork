import { useState, useEffect } from "react";
import styles from "./questionnaire.module.css";
import { supabase } from "./supabaseClient";
import { useParams, useNavigate  } from "react-router-dom";
import Error from "./Error.jsx";

function Questionnaire({ user }) {
  // on a besoin de cela pour savoir si le questionnaire a
  // commence ou non et agir en consequence
  const { userId, questionnaireId } = useParams();
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [finish, setFinish] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
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
  // on utilise des emojis comme reponse, cela parait
  // plus intuitif.
  const ratings = ["😟", "🙁", "😐", "🙂", "😃"];
  // un dictionnaire auquel on va associer a chaque question
  // l'emoji auquel l'employe a repondu
  const empty_answers = {};
  const [answers, setAnswers] = useState(empty_answers);
  const progression = Math.floor((currentQuestion / questions.length) * 100);
  const [questionnaireClosed, setQuestionnaireClosed] = useState(false);
  const [loadingQuestionnaire, setLoadingQuestionnaire] = useState(true);
  
  useEffect(() => {
    async function fetchUser() {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Erreur getUser:", error.message);
        return;
      }
      if (data?.user) {
        setCurrentUser(data.user);
      }
    }
    fetchUser();
  }, []);

  useEffect(() => {
    let interval;

    const checkQuestionnaire = async () => {
      const { data: questionnaire, error } = await supabase
        .from("questionnaire")
        .select("active")
        .eq("id", questionnaireId)
        .single();

      if (error || !questionnaire || !questionnaire.active) {
        setQuestionnaireClosed(true);
        clearInterval(interval);
      }
      setLoadingQuestionnaire(false);
    };

    checkQuestionnaire();
    interval = setInterval(checkQuestionnaire, 5000);

    return () => clearInterval(interval);
  }, [questionnaireId]);

  useEffect(() => {
    if (!currentUser) return;
    async function checkFinish() {
      const { data, error } = await supabase
        .from("reponse_questionnaire")
        .select("id")
        .eq("questionnaire_id", questionnaireId)
        .eq("utilisateur_id", currentUser?.id)
        .maybeSingle();
      if (data) {
        setFinish(true);
      }
    }
    checkFinish();
  }, [questionnaireId, currentUser]);

  async function sendAnswers() {
    if (finish) {
      return;
    }
    const { error } = await supabase
      .from("reponse_questionnaire")
      .insert([
        {
          utilisateur_id: currentUser.id,
          questionnaire_id: questionnaireId,
          reponse_json: JSON.stringify(answers),
        },
      ]);
    if (error) {
      console.error("Echec de l'envoie des réponses :", error.message);
    } else {
      setFinish(true);
    }
  }

  useEffect(() => {
    if (currentQuestion === questions.length && !finish) {
      sendAnswers();
    }
  }, [currentQuestion, finish]);

  if (!currentUser) {
    return <p>Loading</p>;
  }

  if (loadingQuestionnaire) {
    return <p>Loading</p>;
  }

  if (questionnaireClosed) {
    return <Error />;
  }

  function AnswerInput(question) {
    if (question === 'Veuillez-indiquer votre niveau de stress de 1 a 10') {
      return (
        <div className={styles.finalInput}>
          <input
            className={styles.input}
            type="number"
            min={1}
            max={10}
            step={1}
            value={answers[question] || ""}
            onChange={(event) => setAnswers({ ...answers, [question]: Number(event.target.value) })}
            pattern="[1-9]|10"
          />
          <button
            className={styles.button}
            onClick={() => {
              const value = answers[question];
              if (Number.isInteger(value) && value >= 1 && value <= 10) {
                setCurrentQuestion(currentQuestion + 1);
              }
            }}
          >
            Suivant
          </button>
        </div>
      );
    }
    else if (question === 'Commentaires libres (facultatif)') {
      return (
        <div className={styles.finalInput}>
          <textarea className={styles.textarea}
            value = {answers[question] || ""}
            maxLength={150}
            onChange={(event) => setAnswers({ ...answers, [question]: event.target.value })}
          />
          <button className={styles.button}
            onClick={() => setCurrentQuestion(currentQuestion + 1)}
          >
            Suivant
          </button>
        </div>
      );
    }
    else {
      return ratings.map((emoji) => (
        <button className={styles.emoji_button}
          key={emoji}
          onClick={() => {
            setAnswers({ ...answers, [question]: emoji });
            setCurrentQuestion(currentQuestion + 1);
          }}
        >
          {emoji}
        </button>
      ));
    }
  }

  if (!started) {
    return (
      <div className={styles.questionnaireWrapper}>
        <div className={styles.welcome}>
          <h1 className={styles.h1}>Voulez vous procédé au <br />questionnaire ?</h1>
          <button className={styles.button} onClick={() => setStarted(true)}>Commencer l'évaluation</button>
          <p className={styles.p}><br /><br />Il s'agit d'un questionnaire anonyme de 22 questions ayant pour but<br />
          d'évalué votre santé mentale afin de pouvoir vous aidé si besoin.<br />
          Il vous sera demandé de répondre avec honeteté afin de ne pas fausser<br />
          le questionnaire qui pourrait vous aider.</p>
          <p className={styles.p}>Il s'agit d'un questionnaire complet et détaillé basé sur de nombreux<br />questionnaires fiables.</p>
        </div>
      </div>
    );
  }
  if (currentQuestion < questions.length) {
    return (
      <div className={styles.questionnaireWrapper}>
        <div className={styles.container}>
          <div className={styles.middle}>
            <div className={styles.title}>
              <h2 className={styles.h2}>{questions[currentQuestion]}</h2>
            </div>
            <div className={styles.answer}>
              <div className={styles.progression_container}>
                <div className={styles.bar} style={{ width: `${progression}%` }}>
                </div>
              </div>
              <div className={styles.div}>
                {AnswerInput(questions[currentQuestion])}
              </div>
              <button className={styles.retour} onClick={() => {
                  if (currentQuestion > 0) {
                    setCurrentQuestion(currentQuestion - 1);
                    const lastAnswer = answers[questions[currentQuestion - 1]];
                  }
                }}>
                Retour
              </button>
            </div>
          </div>
          {finish && (
          <p className={styles.cantAnswers}>
            Vous avez déjà envoyé vos réponses. Les modifications ne seront pas enregistrées.
          </p>
        )}
        </div>
      </div>
    );
  } else {
    return (
      <div className={styles.questionnaireWrapper}>
        <div className={styles.finish}>
          <h1 className={styles.h1}>C'est terminé !</h1>
          <button className={styles.goHome}
            onClick={() => navigate(`/home/${userId}`)}
          >
            Retour à l'accueil
          </button>
          <p className={styles.p}>Merci d'avoir prit le temps de répondre au questionnaire.</p>
          {/* code pour verifier que tout marche
          <h3>Réponses:</h3>
          <ol>
            {Object.entries(answers).map(([question, emoji]) => (
              <li key={question}>{question} : {emoji}</li>
            ))}
          </ol>
          */}
        </div>
      </div>
    );
  }
}

export default Questionnaire;
