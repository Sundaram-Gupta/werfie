import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        const token = localStorage.getItem('accessToken');

        if (!user || !token) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        // Only connect if not already connected or if token changed (handled by effect dependency)
        // But socket instance is new every time effect runs.

        const newSocket = io('http://localhost:3013', {
            auth: { token }
        });

        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
        });

        newSocket.on('connect_error', (err) => {
            console.error('Socket connection error:', err.message);
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};
