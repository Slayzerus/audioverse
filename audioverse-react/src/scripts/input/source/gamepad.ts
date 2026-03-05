// gamepad.ts
export class GamepadManager {
    private listeners: ((gamepads: GamepadState[]) => void)[] = [];
    private gamepads: GamepadState[] = [];

    constructor() {
        window.addEventListener("gamepadconnected", this.connectHandler);
        window.addEventListener("gamepaddisconnected", this.disconnectHandler);
        this.pollGamepads();
    }

    private connectHandler = (event: GamepadEvent) => {
        this.updateGamepad(event.gamepad);
    };

    private disconnectHandler = (event: GamepadEvent) => {
        this.gamepads = this.gamepads.filter(gp => gp.id !== event.gamepad.index);
        this.notifyListeners();
    };

    private updateGamepad(gamepad: Gamepad) {
        const updatedGamepad: GamepadState = {
            id: gamepad.index,
            buttons: gamepad.buttons.map(btn => btn.pressed),
            axes: [...gamepad.axes], // Copy axes values to avoid readonly issue
        };

        const existingIndex = this.gamepads.findIndex(gp => gp.id === gamepad.index);
        if (existingIndex !== -1) {
            this.gamepads[existingIndex] = updatedGamepad;
        } else {
            this.gamepads.push(updatedGamepad);
        }

        this.notifyListeners();
    }

    private pollGamepads = () => {
        setInterval(() => {
            const gamepads = navigator.getGamepads();
            if (gamepads) {
                this.gamepads = Array.from(gamepads)
                    .filter(gp => gp !== null)
                    .map(gp => ({
                        id: gp!.index,
                        buttons: gp!.buttons.map(btn => btn.pressed),
                        axes: [...gp!.axes], // Copy axes values
                    }));
                this.notifyListeners();
            }
        }, 100);
    };

    private notifyListeners() {
        this.listeners.forEach(listener => listener(this.gamepads));
    }

    public subscribe(listener: (gamepads: GamepadState[]) => void) {
        this.listeners.push(listener);
    }
}

export type GamepadState = {
    id: number;
    buttons: boolean[];
    axes: number[];
};