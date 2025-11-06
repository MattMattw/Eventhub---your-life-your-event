import React, { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'
import { io } from 'socket.io-client'

export default function EventDetail(){
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [messages, setMessages] = useState([])
  const socketRef = useRef(null)

  useEffect(() => {
    api.get(`/events/${id}`)
      .then(res => setEvent(res.data))
      .catch(err => console.error(err))
  }, [id])

  useEffect(() => {
    // connect to socket (no auth token for now)
    socketRef.current = io('http://localhost:3000', { auth: { token: '' } })

    socketRef.current.on('connect', () => console.log('connected to socket'))
    socketRef.current.on('message', m => setMessages(prev => [...prev, m]))
    socketRef.current.on('registration', data => console.log('registration event', data))

    return () => {
      socketRef.current.disconnect()
    }
  }, [id])

  const sendMessage = () => {
    const text = prompt('Enter message')
    if (!text) return
    socketRef.current.emit('sendMessage', { eventId: id, message: text })
  }

  if (!event) return <div>Loading...</div>

  return (
    <div>
      <h2>{event.title}</h2>
      <div>{new Date(event.date).toLocaleString()} - {event.location}</div>
      <p>{event.description}</p>
      <button onClick={sendMessage}>Send message (prompt)</button>
      <h3>Chat</h3>
      <div style={{ border: '1px solid #ddd', padding: 12, minHeight: 80 }}>
        {messages.map((m, i) => (
          <div key={i}><strong>{m.userId}</strong>: {m.text} <small>{new Date(m.timestamp).toLocaleTimeString()}</small></div>
        ))}
      </div>
    </div>
  )
}
