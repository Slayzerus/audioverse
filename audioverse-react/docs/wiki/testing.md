# Testy — Frontend

## Narzędzia
| Narzędzie | Cel |
|-----------|-----|
| Vitest | Testy jednostkowe i integracyjne |
| React Testing Library | Renderowanie i interakcja z komponentami |
| Playwright | Testy E2E (end-to-end) |
| Cypress | Testy E2E (alternatywa) |

## Statystyki
- **122 pliki testowe** w katalogu `test/`
- **1578+ testów** — wszystkie przechodzą (PASS)
- **0 błędów TypeScript** — strict mode

## Uruchamianie

```bash
# Testy jednostkowe
npx vitest

# Testy z coverage
npx vitest --coverage

# Testy E2E (Playwright)
npx playwright test

# Testy E2E (Cypress)
npx cypress run
```

## Konwencje

### Nazewnictwo plików
```
ComponentName.test.tsx    # test komponentu
utilFunction.test.ts      # test utility
hookName.test.tsx         # test hooka
```

### Struktura testów
```typescript
describe('ComponentName', () => {
    it('should render correctly', () => {
        render(<Component />);
        expect(screen.getByText('label')).toBeInTheDocument();
    });

    it('should handle user interaction', async () => {
        const user = userEvent.setup();
        render(<Component />);
        await user.click(screen.getByRole('button'));
        expect(screen.getByText('result')).toBeVisible();
    });
});
```

### Mockowanie
```typescript
// API mocking
vi.mock('../../scripts/api/apiUser', () => ({
    getUserMicrophones: vi.fn().mockResolvedValue([]),
}));

// Context mocking
const wrapper = ({ children }) => (
    <GameProvider>
        <AudioProvider>{children}</AudioProvider>
    </GameProvider>
);
```

## Konfiguracja

### vitest.config.ts
```typescript
export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './vitest.setup.ts',
        include: ['test/**/*.test.{ts,tsx}'],
    },
});
```

### vitest.setup.ts
Setup globalny:
- Polyfill `ResizeObserver`, `IntersectionObserver`
- Mock `navigator.mediaDevices`
- Mock `AudioContext`, `MediaRecorder`
- Konfiguracja @testing-library/jest-dom

## Pokrycie kodu (Coverage)

Generowanie raportu pokrycia:
```bash
npx vitest --coverage --reporter=text
```

Progi pokrycia nie są wymagane, ale monitorowane.
