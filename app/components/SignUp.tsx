'use client'
import styles from './SignUp.module.css'
import { createClient } from '../lib/supabase/client'

export default function SignUp() {
  const signInWithGoogle = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.title}>
          <h1>Make your own shelf</h1>
          <h2> — it&apos;s free</h2>
        </div>

        <button className={styles.googleButton} onClick={signInWithGoogle}>
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
