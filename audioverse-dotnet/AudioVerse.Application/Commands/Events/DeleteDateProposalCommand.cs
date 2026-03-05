using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record DeleteDateProposalCommand(int Id) : IRequest<bool>;
