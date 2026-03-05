import React, { createContext, useContext, useEffect, useState } from "react";
import apiUser, { CurrentUserResponse, CurrentUserPlayer, getUserDevices, createDevice, getUserMicrophones, createMicrophone, DeviceType, DeviceDto, MicrophoneDto } from "../scripts/api/apiUser";
import { getSystemConfig } from "../scripts/api/apiAdmin";
import { setBackendOverrides } from "../config/featureVisibility";
import { useAudioContext } from "./AudioContext";
import { clearSettingsCache } from "../scripts/settingsSync";
import { logger } from '../utils/logger';

const log = logger.scoped('UserContext');

interface SystemConfig {
    id: number;
    sessionTimeoutMinutes: number;
    captchaOption: number;
    maxMicrophonePlayers: number;
    globalMaxListenersPerStation?: number | null;
    globalMaxTotalListeners?: number | null;
    active: boolean;
    showBreadcrumbs?: boolean;
    featureVisibilityOverrides?: Array<{ featureId: string; hidden: boolean; visibleToRoles: string[] }>;
    modifiedAt?: string;
    modifiedByUserId?: number | null;
    modifiedByUsername?: string | null;
}

interface UserContextType {
    isAuthenticated: boolean;
    currentUser: CurrentUserResponse | null;
    userId: number | null;
    username: string | null;
    roles: string[];
    isAdmin: boolean;
    /**
     * Full Player entities (UserProfilePlayer) owned by the current user.
     * Populated from GET /api/user/me response.
     */
    players: CurrentUserPlayer[];
    /** Shorthand: IDs of Player entities owned by the current user. */
    playerIds: number[];
    login: () => Promise<void>;
    logout: () => void;
    loadCurrentUser: () => Promise<void>;
    requirePasswordChange: boolean;
    systemConfig: SystemConfig | null;
    userDevices: DeviceDto[];
    userMicrophones: MicrophoneDto[];
    syncUserDevices: () => Promise<void>;
    gamepads: (Gamepad | null)[];
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(!!apiUser.getAccessToken());
    const [currentUser, setCurrentUser] = useState<CurrentUserResponse | null>(null);
    const [userId, setUserId] = useState<number | null>(null);
    const [username, setUsername] = useState<string | null>(null);
    const [roles, setRoles] = useState<string[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
    const [userDevices, setUserDevices] = useState<DeviceDto[]>([]);
    const [userMicrophones, setUserMicrophones] = useState<MicrophoneDto[]>([]);
    const [players, setPlayers] = useState<CurrentUserPlayer[]>([]);
    const playerIds = React.useMemo(() => players.map(p => p.id), [players]);
    const { audioInputs } = useAudioContext();

    // Minimal gamepad detection hook (polling)
    const [gamepads, setGamepads] = useState<(Gamepad | null)[]>([]);
    useEffect(() => {
        const pollGamepads = () => {
            const detected = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
            setGamepads(detected);
        };
        const interval = setInterval(pollGamepads, 1000);
        pollGamepads();
        return () => clearInterval(interval);
    }, []);

    const loadSystemConfig = async () => {
        try {
            const config = await getSystemConfig();
            setSystemConfig(config);
            // Feed backend feature-visibility overrides into the visibility system
            setBackendOverrides(config?.featureVisibilityOverrides ?? []);
        } catch (_e) {
            setSystemConfig(null);
            setBackendOverrides([]);
        }
    };

    // Rate limiting - don't call more often than every 2 seconds
    const lastSyncTime = React.useRef<number>(0);
    const syncUserDevices = async () => {
        if (!isAuthenticated) {
            log.debug("⏳ Skipping syncUserDevices - user not authenticated");
            return;
        }
        const now = Date.now();
        if (now - lastSyncTime.current < 2000) {
            log.debug("⏳ Skipping syncUserDevices - too frequent call");
            return;
        }
        lastSyncTime.current = now;
        try {
            // 1. Pobierz z backendu
            const devicesResp = await getUserDevices();
            log.debug("🔄 Synchronizing user devices, fetched from backend:", devicesResp);
            const devices = Array.isArray(devicesResp.devices) ? devicesResp.devices : [];
            setUserDevices(devices);
            const microphonesResp = await getUserMicrophones();
            log.debug("🔄 Synchronizing user microphones, fetched from backend:", microphonesResp);
            const microphones = Array.isArray(microphonesResp.microphones) ? microphonesResp.microphones : [];
            setUserMicrophones(microphones);
            // 2. Compare with detected microphones
            if (audioInputs && Array.isArray(audioInputs)) {
                for (const mic of audioInputs) {
                    const micIdNorm = (mic.deviceId || '').trim().toLowerCase();
                    const exists = devices.some((d: DeviceDto) =>
                        (d.deviceId || '').trim().toLowerCase() === micIdNorm && d.deviceType == DeviceType.Microphone
                    );
                    if (!exists) {
                        await createDevice({ deviceId: mic.deviceId, deviceType: DeviceType.Microphone, visible: true, deviceName: mic.label });
                    }
                    const micExists = microphones.some((m: MicrophoneDto) => (m.deviceId || '').trim().toLowerCase() === micIdNorm);
                    if (!micExists) {
                        await createMicrophone({ deviceId: mic.deviceId, visible: true });
                    }
                }
            }
            // 3. Compare with detected gamepads
            if (gamepads && Array.isArray(gamepads)) {
                for (const pad of gamepads) {
                    if (!pad?.id) continue;
                    const exists = devices.some((d: DeviceDto) => d.deviceId === pad.id && d.deviceType === DeviceType.Gamepad);
                    if (!exists) {
                        await createDevice({ deviceId: pad.id, deviceType: DeviceType.Gamepad, visible: true });
                    }
                }
            }
            // 4. Refresh after potential changes
            const refreshedDevicesResp = await getUserDevices();
            const refreshedDevices = Array.isArray(refreshedDevicesResp.devices) ? refreshedDevicesResp.devices : [];
            setUserDevices(refreshedDevices);
            const refreshedMicrophonesResp = await getUserMicrophones();
            const refreshedMicrophones = Array.isArray(refreshedMicrophonesResp.microphones) ? refreshedMicrophonesResp.microphones : [];
            setUserMicrophones(refreshedMicrophones);
        } catch (error) {
            log.error("❌ Error during syncUserDevices:", error);
            // Don't rethrow the error - just skip synchronization
        }
    };

    const loadCurrentUser = async () => {
        try {
            const token = apiUser.getAccessToken();
            if (token) {
                const user = await apiUser.getCurrentUser();
                // Normalize backend response which may use PascalCase (UserId) or camelCase (userId)
                const userRaw = user as unknown as Record<string, unknown>;
                const uid = userRaw.userId ?? userRaw.UserId ?? null;
                const uname = userRaw.username ?? userRaw.Username ?? null;
                const uroles = userRaw.roles ?? userRaw.Roles ?? [];
                const uisAdmin = userRaw.isAdmin ?? userRaw.IsAdmin ?? false;

                setCurrentUser(user);
                setUserId(typeof uid === "number" ? uid : null);
                setUsername(typeof uname === "string" ? uname : null);
                setRoles(Array.isArray(uroles) ? uroles : []);
                setIsAdmin(!!uisAdmin);
                // Extract player entities if backend includes them in /me response
                const rawPlayers = (userRaw.players ?? userRaw.Players) as Array<Record<string, unknown>> | undefined;
                if (Array.isArray(rawPlayers)) {
                    const mapped: CurrentUserPlayer[] = rawPlayers
                        .filter(p => typeof (p.id ?? p.Id) === 'number')
                        .map(p => ({
                            id: (p.id ?? p.Id) as number,
                            name: (p.name ?? p.Name ?? '') as string,
                            profileId: (p.profileId ?? p.ProfileId ?? 0) as number,
                            isPrimary: !!(p.isPrimary ?? p.IsPrimary),
                            preferredColors: (p.preferredColors ?? p.PreferredColors ?? '') as string,
                            fillPattern: (p.fillPattern ?? p.FillPattern ?? '') as string,
                            email: (p.email ?? p.Email ?? null) as string | null,
                            icon: (p.icon ?? p.Icon ?? null) as string | null,
                            photoUrl: (p.photoUrl ?? p.PhotoUrl ?? null) as string | null,
                        }));
                    setPlayers(mapped);
                }
                await loadSystemConfig();
                // Only sync devices if user is authenticated and userId is valid
                if (typeof uid === "number" && !!apiUser.getAccessToken()) {
                    await syncUserDevices();
                }
            } else {
                log.warn("⚠️ No token found in loadCurrentUser");
                setCurrentUser(null);
                setUserId(null);
                setUsername(null);
                setRoles([]);
                setIsAdmin(false);
                setPlayers([]);
                setSystemConfig(null);
                setUserDevices([]);
                setUserMicrophones([]);
            }
        } catch (error) {
            log.error("Failed to load current user:", error);
            // Clear user data if fetching fails
            setCurrentUser(null);
            setUserId(null);
            setUsername(null);
            setRoles([]);
            setIsAdmin(false);
            setPlayers([]);
            setSystemConfig(null);
            setUserDevices([]);
            setUserMicrophones([]);
        }
    };

    useEffect(() => {
        const checkAuth = () => {
            // Read tokens from localStorage if the app just loaded
            apiUser.initTokensFromStorage();
            
            const isAuth = !!apiUser.getAccessToken();
            setIsAuthenticated(isAuth);
            if (isAuth) {
                loadCurrentUser();
            }
        };
        
        checkAuth();
        window.addEventListener("storage", checkAuth); // Handling changes in localStorage

        return () => window.removeEventListener("storage", checkAuth);
    }, []);

    const login = async () => {
        setIsAuthenticated(true);
        await loadCurrentUser();
    };

    const logout = () => {
        apiUser.logoutUser(userId || 0);
        setIsAuthenticated(false);
        setCurrentUser(null);
        setUserId(null);
        setUsername(null);
        setRoles([]);
        setIsAdmin(false);
        setSystemConfig(null);
        clearSettingsCache();
    };

    // Provide requirePasswordChange as false (or derive from currentUser if needed)
    const requirePasswordChange = currentUser?.requirePasswordChange ?? false;
    return (
        <UserContext.Provider value={{
            isAuthenticated,
            currentUser,
            userId,
            username,
            roles,
            isAdmin,
            players,
            playerIds,
            login,
            logout,
            loadCurrentUser,
            requirePasswordChange,
            systemConfig,
            userDevices,
            userMicrophones,
            syncUserDevices,
            gamepads,
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
};
