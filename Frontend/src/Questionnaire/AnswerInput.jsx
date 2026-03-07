import React from "react";
import styles from "./questionnaire.module.css";

function AnswerInput({ question, answers, setAnswers, currentQuestion, setCurrentQuestion, ratings }) {
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
          onChange={(event) => 
            setAnswers({ ...answers, [question]: Number(event.target.value) })
          }
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
  if (question === 'Commentaires libres (facultatif)') {
    return (
      <div className={styles.finalInput}>
        <textarea
          className={styles.textarea}
          value={answers[question] || ""}
          maxLength={150}
          onChange={(event) =>
            setAnswers({ ...answers, [question]: event.target.value })
          }
        />
        <button
          className={styles.button}
          onClick={() => setCurrentQuestion(currentQuestion + 1)}
        >
          Suivant
        </button>
      </div>
    );
  }
  return (
    <>
      {ratings.map((emoji) => (
        <button
          className={styles.emoji_button}
          key={emoji}
          onClick={() => {
            setAnswers({ ...answers, [question]: emoji });
            setCurrentQuestion(currentQuestion + 1);
          }}
        >
          {emoji}
        </button>
      ))}
    </>
  );
}

export default AnswerInput;