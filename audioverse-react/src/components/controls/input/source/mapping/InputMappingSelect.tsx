import React, { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import { InputType } from "../../../../../scripts/input/source/mapping/inputType";
import { GamepadState, GamepadManager } from "../../../../../scripts/input/source/gamepad";
import AudioInputSelect from "../../settings/AudioInputSelect";

interface InputMappingSelectProps {
    onMappingChange: (mapping: { inputType: InputType; device?: string; action: string }) => void;
}

const InputMappingSelect: React.FC<InputMappingSelectProps> = ({ onMappingChange }) => {
    const { t } = useTranslation();
    const [inputType, setInputType] = useState<InputType>(InputType.Keyboard);
    const [device, setDevice] = useState<string | null>(null);
    const [action, setAction] = useState<string>("");

    const [gamepads, setGamepads] = useState<Gamepad[]>([]);
    const [keys/*, setKeys*/] = useState<string[]>(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"]);
    const [notes/*, setNotes*/] = useState<string[]>(["C", "D", "E", "F", "G", "A", "B"]);

    useEffect(() => {
        if (inputType === InputType.Gamepad) {
            const gamepadManager = new GamepadManager();
            gamepadManager.subscribe((gamepadStates: GamepadState[]) => {
                setGamepads(
                    gamepadStates.map(state => navigator.getGamepads()[state.id]) // Pobieramy gamepada po `id`
                        .filter(gp => gp !== null) as Gamepad[] // Usuwamy `null`
                );
            });

        }
    }, [inputType]);

    useEffect(() => {
        onMappingChange({ inputType, device: device || undefined, action });
    }, [inputType, device, action, onMappingChange]);

    return (
        <div>
            <label>{t('inputMapping.inputType', 'Input Type')}:</label>
            <select value={inputType} onChange={(e) => setInputType(e.target.value as InputType)}>
                {Object.values(InputType).map(type => (
                    <option key={type} value={type}>{type}</option>
                ))}
            </select>

            {inputType === InputType.Gamepad && (
                <div>
                    <label>{t('inputMapping.device', 'Device')}:</label>
                    <select onChange={(e) => setDevice(e.target.value)}>
                        {gamepads.map(gp => (
                            <option key={gp.id} value={gp.id}>{gp.id}</option>
                        ))}
                    </select>
                </div>
            )}

            {inputType === InputType.Audio && (
                <AudioInputSelect selectedDevice={device} onDeviceChange={setDevice} />
            )}

            <label>{t('inputMapping.action', 'Action')}:</label>
            <select value={action} onChange={(e) => setAction(e.target.value)}>
                {(inputType === InputType.Keyboard ? keys : inputType === InputType.Gamepad ? gamepads.flatMap(gp => gp.buttons.map((_, i) => `Button ${i}`)) : notes)
                    .map(item => <option key={item} value={item}>{item}</option>)
                }
            </select>
        </div>
    );
};

export default InputMappingSelect;
