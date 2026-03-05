using System.Collections.Generic;

namespace AudioVerse.Application.Models.Admin
{
    public class BulkPermissionChangeDto
    {
        public List<PermissionChangeDetailDto> Changes { get; set; } = new();
    }
}
