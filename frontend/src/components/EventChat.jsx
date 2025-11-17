import React, { useState, useEffect, useRef } from 'react'
import '../styles/EventChat.css'

export default function EventChat({ socket, eventId, currentUser }) {
  const [messages, setMessages] = useState([])
  const [messageText, setMessageText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Listen for incoming messages
  useEffect(() => {
    if (!socket) return

    const handleMessageHistory = (history) => {
      setMessages(history)
    }

    const handleMessage = (messageData) => {
      setMessages(prev => [...prev, messageData])
    }

    const handleRegistration = (data) => {
      // System message for registration
      setMessages(prev => [...prev, {
        id: `system-${Date.now()}`,
        text: `User registered for the event (Qty: ${data.ticketQuantity})`,
        username: 'System',
        timestamp: new Date(),
        isSystem: true
      }])
    }

    const handleRegistrationCancelled = (data) => {
      // System message for cancellation
      setMessages(prev => [...prev, {
        id: `system-${Date.now()}`,
        text: 'User cancelled their registration',
        username: 'System',
        timestamp: new Date(),
        isSystem: true
      }])
    }

    socket.on('messageHistory', handleMessageHistory)
    socket.on('message', handleMessage)
    socket.on('registration', handleRegistration)
    socket.on('registrationCancelled', handleRegistrationCancelled)

    return () => {
      socket.off('messageHistory', handleMessageHistory)
      socket.off('message', handleMessage)
      socket.off('registration', handleRegistration)
      socket.off('registrationCancelled', handleRegistrationCancelled)
    }
  }, [socket])

  const handleSendMessage = async (e) => {
    e.preventDefault()

    if (!messageText.trim()) return
    if (!socket) {
      alert('Not connected to chat')
      return
    }

    setIsLoading(true)
    try {
      socket.emit('sendMessage', {
        eventId,
        message: messageText,
        timestamp: new Date()
      })
      setMessageText('')
    } catch (err) {
      console.error('Error sending message:', err)
      alert('Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const today = new Date()
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    }
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    }
    
    return date.toLocaleDateString('en-US')
  }

  return (
    <div className="event-chat">
      <div className="chat-header">
        <h3>Event Chat</h3>
        <span className="message-count">{messages.length} messages</span>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const showDate = idx === 0 || formatDate(msg.timestamp) !== formatDate(messages[idx - 1].timestamp)
            const isCurrentUser = msg.userId === currentUser?.id || msg.username === currentUser?.username

            return (
              <div key={msg.id || idx}>
                {showDate && (
                  <div className="date-separator">
                    <span>{formatDate(msg.timestamp)}</span>
                  </div>
                )}
                <div className={`message ${msg.isSystem ? 'system-message' : ''} ${isCurrentUser ? 'own-message' : ''}`}>
                  {!msg.isSystem && (
                    <div className="message-header">
                      <strong className="message-author">{msg.username || 'Anonymous'}</strong>
                      <small className="message-time">{formatTime(msg.timestamp)}</small>
                    </div>
                  )}
                  <div className={msg.isSystem ? 'system-text' : 'message-text'}>
                    {msg.text}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="message-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          placeholder="Type your message..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          disabled={isLoading || !socket}
          className="message-input"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={isLoading || !messageText.trim() || !socket}
          className="send-button"
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>

      {!socket && (
        <div className="connection-error">
          <p>⚠️ Chat not connected. Reconnecting...</p>
        </div>
      )}
    </div>
  )
}
