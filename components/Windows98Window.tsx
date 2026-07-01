'use client';

import styles from './Windows98Window.module.css';

interface Windows98WindowProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  icon?: string;
  bodyClassName?: string;
}

export default function Windows98Window({
  title,
  children,
  className = '',
  icon,
  bodyClassName = '',
}: Windows98WindowProps) {
  return (
    <div className={`${styles.window} ${className}`}>
      <div className={styles.titlebar}>
        <div className={styles.titlebarLeft}>
          {icon && <span className={styles.icon}>{icon}</span>}
          <span className={styles.titlebarText}>{title}</span>
        </div>
        <div className={styles.titlebarDots}>
          <button className={`${styles.dot} ${styles.dotYellow}`} title="Minimizar" />
          <button className={`${styles.dot} ${styles.dotGreen}`} title="Maximizar" />
          <button className={`${styles.dot} ${styles.dotPink}`} title="Cerrar" />
        </div>
      </div>
      <div className={`${styles.body} ${bodyClassName}`}>
        {children}
      </div>
    </div>
  );
}
