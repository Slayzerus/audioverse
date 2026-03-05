using AudioVerse.Domain.Entities.Editor;
using AudioVerse.Domain.Repositories;
using Dapper;
using System.Data;

namespace AudioVerse.Infrastructure.Repositories
{
    public class EditorRepository : IEditorRepository
    {
        private readonly IDbConnection _db;

        public EditorRepository(IDbConnection db)
        {
            _db = db;
        }

        // Dodawanie projektu (bez encji podrzędnych)
        public async Task<int> AddProjectAsync(AudioProject project)
        {
            var sql = @"INSERT INTO AudioProjects (Name, UserProfileId, IsTemplate, Volume) 
                VALUES (@Name, @UserProfileId, @IsTemplate, @Volume) RETURNING Id;";
            return await _db.ExecuteScalarAsync<int>(sql, project);
        }
        // Dodawanie sekcji do projektu
        public async Task<int> AddSectionAsync(AudioSection section)
        {
            var sql = @"INSERT INTO AudioSections (ProjectId, Name, OrderNumber, Duration, BPM) 
                VALUES (@ProjectId, @Name, @OrderNumber, @Duration, @BPM) RETURNING Id;";
            return await _db.ExecuteScalarAsync<int>(sql, section);
        }

        public async Task<int> AddLayerAsync(AudioLayer layer)
        {
            var sql = @"INSERT INTO AudioLayers (SectionId, Name, AudioSource, AudioSourceParameters, Duration, BPM, Volume, InputPresetId, AudioClipId) 
                VALUES (@SectionId, @Name, @AudioSource, @AudioSourceParameters, @Duration, @BPM, @Volume, @InputPresetId, @AudioClipId) 
                RETURNING Id;";
            return await _db.ExecuteScalarAsync<int>(sql, layer);
        }


        // Dodawanie pojedynczego itemu do warstwy
        public async Task<int> AddLayerItemAsync(AudioLayerItem item)
        {
            var sql = @"INSERT INTO AudioLayerItems (LayerId, StartTime, Parameters) 
                        VALUES (@LayerId, @StartTime, @Parameters) RETURNING Id;";
            return await _db.ExecuteScalarAsync<int>(sql, item);
        }

        // Dodawanie wielu itemów do warstwy
        public async Task AddLayerItemsAsync(IEnumerable<AudioLayerItem> items)
        {
            var sql = @"INSERT INTO AudioLayerItems (LayerId, StartTime, Parameters) 
                        VALUES (@LayerId, @StartTime, @Parameters);";
            await _db.ExecuteAsync(sql, items);
        }

        // Pobieranie listy projektów
        public async Task<IEnumerable<AudioProject>> GetProjectsAsync()
        {
            var sql = "SELECT * FROM AudioProjects WHERE IsTemplate = 0;";
            return await _db.QueryAsync<AudioProject>(sql);
        }

        public async Task<IEnumerable<AudioProject>> GetProjectTemplatesAsync()
        {
            var sql = "SELECT * FROM AudioProjects WHERE IsTemplate = 1;";
            return await _db.QueryAsync<AudioProject>(sql);
        }

        // Pobieranie projektu z pełnymi szczegółami (sekcje, warstwy, itemy, inputMappings, audioclip, presety)
        public async Task<AudioProject?> GetProjectWithDetailsAsync(int projectId)
        {
            // Wykonujemy kilka zapytań jednocześnie i łączymy wyniki
            var sql = @"
                SELECT Id, Name, UserProfileId, IsTemplate, Volume FROM AudioProjects WHERE Id = @ProjectId;
                SELECT Id, ProjectId, Name, OrderNumber, Duration, BPM FROM AudioSections WHERE ProjectId = @ProjectId;
                SELECT Id, SectionId, Name, AudioSource, AudioSourceParameters, Duration, BPM, Volume, InputPresetId, AudioClipId FROM AudioLayers WHERE SectionId IN (SELECT Id FROM AudioSections WHERE ProjectId = @ProjectId);
                SELECT * FROM AudioLayerItems WHERE LayerId IN (SELECT Id FROM AudioLayers WHERE SectionId IN (SELECT Id FROM AudioSections WHERE ProjectId = @ProjectId));
                SELECT * FROM AudioInputMappings WHERE 
                    (SectionId IN (SELECT Id FROM AudioSections WHERE ProjectId = @ProjectId))
                    OR (LayerId IN (SELECT Id FROM AudioLayers WHERE SectionId IN (SELECT Id FROM AudioSections WHERE ProjectId = @ProjectId)));
                SELECT * FROM AudioClips WHERE Id IN (SELECT AudioClipId FROM AudioLayers WHERE AudioClipId IS NOT NULL);
                SELECT * FROM AudioClipTags WHERE AudioClipId IN (SELECT AudioClipId FROM AudioLayers WHERE AudioClipId IS NOT NULL);
                SELECT * FROM AudioInputPresets WHERE Id IN (SELECT InputPresetId FROM AudioLayers WHERE InputPresetId IS NOT NULL);
            ";

            using var multi = await _db.QueryMultipleAsync(sql, new { ProjectId = projectId });

            var project = await multi.ReadSingleOrDefaultAsync<AudioProject>();
            if (project == null)
                return null;

            var sections = (await multi.ReadAsync<AudioSection>()).ToList();
            var layers = (await multi.ReadAsync<AudioLayer>()).ToList();
            var items = (await multi.ReadAsync<AudioLayerItem>()).ToList();
            var mappings = (await multi.ReadAsync<AudioInputMapping>()).ToList();
            var clips = (await multi.ReadAsync<AudioClip>()).ToList();
            var clipTags = (await multi.ReadAsync<AudioClipTag>()).ToList();
            var presets = (await multi.ReadAsync<AudioInputPreset>()).ToList();

            // Przypisanie sekcji do projektu
            project.Sections = sections;

            // Łączenie warstw z sekcjami
            foreach (var section in sections)
            {
                section.Layers = layers.Where(l => l.SectionId == section.Id).ToList();
                // Przypisanie input mappingów dla sekcji
                section.InputMappings = mappings.Where(m => m.SectionId == section.Id).ToList();

                foreach (var layer in section.Layers)
                {
                    // Przypisanie itemów do warstwy
                    layer.Items = items.Where(i => i.LayerId == layer.Id).ToList();
                    // Przypisanie input mappingów dla warstwy
                    layer.InputMappings = mappings.Where(m => m.LayerId == layer.Id).ToList();

                    // Przypisanie AudioClip (jeśli istnieje)
                    if (layer.AudioClipId.HasValue)
                    {
                        layer.AudioClip = clips.FirstOrDefault(c => c.Id == layer.AudioClipId.Value);
                        if (layer.AudioClip != null)
                        {
                            layer.AudioClip.Tags = clipTags.Where(t => t.AudioClipId == layer.AudioClip.Id).ToList();
                        }
                    }
                }
            }

            return project;
        }

        // Dodawanie AudioClip
        public async Task<int> AddAudioClipAsync(AudioClip clip)
        {
            var sql = @"INSERT INTO AudioClips (UserProfileId, FileName, FileFormat, Data, Duration, Size)
                        VALUES (@UserProfileId, @FileName, @FileFormat, @Data, @Duration, @Size) RETURNING Id;";
            return await _db.ExecuteScalarAsync<int>(sql, clip);
        }

        // Pobieranie AudioClip
        public async Task<AudioClip?> GetAudioClipAsync(int clipId)
        {
            var sql = "SELECT * FROM AudioClips WHERE Id = @Id;";
            var clip = await _db.QuerySingleOrDefaultAsync<AudioClip>(sql, new { Id = clipId });
            if (clip != null)
            {
                var tagsSql = "SELECT * FROM AudioClipTags WHERE AudioClipId = @Id;";
                clip.Tags = (await _db.QueryAsync<AudioClipTag>(tagsSql, new { Id = clipId })).ToList();
            }
            return clip;
        }

        // Listowanie AudioClipów z paginacją, filtrowaniem po tagach i wyszukiwaniem
        public async Task<IEnumerable<AudioClip>> GetAudioClipsAsync(int skip, int take, string? tag = null, string? search = null)
        {
            var sql = @"SELECT * FROM AudioClips 
                        WHERE (@Search IS NULL OR FileName ILIKE '%' || @Search || '%')
                        AND ( (@Tag IS NULL) OR Id IN (SELECT AudioClipId FROM AudioClipTags WHERE Tag = @Tag) )
                        ORDER BY Id
                        OFFSET @Skip LIMIT @Take;";
            return await _db.QueryAsync<AudioClip>(sql, new { Search = search, Tag = tag, Skip = skip, Take = take });
        }

        // Dodawanie Input Preset
        public async Task<int> AddInputPresetAsync(AudioInputPreset preset)
        {
            var sql = @"INSERT INTO AudioInputPresets (Version, UserProfileId, Name)
                        VALUES (@Version, @UserProfileId, @Name) RETURNING Id;";
            return await _db.ExecuteScalarAsync<int>(sql, preset);
        }

        // Pobieranie Input Preset
        public async Task<AudioInputPreset?> GetInputPresetAsync(int presetId)
        {
            var sql = "SELECT * FROM AudioInputPresets WHERE Id = @Id;";
            var preset = await _db.QuerySingleOrDefaultAsync<AudioInputPreset>(sql, new { Id = presetId });
            if (preset != null)
            {
                var layersSql = "SELECT * FROM AudioLayers WHERE InputPresetId = @Id;";
                preset.Layers = (await _db.QueryAsync<AudioLayer>(layersSql, new { Id = presetId })).ToList();
            }
            return preset;
        }

        // Listowanie Input Preset z paginacją i wyszukiwaniem
        public async Task<IEnumerable<AudioInputPreset>> GetInputPresetsAsync(int skip, int take, string? search = null)
        {
            var sql = @"SELECT * FROM AudioInputPresets 
                        WHERE (@Search IS NULL OR Name ILIKE '%' || @Search || '%')
                        ORDER BY Id
                        OFFSET @Skip LIMIT @Take;";
            return await _db.QueryAsync<AudioInputPreset>(sql, new { Search = search, Skip = skip, Take = take });
        }

        // Dodawanie tagu do AudioClip
        public async Task AddTagToAudioClipAsync(int clipId, string tag)
        {
            var sql = @"INSERT INTO AudioClipTags (AudioClipId, Tag)
                        VALUES (@AudioClipId, @Tag);";
            await _db.ExecuteAsync(sql, new { AudioClipId = clipId, Tag = tag });
        }

        // Usuwanie tagu z AudioClip
        public async Task RemoveTagFromAudioClipAsync(int clipId, string tag)
        {
            var sql = @"DELETE FROM AudioClipTags 
                        WHERE AudioClipId = @AudioClipId AND Tag = @Tag;";
            await _db.ExecuteAsync(sql, new { AudioClipId = clipId, Tag = tag });
        }

        public async Task<int> AddInputMappingAsync(AudioInputMapping mapping)
        {
            var sql = @"INSERT INTO AudioInputMappings (UserProfileId, LayerId, SectionId, ActionName, DeviceType, DeviceId, InputKey) 
                VALUES (@UserProfileId, @LayerId, @SectionId, @ActionName, @DeviceType, @DeviceId, @InputKey) 
                RETURNING Id;";
            return await _db.ExecuteScalarAsync<int>(sql, mapping);
        }

        public async Task<bool> UpdateInputMappingAsync(AudioInputMapping mapping)
        {
            var sql = @"UPDATE AudioInputMappings 
                SET UserProfileId = @UserProfileId, LayerId = @LayerId, SectionId = @SectionId, 
                    ActionName = @ActionName, DeviceType = @DeviceType, DeviceId = @DeviceId, InputKey = @InputKey
                WHERE Id = @Id;";
            return await _db.ExecuteAsync(sql, mapping) > 0;
        }

        public async Task<bool> RemoveInputMappingAsync(int mappingId)
        {
            var sql = "DELETE FROM AudioInputMappings WHERE Id = @Id;";
            return await _db.ExecuteAsync(sql, new { Id = mappingId }) > 0;
        }

        public async Task<bool> UpdateProjectAsync(AudioProject project)
        {
            var sql = "UPDATE AudioProjects SET Name = @Name, IsTemplate = @IsTemplate, Volume = @Volume WHERE Id = @Id";
            return await _db.ExecuteAsync(sql, project) > 0;
        }

        public async Task<bool> DeleteProjectAsync(int projectId)
        {
            var sql = "DELETE FROM AudioProjects WHERE Id = @Id";
            return await _db.ExecuteAsync(sql, new { Id = projectId }) > 0;
        }

        public async Task<bool> UpdateSectionAsync(AudioSection section)
        {
            var sql = "UPDATE AudioSections SET Name = @Name, OrderNumber = @OrderNumber WHERE Id = @Id";
            return await _db.ExecuteAsync(sql, section) > 0;
        }

        public async Task<bool> DeleteSectionAsync(int sectionId)
        {
            var sql = "DELETE FROM AudioSections WHERE Id = @Id";
            return await _db.ExecuteAsync(sql, new { Id = sectionId }) > 0;
        }

        public async Task<bool> UpdateLayerAsync(AudioLayer layer)
        {
            var sql = "UPDATE AudioLayers SET Name = @Name, AudioClipId = @AudioClipId WHERE Id = @Id";
            return await _db.ExecuteAsync(sql, layer) > 0;
        }

        public async Task<bool> DeleteLayerAsync(int layerId)
        {
            var sql = "DELETE FROM AudioLayers WHERE Id = @Id";
            return await _db.ExecuteAsync(sql, new { Id = layerId }) > 0;
        }

        public async Task<bool> DeleteLayerItemAsync(int itemId)
        {
            var sql = "DELETE FROM AudioLayerItems WHERE Id = @Id";
            return await _db.ExecuteAsync(sql, new { Id = itemId }) > 0;
        }

        public async Task<bool> DeleteAudioClipAsync(int clipId)
        {
            var sql = "DELETE FROM AudioClips WHERE Id = @Id";
            return await _db.ExecuteAsync(sql, new { Id = clipId }) > 0;
        }

        // ── New interface members (delegated to EF implementation via DI) ──

        public Task<IEnumerable<AudioEffect>> GetEffectsAsync() => throw new NotImplementedException("Use EditorRepositoryEF");
        public Task<AudioEffect?> GetEffectByIdAsync(int id) => throw new NotImplementedException("Use EditorRepositoryEF");
        public Task<int> AddEffectAsync(AudioEffect effect) => throw new NotImplementedException("Use EditorRepositoryEF");
        public Task RemoveEffectAsync(AudioEffect effect) => throw new NotImplementedException("Use EditorRepositoryEF");
        public Task SaveChangesAsync() => throw new NotImplementedException("Use EditorRepositoryEF");
        public Task<IEnumerable<AudioLayerEffect>> GetLayerEffectsAsync(int layerId) => throw new NotImplementedException("Use EditorRepositoryEF");
        public Task<AudioLayerEffect?> GetLayerEffectByIdAsync(int id) => throw new NotImplementedException("Use EditorRepositoryEF");
        public Task<int> AddLayerEffectAsync(AudioLayerEffect layerEffect) => throw new NotImplementedException("Use EditorRepositoryEF");
        public Task RemoveLayerEffectAsync(AudioLayerEffect layerEffect) => throw new NotImplementedException("Use EditorRepositoryEF");
        public Task<IEnumerable<AudioProjectCollaborator>> GetCollaboratorsAsync(int projectId) => throw new NotImplementedException("Use EditorRepositoryEF");
        public Task<AudioProjectCollaborator?> GetCollaboratorByIdAsync(int id) => throw new NotImplementedException("Use EditorRepositoryEF");
        public Task<int> AddCollaboratorAsync(AudioProjectCollaborator collaborator) => throw new NotImplementedException("Use EditorRepositoryEF");
        public Task RemoveCollaboratorAsync(AudioProjectCollaborator collaborator) => throw new NotImplementedException("Use EditorRepositoryEF");
        public Task<int> AddExportTaskAsync(AudioExportTask task) => throw new NotImplementedException("Use EditorRepositoryEF");
        public Task<AudioExportTask?> GetExportTaskByIdAsync(int id) => throw new NotImplementedException("Use EditorRepositoryEF");
        public Task<IEnumerable<AudioSamplePack>> GetSamplePacksAsync(string? genre, string? instrument) => throw new NotImplementedException("Use EditorRepositoryEF");
        public Task<AudioSamplePack?> GetSamplePackByIdAsync(int id) => throw new NotImplementedException("Use EditorRepositoryEF");
        public Task<int> AddSamplePackAsync(AudioSamplePack pack) => throw new NotImplementedException("Use EditorRepositoryEF");
        public Task RemoveSamplePackAsync(AudioSamplePack pack) => throw new NotImplementedException("Use EditorRepositoryEF");
        public Task<int> AddSampleAsync(AudioSample sample) => throw new NotImplementedException("Use EditorRepositoryEF");
        public Task<AudioSample?> GetSampleByIdAsync(int id) => throw new NotImplementedException("Use EditorRepositoryEF");
        public Task RemoveSampleAsync(AudioSample sample) => throw new NotImplementedException("Use EditorRepositoryEF");
    }
}


