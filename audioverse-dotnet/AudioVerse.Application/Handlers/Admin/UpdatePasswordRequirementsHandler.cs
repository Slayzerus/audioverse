using AudioVerse.Application.Commands.Admin;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Admin;

public class UpdatePasswordRequirementsHandler(ISystemConfigRepository configRepo) : IRequestHandler<UpdatePasswordRequirementsCommand, bool>
{
    public async Task<bool> Handle(UpdatePasswordRequirementsCommand req, CancellationToken ct)
    {
        var current = await configRepo.GetPasswordRequirementsAsync();
        if (current == null) return false;

        current.RequireUppercase = req.RequireUppercase;
        current.RequireLowercase = req.RequireLowercase;
        current.RequireDigit = req.RequireDigit;
        current.RequireSpecialChar = req.RequireSpecialChar;
        current.MinLength = req.MinLength;

        return await configRepo.UpdatePasswordRequirementsAsync(current);
    }
}
