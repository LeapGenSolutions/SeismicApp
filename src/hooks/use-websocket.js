import { useState, useEffect, useCallback, useRef } from 'react';



export function useWebSocket(options= {}) {
  const {
    onOpen,
    onMessage,
    onClose,
    onError,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    autoConnect = true
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  
  const websocketRef = useRef(null);
  const reconnectCountRef = useRef(0);
  
  // Initialize WebSocket connection
  const connect = useCallback(() => {
    // Close existing connection if any
    if (websocketRef.current) {
      websocketRef.current.close();
    }
    
    // Set up WebSocket connection using the correct protocol
    const protocol = window.location.protocol === "https;
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      const socket = new WebSocket(wsUrl);
      websocketRef.current = socket;
      
      // Handle WebSocket events
      socket.addEventListener('open', (event) => {
        setIsConnected(true);
        reconnectCountRef.current = 0;
        console.log('WebSocket connection established');
        
        if (onOpen) {
          onOpen(event);
        }
      });
      
      socket.addEventListener('message', (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          setMessages((prevMessages) => [...prevMessages, parsedData]);
          
          if (onMessage) {
            onMessage(event);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message, error);
        }
      });
      
      socket.addEventListener('close', (event) => {
        setIsConnected(false);
        console.log('WebSocket connection closed');
        
        if (onClose) {
          onClose(event);
        }
        
        // Attempt to reconnect if connection was closed
        if (reconnectCountRef.current  connect(), reconnectInterval);
        }
      });
      
      socket.addEventListener('error', (event) => {
        setError(event);
        console.error('WebSocket error, event);
        
        if (onError) {
          onError(event);
        }
      });
    } catch (error) {
      console.error('Failed to create WebSocket connection, error);
    }
  }, [onOpen, onMessage, onClose, onError, reconnectAttempts, reconnectInterval]);
  
  // Send a message through the WebSocket
  const sendMessage = useCallback((message) => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      const stringifiedMessage = typeof message === 'string' ? message );
      websocketRef.current.send(stringifiedMessage);
      return true;
    }
    return false;
  }, []);
  
  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
  }, []);
  
  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    
    // Clean up on unmount
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);
  
  return {
    isConnected,
    messages,
    error,
    connect,
    disconnect,
    sendMessage
  };
}

export default useWebSocket;