import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import EventList from './pages/EventList'
import EventDetail from './pages/EventDetail'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<EventList />} />
          <Route path="events/:id" element={<EventDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
