import { createContext, useContext, useEffect, useState } from 'react';
import { socketService } from '@/services/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            const socketInstance = socketService.connect();
            setSocket(socketInstance);
        } else {
            socketService.disconnect();
            setSocket(null);
        }

        return () => {
            // Optional: don't disconnect on unmount of provider if it's app-wide?
            // But if user logs out (user changes), we disconnect.
        };
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};
