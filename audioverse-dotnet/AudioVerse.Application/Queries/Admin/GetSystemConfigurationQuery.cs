using AudioVerse.Application.Models;
using MediatR;

namespace AudioVerse.Application.Queries.Admin
{
    public record GetSystemConfigurationQuery() : IRequest<SystemConfigurationDto>;
}
