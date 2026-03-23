import { useState, useEffect } from "react";
import styles from "./questionnaire.module.css";
import { supabase } from "../supabaseClient.js";
import { useParams, useNavigate  } from "react-router-dom";
import Error from "../Error/Error.jsx";
import AnswerInput  from "./AnswerInput.jsx";
import Loading  from "../Loading/Loading.jsx";

function Questionnaire({ user }) {
  // on a besoin de cela pour savoir si le questionnaire a
  // commence ou non et agir en consequence
  const { userId, questionnaireId } = useParams();
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [finish, setFinish] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [questions, setQuestions] = useState([]);
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
  const [loadingFinish, setLoadingFinish] = useState(true);

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
    if (!currentUser) {
      return;
    }
    async function checkFinish() {
      setLoadingFinish(true);
      const { data } = await supabase
        .from("reponse_questionnaire")
        .select("id")
        .eq("questionnaire_id", questionnaireId)
        .eq("utilisateur_id", currentUser.id)
        .maybeSingle();

      if (data) {
        setFinish(true);
      }  
      setLoadingFinish(false);
    }
    checkFinish();
  }, [currentUser, questionnaireId]);

  useEffect(() => {
    async function fetchQuestionnaire() {
      if (!questionnaireId) return;
      const { data, error } = await supabase
        .from("questionnaire")
        .select("structure_json, default")
        .eq("id", questionnaireId)
        .single();
      if (error) {
        console.error("Erreur dans la recherche du questionnaire", error.message);
        return;
      }
      if (data.structure_json) {
        try {
          const Questions = JSON.parse(data.structure_json);
          setQuestions(Questions);
          setCurrentQuestion(0);
          setAnswers({});
        } catch (e) {
          console.error("Erreur dans le parsing du JSON du questionnaire", e);
        }
      }
    }
    fetchQuestionnaire();
  }, [questionnaireId]);

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
  }, [currentQuestion, finish, questions.length]);

  if (!currentUser || loadingQuestionnaire || loadingFinish) {
    return <Loading />;
  }
  if (questionnaireClosed || !questionnaireId) {
    return <NoQuestionnaire />;
  }

  if (finish) {
    return (
      <div className={styles.questionnaireWrapper}>
        <div className={styles.finish}>
          <h1 className={styles.h1}>C'est terminé !</h1>
          <button className={styles.goHome}
            onClick={() => navigate(`/home/${userId}`)}
          >
            Retour à l'accueil
          </button>
          <p className={styles.p}>Merci d'avoir pris le temps de répondre au questionnaire.</p>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className={styles.questionnaireWrapper}>
        <div className={styles.welcome}>
          <h1 className={styles.h1}>Voulez vous procédé au <br />questionnaire ?</h1>
          <button className={styles.button} onClick={() => setStarted(true)}>Commencer l'évaluation</button>
          <p className={styles.p}><br /><br />Il s'agit d'un questionnaire anonyme de {questions.length} questions ayant pour but<br />
          d'évaluer votre santé mentale afin de pouvoir vous aider si besoin.<br />
          Il vous sera demandé de répondre avec honnêteté afin de ne pas fausser<br />
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
              <h2 className={styles.h2}>
              {questions[currentQuestion].question}
              {questions[currentQuestion].optional ? " (facultatif)" : ""}
              {questions[currentQuestion].type == "1_to_10" ? " (de 1 à 10)" : ""}
              </h2>
            </div>
            <div className={styles.answer}>
              <div className={styles.progression_container}>
                <div className={styles.bar} style={{ width: `${progression}%` }}>
                </div>
              </div>
              <div className={styles.div}>
                <AnswerInput
                  question={questions[currentQuestion]}
                  answers={answers}
                  setAnswers={setAnswers}
                  currentQuestion={currentQuestion}
                  setCurrentQuestion={setCurrentQuestion}
                  ratings={ratings}
                />
              </div>
              <button className={styles.retour} onClick={() => {
                  if (currentQuestion > 0) {
                    setCurrentQuestion(currentQuestion - 1);
                    const lastAnswer = answers[questions[currentQuestion - 1].question];
                  }
                }}>
                Retour
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Questionnaire;
