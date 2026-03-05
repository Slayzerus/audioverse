using AudioVerse.Application.Models;
using MediatR;

namespace AudioVerse.Application.Queries.User
{
    public record GetMicrophoneAssignmentsQuery() : IRequest<List<MicrophoneAssignmentDto>>;
}
