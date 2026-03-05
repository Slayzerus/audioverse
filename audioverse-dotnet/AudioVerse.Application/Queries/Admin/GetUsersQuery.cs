using MediatR;
using AudioVerse.Application.Models.Admin;
using System.Collections.Generic;

namespace AudioVerse.Application.Queries.Admin
{
    public record GetUsersQuery() : IRequest<List<UserAdminDto>>;
}
