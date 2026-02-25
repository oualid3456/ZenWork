import { useState } from "react";
import styles from "./questionnaire.module.css";

function Questionnaire() {
  // on a besoin de cela pour savoir si le questionnaire a
  // commence ou non et agir en consequence
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
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
    "À quel point ête vous serein(e) par rapport à l'avenir de votre emploi ?"
  ];
  // on utilise des emojis comme reponse, cela parait
  // plus intuitif.
  const ratings = ["😟", "🙁", "😐", "🙂", "😃"];
  // un dictionnaire auquel on va associer a chaque question
  // l'emoji auquel l'employe a repondu
  const empty_answers = {};
  const [answers, setAnswers] = useState(empty_answers);
  const progression = Math.floor((currentQuestion / questions.length) * 100);
  if (!started) {
    return (
      <div className={styles.questionnaireWrapper}>
        <div className={styles.welcome}>
          <h1 className={styles.h1}>Voulez vous procédé au <br />questionnaire ?</h1>
          <button className={styles.button} onClick={() => setStarted(true)}>Commencer l'évaluation</button>
          <p className={styles.p}><br /><br />Il s'agit d'un questionnaire anonyme de 20 questions ayant pour but<br />
          d'évalué votre santé mentale afin de pouvoir vous aidé si besoin.<br />
          Il vous sera demandé de répondre avec honeteté afin de ne pas fausser<br />
          le questionnaire qui pourrait vous aider.</p>
          <p className={styles.p}>Il s'agit d'un questionnaire complet et détaillé basé sur de nombreux questionnaires fiables.</p>
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
                {ratings.map((emoji) => (
                  <button className={styles.emoji_button} key={emoji} onClick={() => {
                    setAnswers({...answers, [questions[currentQuestion]]: emoji});
                    setCurrentQuestion(currentQuestion + 1)}}>
                    {emoji}
                  </button>
                ))}
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
        </div>
      </div>
    );
  }
  return (
    <div className={styles.questionnaireWrapper}>
      <div className={styles.finish}>
        <h1 className={styles.h1}>C'est terminé !</h1>
        <p className={styles.p}>Merci d’avoir prit le temps de répondre au questionnaire.</p>
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

export default Questionnaire;
