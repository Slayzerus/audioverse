import React from "react";
import { useTranslation } from "react-i18next";
import { useRTC } from "../../../contexts/RTCContext";
import { motion, AnimatePresence } from 'framer-motion';

import "./partyAlerts.module.css";

type ChatMessage = {
    user: string;
    message: string;
    timestamp?: string;
};

interface PartyChatProps {
    partyId: number;
    username?: string;
    isOpen?: boolean;
    onCountsChange?: (stats: { unread: number; total: number }) => void;
}

const PartyChat: React.FC<PartyChatProps> = ({ partyId, username, isOpen = false, onCountsChange }) => {
    const { t } = useTranslation();
    const { service: rtc } = useRTC();
    const [messages, setMessages] = React.useState<ChatMessage[]>([]);
    const [unread, setUnread] = React.useState(0);
    const [input, setInput] = React.useState("");
    const [sendError, setSendError] = React.useState<string | null>(null);
    const [sendSuccess, setSendSuccess] = React.useState<string | null>(null);
    const listRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        const handleReceive = (user: string, message: string, timestamp?: string) => {
            setMessages(prev => [...prev, { user, message, timestamp }]);
            if (!isOpen) setUnread(prev => prev + 1);
        };

        // Subscribe to server broadcast (RTC.md: ReceiveChatMessage)
        rtc.on && rtc.on("ReceiveChatMessage", handleReceive as (...args: unknown[]) => void);

        return () => {
            rtc.off && rtc.off("ReceiveChatMessage", handleReceive as (...args: unknown[]) => void);
        };
    }, [rtc, isOpen]);

    React.useEffect(() => {
        if (isOpen) setUnread(0);
    }, [isOpen]);

    React.useEffect(() => {
        onCountsChange?.({ unread, total: messages.length });
    }, [unread, messages.length, onCountsChange]);

    React.useEffect(() => {
        // scroll to bottom on new message
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages.length]);

    const send = async () => {
        const text = input.trim();
        if (!text) return;
        try {
            // optimistic add
            const ts = new Date().toISOString();
            setMessages(prev => [...prev, { user: username ?? "Anonymous", message: text, timestamp: ts }]);
            if (!isOpen) setUnread(prev => prev + 1);
            setInput("");
            await rtc.sendChatMessage(partyId, username ?? "Anonymous", text);
            setSendSuccess(t('party.chat.sent'));
            setTimeout(() => setSendSuccess(null), 1200);
        } catch (_e) {
            setSendError(t('party.chat.sendError'));
            setTimeout(() => setSendError(null), 3500);
        }
    };

    const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") send();
    };

    return (
        <div className="card">
            <div className="card-body d-flex flex-column" style={{ minHeight: 300, maxHeight: '70vh' }}>
                <div ref={listRef} className="flex-grow-1 overflow-auto mb-2">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: { opacity: 1, transition: { staggerChildren: 0.04 } }
                        }}
                    >
                        <AnimatePresence initial={false} mode="popLayout">
                            {messages.length === 0 ? (
                                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-muted">{t('party.chat.noMessages')}</motion.div>
                            ) : (
                                messages.map((m, i) => (
                                    <motion.div
                                        key={i}
                                        layout
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                                        className="mb-1"
                                    >
                                        <strong className="me-2">{m.user}:</strong>
                                        <span>{m.message}</span>
                                        <div className="text-muted small">{m.timestamp ?? ""}</div>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
                <div className="input-group">
                    <input
                        type="text"
                        className="form-control"
                        placeholder={t('party.chat.placeholder')}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={onKey}
                        aria-label={t('party.chat.placeholder')}
                    />
                    <button className="btn btn-primary" onClick={send}>{t('party.chat.send')}</button>
                </div>
                <div className="position-absolute end-0 me-2" style={{ bottom: 6 }}>
                    <AnimatePresence>
                        {sendError ? (
                            <motion.div key="serr" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}>
                                <div className="alert alert-danger py-1 px-2 mb-0 small">{sendError}</div>
                            </motion.div>
                        ) : null}
                        {sendSuccess ? (
                            <motion.div key="ssuc" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}>
                                <div className="alert alert-success py-1 px-2 mb-0 small">{sendSuccess}</div>
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default React.memo(PartyChat);
