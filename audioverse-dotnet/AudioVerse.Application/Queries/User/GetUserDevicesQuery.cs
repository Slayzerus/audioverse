using AudioVerse.Application.Models;
using MediatR;

namespace AudioVerse.Application.Queries.User
{
    public record GetUserDevicesQuery(int UserId) : IRequest<List<DeviceDto>>;
}
