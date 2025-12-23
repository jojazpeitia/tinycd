import Scene from './components/Scene'

export default function Home() {
  return (
    <main style={{ width: '100vw', height: '100vh' }}>
        <div className="hint">
          <span>Click and drag to see from different angles</span>
        <span className="hint-close">×</span>
      </div>
      <Scene />
    </main>
  )
}