import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

export default function EventList() {
  const [events, setEvents] = useState([])

  useEffect(() => {
    api.get('/events')
      .then(res => setEvents(res.data))
      .catch(err => console.error(err))
  }, [])

  return (
    <div>
      <h2>Public Events</h2>
      {events.length === 0 && <p>No public events found.</p>}
      <ul>
        {events.map(e => (
          <li key={e._id} style={{ marginBottom: 12 }}>
            <Link to={`/events/${e._id}`}><strong>{e.title}</strong></Link>
            <div>{new Date(e.date).toLocaleString()} - {e.location}</div>
            <div>{e.description}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
