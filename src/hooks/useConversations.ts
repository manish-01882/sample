import { useState, useEffect } from 'react'
import { useSupabase } from '../contexts/SupabaseContext'
import {
  Conversation,
  Message,
  getConversations,
  createConversation,
  updateConversation,
  deleteConversation,
  getMessages,
  createMessage,
  subscribeToMessages,
} from '../lib/supabaseQueries'

export function useConversations() {
  const { user } = useSupabase()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  // Load conversations
  useEffect(() => {
    if (!user) return

    const loadConversations = async () => {
      try {
        const data = await getConversations(user.id)
        setConversations(data)
      } catch (error) {
        console.error('Error loading conversations:', error)
      } finally {
        setLoading(false)
      }
    }

    loadConversations()
  }, [user])

  // Load messages when conversation changes
  useEffect(() => {
    if (!currentConversation) {
      setMessages([])
      return
    }

    const loadMessages = async () => {
      try {
        const data = await getMessages(currentConversation.id)
        setMessages(data)
      } catch (error) {
        console.error('Error loading messages:', error)
      }
    }

    loadMessages()

    // Subscribe to new messages
    const subscription = subscribeToMessages(currentConversation.id, (message) => {
      setMessages((prev) => [...prev, message])
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [currentConversation])

  const startNewConversation = async (title: string) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const conversation = await createConversation(user.id, title)
      setConversations((prev) => [conversation, ...prev])
      setCurrentConversation(conversation)
      return conversation
    } catch (error) {
      console.error('Error creating conversation:', error)
      throw error
    }
  }

  const sendMessage = async (content: string) => {
    if (!currentConversation) throw new Error('No active conversation')
    if (!user) throw new Error('User not authenticated')

    try {
      // Create user message
      await createMessage(currentConversation.id, 'user', content)

      // Here you would typically call your AI service and get a response
      // For now, we'll just echo the message
      const aiResponse = `Echo: ${content}`
      await createMessage(currentConversation.id, 'assistant', aiResponse)

      // Update conversation timestamp
      await updateConversation(currentConversation.id, {
        updated_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  const removeConversation = async (conversationId: string) => {
    try {
      await deleteConversation(conversationId)
      setConversations((prev) => prev.filter((c) => c.id !== conversationId))
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null)
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
      throw error
    }
  }

  return {
    conversations,
    currentConversation,
    messages,
    loading,
    startNewConversation,
    sendMessage,
    removeConversation,
    setCurrentConversation,
  }
} 