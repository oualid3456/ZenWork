import { useState } from "react";
import styles from "./questionnaire.module.css";

function Questionnaire() {
  // on a besoin de cela pour savoir si le questionnaire a
  // commence ou non et agir en consequence
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [cmp, setCmp] = useState(0);
  // un tableau contenant l'ensemble des questions dans l'ordre
  const questions = [
    "Question 1 ? aeggggggggggggggggggggggggggggggggggggggggggga       agae",
    "Question 2 ?",
    "Question 3 ?",
    "Question 4 ?",
    "Question 5 ?"
  ];
  // on utilise des emojis comme reponse, cela parait
  // plus intuitif. On utilise egalemnt un dictionnaire pour
  // associer a chaque reponse un certain nombre de points
  // qui une fois le questionnaire finit donnerais une mini
  // estimation plus ou moins fiable de la situation mentale
  // de la personne (ce n'est pas cela qui determinera le
  // diagnostique en soi)
  const ratings = {
    "😟": 0,
    "🙁": 1,
    "😐": 2,
    "🙂": 3,
    "😃": 4
  };
  // un dictionnaire auquel on va associer a chaque question
  // l'emoji auquel l'employe a repondu
  const empty_answers = {
    "Question 1 ?": null,
    "Question 2 ?": null,
    "Question 3 ?": null,
    "Question 4 ?": null,
    "Question 5 ?": null
  };
  const [answers, setAnswers] = useState(empty_answers);
  const progression = Math.floor((currentQuestion / questions.length) * 100);
  if (!started) {
    return (
      <div className={styles.div}>
        <h1 className={styles.h1}>Voulez vous procédé au test ?</h1>
        <button className={styles.button} onClick={() => setStarted(true)}>Commencer l'évaluation</button>
        <p className={styles.p}>Il s'agit d'un questionnaire anonyme de X questions ayant pour but<br />
        d'évalué votre santé mentale afin de pouvoir vous aidé si besoin.<br />
        Il vous sera demandé de répondre avec honeteté afin de ne pas fausser<br />
        le questionnaire qui pourrait vous aider.</p>
        <p className={styles.p}>Il s'agit d'un questionnaire complet et détaillé basé sur de nombreux questionnaires fiables.</p>
      </div>
    );
  }
  if (currentQuestion < questions.length) {
    return (
      <div className={styles.questionnaire}>
        <h2 className={styles.h2}>{questions[currentQuestion]}</h2>
        <div className={styles.progression_container}>
          <div className={styles.bar} style={{ width: `${progression}%` }}>
          </div>
        </div>
        <div className={styles.div}>
          {Object.keys(ratings).map((emoji) => (
            <button className={styles.emoji_button} key={emoji} onClick={() => {
              setCmp(cmp + ratings[emoji]);
              setAnswers({...answers, [questions[currentQuestion]]: emoji});
              setCurrentQuestion(currentQuestion + 1)}}>
              {emoji}
            </button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className={styles.div}>
      <h1 className={styles.h1}>C'est terminé !</h1>
      <p>Merci d’avoir prit le temps de répondre au questionnaire.</p>
      {/* code pour verifier que tout marche
      <p>Score total: {cmp}</p>
      <h3>Réponses:</h3>
      <ol>
        {Object.entries(answers).map(([question, emoji]) => (
          <li key={question}>{question} : {emoji}</li>
        ))}
      </ol>
      */}
    </div>
  );
}

export default Questionnaire;
