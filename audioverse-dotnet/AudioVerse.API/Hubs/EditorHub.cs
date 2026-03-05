using Microsoft.AspNetCore.SignalR;

namespace AudioVerse.API.Hubs;

/// <summary>
/// Real-time collaboration hub for the audio editor.
/// Clients join a project group and broadcast layer/item changes.
/// </summary>
public class EditorHub : Hub
{
    /// <summary>Join a project editing session</summary>
    public async Task JoinProject(string projectId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"editor_{projectId}");
        await Clients.OthersInGroup($"editor_{projectId}").SendAsync("UserJoined", new
        {
            ConnectionId = Context.ConnectionId,
            UserId = Context.UserIdentifier,
            ProjectId = projectId,
            JoinedAt = DateTime.UtcNow
        });
    }

    /// <summary>Leave a project editing session</summary>
    public async Task LeaveProject(string projectId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"editor_{projectId}");
        await Clients.OthersInGroup($"editor_{projectId}").SendAsync("UserLeft", new
        {
            ConnectionId = Context.ConnectionId,
            UserId = Context.UserIdentifier,
            ProjectId = projectId
        });
    }

    /// <summary>Broadcast a layer item change (add/move/resize/delete)</summary>
    public async Task SendItemChange(string projectId, object change)
    {
        await Clients.OthersInGroup($"editor_{projectId}").SendAsync("ItemChanged", new
        {
            UserId = Context.UserIdentifier,
            Change = change,
            Timestamp = DateTime.UtcNow
        });
    }

    /// <summary>Broadcast cursor/selection position for presence</summary>
    public async Task SendCursorPosition(string projectId, double timePosition, int? trackId, int? layerId)
    {
        await Clients.OthersInGroup($"editor_{projectId}").SendAsync("CursorMoved", new
        {
            UserId = Context.UserIdentifier,
            ConnectionId = Context.ConnectionId,
            TimePosition = timePosition,
            TrackId = trackId,
            LayerId = layerId
        });
    }

    /// <summary>Lock a section (track/layer) for editing</summary>
    public async Task LockSection(string projectId, string sectionType, int sectionId)
    {
        await Clients.OthersInGroup($"editor_{projectId}").SendAsync("SectionLocked", new
        {
            UserId = Context.UserIdentifier,
            SectionType = sectionType,
            SectionId = sectionId
        });
    }

    /// <summary>Unlock a section</summary>
    public async Task UnlockSection(string projectId, string sectionType, int sectionId)
    {
        await Clients.OthersInGroup($"editor_{projectId}").SendAsync("SectionUnlocked", new
        {
            UserId = Context.UserIdentifier,
            SectionType = sectionType,
            SectionId = sectionId
        });
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }
}
