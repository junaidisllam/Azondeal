'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function RealtimeTracker() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const tabIdRef = useRef<string | null>(null)
  const visitorIdRef = useRef<string | null>(null)
  const lastHeartbeatRef = useRef<number>(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Persistent visitor ID across tabs
    const VISITOR_KEY = 'av_visitor_id'
    
    if (typeof window !== 'undefined') {
      // 1. Get or create Visitor ID (localStorage)
      let vid = localStorage.getItem(VISITOR_KEY)
      if (!vid) {
        vid = `v_${crypto.randomUUID().slice(0, 8)}`
        localStorage.setItem(VISITOR_KEY, vid)
      }
      visitorIdRef.current = vid

      // 2. Create unique Session/Tab ID for this specific tab (memory/ref)
      if (!tabIdRef.current) {
        tabIdRef.current = `s_${crypto.randomUUID().slice(0, 8)}_${Date.now().toString(36)}`
      }
    }

    const sendHeartbeat = async (isDisconnect = false) => {
      if (!tabIdRef.current) return
      
      const now = Date.now()
      // Don't send more than one heartbeat every 5 seconds (except on disconnect)
      if (!isDisconnect && now - lastHeartbeatRef.current < 5000) return
      
      try {
        lastHeartbeatRef.current = now
        await fetch('/api/analytics/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visitorId: visitorIdRef.current,
            userId: session?.user?.id,
            sessionId: tabIdRef.current,
            path: pathname,
            disconnect: isDisconnect
          }),
          keepalive: true,
        })
      } catch (err) {
        // Silently fail
      }
    }

    // Send immediate heartbeat on mount or path change (throttled)
    sendHeartbeat()

    // Interval for updates (increased to 60 seconds to save server processes)
    timerRef.current = setInterval(() => sendHeartbeat(), 60000)

    // Handle page unload / tab close
    const handleUnload = () => {
      sendHeartbeat(true)
    }

    window.addEventListener('beforeunload', handleUnload)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [pathname, session])

  return null // This component doesn't render anything
}
