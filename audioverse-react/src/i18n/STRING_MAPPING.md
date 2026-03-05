# AudioVerse i18n String Extraction — File-by-File Mapping

> Generated from 39 files (PlayPage.tsx was not found).
> Convention: `namespace.key` → `t('namespace.key')` or `t('namespace.key', { param: value })`

---

## 1. AudioEditor.tsx
**Path:** `src/components/controls/editor/AudioEditor.tsx` (2255 lines)
**Namespace:** `editor.*`, `common.*`

| Line(s) | Original String (PL/EN) | Translation Key |
|---------|------------------------|-----------------|
| ~540 | `"Zaimportowano projekt z pliku"` | `editor.importedProject` |
| ~542 | `"Błąd importu: " + error` | `editor.importError` |
| ~547 | `"Szablon projektu zapisany!"` | `editor.templateSaved` |
| ~550 | `"Brak zapisanego szablonu"` | `editor.noTemplate` |
| ~553 | `"Załadowano szablon projektu"` | `editor.templateLoaded` |
| ~556 | `"Błąd zapisu szablonu: "` | `editor.templateSaveError` |
| ~559 | `"Błąd ładowania szablonu: "` | `editor.templateLoadError` |
| ~570 | `"Section"` | `editor.defaultSectionName` |
| ~580 | `"New Layer"` | `editor.defaultLayerName` |
| ~590 | `"Usunąć sekcję?"` | `editor.deleteSectionConfirm` |
| ~608 | `"Warstwa jest zablokowana (Lock). Odblokuj aby usunąć."` | `editor.layerLocked` |
| ~613 | `"Usunąć warstwę?"` | `editor.deleteLayerConfirm` |
| ~643 | `"Volume musi być liczbą"` | `editor.volumeMustBeNumber` |
| ~647 | `"Nazwa projektu nie może być pusta"` | `editor.projectNameRequired` |
| ~659 | `"Projekt zapisany"` | `editor.projectSaved` |
| ~668 | `"Nazwa sekcji nie może być pusta"` | `editor.sectionNameRequired` |
| ~673 | `"Order musi być liczbą"` | `editor.orderMustBeNumber` |
| ~691 | `"Sekcja zapisana"` | `editor.sectionSaved` |
| ~748 | `"Wybierz warstwę, aby nagrywać."` | `editor.selectLayerToRecord` |
| ~799 | `"Wybierz warstwę przed nagrywaniem"` | `editor.selectLayerBeforeRecording` |
| ~780 | `"Recording"` (clip label) | `editor.recording` |
| ~909 | `Preset "${name}" saved` | `editor.presetSaved` |
| ~1440 | `"Projekt"` (h5) | `editor.project` |
| ~1443 | `"Nazwa"` (label) | `editor.projectName` |
| ~1452 | `"Is template"` | `editor.isTemplate` |
| ~1457 | `"Volume"` | `editor.volume` |
| ~1463 | `"np. 0.8"` | `editor.volumePlaceholder` |
| ~1469 | `"💾 Zapisz jako szablon"` | `editor.saveAsTemplate` |
| ~1473 | `"📂 Załaduj szablon"` | `editor.loadTemplate` |
| ~1480 | `"⬇️ Eksportuj projekt"` | `editor.exportProject` |
| ~1484 | `"⬆️ Importuj projekt"` | `editor.importProject` |
| ~1493 | `"Zapisz projekt (PUT)"` | `editor.saveProjectPut` |
| ~1497 | `"🎵 Bounce (eksportuj WAV)"` | `editor.bounceWav` |
| ~1502 | `"Sekcja"` (h6) | `editor.section` |
| ~1536 | `"Zapisz sekcję (PUT)"` | `editor.saveSectionPut` |
| ~1415 | `"☀️ Jasny"` / `"🌙 Ciemny"` | `editor.themeLight` / `editor.themeDark` |
| ~1420 | `"Skróty klawiszowe"` | `editor.shortcuts` |
| ~1424-1428 | Shortcut descriptions | `editor.shortcutUndo` .. `editor.shortcutHelp` |
| ~1700 | `"Wybrany clip"` / `"Brak zaznaczonego clipu"` | `editor.selectedClip` / `editor.noSelectedClip` |
| ~1702 | `"Split (przy playhead)"` | `editor.splitAtPlayhead` |
| ~1705 | `"Cut/Delete"` | `editor.cutDelete` |
| ~1708 | `"Copy"` / `"Paste → aktywna warstwa"` | `common.copy` / `editor.pasteToActiveLayer` |
| ~1714 | `"Reverse"` | `editor.reverse` |
| ~1717 | `"Fade In"` / `"Fade Out"` | `editor.fadeIn` / `editor.fadeOut` |
| ~1613 | `"Advanced Editing"` | `editor.advancedEditing` |
| ~1620 | `"No clips selected"` / `"{{count}} clip(s) selected"` | `editor.noClipsSelected` / `editor.clipsSelected` |
| ~1625 | `"Clear Selection"` | `editor.clearSelection` |
| ~1634 | `"Ripple Mode"` | `editor.rippleMode` |
| ~1848-1870 | Layer buttons: `"Solo"`, `"Mute"`, `"Vol"`, `"Pan"`, etc. | `editor.solo`, `editor.mute`, `editor.vol`, `editor.pan` |
| ~1900 | `"Audio"` / `"MIDI"` | `editor.trackAudio` / `editor.trackMidi` |
| ~1920 | `"Sine"`, `"Square"`, `"Saw"`, `"Triangle"` | `editor.instrumentSine`, etc. |
| ~1940 | `"Lock"` | `editor.lock` |
| ~1960 | `"Muted via Solo/Mute"` / `"Locked (drag/drop disabled)"` | `editor.mutedViaSoloMute` / `editor.lockedDragDisabled` |
| ~2000 | `"+ EQ3"`, `"+ Comp"`, `"+ Delay"`, `"+ Reverb"`, `"+ Distortion"` | `editor.addEQ3`, `editor.addComp`, etc. |

---

## 2. UserProfileSettingsPage.tsx
**Path:** `src/pages/profile/UserProfileSettingsPage.tsx`
**Namespace:** `profile.*`

| Line(s) | Original String | Translation Key |
|---------|----------------|-----------------|
| h2 | `"Ustawienia profilu użytkownika"` | `profile.settings` |
| label | `"Tryb deweloperski (DeveloperMode)"` | `profile.developerMode` |
| label | `"Jurorzy (AI ocena)"` | `profile.jurors` |
| label | `"Tryb pełnoekranowy"` | `profile.fullscreen` |
| button | `"Zapisz ustawienia"` | `profile.saveSettings` |
| h4 | `"Gracze profilu"` | `profile.players` |
| button | `"Odśwież"` | `common.refresh` |
| placeholder | `"Nowy gracz - imię"` | `profile.newPlayerName` |
| placeholder | `"Kolor (np. #ff0000)"` | `profile.colorPlaceholder` |
| label | `"Ustaw jako główny gracz (Primary)"` | `profile.setPrimary` |
| button | `"Dodaj gracza do profilu"` | `profile.addPlayerToProfile` |
| text | `"Brak graczy (załaduj profil)"` | `profile.noPlayers` |
| button | `"Edytuj"` | `common.edit` |
| button | `"Ustaw Primary"` | `profile.setPrimaryBtn` |
| button | `"Usuń Primary"` | `profile.removePrimaryBtn` |
| button | `"Usuń"` | `common.delete` |
| modal | `"Edytuj gracza profilu"` | `profile.editPlayerModal` |
| text | `"Nie wykryto profileId w kontekście użytkownika"` | `profile.noProfileId` |
| toast | `"Zapisano ustawienia!"` | `profile.settingsSaved` |
| toast | `"Błąd zapisu ustawień"` | `profile.settingsSaveError` |

---

## 3. PartyPage.tsx
**Path:** `src/pages/profile/PartyPage.tsx` (685 lines)
**Namespace:** `party.*`

| Line(s) | Original String | Translation Key |
|---------|----------------|-----------------|
| ~424 | `"Nieprawidłowe ID imprezy."` | `party.invalidId` |
| ~425 | `"← Wróć do listy"` | `party.backToList` |
| ~430 | `"Ładowanie imprezy..."` | `party.loadingParty` |
| ~434 | `"Nie udało się załadować imprezy."` | `party.loadError` |
| ~485 | `"Błąd zapisu."` | `party.saveError` |
| ~500 | `"Odrzucić żądanie i usunąć przypisanie?"` | `party.rejectConfirm` |
| ~502 | `"Wpis odrzucony"` | `party.rejected` |
| ~504 | `"Nie udało się odrzucić wpisu"` | `party.rejectFailed` |
| ~520 | `"Zaproszenia"` (card title) | `party.invites` |
| ~525 | `"Link do dołączenia z telefonu"` | `party.phoneJoinLink` |
| ~530 | `"📋 Kopiuj"` | `common.copy` |
| ~531 | `"Link skopiowany!"` | `party.linkCopied` |
| ~533 | `"Udostępnij ten link..."` | `party.shareLink` |
| ~540 | `"Do (email lub userId)"` | `party.inviteTo` |
| ~546 | `"Wysyłanie..."` / `"Wyślij"` | `party.inviteSending` / `common.send` |
| ~548 | `"Podaj email lub userId"` | `party.provideEmailOrUserId` |
| ~552 | `"Tylko organizator może wysyłać zaproszenia."` | `party.onlyOrganizerCanInvite` |
| ~558 | `"Lista zaproszeń"` | `party.inviteList` |
| ~576 | `"Anulować zaproszenie?"` | `party.cancelInviteConfirm` |
| ~583 | `"Zaproszenie przyjęte"` / `"Zaproszenie odrzucone"` | `party.inviteAccepted` / `party.inviteRejected` |
| ~600 | `"Ustawienia (Typ / Dostęp)"` | `party.settingsTitle` |

---

## 4. RoundPlayersModal.tsx
**Path:** `src/components/controls/party/RoundPlayersModal.tsx`
**Namespace:** `party.roundPlayers.*`

| Original String | Translation Key |
|-----------------|-----------------|
| `"Przypisania rundy #${roundId}"` | `party.roundPlayers.title` |
| `"Oczekujące (waiting)"` | `party.roundPlayers.waiting` |
| `"Zatwierdzone (approved)"` | `party.roundPlayers.approved` |
| `"Zatwierdź"` | `party.roundPlayers.approve` |
| `"Zatwierdź wybrane"` | `party.roundPlayers.approveSelected` |
| `"Brak oczekujących"` | `party.roundPlayers.noWaiting` |
| `"Dodaj przypisanie"` | `party.roundPlayers.addAssignment` |
| `"Wybierz z Twoich graczy..."` | `party.roundPlayers.selectPlayer` |
| `"lub wpisz playerId"` | `party.roundPlayers.orTypePlayerId` |
| `"slot (opcjonalnie)"` | `party.roundPlayers.slotOptional` |
| `"Edytuj slot"` | `party.roundPlayers.editSlot` |
| `"Dodaj"` / `"Zamknij"` / `"Zapisz"` / `"Anuluj"` | `common.add` / `common.close` / `common.save` / `common.cancel` |

---

## 5. PartsModal.tsx
**Path:** `src/components/controls/party/PartsModal.tsx`
**Namespace:** `party.parts.*`

| Original String | Translation Key |
|-----------------|-----------------|
| `"Części rundy #${roundId}"` | `party.parts.title` |
| `"Brak części dla tej rundy."` | `party.parts.noParts` |
| `"Istniejące części:"` | `party.parts.existing` |
| `"Numer"` / `"Player"` | `party.parts.sortNumber` / `party.parts.sortPlayer` |
| `"Część #${p.partNumber}"` | `party.parts.partNumber` |
| `"wolna"` | `common.free` |
| `"Zarezerwuj"` | `party.parts.reserve` |
| `"Moja"` / `"Zajęta"` | `common.mine` / `common.taken` |
| `"Dodaj nową część"` | `party.parts.addNew` |
| `"Numer części"` | `party.parts.partNumberLabel` |
| `"PlayerId (opcjonalnie)"` | `party.parts.playerIdOptional` |
| `"Dodaj część"` | `party.parts.addPart` |
| `"Usuń przypisanie tej części?"` | `party.parts.removeConfirm` |

---

## 6. AudioPitchLevel.tsx
**Path:** `src/components/controls/input/source/AudioPitchLevel.tsx` (965 lines)
**Namespace:** `pitch.*`

| Original String | Translation Key |
|-----------------|-----------------|
| `"Nie udało się utworzyć rekordu mikrofonu."` | `pitch.createRecordError` |
| `"Ustawienia zapisane!"` | `pitch.settingsSaved` |
| `"Błąd zapisu: "` | `pitch.saveError` |
| `"Zaimportowano ustawienia!"` | `pitch.importedSettings` |
| `"Błąd importu: "` | `pitch.importError` |
| `"Metoda detekcji pitchu:"` | `pitch.detectionMethod` |
| `"Wykres częstotliwości (FFT)"` | `pitch.fftChart` |
| `"Linia czasu z nutą (ostatnie 5s)"` | `pitch.noteTimeline` |
| `"Smoothing:"` / `"Hysteresis:"` / `"RMS:"` / `"Hanning:"` | `pitch.smoothing` .. `pitch.hanning` |
| `"Mic gain:"` | `pitch.micGain` |
| `"Odsłuch"` | `pitch.monitor` |
| `"Głośność odsłuchu:"` | `pitch.monitorVolume` |
| `"Próg łapania:"` | `pitch.pitchThreshold` |
| `"💾 Zapisz"` / `"⬇️ Eksportuj"` / `"Resetuj"` / `"⬆️ Importuj"` | `pitch.saveBtn` .. `pitch.importBtn` |
| `"🔧 Kalibruj latency"` | `pitch.calibrateLatency` |
| `"Kalibrator opóźnienia mikrofonu"` (modal) | `latency.modalTitle` |

---

## 7. KaraokeSongBrowser.tsx
**Path:** `src/components/controls/karaoke/KaraokeSongBrowser.tsx` (916 lines)
**Namespace:** `karaoke.*`

| Original String | Translation Key |
|-----------------|-----------------|
| `"Tytuł"` / `"Artysta"` / `"Rok"` / `"Gatunek"` | `karaoke.sortTitle` .. `karaoke.sortGenre` |
| `"Dodano do playlisty"` | `karaoke.addedToPlaylist` |
| `"Nie udało się dodać do playlisty"` | `karaoke.addToPlaylistFailed` |
| `"Usunięto z playlisty"` | `karaoke.removedFromPlaylist` |
| `"Nie udało się usunąć z playlisty"` | `karaoke.removeFromPlaylistFailed` |
| `"Maksymalnie ${max} piosenek"` | `karaoke.maxSongs` |
| `"🔍 Szukaj tytułu, artysty…"` | `karaoke.searchPlaceholder` |
| `"Ukryj filtry ✕"` / `"Filtry ▾"` | `common.hideFilters` / `common.showFilters` |
| `"✓ Zatwierdź (${count})"` | `karaoke.confirmSelection` |
| `"Gatunek: Wszystkie"` | `karaoke.genreAll` |
| `"Język: Wszystkie"` | `karaoke.languageAll` |
| `"Rok: Wszystkie"` | `karaoke.yearAll` |
| `"Wyczyść filtry"` | `common.clearFilters` |
| `"${count} utworów"` | `karaoke.songCount` |
| `"${count} zaznaczonych"` | `karaoke.selectedCount` |
| `"Ładowanie…"` | `karaoke.loadingSongs` |
| `"Błąd ładowania piosenek."` | `karaoke.loadError` |
| `"Lista piosenek"` (aria-label) | `karaoke.songsList` |
| `"Usuń z playlisty"` (title) | `karaoke.removeFromPlaylist` |
| `"Dodaj do playlisty"` (title) | `karaoke.addToPlaylist` |
| `"Graj"` (title) | `karaoke.playButton` |
| `"Brak piosenek spełniających kryteria"` | `karaoke.noSongsMatch` |

---

## 8. GenericPlaylist.tsx
**Path:** `src/components/playlists/GenericPlaylist.tsx`
**Namespace:** `playlist.*`

| Original String | Translation Key |
|-----------------|-----------------|
| `"Brak utworów. Dodaj pierwszy poniżej."` | `playlist.empty` |
| `"Dodaj utwór"` | `playlist.addSong` |
| `"Playlist"` (h3) | `playlist.title` |
| `"Wklej wiele pozycji naraz"` | `playlist.bulkPaste` |
| `"Wklej linie w formacie:..."` | `playlist.bulkPlaceholder` |
| `"Każda linia zostanie dodana jako osobny utwór."` | `playlist.bulkHelp` |
| `"Dodaj z listy"` | `playlist.addFromList` |

---

## 9. PlayerForm.tsx
**Path:** `src/components/controls/player/PlayerForm.tsx`
**Namespace:** `player.*`

| Original String | Translation Key |
|-----------------|-----------------|
| `"Wybierz istniejącego gracza"` | `player.selectExisting` |
| `"-- Nowy gracz --"` | `player.newPlayer` |
| `"Imię gracza"` | `player.playerName` / `player.playerNamePlaceholder` |
| `"Kolor gracza"` | `player.playerColor` |
| `"Preferowane kolory (kolejność)"` | `player.preferredColors` |
| `"Oczekiwanie na załadowanie profilu użytkownika..."` | `player.waitingForProfile` |
| `"Ładowanie profilu użytkownika..."` | `player.loadingProfile` |
| `"Brak profilu użytkownika"` | `player.noProfile` |
| `"Zapisywanie..."` / `"Dodawanie..."` | `common.saving` / `common.adding` |
| `"Zapisz"` / `"Dodaj gracza"` | `player.saveBtn` / `player.addPlayerBtn` |
| `"Błąd edycji gracza"` | `player.editError` |
| `"Błąd dodawania gracza"` | `player.addError` |
| `"Błąd usuwania gracza"` | `player.deleteError` |

---

## 10. AnimatedPersons.tsx
**Path:** `src/components/characters/AnimatedPersons.tsx`
**Namespace:** `characters.*`

| Original String | Translation Key |
|-----------------|-----------------|
| `"Dodaj"` | `characters.addBtn` |
| `"Reset (8 domyślnych)"` | `characters.resetDefault` |
| `"Pobierz JSON"` | `characters.downloadJson` |
| `"Kopiuj"` | `characters.copyBtn` |
| `"Wczytaj"` | `characters.loadBtn` |
| `"Edytujesz:"` | `characters.editing` |
| `"Nieprawidłowy plik JSON"` | `characters.invalidJson` |
| `"Kształt twarzy"` .. `"Rekwizyt"` | `characters.faceShape` .. `characters.prop` |
| `"Rozmiar"` | `characters.size` |

---

## 11. PartyChat.tsx
**Path:** `src/components/controls/party/PartyChat.tsx`
**Namespace:** `party.chat.*`

| Original String | Translation Key |
|-----------------|-----------------|
| `"Brak wiadomości."` | `party.chat.noMessages` |
| `"Napisz wiadomość..."` | `party.chat.placeholder` |
| `"Wyślij"` | `party.chat.send` |
| `"Wysłano"` | `party.chat.sent` |
| `"Błąd wysyłania wiadomości"` | `party.chat.sendError` |

---

## 12. PartySettings.tsx
**Path:** `src/components/controls/party/PartySettings.tsx`
**Namespace:** `party.*`

| Original String | Translation Key |
|-----------------|-----------------|
| `"Status:"` / `"Typ:"` / `"Dostęp:"` / `"Kod:"` | `party.status` / `party.type` / `party.access` / `party.code` |
| `"Zapisz"` (button title) | `common.save` |

---

## 13. LatencyCalibrator.tsx
**Path:** `src/components/controls/input/source/LatencyCalibrator.tsx`
**Namespace:** `latency.*`

| Original String | Translation Key |
|-----------------|-----------------|
| `"Kalibrator opóźnienia — mikrofon"` | `latency.title` |
| `"Kalibruj"` / `"Wyczyść"` | `latency.calibrate` / `latency.clear` |
| `"Status:"` / `"Zmierzony offset:"` / `"brak"` | `latency.status` / `latency.measuredOffset` / `common.none` |
| `"Zapisz (do backend)"` | `latency.saveToBackend` |
| `"Zamknij"` | `common.close` |
| `"Nie wykryto sygnału..."` | `latency.noSignal` |
| `"Zmierzono ~X ms (est)"` | `latency.measured` |
| `"Zapisano lokalnie..."` | `latency.savedLocally` |
| `"Zapisano do profilu (backend)"` | `latency.savedToBackend` |
| `"Błąd kalibracji:"` | `latency.calibrationError` |
| `"Błąd zapisu:"` | `latency.saveError` |
| `"Requesting microphone..."` | `latency.requestingMic` |

---

## 14. LoginForm.tsx
**Path:** `src/components/auth/LoginForm.tsx`
**Namespace:** `auth.*`

| Original String | Translation Key |
|-----------------|-----------------|
| `"Logowanie"` | `auth.login` |
| `"Nazwa użytkownika"` | `auth.username` |
| `"Hasło"` | `auth.password` |
| `"Zaloguj"` | `auth.loginButton` |
| `"Błąd logowania"` | `auth.loginError` |
| `"Błąd ładowania CAPTCHA"` | `auth.captchaLoadError` |
| CAPTCHA type options | `auth.captchaTypes.*` |

---

## 15. ConfirmProvider.tsx
**Path:** `src/contexts/ConfirmProvider.tsx`
**Namespace:** `common.*`

| Original String | Translation Key |
|-----------------|-----------------|
| `"Potwierdzenie"` | `common.confirmation` |
| `"Anuluj"` | `common.cancel` |
| `"OK"` | `common.ok` |

---

## 16. TextTab.tsx
**Path:** `src/components/editor/TextTab.tsx` (562 lines)
**Namespace:** `textTab.*`

| Original String | Translation Key |
|-----------------|-----------------|
| `"Nothing to save"` | `textTab.nothingToSave` |
| `"Song updated"` / `"Song created"` | `textTab.songUpdated` / `textTab.songCreated` |
| `"Save failed"` | `textTab.saveFailed` |
| `"Text is empty"` / `"No note lines detected"` / `"Very long line"` | `textTab.textIsEmpty` / `textTab.noNoteLines` / `textTab.veryLongLine` |
| `"Plik Ultrastar (.txt):"` | `textTab.ultrastarFile` |
| `"Parse (server)"` | `textTab.parseServer` |
| `"Saving..."` / `"Save (update)"` / `"Save (create)"` | `textTab.savingButton` / `textTab.saveUpdate` / `textTab.saveCreate` |
| `"Parsing"` | `textTab.parsing` |
| `"Parse issues:"` / `"Validation:"` | `textTab.parseIssues` / `textTab.validation` |
| `"Auto-parse"` | `textTab.autoParse` |
| `"Full Editor (main)"` / `"Preview (read-only, synced)"` | `textTab.fullEditorMain` / `textTab.previewReadOnly` |
| `"Loading editor…"` / `"Loading preview…"` | `textTab.loadingEditor` / `textTab.loadingPreview` |
| `"Apply Fix"` / `"Jump"` / `"Close"` | `textTab.applyFix` / `textTab.jump` / `common.close` |

---

## 17. NotesTab.tsx
**Path:** `src/components/editor/NotesTab.tsx` (726 lines)
**Namespace:** `notesTab.*`

| Original String | Translation Key |
|-----------------|-----------------|
| `"Cofnięto"` | `notesTab.undone` |
| `"Przywrócono"` | `notesTab.redone` |
| `"Zapisano"` | `notesTab.saved` |
| `"Timeline / Piano-roll (click to add note)"` | `notesTab.timelinePianoRoll` |
| `"wybrany"` / `"brak"` (audio status) | `notesTab.audioSelected` / `notesTab.audioNone` |
| `"Snap"` / `"Snap to beat"` | `notesTab.snap` / `notesTab.snapToBeat` |
| `"BPM:"` / `"Beat div:"` / `"Quantize:"` / `"Grid:"` | `notesTab.bpm` .. `notesTab.grid` |
| `"Undo"` / `"Redo"` | `notesTab.undo` / `notesTab.redo` |
| `"Export to Ultrastar text"` | `notesTab.exportToUltrastar` |
| `"Clear"` / `"Save"` | `notesTab.clear` / `notesTab.save` |

---

## 18. AudioClipEditor.tsx
**Path:** `src/components/controls/editor/AudioClipEditor.tsx`
**Namespace:** `audioClip.*`

| Original String | Translation Key |
|-----------------|-----------------|
| `"Waveform"` / `"Info"` / `"Analysis"` | `audioClip.waveform` / `audioClip.info` / `audioClip.analysis` |
| `"▶️ Play"` / `"⏸ Pause"` / `"⏹ Stop"` | `audioClip.playBtn` / `audioClip.pauseBtn` / `audioClip.stopBtn` |
| `"⏪ -5s"` / `"⏩ +5s"` | `audioClip.skipBack` / `audioClip.skipForward` |
| `"Zoom"` | `audioClip.zoom` |

---

## 19. AdminUsersPage.tsx
**Path:** `src/pages/admin/AdminUsersPage.tsx` (419 lines)
**Namespace:** `admin.*`

| Original String | Translation Key |
|-----------------|-----------------|
| `"Users"` (h2) | `admin.users` |
| `"Create User"` / `"Cancel"` | `admin.createUser` / `admin.cancel` |
| `"Username"` / `"Email"` / `"Full Name"` / `"Temporary Password"` | `admin.usernamePlaceholder` .. `admin.tempPasswordPlaceholder` |
| `"Loading users..."` | `admin.loadingUsers` |
| `"ID"` / `"Username"` / ... / `"Actions"` (thead) | `admin.tableId` .. `admin.tableActions` |
| `"Zmiana hasła"` | `admin.tablePasswordChange` |
| `"Data ważności hasła"` | `admin.tablePasswordExpiry` |
| `"Are you sure you want to delete this user?"` | `admin.deleteConfirm` |
| `"Błąd generowania OTP"` | `admin.otpError` |
| `"🔒 Blocked"` / `"✓ Active"` | `admin.blocked` / `admin.activeStatus` |
| `"Unblock"` / `"Block"` / `"Delete"` / `"OTP"` | `admin.unblock` / `admin.block` / `admin.deleteBtn` / `admin.otpBtn` |
| `"Wygenerowane OTP"` | `admin.generatedOtp` |
| `"Ważne do: ..."` | `admin.validUntil` |
| `"Kopiuj"` / `"Zamknij"` | `common.copy` / `common.close` |

---

## 20. CreateHoneyTokenForm.tsx
**Path:** `src/components/admin/CreateHoneyTokenForm.tsx`
**Namespace:** `admin.honeyToken.*`

| Original String | Translation Key |
|-----------------|-----------------|
| `"Description"` | `admin.honeyToken.descriptionPlaceholder` |
| `"Creating..."` / `"Create Token"` | `admin.honeyToken.creating` / `admin.honeyToken.createToken` |
| `"Failed to create token"` | `admin.honeyToken.createFailed` |

---

## 21. AudioProjectForm.tsx
**Path:** `src/components/controls/editor/AudioProjectForm.tsx`
**Namespace:** `editor.*`

| Original String | Translation Key |
|-----------------|-----------------|
| `"New Project"` | `editor.newProject` |
| `"Nazwa projektu"` | `editor.projectNamePlaceholder` |
| `"Cancel"` / `"Create"` | `common.cancel` / `common.create` |

---

## 22. LogoutButton.tsx
**Path:** `src/components/auth/LogoutButton.tsx`
**Namespace:** `nav.*`

| Original String | Translation Key |
|-----------------|-----------------|
| `"Sign Out"` | `nav.signOut` |

---

## 23. GenericPlayerControls.tsx
**Path:** `src/components/controls/player/GenericPlayerControls.tsx`
**Namespace:** `player.*`

| Original String | Translation Key |
|-----------------|-----------------|
| `"Prev"` / `"Pause"` / `"Play"` / `"Next"` | `player.prev` / `player.pause` / `player.play` / `player.next` |

---

## 24. ExportTab.tsx
**Path:** `src/components/controls/editor/ExportTab.tsx`
**Namespace:** `exportTab.*`

| Original String | Translation Key |
|-----------------|-----------------|
| `"Pobierz Ultrastar (.txt)"` | `exportTab.downloadUltrastar` |
| `"Download Full Backup (JSON)"` | `exportTab.downloadBackup` |
| `"Live Preview:"` | `exportTab.livePreview` |
| `"Timeline Animation"` | `exportTab.timelineAnimation` |
| `"Reset"` | `exportTab.reset` |
| `"Default"` / `"Subtle"` / `"Strong"` | `exportTab.presetDefault` / `exportTab.presetSubtle` / `exportTab.presetStrong` |
| `"Enabled"` | `exportTab.enabled` |
| `"Duration (ms)"`, `"Translate X (px)"`, ... | `exportTab.durationMs`, `exportTab.translateX`, etc. |
| `"Enable advanced visual renderer (Phaser)"` | `exportTab.enablePhaser` |
| `"Loading advanced renderer…"` | `exportTab.loadingRenderer` |

---

## 25. VersionHistoryPanel.tsx
**Path:** `src/components/controls/editor/VersionHistoryPanel.tsx`
**Namespace:** `versionHistory.*`

| Original String | Translation Key |
|-----------------|-----------------|
| `"Version History"` | `versionHistory.title` |
| `"No songId provided..."` | `versionHistory.noSongId` |
| `"No versions"` | `versionHistory.noVersions` |
| `"Select version to preview"` | `versionHistory.selectVersion` |
| `"Preview (JSON)"` | `versionHistory.previewJson` |
| `"Reason for revert (optional)"` | `versionHistory.revertReason` |
| `"Reverting..."` / `"Revert to this version"` | `versionHistory.reverting` / `versionHistory.revertToVersion` |
| `"No permission to revert"` | `versionHistory.noPermission` |
| `"You don't have permission..."` | `versionHistory.noPermissionDetail` |

---

## 26. Oxygen25Demo.tsx
**Path:** `src/components/controls/input/source/Oxygen25Demo.tsx`
**Namespace:** `oxygen25.*`

| Original String | Translation Key |
|-----------------|-----------------|
| `"M-Audio Oxygen 25 (MKIV) — integracja"` | `oxygen25.title` |
| `"Twoja przeglądarka nie wspiera Web MIDI."` | `oxygen25.noWebMidi` |
| `"Proszę o nadanie uprawnień MIDI…"` | `oxygen25.requestingPermissions` |
| `"Wejścia (z hooka):"` / `"Wejścia (z eventów):"` | `oxygen25.inputsHook` / `oxygen25.inputsEvents` |
| `"(brak)"` | `oxygen25.noInputs` |
| `"Gałki"` / `"Suwak"` / `"Pady"` / `"Transport"` | `oxygen25.knobs` .. `oxygen25.transport` |
| `"Learn CC"` / `"Learn Fader"` / `"Learn Note"` / `"Learn"` | `oxygen25.learnCC` .. `oxygen25.learn` |
| `"Reset preset/learn"` | `oxygen25.resetPreset` |
| `"Log zdarzeń"` | `oxygen25.eventLog` |

---

## 27. KaraokeManager.tsx
**Path:** `src/components/controls/karaoke/KaraokeManager.tsx` (1511 lines)
**Namespace:** `karaoke.*`

| Line(s) | Original String | Translation Key |
|---------|----------------|-----------------|
| ~280 | `"🎤 Mikrofon ${name} odłączony — pauza"` | `karaoke.micDisconnected` |
| ~1130 | `"Podłącz ponownie — gra wznowi się automatycznie..."` | `karaoke.micReconnect` |
| ~960 | `"⚠️ Brak danych artysty/tytułu..."` | `karaoke.ytNoData` |
| ~965 | `"🔍 Szukam w YouTube..."` | `karaoke.ytSearching` |
| ~975 | `"✅ Znaleziono: ${videoId}"` | `karaoke.ytFound` |
| ~980 | `"❌ Nie znaleziono w YouTube"` | `karaoke.ytNotFound` |
| ~985 | `"❌ Błąd wyszukiwania"` | `karaoke.ytSearchError` |
| ~1065 | `"⏸ Pause"` / `"▶ Play"` | `common.pause` / `common.play` |
| ~1067 | `"⏮ Reset"` | `common.reset` |
| ~1080 | `"Show timelines"` / `"Compact"` | `karaoke.showTimelines` / `karaoke.compact` |
| ~1085 | `"Offset: ${ms} ms"` | `karaoke.offset` |
| ~1098 | `"Tryb Pad — Aktywuj audio"` / `"Aktywuj audio"` | `karaoke.padModeActivate` / `karaoke.activateAudio` |
| ~1102 | Pad / browser audio descriptions | `karaoke.padModeDescription` / `karaoke.browserAudioRequired` |
| ~1115 | `"🎶 Kliknij, aby rozpocząć"` | `karaoke.clickToStart` |
| ~1120 | `"Możesz też nacisnąć Enter..."` | `karaoke.pressAnyKey` |
| ~1180 | `"🎙️ Nagrania graczy"` | `karaoke.playerRecordings` |
| ~1195 | `"⬇️ Pobierz"` / `"Brak nagrania"` | `karaoke.downloadRecording` / `karaoke.noRecording` |
| ~1380 | `"🏆 Top 10"` | `karaoke.top10` |
| ~1390 | `"Player"` / `"Score"` (thead) | `karaoke.leaderPlayer` / `karaoke.leaderScore` |
| ~1418 | `"Restart"` / `"Continue"` | `karaoke.restart` / `karaoke.continue` |

---

## 28. ErrorBoundary.tsx
**Path:** `src/components/ErrorBoundary.tsx`
**Namespace:** `errorBoundary.*`

| Original String | Translation Key |
|-----------------|-----------------|
| `"Coś poszło nie tak 😕"` | `errorBoundary.title` |
| `"Nieznany błąd"` | `errorBoundary.unknownError` |
| `"Spróbuj ponownie"` | `errorBoundary.retry` |
| `"Wróć na stronę główną"` | `errorBoundary.goHome` |

---

## 29. Navbar.tsx
**Path:** `src/components/Navbar.tsx` (582 lines)
**Namespace:** `nav.*`

| Original String | Translation Key |
|-----------------|-----------------|
| `"Play"` (dropdown) | `nav.play` |
| `"Play Hub"` / `"Parties"` / `"Songs"` / `"Rounds"` / `"Playlists"` / `"Dance"` | `nav.playHub` .. `nav.dance` |
| `"📱 Dołącz (telefon)"` | `nav.joinPhone` |
| `"Create"` (dropdown) | `nav.create` |
| `"Projects"` / `"Karaoke Editor"` / `"DMX Editor"` | `nav.projects` / `nav.karaokeEditor` / `nav.dmxEditor` |
| `"Explore&Enjoy"` / `"Explore"` / `"Library"` / `"Enjoy"` / `"Music Player"` | `nav.exploreEnjoy` .. `nav.musicPlayer` |
| `"Admin"` (dropdown) | `nav.admin` |
| `"Dashboard"` / `"Audit"` / `"Users"` / `"Settings"` / ... | `nav.dashboard` .. `nav.characters` |
| `"Logi aktywności"` / `"Próby logowania"` | `nav.auditLogs` / `nav.loginAttempts` |
| `"Profile"` (dropdown) / `"Dashboard"` / `"Settings"` / `"Change Password"` / `"My Audit Logs"` | `nav.profile` .. `nav.myAuditLogs` |
| `"Settings"` (dropdown) / `"Controller"` / `"Audio Input"` | `nav.settingsTitle` / `nav.controller` / `nav.audioInput` |
| `"Reset Tutorials"` | `nav.resetTutorials` |
| `"Reset all tutorials?..."` | `nav.resetTutorialsConfirm` |
| `"Tutorials have been reset!"` | `nav.resetTutorialsSuccess` |
| `"Sign Out"` / `"Sign In"` / `"Sign Up"` | `nav.signOut` / `nav.signIn` / `nav.signUp` |

---

## 30. RegistrationForm.tsx
**Path:** `src/components/auth/RegistrationForm.tsx`
**Namespace:** `auth.*`

| Original String | Translation Key |
|-----------------|-----------------|
| `"Rejestracja"` | `auth.register` |
| `"Nazwa użytkownika"` / `"Email"` / `"Hasło"` | `auth.username` / `auth.email` / `auth.password` |
| `"Zarejestruj się"` | `auth.registerButton` |
| `"Rejestracja zakończona sukcesem!..."` | `auth.registerSuccess` |
| `"Błąd rejestracji"` | `auth.registerError` |
| Password rules | `auth.passwordRules.*` |
| CAPTCHA types (8) | `auth.captchaTypes.*` |
| `"Generuj CAPTCHA"` / `"Typ CAPTCHA:"` | `auth.generateCaptcha` / `auth.captchaType` |
| `"Niepoprawna odpowiedź CAPTCHA"` | `auth.captchaInvalid` |
| `"Błąd walidacji CAPTCHA"` / `"Błąd ładowania CAPTCHA"` | `auth.captchaValidationError` / `auth.captchaLoadError` |

---

## 31. KaraokeSessionJoin.tsx
**Path:** `src/components/controls/karaoke/KaraokeSessionJoin.tsx`
**Namespace:** `karaoke.*`

| Original String | Translation Key |
|-----------------|-----------------|
| `"Brak wykrytych urządzeń wejściowych (mikrofonów)!"` | `karaoke.noInputDevices` |
| `"Każdy gracz musi mieć przypisany mikrofon..."` | `karaoke.assignMicWarning` |

---

## 32. RoundActions.tsx
**Path:** `src/components/controls/party/RoundActions.tsx`
**Namespace:** `party.round.*`

| Original String | Translation Key |
|-----------------|-----------------|
| `"Zarządzaj częściami"` | `party.round.manageParts` |
| `"Zarządzaj przypisaniami"` | `party.round.manageAssignments` |
| `"Start"` | `party.round.start` |

---

## 33. RoundCard.tsx
**Path:** `src/components/controls/party/RoundCard.tsx`
**Namespace:** `party.round.*`, `common.*`

| Original String | Translation Key |
|-----------------|-----------------|
| `"Wygrany:"` | `party.round.winner` |
| `"pkt"` | `common.pts` |

---

## 34. AddRoundModal.tsx
**Path:** `src/components/controls/party/AddRoundModal.tsx`
**Namespace:** `party.round.*`

| Original String | Translation Key |
|-----------------|-----------------|
| `"Dodaj rundę"` | `party.round.addRound` |
| `"Wybierz piosenkę"` | `party.round.selectSong` |
| `"Ładowanie piosenek..."` | `party.round.loadingSongs` |
| `"Brak piosenek"` | `party.round.noSongs` |
| `"Sesja (opcjonalnie)"` | `party.round.sessionOptional` |
| `"Nazwa nowej sesji"` | `party.round.newSessionName` |
| `"Utwórz sesję"` | `party.round.createSession` |
| `"Wybrano sesję #${id}"` | `party.round.selectedSession` |
| `"Brak wybranej sesji"` | `party.round.noSession` |
| `"Anuluj"` / `"Dodaj"` | `common.cancel` / `common.add` |

---

## 35. RoundsList.tsx
**Path:** `src/components/controls/party/RoundsList.tsx`
No direct UI strings — delegates rendering to RoundCard.

---

## 36. ParticipantsPanel.tsx
**Path:** `src/components/controls/party/ParticipantsPanel.tsx`
**Namespace:** `party.*`

| Original String | Translation Key |
|-----------------|-----------------|
| `"Uczestnicy"` | `party.participants` |
| `"RTC: połączony"` / `"RTC: rozłączony"` | `party.rtcConnected` / `party.rtcDisconnected` |
| `"Połącz"` / `"Łączenie..."` | `party.connect` / `party.connecting` |
| `"Rozłącz"` / `"Rozłączanie..."` | `party.disconnect` / `party.disconnecting` |
| `"Odśwież"` / `"Odświeżanie..."` | `common.refresh` / `common.refreshing` |
| `"Dodawanie..."` / `"Dołączono"` / `"Dołącz jako gracz"` | `party.joining` / `party.joined` / `party.joinAsPlayer` |
| `"Brak uczestników w tej imprezie."` | `party.noParticipants` |
| `"Przełącz na widzów"` / `"Przełącz na uczestników"` | `party.switchToSpectators` / `party.switchToParticipants` |
| `"Brak osób na kanale."` | `party.noChannelMembers` |
| `"Zamknij"` (aria-label) | `common.close` |

---

## 37. PlayPage.tsx — ❌ FILE NOT FOUND
The file `src/pages/PlayPage.tsx` does not exist in the workspace.

---

## 38. ChangePasswordPage.tsx (profile)
**Path:** `src/pages/profile/ChangePasswordPage.tsx` (304 lines)
**Namespace:** `auth.*`

| Original String | Translation Key |
|-----------------|-----------------|
| `"Change Password"` (h2) | `auth.changePassword` |
| `"Current Password"` / `"New Password"` / `"Confirm New Password"` | `auth.currentPassword` / `auth.newPassword` / `auth.confirmNewPassword` |
| `"New passwords do not match."` | `auth.passwordMismatch` |
| `"Hasło nie spełnia wymagań bezpieczeństwa."` | `auth.passwordNotMeetRequirements` |
| `"Changing..."` / `"Change Password"` | `auth.changingPassword` / `auth.changePasswordButton` |
| `"Password changed successfully."` | `auth.passwordChangeSuccess` |
| `"Failed to change password"` | `auth.passwordChangeFailed` |
| Password rules (PL) | `auth.passwordRules.*` |
| CAPTCHA types | `auth.captchaTypes.*` |

---

## 39. ChangePasswordPage.tsx (auth)
**Path:** `src/pages/auth/ChangePasswordPage.tsx`
**Namespace:** `auth.*`

| Original String | Translation Key |
|-----------------|-----------------|
| `"Change Password"` (h2 + button) | `auth.changePassword` / `auth.changePasswordButton` |
| `"Current Password"` / `"New Password"` / `"Confirm Password"` | `auth.currentPassword` / `auth.newPassword` / `auth.confirmPassword` |
| `"12 characters minimum"` | `auth.passwordRulesEN.minChars` |
| `"At least 1 digit"` | `auth.passwordRulesEN.digit` |
| `"At least 1 special character"` | `auth.passwordRulesEN.special` |
| `"Błąd ładowania CAPTCHA"` | `auth.captchaLoadError` |
| `"Niepoprawna odpowiedź CAPTCHA"` | `auth.captchaInvalid` |
| `"Błąd walidacji CAPTCHA"` | `auth.captchaValidationError` |

---

## 40. KaraokeSettingsPanel.tsx
**Path:** `src/components/controls/karaoke/KaraokeSettingsPanel.tsx` (340 lines)
**Namespace:** `karaoke.*`

| Original String | Translation Key |
|-----------------|-----------------|
| `"Edycja gracza"` / `"Dodaj gracza"` (modal titles) | `karaoke.editPlayer` / `karaoke.addPlayer` |
| `"Mode:"` / `"Difficulty:"` | `karaoke.mode` / `karaoke.difficulty` |
| `"Normal"` / `"Demo (12s)"` / `"Pad / Gamepad"` | `karaoke.gameModes.normal` / `.demo` / `.pad` |
| `"Easy"` / `"Normal"` / `"Hard"` | `karaoke.difficulties.easy` / `.normal` / `.hard` |
| `"Gracz ${idx+1}"` | `karaoke.defaultPlayerName` |
| `"Przypisany mikrofon: ${micId}"` | `karaoke.assignedMic` |
| `"Przeciągnij mikrofon tutaj"` | `karaoke.dragMicHere` |
| `"Mikrofon"` (label) | `karaoke.micLabel` |

---

## Summary Statistics

| Category | Key Count |
|----------|----------|
| `common.*` | 50 |
| `nav.*` | 34 |
| `auth.*` | 30+ (incl. nested) |
| `party.*` | 55+ (incl. nested chat/round/parts/players) |
| `karaoke.*` | 55+ (incl. nested) |
| `editor.*` | 85+ |
| `textTab.*` | 18 |
| `notesTab.*` | 16 |
| `audioClip.*` | 8 |
| `exportTab.*` | 15 |
| `versionHistory.*` | 10 |
| `admin.*` | 25+ |
| `player.*` | 16 |
| `characters.*` | 14 |
| `profile.*` | 18 |
| `latency.*` | 14 |
| `pitch.*` | 18 |
| `playlist.*` | 7 |
| `errorBoundary.*` | 4 |
| `oxygen25.*` | 14 |
| **TOTAL** | **~450+ unique keys** |
