import React from "react";
import styles from "./soon.module.css";

export default function LoadingSoon() {
  return (
    <div className={styles.loadingSoonWrapper}>
      <div className={styles.loadingTooth}>
        <div className={styles.toothBody}></div>
        <div className={styles.toothSmile}></div>
        <div className={styles.toothEyes}></div>
      </div>
  <div className={styles.loadingText}>Beklemede kalın,🦷</div>
    </div>
  );
}
