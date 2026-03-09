import styles from "./loading.module.css";

function Loading() {
  return (
    <div className={styles.loadingContainer}>
      <p className={styles.text}>Loading</p>
    </div>
  );
}

export default Loading;