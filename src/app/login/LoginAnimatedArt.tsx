import React from "react";
import styles from "../consent-forms/soon.module.css";

export default function LoginAnimatedArt() {
  return (
    <div className={styles.loadingSoonWrapper} style={{ marginBottom: 24 }}>
      <div className={styles.loadingTooth}>
        <div className={styles.toothBody}></div>
        <div className={styles.toothSmile}></div>
        <div className={styles.toothEyes}></div>
      </div>
      <div className={styles.loadingText} style={{ fontSize: 20, marginTop: 12 }}>
        Hoş geldiniz!
      </div>
      <div style={{ color: '#1976d2', fontWeight: 500, fontSize: 15, marginTop: 4, opacity: 0.85 }}>
        Lütfen giriş yapın
      </div>
    </div>
  );
}
