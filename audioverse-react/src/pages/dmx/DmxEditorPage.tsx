// DmxEditorPage.tsx
import { useTranslation } from 'react-i18next';
import DmxEditor from "../../components/controls/dmx/DmxEditor";

export default function DmxEditorPage() {
    const { t } = useTranslation();
    return (
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
            <header>
                <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
                    {t('dmxEditor.pageTitle', 'DMX Editor')}
                </h1>
                <p style={{ color: "var(--text-secondary, #6b7280)", fontSize: 14 }}>
                    {t('dmxEditor.pageDescription', 'Manage DMX devices, port configuration and channels.')}
                </p>
            </header>

            <section>
                <DmxEditor />
            </section>
        </div>
    );
}
