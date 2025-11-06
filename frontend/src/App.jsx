import React from 'react'
import { Outlet, Link } from 'react-router-dom'

export default function App() {
  return (
    <div>
      <header style={{ padding: 20, borderBottom: '1px solid #ddd' }}>
        <Link to="/">EventHub</Link>
      </header>
      <main style={{ padding: 20 }}>
        <Outlet />
      </main>
    </div>
  )
}
