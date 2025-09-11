import React from "react";
import styles from "./loginLoading.module.css";

export default function LoginAnimatedArt() {
  return (
    <div className={styles.loginArtWrapper}>
      <div className={styles.bgCircle}></div>
      <div className={styles.toothWrapper}>
        <svg className={styles.toothSvg} width="120" height="120" viewBox="0 0 120 120" fill="none">
          <ellipse cx="60" cy="60" rx="50" ry="50" fill="#e3eaff" />
          <path d="M40 60 Q60 20 80 60 Q90 100 60 100 Q30 100 40 60 Z" fill="#fff" stroke="#1976d2" strokeWidth="3" />
          <ellipse cx="55" cy="75" rx="4" ry="2" fill="#1976d2" opacity="0.18" />
          <ellipse cx="65" cy="75" rx="4" ry="2" fill="#1976d2" opacity="0.18" />
          <path d="M52 85 Q60 90 68 85" stroke="#1976d2" strokeWidth="2" fill="none" />
          <circle cx="52" cy="65" r="2.5" fill="#1976d2" />
          <circle cx="68" cy="65" r="2.5" fill="#1976d2" />
        </svg>
        <div className={styles.sparkle1}></div>
        <div className={styles.sparkle2}></div>
      </div>
      <div className={styles.loginTextMain}>Hoş geldiniz!</div>
      <div className={styles.loginTextSub}>Lütfen giriş yapın</div>
    </div>
  );
}
