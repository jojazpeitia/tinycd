import Scene from './components/Scene'

export default function Home() {
  return (
    <main style={{ width: '100vw', height: '100vh' }}>
      <input type="checkbox" id="hint-toggle" className="hint-toggle" />
      <div className="hint">
        <span>Click and drag to see from different angles</span>
        <label htmlFor="hint-toggle" className="hint-close"> x </label>
      </div>
      <Scene />
    </main>
  )
}