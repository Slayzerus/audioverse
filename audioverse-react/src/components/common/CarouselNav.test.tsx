/**
 * Tests for CarouselNav component
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

/* ── Mocks ── */
const mockRegister = vi.fn();
const mockUnregister = vi.fn();
const mockSetActive = vi.fn();

vi.mock('../../contexts/GamepadNavigationContext', () => ({
    useGamepadNavigation: () => ({
        register: mockRegister,
        unregister: mockUnregister,
        setActive: mockSetActive,
        activeId: null,
        pushFocusTrap: vi.fn(),
        popFocusTrap: vi.fn(),
    }),
}));

vi.mock('./useFocusableLayout', () => ({
    useFocusableLayout: () => ({
        ref: { current: document.createElement('div') },
        layout: { x: 0, y: 0, width: 100, height: 50 },
    }),
}));

vi.mock('../../services/navigationLogger', () => ({
    navigationLogger: { error: vi.fn(), debug: vi.fn() },
}));

import { CarouselNav, type CarouselLevel, type CarouselItem } from './CarouselNav';

beforeEach(() => {
    vi.clearAllMocks();
});

/* ── Test data ── */
const sampleItems: CarouselItem[] = [
    { id: 'rock', label: 'Rock', icon: '🎸', color: '#e040fb' },
    { id: 'pop', label: 'Pop', icon: '🎤', color: '#42a5f5' },
    { id: 'jazz', label: 'Jazz', icon: '🎷', color: '#ffa726' },
];

const sampleLevels: CarouselLevel[] = [
    { title: 'Genres', items: sampleItems },
];

const hierarchicalLevels: CarouselLevel[] = [
    {
        title: 'Browse by',
        items: [
            { id: 'all', label: 'All', icon: '🎵' },
            { id: 'genre', label: 'Genre', icon: '🎸', children: sampleItems },
        ],
    },
    { title: 'Genre', items: sampleItems },
];

/* ── Tests ── */
describe('CarouselNav', () => {
    it('renders all items from level', () => {
        render(<CarouselNav levels={sampleLevels} idPrefix="test-" />);
        expect(screen.getByText('Rock')).toBeDefined();
        expect(screen.getByText('Pop')).toBeDefined();
        expect(screen.getByText('Jazz')).toBeDefined();
    });

    it('shows level title with item count', () => {
        render(<CarouselNav levels={sampleLevels} idPrefix="test-" />);
        expect(screen.getByText('Genres')).toBeDefined();
        expect(screen.getByText('(3)')).toBeDefined();
    });

    it('calls onSelect when item is clicked', () => {
        const onSelect = vi.fn();
        render(<CarouselNav levels={sampleLevels} onSelect={onSelect} idPrefix="test-" />);
        fireEvent.click(screen.getByText('Rock'));
        expect(onSelect).toHaveBeenCalledWith(
            expect.objectContaining({ id: 'rock', label: 'Rock' }),
            0,
        );
    });

    it('shows empty state when no items', () => {
        const emptyLevels: CarouselLevel[] = [{ title: 'Empty', items: [] }];
        render(<CarouselNav levels={emptyLevels} idPrefix="test-" />);
        expect(screen.getByText('No items')).toBeDefined();
    });

    it('registers Focusable elements for gamepad navigation', () => {
        render(<CarouselNav levels={sampleLevels} idPrefix="test-" />);
        // 3 items should register with the navigation system
        expect(mockRegister).toHaveBeenCalled();
        const registeredIds = mockRegister.mock.calls.map((c: unknown[]) =>
            (c[0] as { id: string }).id,
        );
        expect(registeredIds).toContain('test-item-rock');
        expect(registeredIds).toContain('test-item-pop');
        expect(registeredIds).toContain('test-item-jazz');
    });

    it('does not show breadcrumbs for single level', () => {
        render(<CarouselNav levels={sampleLevels} idPrefix="test-" />);
        // No breadcrumb separator should be present
        expect(screen.queryByText('›')).toBeNull();
    });

    it('applies custom cardHeight and visibleCount', () => {
        const { container } = render(
            <CarouselNav levels={sampleLevels} idPrefix="test-" cardHeight={120} visibleCount={3} />,
        );
        const buttons = container.querySelectorAll('button[aria-label]');
        expect(buttons.length).toBe(3);
        // Check first button has the custom height
        const btn = buttons[0] as HTMLElement;
        expect(btn.style.height).toBe('120px');
    });

    it('supports hierarchical=false mode', () => {
        render(
            <CarouselNav levels={hierarchicalLevels} idPrefix="test-" hierarchical={false} />,
        );
        // Should not show drill indicator (▶) when hierarchical is disabled
        expect(screen.queryByText('▶')).toBeNull();
    });

    it('shows arrows when items exceed visibleCount', () => {
        const manyItems: CarouselItem[] = Array.from({ length: 10 }, (_, i) => ({
            id: `item-${i}`,
            label: `Item ${i}`,
        }));
        const levels: CarouselLevel[] = [{ title: 'Many', items: manyItems }];
        const { container } = render(
            <CarouselNav levels={levels} idPrefix="test-" visibleCount={3} />,
        );
        expect(container.textContent).toContain('◀');
        expect(container.textContent).toContain('▶');
    });

    it('does not show arrows when items fit in view', () => {
        const { container } = render(
            <CarouselNav levels={sampleLevels} idPrefix="test-" visibleCount={5} />,
        );
        expect(container.textContent).not.toContain('◀');
    });

    it('calls onFocus when item is activated', () => {
        const onFocus = vi.fn();
        render(<CarouselNav levels={sampleLevels} onFocus={onFocus} idPrefix="test-" />);
        fireEvent.click(screen.getByText('Pop'));
        expect(onFocus).toHaveBeenCalledWith(
            expect.objectContaining({ id: 'pop' }),
            1,
        );
    });

    it('renders sublabels when provided', () => {
        const levelsWithSub: CarouselLevel[] = [{
            title: 'Test',
            items: [{ id: 'a', label: 'Alpha', sublabel: '42 songs' }],
        }];
        render(<CarouselNav levels={levelsWithSub} idPrefix="test-" />);
        expect(screen.getByText('42 songs')).toBeDefined();
    });
});

describe('CarouselNav — useModalFocusTrap hook', () => {
    it('useModalFocusTrap module exports correctly', async () => {
        const mod = await import('../../hooks/useModalFocusTrap');
        expect(typeof mod.useModalFocusTrap).toBe('function');
    });
});
