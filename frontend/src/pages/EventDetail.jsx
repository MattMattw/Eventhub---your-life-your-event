import React, { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'
import { io } from 'socket.io-client'
import EventChat from '../components/EventChat'
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

export default function EventDetail(){
  const { id } = useParams()
  const { user } = useContext(AuthContext)
  const [event, setEvent] = useState(null)
  const [messages, setMessages] = useState([])
  const socketRef = useRef(null)
  const [registrations, setRegistrations] = useState([])
  const [isRegistered, setIsRegistered] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    api.get(`/events/${id}`)
      .then(res => setEvent(res.data))
      .catch(err => console.error(err))

    // Get registrations to check if user is registered
    if (user) {
      api.get(`/registrations/user`)
        .then(res => {
          const userRegistration = res.data.find(r => r.event._id === id || r.event === id)
          setIsRegistered(!!userRegistration)
          setRegistrations(res.data)
        })
        .catch(err => console.error(err))
    }
  }, [id, user])

  useEffect(() => {
    // connect to socket with auth token
    const token = localStorage.getItem('token')
    socketRef.current = io('http://localhost:3000', {
      auth: { token: token || '' }
    })

    socketRef.current.on('connect', () => {
      console.log('connected to socket')
      socketRef.current.emit('joinEventChat', { eventId: id })
    })

    socketRef.current.on('message', m => {
      setMessages(prev => [...prev, m])
    })

    socketRef.current.on('registration', data => {
      console.log('registration event', data)
    })

    socketRef.current.on('disconnect', () => {
      console.log('disconnected from socket')
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leaveEventChat', { eventId: id })
        socketRef.current.disconnect()
      }
    }
  }, [id])

  const sendMessage = () => {
    const text = prompt('Enter message')
    if (!text) return
    socketRef.current.emit('sendMessage', { eventId: id, message: text })
  }

  const handleRegister = async () => {
    try {
      setIsLoading(true)
      await api.post('/registrations', {
        eventId: id,
        ticketQuantity: 1
      })
      setIsRegistered(true)
      alert('Registered successfully!')
    } catch (err) {
      alert(err.response?.data?.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelRegistration = async () => {
    try {
      setIsLoading(true)
      const registration = registrations.find(r => r.event._id === id || r.event === id)
      if (registration) {
        await api.delete(`/registrations/${registration._id}`)
        setIsRegistered(false)
        alert('Registration cancelled')
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Cancellation failed')
    } finally {
      setIsLoading(false)
    }
  }

  if (!event) return <div>Loading...</div>

  return (
    <div style={{ padding: '20px' }}>
      <h2>{event.title}</h2>
      <div>
        <p><strong>Date:</strong> {new Date(event.date).toLocaleString()}</p>
        <p><strong>Location:</strong> {event.location}</p>
        <p><strong>Capacity:</strong> {event.capacity} | <strong>Available:</strong> {event.availableSpots}</p>
        <p><strong>Price:</strong> ${event.price}</p>
        <p><strong>Category:</strong> {event.category}</p>
        {event.tags && event.tags.length > 0 && (
          <p><strong>Tags:</strong> {event.tags.join(', ')}</p>
        )}
      </div>
      <div style={{ marginBottom: '20px' }}>
        <h3>Description</h3>
        <p>{event.description}</p>
      </div>

      {user ? (
        <div style={{ marginBottom: '20px' }}>
          {isRegistered ? (
            <button
              onClick={handleCancelRegistration}
              disabled={isLoading}
              style={{
                padding: '10px 20px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? 'Cancelling...' : 'Cancel Registration'}
            </button>
          ) : (
            <button
              onClick={handleRegister}
              disabled={isLoading || event.availableSpots <= 0}
              style={{
                padding: '10px 20px',
                backgroundColor: event.availableSpots > 0 ? '#28a745' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isLoading || event.availableSpots <= 0 ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? 'Registering...' : event.availableSpots > 0 ? 'Register' : 'Event Full'}
            </button>
          )}
        </div>
      ) : (
        <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
          <p>Please log in to register for this event</p>
        </div>
      )}

      <div style={{ marginTop: '30px' }}>
        <EventChat
          socket={socketRef.current}
          eventId={id}
          currentUser={user}
        />
      </div>
    </div>
  )
}
