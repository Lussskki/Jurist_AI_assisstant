import { Translations } from '../i18n/translations'
import '../styles/Sidebar.css'

export interface ChatSession {
    id: string
    title: string
    timestamp: Date
    preview: string
}

interface Props {
    sessions: ChatSession[]
    activeId: string | null
    onSelect: (id: string) => void
    onNew: () => void
    onDelete: (id: string) => void
    isOpen: boolean
    onToggle: () => void
    t: Translations
}

const Sidebar = ({ sessions, activeId, onSelect, onNew, onDelete, isOpen, onToggle, t }: Props) => {
    return (
        <>
            <div className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
                <div className="sb-header">
                    <span className="sb-title">History</span>
                    <button className="sb-new" onClick={onNew}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        <span>New</span>
                    </button>
                </div>
                <div className="sb-list">
                    {sessions.length === 0 && (
                        <div className="sb-empty">No saved conversations</div>
                    )}
                    {sessions.map(s => (
                        <div
                            key={s.id}
                            className={`sb-item ${s.id === activeId ? 'sb-item--active' : ''}`}
                            onClick={() => onSelect(s.id)}
                        >
                            <div className="sb-item-content">
                                <span className="sb-item-title">{s.title}</span>
                                <span className="sb-item-preview">{s.preview}</span>
                                <span className="sb-item-time">
                                    {s.timestamp.toLocaleDateString('ka-GE', { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                            <button className="sb-item-delete" onClick={(e) => { e.stopPropagation(); onDelete(s.id) }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            {isOpen && <div className="sb-overlay" onClick={onToggle}/>}
        </>
    )
}

export default Sidebar
