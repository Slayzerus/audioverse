using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Application.Handlers.Karaoke;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Domain.Enums;
using AudioVerse.Domain.Repositories;
using Moq;
using Xunit;

namespace AudioVerse.Tests.Handlers;

public class CollaboratorHandlersTests
{
    private readonly Mock<IKaraokeRepository> _repo = new();

    [Fact]
    public async Task AddCollaborator_CallsRepository_ReturnsTrue()
    {
        _repo.Setup(r => r.AddCollaboratorAsync(1, 10, CollaborationPermission.Write)).ReturnsAsync(true);
        var handler = new AddCollaboratorHandler(_repo.Object);
        var result = await handler.Handle(new AddCollaboratorCommand(1, 10, CollaborationPermission.Write), default);
        Assert.True(result);
        _repo.Verify(r => r.AddCollaboratorAsync(1, 10, CollaborationPermission.Write), Times.Once);
    }

    [Fact]
    public async Task AddCollaborator_DuplicateUser_ReturnsFalse()
    {
        _repo.Setup(r => r.AddCollaboratorAsync(1, 10, CollaborationPermission.Read)).ReturnsAsync(false);
        var handler = new AddCollaboratorHandler(_repo.Object);
        var result = await handler.Handle(new AddCollaboratorCommand(1, 10, CollaborationPermission.Read), default);
        Assert.False(result);
    }

    [Fact]
    public async Task RemoveCollaborator_Exists_ReturnsTrue()
    {
        _repo.Setup(r => r.RemoveCollaboratorAsync(1, 10)).ReturnsAsync(true);
        var handler = new RemoveCollaboratorHandler(_repo.Object);
        var result = await handler.Handle(new RemoveCollaboratorCommand(1, 10), default);
        Assert.True(result);
        _repo.Verify(r => r.RemoveCollaboratorAsync(1, 10), Times.Once);
    }

    [Fact]
    public async Task RemoveCollaborator_NotFound_ReturnsFalse()
    {
        _repo.Setup(r => r.RemoveCollaboratorAsync(1, 99)).ReturnsAsync(false);
        var handler = new RemoveCollaboratorHandler(_repo.Object);
        var result = await handler.Handle(new RemoveCollaboratorCommand(1, 99), default);
        Assert.False(result);
    }

    [Fact]
    public async Task UpdatePermission_Exists_ReturnsTrue()
    {
        _repo.Setup(r => r.UpdateCollaboratorPermissionAsync(1, 10, CollaborationPermission.Manage)).ReturnsAsync(true);
        var handler = new UpdateCollaboratorPermissionHandler(_repo.Object);
        var result = await handler.Handle(new UpdateCollaboratorPermissionCommand(1, 10, CollaborationPermission.Manage), default);
        Assert.True(result);
    }

    [Fact]
    public async Task UpdatePermission_NotFound_ReturnsFalse()
    {
        _repo.Setup(r => r.UpdateCollaboratorPermissionAsync(1, 99, CollaborationPermission.Write)).ReturnsAsync(false);
        var handler = new UpdateCollaboratorPermissionHandler(_repo.Object);
        var result = await handler.Handle(new UpdateCollaboratorPermissionCommand(1, 99, CollaborationPermission.Write), default);
        Assert.False(result);
    }

    [Fact]
    public async Task GetCollaborators_ReturnsList()
    {
        _repo.Setup(r => r.GetCollaboratorUserIdsAsync(1)).ReturnsAsync(new List<int> { 10, 20, 30 });
        var handler = new GetCollaboratorsHandler(_repo.Object);
        var result = await handler.Handle(new GetCollaboratorsQuery(1), default);
        Assert.Equal(3, result.Count());
    }

    [Fact]
    public async Task GetCollaborators_Empty_ReturnsEmpty()
    {
        _repo.Setup(r => r.GetCollaboratorUserIdsAsync(999)).ReturnsAsync(Enumerable.Empty<int>());
        var handler = new GetCollaboratorsHandler(_repo.Object);
        var result = await handler.Handle(new GetCollaboratorsQuery(999), default);
        Assert.Empty(result);
    }

    [Fact]
    public async Task GetPermission_Exists_ReturnsPermission()
    {
        _repo.Setup(r => r.GetCollaboratorPermissionAsync(1, 10)).ReturnsAsync(CollaborationPermission.Write);
        var handler = new GetCollaboratorPermissionHandler(_repo.Object);
        var result = await handler.Handle(new GetCollaboratorPermissionQuery(1, 10), default);
        Assert.Equal(CollaborationPermission.Write, result);
    }

    [Fact]
    public async Task GetPermission_NotFound_ReturnsNull()
    {
        _repo.Setup(r => r.GetCollaboratorPermissionAsync(1, 99)).ReturnsAsync((CollaborationPermission?)null);
        var handler = new GetCollaboratorPermissionHandler(_repo.Object);
        var result = await handler.Handle(new GetCollaboratorPermissionQuery(1, 99), default);
        Assert.Null(result);
    }
}
