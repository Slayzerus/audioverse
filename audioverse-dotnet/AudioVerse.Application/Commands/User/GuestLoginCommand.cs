using MediatR;

namespace AudioVerse.Application.Commands.User
{
    public record GuestLoginCommand : IRequest<GuestLoginResult>;
}
