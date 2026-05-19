import { useState, useRef, useEffect } from 'react'
import { sendMessage } from '../services/api'
import { Translations, Lang } from '../i18n/translations'
import '../styles/VoiceChat.css'

interface Props { onClose: () => void; t: Translations; lang: Lang }
type State = 'idle' | 'listening' | 'processing' | 'speaking' | 'unsupported'

const VoiceChat = ({ onClose, t, lang }: Props) => {
    const [state, setState] = useState<State>('idle')
    const [transcript, setTranscript] = useState('')
    const [botText, setBotText] = useState('')
    const [log, setLog] = useState<{ role: string; text: string }[]>([])
    const recRef = useRef<SpeechRecognition | null>(null)
    const txRef = useRef('')
    const endRef = useRef<HTMLDivElement>(null)

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [log])

    const speak = (text: string): Promise<void> => new Promise(resolve => {
        if (!('speechSynthesis' in window)) { resolve(); return }
        window.speechSynthesis.cancel()
        const u = new SpeechSynthesisUtterance(text)
        u.lang = lang === 'ka' ? 'ka-GE' : 'en-US'; u.rate = 0.95
        u.onend = () => resolve(); u.onerror = () => resolve()
        window.speechSynthesis.speak(u)
    })

    const listen = () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SR) { setState('unsupported'); return }
        setTranscript(''); txRef.current = ''; setBotText(''); setState('listening')
        const r = new SR(); r.lang = lang === 'ka' ? 'ka-GE' : 'en-US'; r.interimResults = true; r.continuous = true
        r.onresult = (e: SpeechRecognitionEvent) => {
            let txt = ''; for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript
            setTranscript(txt); txRef.current = txt
        }
        r.onend = async () => {
            const txt = txRef.current
            if (txt.trim()) { await process(txt.trim()); txRef.current = '' }
            else setState('idle')
        }
        r.onerror = (e) => { if ((e as any).error === 'network') setState('unsupported'); else setState('idle') }
        recRef.current = r; r.start()
    }

    const process = async (text: string) => {
        setState('processing'); setLog(p => [...p, { role: 'user', text }])
        try {
            const d = await sendMessage(text); setBotText(d.reply)
            setLog(p => [...p, { role: 'bot', text: d.reply }])
            setState('speaking'); await speak(d.reply); setState('idle')
        } catch {
            setBotText(t.serverError); setLog(p => [...p, { role: 'bot', text: t.serverError }]); setState('idle')
        }
    }

    const stop = () => { recRef.current?.stop(); window.speechSynthesis?.cancel(); setState('idle') }
    const onMain = () => {
        if (state === 'idle' || state === 'unsupported') listen()
        else if (state === 'listening') recRef.current?.stop()
        else if (state === 'speaking') { window.speechSynthesis?.cancel(); setState('idle') }
    }

    const label = { idle: t.voiceBtn, listening: t.voiceListening, processing: t.voiceProcessing, speaking: t.voiceSpeaking, unsupported: t.voiceUnsupported }[state]

    return (
        <div className="vc-overlay">
            <div className="vc-panel">
                <div className="vc-head">
                    <div className="vc-title">
                        <div className="vc-logo">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>
                        </div>
                        <div><h3>{t.voiceTitle}</h3><span>{t.title}</span></div>
                    </div>
                    <button className="vc-close" onClick={() => { stop(); onClose() }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
                <div className="vc-log">
                    {log.length === 0 && state !== 'unsupported' && <div className="vc-empty"><p>{t.voiceEmpty}</p></div>}
                    {state === 'unsupported' && log.length === 0 && (
                        <div className="vc-browser-warning">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            <h4>{t.voiceWarningTitle}</h4><p>{t.voiceWarningText}</p><p>{t.voiceWarningHint}</p>
                        </div>
                    )}
                    {log.map((e, i) => (
                        <div key={i} className={`vc-entry vc-entry--${e.role}`}>
                            <div className="vc-entry-icon">
                                {e.role === 'user' ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
                                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>}
                            </div>
                            <div><span className="vc-entry-role">{e.role === 'user' ? t.you : t.title}</span><p>{e.text}</p></div>
                        </div>
                    ))}
                    <div ref={endRef}/>
                </div>
                <div className="vc-live">
                    {state === 'listening' && transcript && <p className="vc-tx">{transcript}</p>}
                    {state === 'processing' && <div className="vc-dots"><span/><span/><span/></div>}
                    {state === 'speaking' && botText && <p className="vc-speaking">{botText.substring(0, 120)}...</p>}
                </div>
                <div className="vc-controls">
                    <span className="vc-label">{label}</span>
                    <button className={`vc-btn vc-btn--${state === 'unsupported' ? 'idle' : state}`} onClick={onMain} disabled={state === 'processing'}>
                        {(state === 'idle' || state === 'unsupported') && <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>}
                        {state === 'listening' && <div className="vc-waves"><span/><span/><span/><span/><span/></div>}
                        {state === 'processing' && <div className="vc-spin"/>}
                        {state === 'speaking' && <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>}
                    </button>
                </div>
            </div>
        </div>
    )
}
export default VoiceChat
