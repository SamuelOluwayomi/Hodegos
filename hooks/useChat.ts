"use client";

import React, { useState, useCallback, useRef, useEffect, createContext, useContext } from 'react'
import { supabase } from '@/lib/supabase'
import { getTierByXP } from '@/lib/tiers'

export interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp?: number
}

export interface UserProfile {
  walletAddress: string
  userName: string
  aiTone: 'friendly' | 'disciplined' | 'straight' | 'socratic'
  tradingLevel: 'beginner' | 'intermediate' | 'master' | 'unknown'
  xp: number
  badges: string[]
  onboardingComplete: boolean
  onboardingStep: string
  quizScores: number[]
  demoCompleted: boolean
  avatarUrl?: string
}

const DEFAULT_PROFILE: UserProfile = {
  walletAddress: '',
  userName: '',
  aiTone: 'friendly',
  tradingLevel: 'unknown',
  xp: 0,
  badges: [],
  onboardingComplete: false,
  onboardingStep: 'welcome',
  quizScores: [],
  demoCompleted: false,
  avatarUrl: '',
}

// Persist profile to localStorage (will be replaced by DB calls later)
function saveProfile(profile: UserProfile) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`hodegos_profile_${profile.walletAddress}`, JSON.stringify(profile))
  }
}

function loadProfile(walletAddress: string): UserProfile | null {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(`hodegos_profile_${walletAddress}`)
    if (data) {
      try {
        return JSON.parse(data) as UserProfile
      } catch {
        return null
      }
    }
  }
  return null
}

const MAX_CHAT_HISTORY_MESSAGES = 8

function saveMessages(walletAddress: string, messages: Message[]) {
  if (typeof window !== 'undefined' && walletAddress) {
    const clean = messages.filter(m => !(m.role === 'assistant' && m.content === ''))
    localStorage.setItem(`hodegos_chat_messages_${walletAddress}`, JSON.stringify(clean))
  }
}

function loadMessages(walletAddress: string): Message[] {
  if (typeof window !== 'undefined' && walletAddress) {
    const data = localStorage.getItem(`hodegos_chat_messages_${walletAddress}`)
    if (data) {
      try {
        return JSON.parse(data) as Message[]
      } catch {
        return []
      }
    }
  }
  return []
}

function useChatRaw(walletAddress?: string) {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (walletAddress) {
      return loadMessages(walletAddress)
    }
    return []
  })
  const [isLoading, setIsLoading] = useState(false)
  const [profile, setProfile] = useState<UserProfile>(() => {
    if (walletAddress) {
      return loadProfile(walletAddress) || { ...DEFAULT_PROFILE, walletAddress }
    }
    return DEFAULT_PROFILE
  })
  const [isProfileLoading, setIsProfileLoading] = useState(true)
  const abortRef = useRef<AbortController | null>(null)
  const prevWalletRef = useRef<string | undefined>(walletAddress)

  // Isolation guard & state loader: when wallet address changes, load profile & history
  useEffect(() => {
    if (!walletAddress) {
      setIsProfileLoading(false)
      return
    }

    let active = true
    setIsProfileLoading(true)

    const loadData = async () => {
      // Abort any in-flight request from the previous user
      if (abortRef.current) {
        abortRef.current.abort()
        abortRef.current = null
      }

      // 1. Initial local load
      const localProfile = loadProfile(walletAddress) || { ...DEFAULT_PROFILE, walletAddress }
      const localMessages = loadMessages(walletAddress)
      if (active) {
        setProfile(localProfile)
        setMessages(localMessages)
      }

      // 2. Fetch from Supabase if configured
      if (supabase) {
        try {
          // Fetch user profile
          const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('wallet_address', walletAddress)
            .maybeSingle()

          if (userError) {
            console.error('Error fetching user from Supabase:', userError)
          }

          let dbProfile: UserProfile | null = null

          if (user) {
            // Fetch badges
            const { data: badgesData } = await supabase
              .from('user_badges')
              .select('badge_name')
              .eq('user_id', user.id)

            // Fetch quiz scores
            const { data: quizzesData } = await supabase
              .from('quiz_scores')
              .select('correct_answers')
              .eq('user_id', user.id)

            dbProfile = {
              walletAddress: user.wallet_address,
              userName: user.user_name || '',
              aiTone: user.ai_tone || 'friendly',
              tradingLevel: user.trading_level || 'unknown',
              xp: user.xp || 0,
              badges: badgesData?.map(b => b.badge_name) || [],
              onboardingComplete: user.onboarding_complete || false,
              onboardingStep: user.onboarding_step || 'welcome',
              quizScores: quizzesData?.map(q => q.correct_answers) || [],
              demoCompleted: user.demo_completed || false,
              avatarUrl: user.avatar_url || '',
            }
          }

          if (dbProfile && active) {
            setProfile(dbProfile)
            saveProfile(dbProfile) // keep local storage in sync
          }

          // Fetch chat history
          if (user && active) {
            const { data: messagesData } = await supabase
              .from('chat_messages')
              .select('role, content, created_at')
              .eq('user_id', user.id)
              .order('created_at', { ascending: true })

            if (messagesData && active) {
              const filteredData = messagesData.filter(m => !m.content.startsWith('[SYSTEM]'));
              const dbMessages = filteredData.map(m => ({
                role: m.role as 'user' | 'assistant',
                content: m.content,
                timestamp: new Date(m.created_at).getTime()
              }));
              setMessages(dbMessages)
              saveMessages(walletAddress, dbMessages)
            }
          }
        } catch (err) {
          console.error('Supabase fetch error:', err)
        }
      }

      if (active) {
        setIsProfileLoading(false)
      }
    }

    loadData()

    return () => {
      active = false
    }
  }, [walletAddress])

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile(prev => {
      const updated = { ...prev, ...updates }
      saveProfile(updated)

      if (supabase && prev.walletAddress) {
        (async () => {
          try {
            const dbPayload = {
              wallet_address: prev.walletAddress,
              user_name: updated.userName,
              ai_tone: updated.aiTone,
              trading_level: updated.tradingLevel,
              xp: updated.xp,
              onboarding_complete: updated.onboardingComplete,
              onboarding_step: updated.onboardingStep,
              demo_completed: updated.demoCompleted,
              avatar_url: updated.avatarUrl,
              updated_at: new Date().toISOString()
            }

            await supabase.from('users').upsert(dbPayload, { onConflict: 'wallet_address' })
          } catch (err) {
            console.error('Supabase update error:', err)
          }
        })()
      }

      return updated
    })
  }, [])

  const addXP = useCallback((amount: number) => {
    setProfile(prev => {
      const updated = { ...prev, xp: prev.xp + amount }
      saveProfile(updated)

      if (supabase && prev.walletAddress) {
        supabase.from('users').update({ xp: updated.xp }).eq('wallet_address', prev.walletAddress).then()
      }

      return updated
    })
  }, [])

  const awardBadge = useCallback((badge: string) => {
    setProfile(prev => {
      if (prev.badges.includes(badge)) return prev
      const updated = { ...prev, badges: [...prev.badges, badge] }
      saveProfile(updated)

      if (supabase && prev.walletAddress) {
        (async () => {
          try {
            const { data: user } = await supabase.from('users').select('id').eq('wallet_address', prev.walletAddress).maybeSingle()
            if (user) {
              await supabase.from('user_badges').upsert({
                user_id: user.id,
                badge_name: badge
              }, { onConflict: 'user_id,badge_name', ignoreDuplicates: true })
            }
          } catch (err) {
            console.error('Supabase badge save error:', err)
          }
        })()
      }

      return updated
    })
  }, [])

  const sendMessage = useCallback(async (
    userMessage: string,
    marketContext?: object,
    pageContext?: string,
    portfolioContext?: object,
  ) => {
    // Cancel any ongoing request
    if (abortRef.current) {
      abortRef.current.abort()
    }
    abortRef.current = new AbortController()

    const cleanBaseMessages = messages.filter(m => !(m.role === 'assistant' && m.content === ''))

    const newMessages: Message[] = [
      ...cleanBaseMessages,
      { role: 'user' as const, content: userMessage, timestamp: Date.now() }
    ]
    setMessages(newMessages)
    saveMessages(profile.walletAddress, newMessages)
    setIsLoading(true)

    // Push empty assistant placeholder IMMEDIATELY so the typing loader is visible
    // while we wait for the server response
    const assistantTimestamp = Date.now()
    setMessages(prev => {
      const updated = [...prev, { role: 'assistant' as const, content: '', timestamp: assistantTimestamp }]
      saveMessages(profile.walletAddress, updated)
      return updated
    })

    // Fire-and-forget: save user message to Supabase — never blocks the API call
    if (supabase && profile.walletAddress && !userMessage.startsWith('[SYSTEM]')) {
      void (async () => {
        try {
          const { data: user, error: upsertUserError } = await supabase.from('users')
            .upsert({
              wallet_address: profile.walletAddress,
              user_name: profile.userName,
              ai_tone: profile.aiTone,
              trading_level: profile.tradingLevel,
              xp: profile.xp,
              onboarding_complete: profile.onboardingComplete,
              onboarding_step: profile.onboardingStep,
              demo_completed: profile.demoCompleted
            }, { onConflict: 'wallet_address' })
            .select('id')
            .maybeSingle()

          if (upsertUserError) {
            console.error('Supabase user upsert error:', upsertUserError)
          }

          if (user) {
            await supabase.from('chat_messages').insert({
              user_id: user.id,
              role: 'user',
              content: userMessage,
              context: profile.onboardingStep || 'onboarding'
            })
          }
        } catch (err) {
          console.error('Error saving user message to Supabase:', err)
        }
      })()
    }

    try {
      const apiMessages = newMessages
        .slice(-MAX_CHAT_HISTORY_MESSAGES)
        .map(m => ({ role: m.role, content: m.content }))

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          marketContext,
          pageContext,
          portfolioContext,
          userLevel: getTierByXP(profile.xp).level,
          aiTone: profile.aiTone,
          userName: profile.userName,
          onboardingStep: profile.onboardingStep,
        }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ''

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        assistantMessage += decoder.decode(value)

        setMessages(prev => {
          const updated = [
            ...prev.slice(0, -1),
            { role: 'assistant' as const, content: assistantMessage, timestamp: assistantTimestamp }
          ]
          saveMessages(profile.walletAddress, updated)
          return updated
        })
      }

      // Save assistant message to Supabase
      if (supabase && profile.walletAddress) {
        (async () => {
          try {
            const { data: user } = await supabase.from('users').select('id').eq('wallet_address', profile.walletAddress).maybeSingle()
            if (user) {
              await supabase.from('chat_messages').insert({
                user_id: user.id,
                role: 'assistant',
                content: assistantMessage,
                context: profile.onboardingStep || 'onboarding'
              })
            }
          } catch (err) {
            console.error('Error saving assistant message to Supabase:', err)
          }
        })()
      }

      // Auto-detect XP awards from AI response
      const xpMatch = assistantMessage.match(/\+(\d+)\s*XP/i)
      if (xpMatch) {
        addXP(parseInt(xpMatch[1], 10))
      }

      // Auto-detect badge awards
      const badgePatterns = [
        { pattern: /First Steps/i, badge: 'First Steps' },
        { pattern: /Quick Learner/i, badge: 'Quick Learner' },
        { pattern: /Paper Trader/i, badge: 'Paper Trader' },
        { pattern: /Chain Ready/i, badge: 'Chain Ready' },
      ]
      for (const { pattern, badge } of badgePatterns) {
        if (pattern.test(assistantMessage)) {
          awardBadge(badge)
        }
      }

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      console.error('Chat error:', err)
      setMessages(prev => {
        // Replace the empty assistant placeholder we pushed at the start,
        // rather than appending a second bubble after it
        const withoutPlaceholder = prev[prev.length - 1]?.content === ''
          ? prev.slice(0, -1)
          : prev
        const updated = [
          ...withoutPlaceholder,
          { role: 'assistant' as const, content: 'Something went wrong. Please try again.', timestamp: Date.now() }
        ]
        saveMessages(profile.walletAddress, updated)
        return updated
      })
    } finally {
      setIsLoading(false)
      abortRef.current = null
    }
  }, [messages, profile, addXP, awardBadge])

  const retryLastMessage = useCallback(async () => {
    const userMsgs = messages.filter(m => m.role === 'user')
    if (userMsgs.length === 0) return
    const lastUserMessage = userMsgs[userMsgs.length - 1].content

    // Remove the error message and the user's last message from state so they don't duplicate
    setMessages(prev => {
      const clean = [...prev]
      if (clean.length > 0 && clean[clean.length - 1].role === 'assistant' && clean[clean.length - 1].content.includes('Something went wrong')) {
        clean.pop()
      }
      if (clean.length > 0 && clean[clean.length - 1].role === 'user') {
        clean.pop()
      }
      saveMessages(profile.walletAddress, clean)
      return clean
    })

    await sendMessage(lastUserMessage)
  }, [messages, sendMessage, profile.walletAddress])

  const resetProfile = useCallback(() => {
    const fresh = { ...DEFAULT_PROFILE, walletAddress: profile.walletAddress }
    setProfile(fresh)
    saveProfile(fresh)
    setMessages([])
    if (typeof window !== 'undefined' && profile.walletAddress) {
      localStorage.removeItem(`hodegos_chat_messages_${profile.walletAddress}`)
    }

    if (supabase && profile.walletAddress) {
      (async () => {
        try {
          const { data: user } = await supabase.from('users').select('id').eq('wallet_address', profile.walletAddress).maybeSingle()
          if (user) {
            await supabase.from('chat_messages').delete().eq('user_id', user.id)
            await supabase.from('user_badges').delete().eq('user_id', user.id)
            await supabase.from('users').update({
              user_name: '',
              ai_tone: 'friendly',
              trading_level: 'unknown',
              xp: 0,
              onboarding_complete: false,
              onboarding_step: 'welcome',
              demo_completed: false,
            }).eq('id', user.id)
          }
        } catch (err) {
          console.error('Supabase reset error:', err)
        }
      })()
    }
  }, [profile.walletAddress])

  const clearMessages = useCallback(() => {
    setMessages([])
    if (typeof window !== 'undefined' && walletAddress) {
      localStorage.removeItem(`hodegos_chat_messages_${walletAddress}`)
    }
  }, [walletAddress])

  return {
    messages,
    isLoading,
    isProfileLoading,
    sendMessage,
    retryLastMessage,
    clearMessages,
    profile,
    updateProfile,
    addXP,
    awardBadge,
    resetProfile,
  }
}

const ChatContext = createContext<ReturnType<typeof useChatRaw> | null>(null)

export function ChatProvider({ children, walletAddress }: { children: React.ReactNode; walletAddress?: string }) {
  const value = useChatRaw(walletAddress)
  return React.createElement(ChatContext.Provider, { value }, children)
}

export function useChat(walletAddress?: string) {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context
}

