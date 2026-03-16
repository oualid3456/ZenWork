import React from "react";
import styles from "./questionnaire.module.css";

function AnswerInput({ question, answers, setAnswers, currentQuestion, setCurrentQuestion, ratings }) {
  if (question.type === "text") {
    return (
      <div className={styles.finalInput}>
        <textarea
          className={styles.textarea}
          value={answers[question.question] || ""}
          maxLength={150}
          onChange={(event) =>
            setAnswers({
              ...answers,
              [question.question]: event.target.value
            })
          }
        />
        <button
          className={styles.button}
          onClick={() => {
            if (!question.optional) {
              if (!answers[question.question] || answers[question.question].trim() === "") {
                return;
              }
            }
            setCurrentQuestion(currentQuestion + 1);
          }}
        >
        Suivant
        </button>
        {question.optional && (
          <button
            className={styles.skip}
            onClick={() => {
              setAnswers({ ...answers, [question.question]: null });
              setCurrentQuestion(currentQuestion + 1);
            }}
          >
            Passer
          </button>
        )}
      </div>
    );
  }

  if (question.type === "yes_no") {
    return (
      <>
        <button
          className={styles.emoji_button}
          onClick={() => {
            setAnswers({ ...answers, [question.question]: "oui" });
            setCurrentQuestion(currentQuestion + 1);
          }}
        >
        Oui
        </button>

        <button
          className={styles.emoji_button}
          onClick={() => {
            setAnswers({ ...answers, [question.question]: "non" });
            setCurrentQuestion(currentQuestion + 1);
          }}
        >
        Non
        </button>

        {question.optional && (
          <button
            className={styles.skip}
            onClick={() => {
              setAnswers({ ...answers, [question.question]: null });
              setCurrentQuestion(currentQuestion + 1);
            }}
          >
            Passer
          </button>
        )}
      </>
    );
  }

  if (question.type === "1_to_10") {
    return (
      <div className={styles.finalInput}>
        <input
          className={styles.input}
          type="number"
          min={1}
          max={10}
          step={1}
          value={answers[question.question] || ""}
          onChange={(event) =>
            setAnswers({
              ...answers,
              [question.question]: Number(event.target.value)
            })
          }
        />
        <button
          className={styles.button}
          onClick={() => {
            const value = answers[question.question];
            if (Number.isInteger(value) && value >= 1 && value <= 10) {
              setCurrentQuestion(currentQuestion + 1);
            }
          }}
        >
        Suivant
        </button>
        {question.optional && (
          <button
            className={styles.skip}
            onClick={() => {
              setAnswers({ ...answers, [question.question]: null });
              setCurrentQuestion(currentQuestion + 1);
            }}
          >
            Passer
          </button>
        )}
      </div>
    );
  }

  if (question.type === "emoji") {
    return (
      <>
        {ratings.map((emoji) => (
          <button
            className={styles.emoji_button}
            key={emoji}
            onClick={() => {
              setAnswers({
                ...answers,
                [question.question]: emoji
              });
              setCurrentQuestion(currentQuestion + 1);
            }}
          >
          {emoji}
          </button>
        ))}
        {question.optional && (
          <button
            className={styles.skip}
            onClick={() => {
              setAnswers({ ...answers, [question.question]: null });
              setCurrentQuestion(currentQuestion + 1);
            }}
          >
            Passer
          </button>
        )}
      </>
    );
  }
}

export default AnswerInput;