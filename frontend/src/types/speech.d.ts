interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
    length: number
    [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
    [index: number]: SpeechRecognitionAlternative
    isFinal: boolean
}

interface SpeechRecognitionAlternative {
    transcript: string
    confidence: number
}

interface SpeechRecognition extends EventTarget {
    lang: string
    interimResults: boolean
    continuous: boolean
    onresult: ((event: SpeechRecognitionEvent) => void) | null
    onstart: (() => void) | null
    onend: (() => void) | null
    onerror: ((event: Event) => void) | null
    start(): void
    stop(): void
}

declare var SpeechRecognition: {
    new(): SpeechRecognition
}

interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
}
