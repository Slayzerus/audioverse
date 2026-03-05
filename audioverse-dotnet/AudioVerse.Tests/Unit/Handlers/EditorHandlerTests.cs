using Xunit;
using Moq;
using AudioVerse.Application.Commands.Editor;
using AudioVerse.Application.Queries.Editor;
using AudioVerse.Application.Handlers.Editor;
using AudioVerse.Domain.Entities.Editor;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Tests.Unit.Handlers
{
    public class EditorHandlerTests
    {
        private readonly Mock<IEditorRepository> _repo = new();

        [Fact]
        public async Task AddProject_ReturnsId()
        {
            _repo.Setup(r => r.AddProjectAsync(It.IsAny<AudioProject>())).ReturnsAsync(1);

            var handler = new AddProjectHandler(_repo.Object);
            var result = await handler.Handle(new AddProjectCommand("TestProject", 5), CancellationToken.None);

            Assert.Equal(1, result);
            _repo.Verify(r => r.AddProjectAsync(It.Is<AudioProject>(p => p.Name == "TestProject" && p.UserProfileId == 5)), Times.Once);
        }

        [Fact]
        public async Task UpdateProject_ReturnsTrue()
        {
            _repo.Setup(r => r.UpdateProjectAsync(It.IsAny<AudioProject>())).ReturnsAsync(true);

            var handler = new UpdateProjectHandler(_repo.Object);
            var result = await handler.Handle(new UpdateProjectCommand(1, "Updated", false, 80), CancellationToken.None);

            Assert.True(result);
            _repo.Verify(r => r.UpdateProjectAsync(It.Is<AudioProject>(p => p.Id == 1 && p.Name == "Updated" && p.Volume == 80)), Times.Once);
        }

        [Fact]
        public async Task DeleteProject_ReturnsTrue()
        {
            _repo.Setup(r => r.DeleteProjectAsync(1)).ReturnsAsync(true);

            var handler = new DeleteProjectHandler(_repo.Object);
            var result = await handler.Handle(new DeleteProjectCommand(1), CancellationToken.None);

            Assert.True(result);
        }

        [Fact]
        public async Task DeleteProject_NonExistent_ReturnsFalse()
        {
            _repo.Setup(r => r.DeleteProjectAsync(999)).ReturnsAsync(false);

            var handler = new DeleteProjectHandler(_repo.Object);
            var result = await handler.Handle(new DeleteProjectCommand(999), CancellationToken.None);

            Assert.False(result);
        }

        [Fact]
        public async Task GetProjects_ReturnsList()
        {
            var projects = new List<AudioProject>
            {
                new() { Id = 1, Name = "Project A" },
                new() { Id = 2, Name = "Project B" }
            };
            _repo.Setup(r => r.GetProjectsAsync()).ReturnsAsync(projects);

            var handler = new GetProjectsHandler(_repo.Object);
            var result = await handler.Handle(new GetProjectsQuery(), CancellationToken.None);

            Assert.Equal(2, result.Count());
        }

        [Fact]
        public async Task GetProjectDetails_ReturnsProject()
        {
            var project = new AudioProject { Id = 1, Name = "Detailed" };
            _repo.Setup(r => r.GetProjectWithDetailsAsync(1)).ReturnsAsync(project);

            var handler = new GetProjectDetailsHandler(_repo.Object);
            var result = await handler.Handle(new GetProjectDetailsQuery(1), CancellationToken.None);

            Assert.NotNull(result);
            Assert.Equal("Detailed", result!.Name);
        }

        [Fact]
        public async Task GetProjectDetails_NonExistent_ReturnsNull()
        {
            _repo.Setup(r => r.GetProjectWithDetailsAsync(999)).ReturnsAsync((AudioProject?)null);

            var handler = new GetProjectDetailsHandler(_repo.Object);
            var result = await handler.Handle(new GetProjectDetailsQuery(999), CancellationToken.None);

            Assert.Null(result);
        }
    }
}
