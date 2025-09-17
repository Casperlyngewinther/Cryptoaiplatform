import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [marketData, setMarketData] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [aiDecisions, setAiDecisions] = useState([]);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [connectionStats, setConnectionStats] = useState({});
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const subscriptions = useRef(new Set());

  const connect = () => {
    if (!isAuthenticated) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('🔌 WebSocket connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;
        
        // Re-subscribe to previous channels
        subscriptions.current.forEach(channel => {
          subscribe(channel);
        });
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        setIsConnected(false);
        attemptReconnect();
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('WebSocket connection error:', error);
      attemptReconnect();
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    subscriptions.current.clear();
  };

  const attemptReconnect = () => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      toast.error('Forbindelse til server tabt. Genindlæs siden.');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
    reconnectAttempts.current++;

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  };

  const sendMessage = (message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  };

  const subscribe = (channel) => {
    subscriptions.current.add(channel);
    sendMessage({
      type: 'subscribe',
      channel
    });
  };

  const unsubscribe = (channel) => {
    subscriptions.current.delete(channel);
    sendMessage({
      type: 'unsubscribe',
      channel
    });
  };

  const requestData = (request) => {
    sendMessage({
      type: 'request_data',
      request
    });
  };

  const handleMessage = (message) => {
    switch (message.type) {
      case 'connection':
        console.log('Connection confirmed:', message.data);
        // Auto-subscribe to essential channels
        subscribe('market_data');
        subscribe('portfolio');
        subscribe('ai_decisions');
        subscribe('security');
        subscribe('system_health');
        break;

      case 'channel_data':
        handleChannelData(message.channel, message.data);
        break;

      case 'portfolio_summary':
        setPortfolio(message.data);
        break;

      case 'ai_status':
        setAiDecisions(message.data.recentDecisions || []);
        break;

      case 'security_status':
        setSecurityEvents(prev => {
          const newEvents = message.data.activeThreats || [];
          return [...newEvents, ...prev.slice(0, 50)]; // Keep last 50
        });
        break;

      case 'market_overview':
        setMarketData(message.data.marketData || []);
        break;

      case 'emergency_alert':
        handleEmergencyAlert(message.alert);
        break;

      case 'subscription_confirmed':
        console.log(`✅ Subscribed to ${message.channel}`);
        break;

      case 'unsubscription_confirmed':
        console.log(`❌ Unsubscribed from ${message.channel}`);
        break;

      case 'error':
        console.error('WebSocket error:', message.message);
        toast.error(`WebSocket fejl: ${message.message}`);
        break;

      case 'pong':
        // Handle ping/pong for connection health
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  };

  const handleChannelData = (channel, data) => {
    switch (channel) {
      case 'market_data':
        setMarketData(data.symbols || []);
        break;

      case 'portfolio':
        setPortfolio(data);
        break;

      case 'ai_decisions':
        setAiDecisions(prev => {
          const newDecisions = data.recentDecisions || [];
          const combined = [...newDecisions, ...prev];
          return combined.slice(0, 100); // Keep last 100
        });
        break;

      case 'security':
        if (data.activeThreats && data.activeThreats.length > 0) {
          setSecurityEvents(prev => {
            const newEvents = data.activeThreats;
            return [...newEvents, ...prev.slice(0, 50)];
          });
        }
        break;

      case 'system_health':
        setSystemHealth(data);
        setConnectionStats({
          connections: data.connections,
          uptime: data.uptime,
          services: data.services
        });
        break;

      default:
        console.log(`Unknown channel data: ${channel}`, data);
    }
  };

  const handleEmergencyAlert = (alert) => {
    toast.error(`🚨 NØDALARM: ${alert.message}`, {
      duration: 10000,
      style: {
        background: '#D32F2F',
        color: '#FFFFFF',
        fontSize: '16px',
        fontWeight: 'bold'
      }
    });
    
    console.error('Emergency Alert:', alert);
  };

  // Send periodic ping to keep connection alive
  useEffect(() => {
    if (!isConnected) return;

    const pingInterval = setInterval(() => {
      sendMessage({ type: 'ping' });
    }, 30000); // Every 30 seconds

    return () => clearInterval(pingInterval);
  }, [isConnected]);

  // Connect/disconnect based on authentication status
  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated]);

  const value = {
    isConnected,
    marketData,
    portfolio,
    aiDecisions,
    securityEvents,
    systemHealth,
    connectionStats,
    subscribe,
    unsubscribe,
    requestData,
    sendMessage
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};