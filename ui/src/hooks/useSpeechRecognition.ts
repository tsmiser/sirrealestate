import { useCallback, useEffect, useRef, useState } from 'react'

interface SpeechRecognitionInstance {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: ((e: { error: string }) => void) | null
  onresult: ((e: { results: { 0: { transcript: string } }[] }) => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

interface UseSpeechRecognitionOptions {
  onResult: (transcript: string) => void
  onError?: (error: string) => void
  lang?: string
}

export function useSpeechRecognition({
  onResult,
  onError,
  lang = 'en-US',
}: UseSpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SpeechRecognitionAPI: (new () => SpeechRecognitionInstance) | undefined =
    typeof window !== 'undefined'
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition)
      : undefined

  const isSupported = SpeechRecognitionAPI != null

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
    }
  }, [])

  const startListening = useCallback(() => {
    if (!SpeechRecognitionAPI) return

    const recognition = new SpeechRecognitionAPI()
    recognition.lang = lang
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.continuous = false

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)

    recognition.onerror = (e) => {
      setIsListening(false)
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        onError?.(e.error)
      }
    }

    recognition.onresult = (e) => {
      const transcript = e.results
        .map((r) => r[0].transcript)
        .join(' ')
        .trim()
      onResult(transcript)
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [SpeechRecognitionAPI, lang, onResult, onError])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  return { isListening, isSupported, startListening, stopListening }
}
