'use client'
import styles from './SignUp.module.css'

type Props = {
  onContinue?: () => void
}

export default function SignUp({ onContinue }: Props) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.title}>
          <h1>Make your own shelf</h1>
          <h2> — it&apos;s free</h2>
        </div>

        <button className={styles.googleButton} onClick={onContinue}>
          <img
            src="/icons/google.svg"
            alt="Google"
            className={styles.googleIcon}
          />
          <span>Continue with Google</span>
        </button>
      </div>
    </div>
  )
}
