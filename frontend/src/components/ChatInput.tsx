import { useState, useRef } from 'react'
import { Translations } from '../i18n/translations'
import '../styles/ChatInput.css'

interface Props { onSend: (m: string) => void; isLoading: boolean; t: Translations }

const ChatInput = ({ onSend, isLoading, t }: Props) => {
    const [input, setInput] = useState('')
    const [isListening, setIsListening] = useState(false)
    const [micError, setMicError] = useState(false)
    const recRef = useRef<SpeechRecognition | null>(null)

    const submit = () => { if (input.trim() && !isLoading) { onSend(input.trim()); setInput('') } }
    const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
    }
    const toggleMic = () => {
        if (isListening) { recRef.current?.stop(); setIsListening(false); return }
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SR) { setMicError(true); setTimeout(() => setMicError(false), 5000); return }
        setMicError(false)
        const r = new SR(); r.lang = 'ka-GE'; r.interimResults = true; r.continuous = true
        r.onstart = () => setIsListening(true)
        r.onresult = (ev: SpeechRecognitionEvent) => {
            let txt = ''; for (let i = 0; i < ev.results.length; i++) txt += ev.results[i][0].transcript; setInput(txt)
        }
        r.onerror = (ev) => { setIsListening(false); if ((ev as any).error === 'network') { setMicError(true); setTimeout(() => setMicError(false), 5000) } }
        r.onend = () => setIsListening(false)
        recRef.current = r; r.start()
    }

    return (
        <div className="ci-wrap">
            {micError && (
                <div className="ci-error">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span>{t.micError}</span>
                </div>
            )}
            <div className={`ci-box ${isListening ? 'ci-box--rec' : ''}`}>
                <textarea className="ci-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey} placeholder={isListening ? t.listening : t.placeholder} rows={1} disabled={isLoading} />
                <div className="ci-btns">
                    <button className={`ci-mic ${isListening ? 'ci-mic--on' : ''}`} onClick={toggleMic} disabled={isLoading}>
                        {isListening ? <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>}
                    </button>
                    <button className={`ci-send ${input.trim() && !isLoading ? 'ci-send--on' : ''}`} onClick={submit} disabled={!input.trim() || isLoading}>
                        {isLoading ? <div className="ci-spin"/> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>}
                    </button>
                </div>
            </div>
        </div>
    )
}
export default ChatInput
