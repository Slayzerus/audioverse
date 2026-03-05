namespace AudioVerse.Domain.Enums
{
    /// <summary>
    /// Źródło importu kontaktu.
    /// </summary>
    public enum ContactImportSource
    {
        /// <summary>Dodany ręcznie.</summary>
        Manual = 0,
        /// <summary>Google Contacts (People API).</summary>
        Google = 1,
        /// <summary>Microsoft / Outlook (Graph API).</summary>
        Microsoft = 2,
        /// <summary>Apple Contacts (vCard).</summary>
        Apple = 3,
        /// <summary>Import z pliku CSV.</summary>
        Csv = 4,
        /// <summary>Import z pliku vCard (.vcf).</summary>
        VCard = 5,
        /// <summary>Kontakty z urządzenia mobilnego.</summary>
        Phone = 6,
        /// <summary>Facebook.</summary>
        Facebook = 7,
        /// <summary>LinkedIn.</summary>
        LinkedIn = 8,
        /// <summary>CardDAV / CalDAV.</summary>
        CardDav = 9
    }
}
