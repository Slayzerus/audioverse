using AudioVerse.Application.Models.Admin;
using AudioVerse.Application.Queries.Admin;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Admin
{
    public class GetEventsAdminHandler : IRequestHandler<GetEventsAdminQuery, List<EventAdminDto>>
    {
        private readonly IKaraokeRepository _karaokeRepository;
        public GetEventsAdminHandler(IKaraokeRepository karaokeRepository)
        {
            _karaokeRepository = karaokeRepository;
        }

        public async Task<List<EventAdminDto>> Handle(GetEventsAdminQuery request, CancellationToken cancellationToken)
        {
            var parties = await _karaokeRepository.GetAllPartiesAsync();
            return parties
                .OrderByDescending(p => p.StartTime)
                .Select(p => new EventAdminDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description ?? string.Empty,
                    Organizer = p.Organizer?.FullName ?? p.Organizer?.UserName ?? "Unknown",
                    StartTime = p.StartTime,
                    EndTime = p.EndTime,
                    Active = p.EndTime == null || p.EndTime > DateTime.UtcNow
                })
                .ToList();
        }
    }
}
