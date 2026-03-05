import { InputType } from "./source/mapping/inputType";

type InputEventCallback = (action: string) => void;

export class InputManager {
    private keyboardListeners: Set<InputEventCallback> = new Set();
    private gamepadListeners: Set<InputEventCallback> = new Set();
    private audioListeners: Set<InputEventCallback> = new Set();

    constructor() {
        window.addEventListener("keydown", this.handleKeyboardEvent);
        window.addEventListener("gamepadconnected", this.handleGamepadEvent);
        setInterval(this.pollGamepads, 100);
    }

    private handleKeyboardEvent = (event: KeyboardEvent) => {
        this.keyboardListeners.forEach(callback => callback(event.key));
    };

    private handleGamepadEvent = () => {
    };

    private pollGamepads = () => {
        const gamepads = navigator.getGamepads();
        if (gamepads) {
            Array.from(gamepads).forEach((gp, _index) => {
                if (gp) {
                    gp.buttons.forEach((button, i) => {
                        if (button.pressed) {
                            this.gamepadListeners.forEach(callback => callback(`Button ${i}`));
                        }
                    });
                }
            });
        }
    };

    public subscribe(inputType: InputType, callback: InputEventCallback) {
        if (inputType === InputType.Keyboard) this.keyboardListeners.add(callback);
        if (inputType === InputType.Gamepad) this.gamepadListeners.add(callback);
        if (inputType === InputType.Audio) this.audioListeners.add(callback);
    }

    public unsubscribe(inputType: InputType, callback: InputEventCallback) {
        if (inputType === InputType.Keyboard) this.keyboardListeners.delete(callback);
        if (inputType === InputType.Gamepad) this.gamepadListeners.delete(callback);
        if (inputType === InputType.Audio) this.audioListeners.delete(callback);
    }
}
