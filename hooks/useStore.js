'use client'

import { useState, useEffect } from 'react'

export function useStore(key, init) {
  const [val, setVal] = useState(init)

  useEffect(() => {
    try {
      const s = localStorage.getItem(key)
      if (s) setVal(JSON.parse(s))
    } catch {}
  }, [key])

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
  }, [val, key])

  return [val, setVal]
}