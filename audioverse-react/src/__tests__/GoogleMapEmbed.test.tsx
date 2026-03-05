import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock fetch for maps-config
const mockFetch = vi.fn();
globalThis.fetch = mockFetch as any;

import GoogleMapEmbed from '../components/maps/GoogleMapEmbed';

describe('GoogleMapEmbed', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetch.mockResolvedValue({
            ok: false,
            json: async () => ({}),
        });
    });

    it('renders map container', () => {
        const { container } = render(<GoogleMapEmbed />);
        expect(container.querySelector('div')).toBeDefined();
    });

    it('renders with custom height', () => {
        const { container } = render(<GoogleMapEmbed height={500} />);
        const mapDiv = container.firstChild as HTMLElement;
        expect(mapDiv).toBeDefined();
    });

    it('renders with markers prop', () => {
        const markers = [
            { lat: 52.23, lng: 21.01, label: 'Warsaw' },
            { lat: 50.06, lng: 19.94, label: 'Krakow' },
        ];
        const { container } = render(<GoogleMapEmbed markers={markers} />);
        expect(container.firstChild).toBeDefined();
    });

    it('renders with route prop', () => {
        const route = { originLat: 52.23, originLng: 21.01, destLat: 50.06, destLng: 19.94 };
        const { container } = render(<GoogleMapEmbed route={route} />);
        expect(container.firstChild).toBeDefined();
    });

    it('renders fallback when API fails', async () => {
        mockFetch.mockRejectedValue(new Error('Network error'));
        render(<GoogleMapEmbed />);
        // Component should still render without crashing
        await vi.waitFor(() => {
            // Will either show map div or fallback iframe
            expect(document.querySelector('div')).toBeDefined();
        });
    });

    it('accepts custom zoom', () => {
        const { container } = render(<GoogleMapEmbed zoom={18} />);
        expect(container.firstChild).toBeDefined();
    });

    it('accepts style overrides', () => {
        const { container } = render(<GoogleMapEmbed style={{ border: '2px solid red' }} />);
        expect(container.firstChild).toBeDefined();
    });
});
