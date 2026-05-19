import { Message } from '../types'
import { Translations } from '../i18n/translations'
import '../styles/ChatMessage.css'

interface Props { message: Message; onSpeak: (t: string) => void; isSpeaking: boolean; t: Translations }

const ChatMessage = ({ message, onSpeak, isSpeaking, t }: Props) => {
    const isUser = message.role === 'user'
    return (
        <div className={`msg ${isUser ? 'msg--user' : 'msg--bot'}`}>
            <div className="msg-avatar">
                {isUser ? (
                    <div className="av av--user">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                ) : (
                    <div className="av av--bot">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>
                    </div>
                )}
            </div>
            <div className="msg-body">
                <div className="msg-head">
                    <span className="msg-name">{isUser ? t.you : t.title}</span>
                    <span className="msg-time">{message.timestamp.toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                </div>
                <div className="msg-text">{message.content}</div>
                {!isUser && (
                    <div className="msg-actions">
                        <button className={`act-btn ${isSpeaking ? 'act-btn--active' : ''}`} onClick={() => onSpeak(message.content)}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                            <span>{isSpeaking ? t.playing : t.listen}</span>
                        </button>
                        <button className="act-btn" onClick={() => navigator.clipboard.writeText(message.content)}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                            <span>{t.copy}</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
export default ChatMessage
