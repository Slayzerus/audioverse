import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SettingsPage from '../pages/settings/SettingsPage';

const mockSetDifficulty = vi.fn();
let mockDifficulty = 'normal';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../contexts/GameContext', () => ({
    useGameContext: () => ({
        difficulty: mockDifficulty,
        setDifficulty: mockSetDifficulty,
    }),
    Difficulty: {},
}));

vi.mock('../contexts/GamepadNavigationContext', () => ({
    useGamepadNavigation: () => ({ register: () => () => {}, unregister: () => {}, activeId: null, setActive: () => {}, pushFocusTrap: () => {}, popFocusTrap: () => {} }),
    GamepadNavigationProvider: ({ children }: any) => children,
}));

describe('SettingsPage', () => {
    beforeEach(() => {
        mockDifficulty = 'normal';
        mockSetDifficulty.mockClear();
    });

    it('renders title', () => {
        render(<MemoryRouter><SettingsPage /></MemoryRouter>);
        expect(screen.getByText('settingsPage.title')).toBeDefined();
    });

    it('renders difficulty label', () => {
        render(<MemoryRouter><SettingsPage /></MemoryRouter>);
        expect(screen.getByText('settingsPage.difficulty')).toBeDefined();
    });

    it('renders 3 difficulty options', () => {
        render(<MemoryRouter><SettingsPage /></MemoryRouter>);
        const select = screen.getByRole('combobox') as HTMLSelectElement;
        expect(select.options).toHaveLength(3);
    });

    it('shows current difficulty value', () => {
        render(<MemoryRouter><SettingsPage /></MemoryRouter>);
        const select = screen.getByRole('combobox') as HTMLSelectElement;
        expect(select.value).toBe('normal');
    });

    it('calls setDifficulty on change', async () => {
        const user = userEvent.setup();
        render(<MemoryRouter><SettingsPage /></MemoryRouter>);
        const select = screen.getByRole('combobox');
        await user.selectOptions(select, 'hard');
        expect(mockSetDifficulty).toHaveBeenCalledWith('hard');
    });

    it('renders difficulty hint', () => {
        render(<MemoryRouter><SettingsPage /></MemoryRouter>);
        expect(screen.getByText('settingsPage.difficultyHint')).toBeDefined();
    });

    it('has easy/normal/hard options', () => {
        render(<MemoryRouter><SettingsPage /></MemoryRouter>);
        expect(screen.getByText('settingsPage.easy')).toBeDefined();
        expect(screen.getByText('settingsPage.normal')).toBeDefined();
        expect(screen.getByText('settingsPage.hard')).toBeDefined();
    });
});
