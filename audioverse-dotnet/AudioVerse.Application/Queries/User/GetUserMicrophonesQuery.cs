using AudioVerse.Application.Models;
using MediatR;

namespace AudioVerse.Application.Queries.User
{
    public record GetUserMicrophonesQuery(int UserId) : IRequest<List<MicrophoneDto>>;
}
