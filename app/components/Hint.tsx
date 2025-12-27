import styles from './Hint.module.css'

type HintProps = { text?: string }

export default function Hint({ text = 'Click and drag to see from different angles' }: HintProps) {
  return (
    <>
      <input type="checkbox" id="hint-toggle" className={styles['hint-toggle']}/>
      <div className={styles.hint}>
        <span>{text}</span>
        <label htmlFor="hint-toggle" className={styles['hint-close']}>
          x
        </label>
      </div>
    </>
  )
}
