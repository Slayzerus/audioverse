using AudioVerse.Domain.Enums;

namespace AudioVerse.API.Areas.Identity.Controllers
{
    /// <summary>
    /// Request importu kontaktów (batch) — z CSV, vCard, Google, urządzenia mobilnego itd.
    /// </summary>
    public class ContactImportRequest
    {
        /// <summary>Źródło importu.</summary>
        public ContactImportSource Source { get; set; } = ContactImportSource.Manual;
        /// <summary>Opcjonalnie — przypisz zaimportowane kontakty do grupy.</summary>
        public int? GroupId { get; set; }
        /// <summary>Lista kontaktów do zaimportowania.</summary>
        public List<ContactImportItem> Contacts { get; set; } = [];
    }
}
