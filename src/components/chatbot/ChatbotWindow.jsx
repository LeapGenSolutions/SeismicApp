import { useRef, useState, useEffect, useCallback} from "react";
import { CHATBOT_URL } from "../../constants";
import { useLocation } from "wouter";



const ChatbotWindow = () => {
    const [open, setOpen] = useState(false);
    const [minimized, setMinimized] = useState(false);
    const [iframeKey, setIframeKey] = useState(Date.now()); // for reload/close
    const iframeRef = useRef();
    const [location] = useLocation();
    const isMeetingPage = location.startsWith("/meeting-room/");
    const SIDEBAR_WIDTH = 256;
    const [windowSize, setWindowSize] = useState({ width: 320, height: 400 });
    const [isResizing, setIsResizing] = useState(false);
    const chatbotWindowRef = useRef(null);
    // store the starting values to avoid jumps when starting resize
    const resizeStartRef = useRef({ startX: 0, startY: 0, startWidth: 0, startHeight: 0 });
    // toggle depending on where the handle lives; we placed it in top-left
    const HANDLE_TOP_LEFT = true;

    const onPointerDownResize = useCallback((e) => {
        // use pointer events to support mouse/touch/pen
        const point = e.touches ? e.touches[0] : e;
        const rect = chatbotWindowRef.current?.getBoundingClientRect();
        if (!rect) return;
        resizeStartRef.current = {
            startX: point.clientX,
            startY: point.clientY,
            startWidth: rect.width,
            startHeight: rect.height
        };
        setIsResizing(true);
        // capture pointer to ensure we keep receiving events (if pointer events available)
        if (e.target && e.target.setPointerCapture) {
            try { e.target.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        }
        e.preventDefault?.();
    }, []);

    const onPointerMove = useCallback((e) => {
        if (!isResizing || !chatbotWindowRef.current) return;
        const point = e.touches ? e.touches[0] : e;
        const { startX, startY, startWidth, startHeight } = resizeStartRef.current;
        const deltaX = point.clientX - startX;
        const deltaY = point.clientY - startY;

        let newWidth;
        let newHeight;
        if (HANDLE_TOP_LEFT) {
            // For a top-left handle, moving pointer right should decrease width (left edge moves right)
            newWidth = Math.round(startWidth - deltaX);
            newHeight = Math.round(startHeight - deltaY);
        } else {
            // bottom-right or default behavior
            newWidth = Math.round(startWidth + deltaX);
            newHeight = Math.round(startHeight + deltaY);
        }

        setWindowSize({
            width: Math.max(320, Math.min(600, newWidth)),
            height: Math.max(400, Math.min(800, newHeight))
        })

        e.preventDefault?.();
    }, [isResizing, HANDLE_TOP_LEFT]);

    const onPointerUp = useCallback((e) => {
        setIsResizing(false);
        // release capture
        if (e.target && e.target.releasePointerCapture) {
            try { e.target.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        }
    }, []);

    useEffect(() => {
        if (isResizing) {
            // listen broadly so pointer events outside the element are captured
            document.addEventListener("pointermove", onPointerMove);
            document.addEventListener("pointerup", onPointerUp);
            // fallback for touch/mouse older browsers
            document.addEventListener("mousemove", onPointerMove);
            document.addEventListener("mouseup", onPointerUp);
            document.addEventListener("touchmove", onPointerMove, { passive: false });
            document.addEventListener("touchend", onPointerUp);
        }
        return () => {
            document.removeEventListener("pointermove", onPointerMove);
            document.removeEventListener("pointerup", onPointerUp);
            document.removeEventListener("mousemove", onPointerMove);
            document.removeEventListener("mouseup", onPointerUp);
            document.removeEventListener("touchmove", onPointerMove);
            document.removeEventListener("touchend", onPointerUp);
        };
    }, [isResizing, onPointerMove, onPointerUp]);

    // Open button (always visible)
    const openButton = (
        <button
            onClick={() => {
                setOpen(true);
                setMinimized(false);
                setIframeKey(Date.now()); // new session on open
            }}
            style={{
                position: "fixed",
                bottom: 24,
                left: isMeetingPage ? SIDEBAR_WIDTH + 24 : "auto",
                right: isMeetingPage ? "auto" : 24,
                transition: "left 0.3s ease, right 0.3s ease",
                zIndex: 101,
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 9999,
                width: 56,
                height: 56,
                boxShadow: "0 2px 16px rgba(0,0,0,0.15)",
                cursor: "pointer",
                fontSize: 28,
                display: open ? "none" : "flex",
                alignItems: "center",
                justifyContent: "center"
            }}
            aria-label="Open Chatbot"
        >
            💬
        </button>
    );

    // Chatbot window
    const chatbotWindow = open && (
        <div
            ref={chatbotWindowRef}
            style={{
                position: "fixed",
                bottom: 24,
                left: isMeetingPage ? SIDEBAR_WIDTH + 24 : "auto",
                right: isMeetingPage ? "auto" : 24,
                zIndex: 100,
                resize: minimized ? undefined : "both",
                overflow: "hidden",
                minWidth: minimized ? 165 : 320,
                minHeight: minimized ? 48 : 400,
                maxWidth: 600,
                maxHeight: 800,
                background: "#fff",
                borderRadius: 12,
                boxShadow: "0 2px 16px rgba(0,0,0,0.15)",
                border: "1px solid #e5e7eb",
                width: minimized ? 165 : windowSize.width,
                height: minimized ? 45 : windowSize.height,
                transition: "all 0.2s"
            }}
        >
            {/* Header with controls */}
            <div style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#f3f4f6",
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                padding: "8px 12px",
                paddingLeft: minimized ? 12 : 44 // smaller padding when minimized so title sits flush left
            }}>
                {/* Resize handle placed inside header to avoid overlap with title/buttons */}
                {!minimized && (
                    <div
                        onPointerDown={onPointerDownResize}
                        onTouchStart={onPointerDownResize}
                        style={{
                            position: "absolute",
                            left: 8,
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: 18,
                            height: 18,
                            cursor: "nwse-resize",
                            backgroundColor: "#2563eb",
                            borderRadius: 6,
                            zIndex: 5,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: 12,
                            userSelect: "none"
                        }}
                        aria-label="Resize chat window"
                        role="separator"
                    >
                        ⤡
                    </div>
                )}

                <span style={{ fontWeight: 600, color: "#2563eb" }}>Chatbot</span>
                <div style={{ display: "flex", gap: 8 }}>
                    <button
                        onClick={() => setMinimized((m) => !m)}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18 }}
                        title={minimized ? "Expand" : "Minimize"}
                    >
                        {minimized ? "🗖" : "🗕"}
                    </button>
                    <button
                        onClick={() => setIframeKey(Date.now())}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18 }}
                        title="Reload"
                    >
                        🔄
                    </button>
                    <button
                        onClick={() => {
                            setOpen(false);
                            setMinimized(false);
                            setIframeKey(Date.now()); // new session on next open
                        }}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18 }}
                        title="Close"
                    >
                        ✖
                    </button>
                </div>
            </div>
            <iframe
                key={iframeKey}
                ref={iframeRef}
                src={CHATBOT_URL}
                title="Chatbot"
                width="100%"
                height="100%"
                style={{
                    border: "none", display: minimized ? "none" : "block",
                    minWidth: 320, minHeight: 400, borderRadius: 12
                }}
                allow="clipboard-write;"
            />
        </div>
    );

    return (
        <>
            {openButton}
            {chatbotWindow}
        </>
    );
};

export default ChatbotWindow;
