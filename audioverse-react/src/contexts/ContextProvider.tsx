import React from "react";
import { UserProvider } from "./UserContext";
import { GameProvider } from "./GameContext";
import { AudioProvider } from "./AudioContext";
import { KaraokeGameProvider } from "./KaraokeGameContext";
import { BreadcrumbProvider } from "../components/breadcrumbs";
import { MiniGameLobbyProvider } from "./MiniGameLobbyContext";

export const ContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AudioProvider>
    <UserProvider>
      <BreadcrumbProvider>
        <GameProvider>
          <KaraokeGameProvider>
            <MiniGameLobbyProvider>
              {children}
            </MiniGameLobbyProvider>
          </KaraokeGameProvider>
        </GameProvider>
      </BreadcrumbProvider>
    </UserProvider>
  </AudioProvider>
);
