using MediatR;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Application.Models.Common;
using AudioVerse.Application.Models.Requests.Karaoke;
using AudioVerse.Domain.Repositories;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles;
using AudioVerse.Domain.Entities.Events;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class GetFilteredEntitiesHandler : IRequestHandler<GetFilteredEntitiesQuery, PagedResult<object>>
    {
        private readonly IKaraokeRepository _karaokeRepo;
        private readonly IEventRepository _eventRepo;
        public GetFilteredEntitiesHandler(IKaraokeRepository karaokeRepo, IEventRepository eventRepo)
        {
            _karaokeRepo = karaokeRepo;
            _eventRepo = eventRepo;
        }

        public async Task<PagedResult<object>> Handle(GetFilteredEntitiesQuery request, CancellationToken cancellationToken)
        {
            var filter = request.Filter;
            switch (request.EntityName.ToLowerInvariant())
            {
                case "songs":
                    return await HandleSongs(filter);
                case "events":
                case "event":
                    return await HandleEvents(filter);
                default:
                    throw new InvalidOperationException($"Unknown entity for filtering: '{request.EntityName}'");
            }
        }

        private async Task<PagedResult<object>> HandleSongs(DynamicFilterRequest filter)
        {
            var q = _karaokeRepo.GetSongsQueryable();
            q = ApplyDynamicFilters(q, filter.Conditions);
            q = ApplySorting(q, filter.SortBy, filter.SortDir, "Title");
            var total = await q.CountAsync();
            var skip = (Math.Max(1, filter.Page) - 1) * Math.Max(1, filter.PageSize);
            var items = await q.Skip(skip).Take(filter.PageSize).ToListAsync();
            var dtos = items.Select(s => AudioVerse.Application.Models.Dtos.KaraokeSongDto.FromDomain(s)).Cast<object>();
            return new PagedResult<object> { Items = dtos, TotalCount = total, Page = filter.Page, PageSize = filter.PageSize };
        }

        private async Task<PagedResult<object>> HandleEvents(DynamicFilterRequest filter)
        {
            var q = _eventRepo.GetEventsQueryable();
            q = ApplyDynamicFilters(q, filter.Conditions);
            q = ApplySorting(q, filter.SortBy, filter.SortDir, "StartTime");
            var total = await q.CountAsync();
            var skip = (Math.Max(1, filter.Page) - 1) * Math.Max(1, filter.PageSize);
            var items = await q.Skip(skip).Take(filter.PageSize).ToListAsync();
            var dtos = items.Select(e => AudioVerse.Application.Models.Dtos.KaraokeEventDto.FromDomain(e)).Cast<object>();
            return new PagedResult<object> { Items = dtos, TotalCount = total, Page = filter.Page, PageSize = filter.PageSize };
        }

        private IQueryable<T> ApplySorting<T>(IQueryable<T> q, string? sortBy, string? sortDir, string defaultSort)
        {
            var dir = (sortDir ?? "desc").ToLowerInvariant();
            var s = (sortBy ?? defaultSort).ToLowerInvariant();

            if (s is "name" or "title")
            {
                var prop = typeof(T).GetProperty("Title") != null ? "Title" : "Name";
                return dir == "asc"
                    ? q.OrderBy(x => EF.Property<object>(x!, prop))
                    : q.OrderByDescending(x => EF.Property<object>(x!, prop));
            }
            if (s == "starttime")
            {
                return dir == "asc"
                    ? q.OrderBy(x => EF.Property<DateTime>(x!, "StartTime"))
                    : q.OrderByDescending(x => EF.Property<DateTime>(x!, "StartTime"));
            }
            if (s == "status")
            {
                return dir == "asc"
                    ? q.OrderBy(x => EF.Property<object>(x!, "Status"))
                    : q.OrderByDescending(x => EF.Property<object>(x!, "Status"));
            }
            return q;
        }

        /// <summary>Convert a string value to the target CLR type, handling enums and nullable enums.</summary>
        private static object ConvertValue(string value, Type targetType)
        {
            var underlying = Nullable.GetUnderlyingType(targetType) ?? targetType;
            if (underlying.IsEnum)
            {
                // Try parsing as int first (e.g. "0"), then as name (e.g. "Planned")
                if (int.TryParse(value, out var intVal))
                    return Enum.ToObject(underlying, intVal);
                return Enum.Parse(underlying, value, ignoreCase: true);
            }
            return Convert.ChangeType(value, underlying);
        }

        private IQueryable<T> ApplyDynamicFilters<T>(IQueryable<T> q, List<FilterCondition> conditions)
        {
            if (conditions == null || !conditions.Any()) return q;
            var param = Expression.Parameter(typeof(T), "x");
            Expression? combined = null;
            foreach (var c in conditions)
            {
                var prop = Expression.PropertyOrField(param, c.Field);
                Expression expr = null!;
                switch (c.Operator)
                {
                    case FilterOperator.Equals:
                        expr = Expression.Equal(prop, Expression.Constant(ConvertValue(c.Values!.First(), prop.Type), prop.Type));
                        break;
                    case FilterOperator.In:
                        // build OR chain
                        Expression? orExpr = null;
                        foreach (var v in c.Values ?? new List<string>())
                        {
                            var eq = Expression.Equal(prop, Expression.Constant(ConvertValue(v, prop.Type), prop.Type));
                            orExpr = orExpr == null ? eq : Expression.OrElse(orExpr, eq);
                        }
                        expr = orExpr!;
                        break;
                    case FilterOperator.Contains:
                        expr = Expression.Call(prop, typeof(string).GetMethod("Contains", new[] { typeof(string) })!, Expression.Constant(c.Values!.First()));
                        break;
                    case FilterOperator.Gte:
                        expr = Expression.GreaterThanOrEqual(prop, Expression.Constant(ConvertValue(c.Values!.First(), prop.Type), prop.Type));
                        break;
                    case FilterOperator.Lte:
                        expr = Expression.LessThanOrEqual(prop, Expression.Constant(ConvertValue(c.Values!.First(), prop.Type), prop.Type));
                        break;
                    case FilterOperator.Between:
                        var low = Expression.GreaterThanOrEqual(prop, Expression.Constant(ConvertValue(c.Values![0], prop.Type), prop.Type));
                        var high = Expression.LessThanOrEqual(prop, Expression.Constant(ConvertValue(c.Values![1], prop.Type), prop.Type));
                        expr = Expression.AndAlso(low, high);
                        break;
                }

                combined = combined == null ? expr : Expression.AndAlso(combined, expr);
            }

            if (combined == null) return q;
            var lambda = Expression.Lambda<Func<T, bool>>(combined, param);
            return q.Where(lambda);
        }
    }
}
