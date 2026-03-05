import { describe, it, expect } from 'vitest';

// Smoke tests for API modules to ensure they import correctly and export symbols
import * as apiPlaylists from '../scripts/api/apiPlaylists';
import * as apiUser from '../scripts/api/apiUser';
import * as apiTidalAuth from '../scripts/api/apiTidalAuth';
import * as apiMicrophoneAssignments from '../scripts/api/apiMicrophoneAssignments';
import * as apiLibraryUltrastar from '../scripts/api/apiLibraryUltrastar';
import * as apiLibraryStream from '../scripts/api/apiLibraryStream';
import * as apiLibraryLibrosa from '../scripts/api/apiLibraryLibrosa';
import * as apiLibraryAiVideo from '../scripts/api/apiLibraryAiVideo';
import * as apiLibraryAiAudio from '../scripts/api/apiLibraryAiAudio';
import * as apiLibrary from '../scripts/api/apiLibrary';
import * as apiEditor from '../scripts/api/apiEditor';
import * as apiDmx from '../scripts/api/apiDmx';
import * as apiConfig from '../scripts/api/apiConfig';
import * as apiAdmin from '../scripts/api/apiAdmin';
import * as audioverseApiClient from '../scripts/api/audioverseApiClient';

describe('API smoke imports', () => {
  it('imports apiPlaylists', () => expect(Object.keys(apiPlaylists).length).toBeGreaterThan(0));
  it('imports apiUser', () => expect(Object.keys(apiUser).length).toBeGreaterThan(0));
  it('imports apiTidalAuth', () => expect(Object.keys(apiTidalAuth).length).toBeGreaterThan(0));
  it('imports apiMicrophoneAssignments', () => expect(Object.keys(apiMicrophoneAssignments).length).toBeGreaterThan(0));
  it('imports apiLibraryUltrastar', () => expect(Object.keys(apiLibraryUltrastar).length).toBeGreaterThan(0));
  it('imports apiLibraryStream', () => expect(Object.keys(apiLibraryStream).length).toBeGreaterThan(0));
  it('imports apiLibraryLibrosa', () => expect(Object.keys(apiLibraryLibrosa).length).toBeGreaterThan(0));
  it('imports apiLibraryAiVideo', () => expect(Object.keys(apiLibraryAiVideo).length).toBeGreaterThan(0));
  it('imports apiLibraryAiAudio', () => expect(Object.keys(apiLibraryAiAudio).length).toBeGreaterThan(0));
  it('imports apiLibrary', () => expect(Object.keys(apiLibrary).length).toBeGreaterThan(0));
  it('imports apiEditor', () => expect(Object.keys(apiEditor).length).toBeGreaterThan(0));
  it('imports apiDmx', () => expect(Object.keys(apiDmx).length).toBeGreaterThan(0));
  it('imports apiConfig', () => expect(Object.keys(apiConfig).length).toBeGreaterThan(0));
  it('imports apiAdmin', () => expect(Object.keys(apiAdmin).length).toBeGreaterThan(0));
  it('imports audioverseApiClient', () => expect(Object.keys(audioverseApiClient).length).toBeGreaterThan(0));
});
