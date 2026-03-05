import React, { Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useGameBridge } from '../../../../honest-living/packages/client/src/hooks/useGameBridge'
import { useRouteSync } from '../../../../honest-living/packages/client/src/hooks/useRouteSync'
import { ErrorBoundary } from '../../../../honest-living/packages/client/src/components/ui/ErrorBoundary'
import { ToastContainer } from '../../../../honest-living/packages/client/src/components/ui/ToastContainer'
import PageSpinner from '../../components/common/PageSpinner'

// Lazy-load all Honest Living sub-pages
const MainMenuPage = React.lazy(() => import('../../../../honest-living/packages/client/src/pages/MainMenuPage'))
const WorldSelectPage = React.lazy(() => import('../../../../honest-living/packages/client/src/pages/WorldSelectPage'))
const CharacterSelectPage = React.lazy(() => import('../../../../honest-living/packages/client/src/pages/CharacterSelectPage'))
const PlayPage = React.lazy(() => import('../../../../honest-living/packages/client/src/pages/PlayPage'))
const LoadGamePage = React.lazy(() => import('../../../../honest-living/packages/client/src/pages/LoadGamePage'))
const EditorPage = React.lazy(() => import('../../../../honest-living/packages/client/src/pages/EditorPage'))
const ModEditorPage = React.lazy(() => import('../../../../honest-living/packages/client/src/pages/ModEditorPage'))
const ModsMenuPage = React.lazy(() => import('../../../../honest-living/packages/client/src/pages/ModsMenuPage'))
const ModManagerPage = React.lazy(() => import('../../../../honest-living/packages/client/src/pages/ModManagerPage'))
const SettingsPage = React.lazy(() => import('../../../../honest-living/packages/client/src/pages/SettingsPage'))

/**
 * Wrapper page that integrates the Honest Living game into AudioVerse.
 * Provides the game bridges (EventBus ↔ Store, route sync) and
 * renders sub-routes for all HL pages under /honest-living/*.
 */
export default function HonestLivingPage() {
  useGameBridge()
  useRouteSync()

  return (
    <div className="honest-living-root" style={{ width: '100%', minHeight: '80vh' }}>
      <ErrorBoundary>
        <Suspense fallback={<PageSpinner />}>
          <Routes>
            <Route index element={<MainMenuPage />} />
            <Route path="world" element={<WorldSelectPage />} />
            <Route path="character" element={<CharacterSelectPage />} />
            <Route path="play" element={<PlayPage />} />
            <Route path="load" element={<LoadGamePage />} />
            <Route path="editor" element={<EditorPage />} />
            <Route path="mods" element={<ModsMenuPage />} />
            <Route path="mod-manager" element={<ModManagerPage />} />
            <Route path="mod-editor" element={<ModEditorPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      <ToastContainer />
    </div>
  )
}
