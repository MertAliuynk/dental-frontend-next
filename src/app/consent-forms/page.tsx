
import React from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import styles from "./soon.module.css";
import LoadingSoon from "./LoadingSoon";

export default function Page() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f6fa' }}>
      <div style={{ zIndex: 200, position: 'relative' }}>
        <Sidebar />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div style={{ zIndex: 110, position: 'relative' }}>
          <Topbar />
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className={styles.soonContainer}>
            <div className={styles.soonGlow}></div>
            <LoadingSoon />
            <div className={styles.soonTitle}>Yakında Gelecek</div>
            <div className={styles.soonSubtitle}>Onam formları çok yakında burada olacak!</div>
            <div className={styles.soonDesc}>Güncellemeleri takip edin</div>
            <div className={styles.soonWave}></div>
          </div>
        </div>
      </div>
    </div>
  );
}