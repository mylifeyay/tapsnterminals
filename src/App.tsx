import { useEffect } from 'react'
import { AppShell } from './components/layout/AppShell'
import { gameLoop } from './engine/GameLoop'

export default function App() {
  useEffect(() => {
    gameLoop.start()
    return () => gameLoop.stop()
  }, [])
  return <AppShell />
}
