using AudioVerse.Domain.Entities;
using AudioVerse.Domain.Entities.Editor;
using AudioVerse.Domain.Repositories;
using Microsoft.AspNetCore.Identity;

namespace AudioVerse.API.Seed
{
    public class EditorSeeder
    {
        public static AudioProject EmptyProject => new AudioProject
        {
            Name = "Empty",
            IsTemplate = true,
            Sections = new List<AudioSection>
            {
                new AudioSection
                {
                    Name = "Section",
                    Duration = TimeSpan.FromSeconds(12),
                    BPM = 60,
                    OrderNumber = 0
                }
            }
        };

        public static AudioProject PopSong => new AudioProject
        {
            Name = "Pop Song",
            IsTemplate = true,
            Sections = new List<AudioSection>
            {
                new AudioSection
                {
                    Name = "Verse",
                    Duration = TimeSpan.FromSeconds(28),
                    BPM = 120,
                    OrderNumber = 0,
                    Layers = new List<AudioLayer>
                    {
                        new AudioLayer(
                            "Vocal",
                            "Recorder",
                            "",
                            TimeSpan.FromSeconds(28),
                            120,
                            new List<AudioInputMapping>
                            {
                                new AudioInputMapping
                                {
                                    ActionName = "Record",
                                    DeviceType = "Controller",
                                    InputKey = "B"
                                }
                            }),
                        new AudioLayer(
                            "Drum",
                            "AudioClip",
                            "",
                            TimeSpan.FromSeconds(28),
                            120,
                            new List<AudioInputMapping>
                            {
                                new AudioInputMapping
                                {
                                    ActionName = "Play",
                                    DeviceType = "Controller",
                                    InputKey = "B"
                                }
                            })
                        }
                    },
                new AudioSection
                {
                    Name = "Chorus",
                    Duration = TimeSpan.FromSeconds(20),
                    BPM = 120,
                    OrderNumber = 1,
                    Layers = new List<AudioLayer>
                    {
                        new AudioLayer(
                            "Vocal",
                            "Recorder",
                            "",
                            TimeSpan.FromSeconds(28),
                            120,
                            new List<AudioInputMapping>
                            {
                                new AudioInputMapping
                                {
                                    ActionName = "Record",
                                    DeviceType = "Controller",
                                    InputKey = "B"
                                }
                            }),
                        new AudioLayer(
                            "Kick",
                            "AudioClip",
                            "",
                            TimeSpan.FromSeconds(28),
                            120,
                            new List<AudioInputMapping>
                            {
                                new AudioInputMapping
                                {
                                    ActionName = "Play",
                                    DeviceType = "Controller",
                                    InputKey = "LB"
                                }
                            }),
                        new AudioLayer(
                            "Drum",
                            "AudioClip",
                            "",
                            TimeSpan.FromSeconds(28),
                            120,
                            new List<AudioInputMapping>
                            {
                                new AudioInputMapping
                                {
                                    ActionName = "Play",
                                    DeviceType = "Controller",
                                    InputKey = "RB"
                                }
                            })
                        }
                        },

                    }

        };

        public static async Task SeedEditor(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var editorRepository = scope.ServiceProvider.GetRequiredService<IEditorRepository>();

            var projects = new List<AudioProject> { EmptyProject, PopSong };            

            foreach(AudioProject project in projects)
            {
                int projectId = await editorRepository.AddProjectAsync(project);

                foreach(AudioSection section in project.Sections)
                {
                    section.ProjectId = projectId;
                    int sectionId = await editorRepository.AddSectionAsync(section);

                    foreach (AudioLayer layer in section.Layers)
                    {
                        layer.SectionId = sectionId;
                        int layerId = await editorRepository.AddLayerAsync(layer);

                        foreach(AudioInputMapping mapping in layer.InputMappings)
                        {
                            mapping.LayerId = layerId;
                            await editorRepository.AddInputMappingAsync(mapping);
                        }

                        foreach (AudioLayerItem item in layer.Items)
                        {
                            item.LayerId = layerId;
                            await editorRepository.AddLayerItemAsync(item);
                        }
                    }
                }                
            }
        }
    }
}
