type HintProps = {
  text?: string
}

export default function Hint({ text = 'Click and drag to see from different angles' }: HintProps) {
  return (
    <>
      <input type="checkbox" id="hint-toggle" className="hint-toggle" />

      <div className="hint">
        <span>{text}</span>
        <label htmlFor="hint-toggle" className="hint-close">
          x
        </label>
      </div>
    </>
  )
}
