import React from "react";
import { rtcService, AccessTokenFactory } from "../services/rtcService";
import { useUser } from "../contexts/UserContext";
import { getAccessToken } from "../scripts/api/apiUser";

type RTCContextValue = {
    service: typeof rtcService;
    connect: (tokenFactory?: AccessTokenFactory) => Promise<void>;
    disconnect: () => Promise<void>;
    connected: boolean;
};

const RTCContext = React.createContext<RTCContextValue | null>(null);

export const RTCProvider: React.FC<{ autoConnect?: boolean; children?: React.ReactNode }> = ({ autoConnect = false, children }) => {
    const [connected, setConnected] = React.useState(false);
    useUser(); // verify we are within UserProvider

    const connect = React.useCallback(async (tokenFactory?: AccessTokenFactory) => {
        const factory: AccessTokenFactory = tokenFactory ?? (() => getAccessToken() ?? "");
        await rtcService.connect(factory);
        setConnected(true);
    }, []);

    const disconnect = React.useCallback(async () => {
        await rtcService.disconnect();
        setConnected(false);
    }, []);

    React.useEffect(() => {
        if (!autoConnect) return;
        let mounted = true;
        (async () => {
            try {
                const tokenFactory: AccessTokenFactory = () => getAccessToken() ?? "";
                await rtcService.connect(tokenFactory);
                if (mounted) setConnected(true);
            } catch (_e) {
                // Expected: RTC auto-connect may fail if server is unavailable or user not authenticated
            }
        })();
        return () => { mounted = false; rtcService.disconnect(); };
    }, [autoConnect]);

    const value: RTCContextValue = React.useMemo(() => ({ service: rtcService, connect, disconnect, connected }), [connect, disconnect, connected]);

    return <RTCContext.Provider value={value}>{children}</RTCContext.Provider>;
};

export const useRTC = () => {
    const ctx = React.useContext(RTCContext);
    if (!ctx) throw new Error("useRTC must be used within RTCProvider");
    return ctx;
};

export default RTCContext;
