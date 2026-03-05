using AudioVerse.Domain.Entities.Radio;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace AudioVerse.API.Seed;

/// <summary>
/// Seeder zewnętrznych stacji radiowych online — darmowe streamy z całego świata.
/// Pokrywa: PL, EN(US/UK), DE, FR, IT, ES, JP, CN + inne.
/// Wszystkie domyślnie włączone (IsActive = true).
/// </summary>
public static class ExternalRadioSeeder
{
    public static async Task SeedExternalRadioStationsAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<AudioVerseDbContext>>();

        if (await db.ExternalRadioStations.AnyAsync())
        {
            logger.LogInformation("External radio stations already seeded — skipping");
            return;
        }

        logger.LogInformation("Seeding external radio stations…");

        static ExternalRadioStation S(string name, string stream, string cc, string country, string lang, string genre, int? kbps = 128)
            => new()
            {
                Name = name,
                Slug = name.ToLower().Replace(" ", "-").Replace(".", "").Replace("ö", "oe").Replace("ü", "ue").Replace("ä", "ae").Replace("ó", "o").Replace("ł", "l").Replace("ś", "s").Replace("ż", "z").Replace("ź", "z").Replace("ą", "a").Replace("ę", "e").Replace("ć", "c").Replace("ń", "n"),
                StreamUrl = stream,
                CountryCode = cc,
                CountryName = country,
                Language = lang,
                Genre = genre,
                BitrateKbps = kbps,
                IsActive = true
            };

        var stations = new List<ExternalRadioStation>
        {
            // ══════════════════════ POLSKA (PL) ══════════════════════
            S("RMF FM",                 "https://rs6-krk2.rmfstream.pl/rmf_fm",                     "PL", "Polska", "pl", "pop",       128),
            S("RMF MAXXX",              "https://rs6-krk2.rmfstream.pl/rmf_maxxx",                   "PL", "Polska", "pl", "pop/dance",  128),
            S("Radio ZET",              "https://zt.radiostream.pl/zet-net.mp3",                     "PL", "Polska", "pl", "pop",        128),
            S("Trójka PR3",             "https://stream3.polskieradio.pl:8904/",                     "PL", "Polska", "pl", "rock/culture",128),
            S("Jedynka PR1",            "https://stream3.polskieradio.pl:8900/",                     "PL", "Polska", "pl", "news/talk",  128),
            S("Radio Nowy Świat",       "https://stream.rfrn.pl/rns.mp3",                            "PL", "Polska", "pl", "eclectic",   128),
            S("Antyradio",              "https://an.cdn.eurozet.pl/ant-waw.mp3",                     "PL", "Polska", "pl", "rock",       128),
            S("Radio Pogoda",           "https://n-4-7.dcs.redcdn.pl/sc/o2/Eurozet/live/radiopogoda.livx", "PL", "Polska", "pl", "oldies", 128),
            S("Radio Eska",             "https://ic1.smcdn.pl/2380-1.mp3",                           "PL", "Polska", "pl", "pop/dance",  128),
            S("Radio Złote Przeboje",   "https://n-4-1.dcs.redcdn.pl/sc/o2/Eurozet/live/audio.livx", "PL", "Polska", "pl", "oldies",     128),
            S("TOK FM",                 "https://radiostream.pl/tuba10122.mp3",                      "PL", "Polska", "pl", "news/talk",  128),
            S("Radio 357",              "https://stream.radio357.pl/radio357_mp3",                   "PL", "Polska", "pl", "culture",    128),
            S("Chillizet",              "https://ch.cdn.eurozet.pl/chi-waw.mp3",                     "PL", "Polska", "pl", "chill",      128),
            S("Meloradio",              "https://ml.cdn.eurozet.pl/mel-waw.mp3",                     "PL", "Polska", "pl", "pop",        128),

            // ══════════════════════ USA / UK (EN) ══════════════════════
            S("KEXP Seattle",           "https://kexp-mp3-128.streamguys1.com/kexp128.mp3",         "US", "USA",     "en", "indie/alternative", 128),
            S("NPR News",              "https://npr-ice.streamguys1.com/live.mp3",                  "US", "USA",     "en", "news",       64),
            S("SomaFM Groove Salad",   "https://ice2.somafm.com/groovesalad-128-mp3",               "US", "USA",     "en", "ambient/chill", 128),
            S("SomaFM Indie Pop Rocks","https://ice2.somafm.com/indiepop-128-mp3",                  "US", "USA",     "en", "indie pop",  128),
            S("SomaFM DEF CON",        "https://ice2.somafm.com/defcon-128-mp3",                    "US", "USA",     "en", "electronic", 128),
            S("SomaFM Drone Zone",     "https://ice2.somafm.com/dronezone-128-mp3",                 "US", "USA",     "en", "ambient",    128),
            S("SomaFM Secret Agent",   "https://ice2.somafm.com/secretagent-128-mp3",               "US", "USA",     "en", "lounge",     128),
            S("WFMU Freeform",         "https://stream0.wfmu.org/freeform-128k.mp3",                "US", "USA",     "en", "freeform",   128),
            S("KCRW Eclectic 24",      "https://kcrw.streamguys1.com/kcrw_192k_mp3_e24",            "US", "USA",     "en", "eclectic",   192),
            S("Jazz24",                "https://live.wostreaming.net/direct/ppm-jazz24mp3-ibc1",     "US", "USA",     "en", "jazz",       128),
            S("Classic FM",            "https://media-ice.musicradio.com/ClassicFMMP3",             "GB", "UK",      "en", "classical",  128),
            S("BBC Radio 1",           "http://stream.live.vc.bbcmedia.co.uk/bbc_radio_one",        "GB", "UK",      "en", "pop/rock",   128),
            S("BBC Radio 2",           "http://stream.live.vc.bbcmedia.co.uk/bbc_radio_two",        "GB", "UK",      "en", "pop/adult",  128),
            S("BBC Radio 3",           "http://stream.live.vc.bbcmedia.co.uk/bbc_radio_three",      "GB", "UK",      "en", "classical",  128),
            S("BBC Radio 4",           "http://stream.live.vc.bbcmedia.co.uk/bbc_radio_fourfm",     "GB", "UK",      "en", "news/talk",  128),
            S("BBC Radio 6 Music",     "http://stream.live.vc.bbcmedia.co.uk/bbc_6music",           "GB", "UK",      "en", "alternative",128),
            S("Absolute Radio",        "https://icecast.thisisdax.com/AbsoluteRadioMP3",            "GB", "UK",      "en", "rock",       128),
            S("NTS Radio 1",           "https://stream-relay-geo.ntslive.net/stream",               "GB", "UK",      "en", "eclectic",   128),
            S("FIP Radio",             "https://icecast.radiofrance.fr/fip-midfi.mp3",              "GB", "UK",      "en", "eclectic",   128),
            S("Rinse FM",              "https://streamer.radio.co/s06b196587/listen",               "GB", "UK",      "en", "electronic", 128),

            // ══════════════════════ NIEMCY (DE) ══════════════════════
            S("SWR3",                  "https://liveradio.swr.de/sw282p3/swr3/play.mp3",           "DE", "Niemcy",  "de", "pop",        128),
            S("Bayern 3",             "https://streams.br.de/bayern3_2.m3u",                       "DE", "Niemcy",  "de", "pop",        128),
            S("WDR 1LIVE",            "https://wdr-1live-live.icecast.wdr.de/wdr/1live/live/mp3/128/stream.mp3", "DE", "Niemcy", "de", "pop/rock", 128),
            S("WDR COSMO",            "https://wdr-cosmo-live.icecast.wdr.de/wdr/cosmo/live/mp3/128/stream.mp3", "DE", "Niemcy", "de", "world", 128),
            S("Deutschlandfunk",       "https://st01.dlf.de/dlf/01/128/mp3/stream.mp3",            "DE", "Niemcy",  "de", "news/culture",128),
            S("FluxFM",               "https://streams.fluxfm.de/live/mp3-320/audio/",              "DE", "Niemcy",  "de", "alternative",320),
            S("Radio Bob",            "https://streams.radiobob.de/bob-live/mp3-192/mediaplayer",   "DE", "Niemcy",  "de", "rock",       192),
            S("Klassik Radio",        "https://stream.klassikradio.de/live/mp3-128/stream.klassikradio.de/", "DE", "Niemcy", "de", "classical", 128),
            S("Sunshine Live",        "https://stream.sunshine-live.de/live/mp3-192/stream.sunshine-live.de/", "DE", "Niemcy", "de", "electronic", 192),
            S("Fritz (rbb)",          "https://dispatcher.rndfnk.com/rbb/fritz/live/mp3/mid",      "DE", "Niemcy",  "de", "alternative",128),
            S("HR3",                  "https://dispatcher.rndfnk.com/hr/hr3/live/mp3/48/stream.mp3","DE", "Niemcy", "de", "pop",        128),
            S("NDR 2",                "https://icecast.ndr.de/ndr/ndr2/niedersachsen/mp3/128/stream.mp3","DE","Niemcy","de","pop",      128),

            // ══════════════════════ FRANCJA (FR) ══════════════════════
            S("FIP",                   "https://icecast.radiofrance.fr/fip-midfi.mp3",              "FR", "Francja", "fr", "eclectic",   128),
            S("France Inter",         "https://icecast.radiofrance.fr/franceinter-midfi.mp3",       "FR", "Francja", "fr", "talk/music", 128),
            S("France Musique",       "https://icecast.radiofrance.fr/francemusique-midfi.mp3",     "FR", "Francja", "fr", "classical",  128),
            S("France Culture",       "https://icecast.radiofrance.fr/franceculture-midfi.mp3",     "FR", "Francja", "fr", "culture",    128),
            S("NRJ France",           "https://scdn.nrjaudio.fm/fr/30001/mp3_128.mp3",             "FR", "Francja", "fr", "pop/dance",  128),
            S("RTL France",           "https://streamer-03.rtl.fr/rtl-1-44-128",                   "FR", "Francja", "fr", "talk",       128),
            S("Skyrock",              "https://icecast.skyrock.net/s/natio_mp3_128k",              "FR", "Francja", "fr", "hip-hop",    128),
            S("Nostalgie France",     "https://scdn.nrjaudio.fm/fr/30601/mp3_128.mp3",             "FR", "Francja", "fr", "oldies",     128),
            S("RFI Monde",            "https://live02.rfi.fr/rfimonde-96k.mp3",                    "FR", "Francja", "fr", "news",       96),
            S("Mouv'",                "https://icecast.radiofrance.fr/mouv-midfi.mp3",              "FR", "Francja", "fr", "urban/hiphop",128),
            S("TSF Jazz",             "https://tsfjazz.ice.infomaniak.ch/tsfjazz-high.mp3",        "FR", "Francja", "fr", "jazz",       128),
            S("Radio Nova",           "https://novazz.ice.infomaniak.ch/novazz-128.mp3",           "FR", "Francja", "fr", "eclectic",   128),

            // ══════════════════════ WŁOCHY (IT) ══════════════════════
            S("Radio Italia",          "https://radioitaliasmi.akamaized.net/hls/live/2093120/RISMI/stream01/streamPlaylist.m3u8", "IT", "Włochy", "it", "pop italiano", 128),
            S("RTL 102.5",            "https://streamingv2.shoutcast.com/rtl-1025",                "IT", "Włochy",  "it", "pop",        128),
            S("Radio DeeJay",         "https://radiodeejay-lh.akamaihd.net/i/RadioDeejay_Live_1@189857/master.m3u8", "IT", "Włochy", "it", "pop/dance", 128),
            S("Radio 105",            "https://icecast.unitedradio.it/Radio105.mp3",               "IT", "Włochy",  "it", "pop",        128),
            S("RDS Radio",            "https://stream3.rds.radio/rds/mp3/icecast.audio",           "IT", "Włochy",  "it", "pop",        128),
            S("Virgin Radio Italy",   "https://icecast.unitedradio.it/Virgin.mp3",                 "IT", "Włochy",  "it", "rock",       128),
            S("Radio Capital",        "https://icecast.unitedradio.it/Capital.mp3",                "IT", "Włochy",  "it", "rock/classic",128),
            S("Radio 24",             "https://shoutcast.radio24.it/radio24",                      "IT", "Włochy",  "it", "news/talk",  128),
            S("Rai Radio 1",          "https://icestreaming.rai.it/1.mp3",                         "IT", "Włochy",  "it", "news",       128),
            S("Rai Radio 3",          "https://icestreaming.rai.it/3.mp3",                         "IT", "Włochy",  "it", "classical/culture", 128),
            S("m2o",                  "https://icecast.unitedradio.it/m2o.mp3",                    "IT", "Włochy",  "it", "electronic", 128),

            // ══════════════════════ HISZPANIA (ES) ══════════════════════
            S("Cadena SER",            "https://playerservices.streamtheworld.com/api/livestream-redirect/CADENASER.mp3", "ES", "Hiszpania", "es", "news/talk", 128),
            S("Los 40 Principales",   "https://playerservices.streamtheworld.com/api/livestream-redirect/LOS40.mp3", "ES", "Hiszpania", "es", "pop",  128),
            S("Cadena Dial",          "https://playerservices.streamtheworld.com/api/livestream-redirect/CADENADIAL.mp3", "ES", "Hiszpania", "es", "pop español", 128),
            S("Rock FM Spain",        "https://playerservices.streamtheworld.com/api/livestream-redirect/ROCKFM.mp3", "ES", "Hispania", "es", "rock",  128),
            S("RNE Radio Nacional",   "https://rtvelivestream.akamaized.net/rne_r1_main.mp3",     "ES", "Hiszpania","es", "news",       128),
            S("Radio 3 RNE",         "https://rtvelivestream.akamaized.net/rne_r3_main.mp3",      "ES", "Hiszpania","es", "alternative/indie", 128),
            S("Radio Clásica RNE",   "https://rtvelivestream.akamaized.net/rne_r2_main.mp3",      "ES", "Hiszpania","es", "classical",  128),
            S("Onda Cero",           "https://playerservices.streamtheworld.com/api/livestream-redirect/ONDACERO.mp3", "ES", "Hiszpania", "es", "talk", 128),
            S("COPE",                "https://flumotion.cope.stream/cope/net1.mp3",                "ES", "Hiszpania","es", "news/talk",  128),
            S("Flamenco Radio",      "https://radios.rtve.es/extra/flamenco.mp3",                 "ES", "Hiszpania","es", "flamenco",   128),

            // ══════════════════════ JAPONIA (JP) ══════════════════════
            S("J-Wave Tokyo",          "https://musicbird-hls.leanstream.co/musicbird/JWave.stream/playlist.m3u8", "JP", "Japonia", "ja", "pop/jpop",  128),
            S("InterFM 897",          "https://musicbird-hls.leanstream.co/musicbird/InterFM.stream/playlist.m3u8","JP","Japonia","ja","pop/international",128),
            S("Tokyo FM",             "https://musicbird-hls.leanstream.co/musicbird/TOKYOFM.stream/playlist.m3u8","JP","Japonia","ja","pop",128),
            S("NHK Radio 1",          "https://radio-stream.nhk.jp/hls/live/2023229/nhkradiruakr1/master.m3u8","JP","Japonia","ja","news",128),
            S("NHK FM",               "https://radio-stream.nhk.jp/hls/live/2023507/nhkradiruakfm/master.m3u8","JP","Japonia","ja","classical/eclectic",128),
            S("Shonan Beach FM",       "https://musicbird-hls.leanstream.co/musicbird/ShonanBeach.stream/playlist.m3u8","JP","Japonia","ja","chill/surf",128),
            S("Ottava Classical",      "https://ottava.out.airtime.pro/ottava_a",                   "JP", "Japonia", "ja", "classical",  128),

            // ══════════════════════ CHINY (CN) ══════════════════════
            S("CRI English",           "http://sk.cri.cn/am846.mp3",                               "CN", "Chiny",   "zh", "news (english)", 64),
            S("CNR China Voice",       "http://ngcdn001.cnr.cn/live/zgzs/index.m3u8",               "CN", "Chiny",   "zh", "news",       128),
            S("CNR Music",            "http://ngcdn001.cnr.cn/live/yyzs/index.m3u8",                "CN", "Chiny",   "zh", "music",      128),
            S("CNR Business",         "http://ngcdn001.cnr.cn/live/jjzs/index.m3u8",                "CN", "Chiny",   "zh", "business",   128),
            S("Beijing Music Radio",  "http://lhttp.qtfm.cn/live/20200601/24kAAC/hls/main.m3u8",   "CN", "Chiny",   "zh", "pop/cpop",   128),

            // ══════════════════════ BRAZYLIA (BR) ══════════════════════
            S("Rádio Globo",           "https://playerservices.streamtheworld.com/api/livestream-redirect/RADIO_GLOBO_RJ_ADP.aac", "BR", "Brazylia", "pt", "pop/sertanejo", 128),
            S("CBN Radio",            "https://playerservices.streamtheworld.com/api/livestream-redirect/CBN_RIOADP.aac", "BR", "Brazylia", "pt", "news", 128),
            S("Jovem Pan FM",         "https://playerservices.streamtheworld.com/api/livestream-redirect/JP_FM_SP_ADP.aac", "BR", "Brazylia", "pt", "pop", 128),

            // ══════════════════════ HOLANDIA (NL) ══════════════════════
            S("NPO Radio 1",          "https://icecast.omroep.nl/radio1-bb-mp3",                   "NL", "Holandia", "nl", "news/talk",  128),
            S("NPO Radio 2",          "https://icecast.omroep.nl/radio2-bb-mp3",                   "NL", "Holandia", "nl", "pop",        128),
            S("NPO 3FM",              "https://icecast.omroep.nl/3fm-bb-mp3",                      "NL", "Holandia", "nl", "alternative",128),
            S("Radio 538",            "https://22593.live.streamtheworld.com/RADIO538.mp3",         "NL", "Holandia", "nl", "pop",        128),
            S("FunX",                 "https://icecast.omroep.nl/funx-bb-mp3",                     "NL", "Holandia", "nl", "urban",      128),

            // ══════════════════════ BELGIA (BE) ══════════════════════
            S("Studio Brussel",        "https://icecast.vrtcdn.be/stubru-high.mp3",                "BE", "Belgia",   "nl", "alternative",128),
            S("MNM",                  "https://icecast.vrtcdn.be/mnm-high.mp3",                    "BE", "Belgia",   "nl", "pop",        128),
            S("Klara",                "https://icecast.vrtcdn.be/klara-high.mp3",                  "BE", "Belgia",   "nl", "classical",  128),
            S("Radio 1 VRT",          "https://icecast.vrtcdn.be/radio1-high.mp3",                 "BE", "Belgia",   "nl", "news",       128),

            // ══════════════════════ AUSTRIA (AT) ══════════════════════
            S("Ö1",                    "https://orf-live.ors-shoutcast.at/oe1-q2a",                "AT", "Austria",  "de", "culture",    128),
            S("FM4",                  "https://orf-live.ors-shoutcast.at/fm4-q2a",                 "AT", "Austria",  "de", "alternative",128),
            S("Ö3",                   "https://orf-live.ors-shoutcast.at/oe3-q2a",                 "AT", "Austria",  "de", "pop",        128),

            // ══════════════════════ SZWAJCARIA (CH) ══════════════════════
            S("SRF 3",                "https://stream.srg-ssr.ch/m/drs3/mp3_128",                  "CH", "Szwajcaria","de","pop",         128),
            S("SRF 1",                "https://stream.srg-ssr.ch/m/drs1/mp3_128",                  "CH", "Szwajcaria","de","talk/pop",    128),
            S("RTS La Première",      "https://stream.srg-ssr.ch/m/la-1ere/mp3_128",               "CH", "Szwajcaria","fr","talk/culture",128),
            S("RSI Rete Uno",         "https://stream.srg-ssr.ch/m/reteuno/mp3_128",               "CH", "Szwajcaria","it","talk",        128),

            // ══════════════════════ CZECHY (CZ) ══════════════════════
            S("Český rozhlas Radiožurnál","https://icecast6.play.cz/croradio-128.mp3",             "CZ", "Czechy",   "cs", "news",       128),
            S("Český rozhlas Dvojka",  "https://icecast6.play.cz/cro2-128.mp3",                    "CZ", "Czechy",   "cs", "talk/culture",128),
            S("Radio Beat",           "https://icecast8.play.cz/radiobeat128.mp3",                 "CZ", "Czechy",   "cs", "rock",       128),

            // ══════════════════════ SZWECJA (SE) ══════════════════════
            S("P3 Sveriges Radio",     "https://sverigesradio.se/topsy/direkt/164-hi-mp3",         "SE", "Szwecja",  "sv", "pop",        192),
            S("P1 Sveriges Radio",     "https://sverigesradio.se/topsy/direkt/132-hi-mp3",         "SE", "Szwecja",  "sv", "news/culture",192),
            S("P4 Stockholm",         "https://sverigesradio.se/topsy/direkt/701-hi-mp3",          "SE", "Szwecja",  "sv", "pop/local",  192),

            // ══════════════════════ NORWEGIA (NO) ══════════════════════
            S("NRK P1",               "https://lyd.nrk.no/nrk_radio_p1_ostlandssendingen_mp3_h",  "NO", "Norwegia", "no", "pop/talk",   192),
            S("NRK P3",               "https://lyd.nrk.no/nrk_radio_p3_mp3_h",                    "NO", "Norwegia", "no", "pop/youth",  192),

            // ══════════════════════ DANIA (DK) ══════════════════════
            S("DR P1",                "https://live-icy.dr.dk/A/A03H.mp3",                        "DK", "Dania",    "da", "news",       192),
            S("DR P3",                "https://live-icy.dr.dk/A/A05H.mp3",                        "DK", "Dania",    "da", "pop",        192),

            // ══════════════════════ FINLANDIA (FI) ══════════════════════
            S("YLE Radio 1",          "https://yleradiolive.akamaized.net/hls/live/2027677/in-YleRadio1/master.m3u8", "FI","Finlandia","fi","classical/culture",128),
            S("YLE Radio Suomi",      "https://yleradiolive.akamaized.net/hls/live/2027682/in-YleRadioSuomi/master.m3u8","FI","Finlandia","fi","pop/talk",128),

            // ══════════════════════ PORTUGALIA (PT) ══════════════════════
            S("Antena 1",             "https://radiocast.rtp.pt/antena180a.mp3",                   "PT", "Portugalia","pt","pop",         128),
            S("Antena 3",             "https://radiocast.rtp.pt/antena380a.mp3",                   "PT", "Portugalia","pt","alternative", 128),

            // ══════════════════════ WĘGRY (HU) ══════════════════════
            S("Petőfi Rádió",          "https://icast.connectmedia.hu/4738/mr2.mp3",               "HU", "Węgry",    "hu", "pop",        128),
            S("Kossuth Rádió",        "https://icast.connectmedia.hu/4736/mr1.mp3",                "HU", "Węgry",    "hu", "news",       128),

            // ══════════════════════ RUMUNIA (RO) ══════════════════════
            S("Radio România Actualități","https://live1.radioromania.ro:8443/actualitati.mp3",    "RO", "Rumunia",  "ro", "news",       128),
            S("Kiss FM Romania",       "https://live.kissfm.ro/kissfm.aacp",                       "RO", "Rumunia",  "ro", "pop/dance",  128),

            // ══════════════════════ TURCJA (TR) ══════════════════════
            S("TRT Radyo 1",          "https://trtcanlitv-lh.akamaized.net/i/TRTRADYO1_1@181944/master.m3u8", "TR", "Turcja", "tr", "news", 128),
            S("Power Türk",           "https://listen.powerapp.com.tr/powerfm/abr/playlist.m3u8",  "TR", "Turcja",   "tr", "pop",        128),

            // ══════════════════════ KOREA POŁUDNIOWA (KR) ══════════════════════
            S("KBS 1 Radio",           "https://kong.kbs.co.kr/80fa/kbs_proxy/aod/kbs_1radio_mp3.m3u8", "KR", "Korea Płd.", "ko", "news",  128),
            S("KBS Cool FM",          "https://kong.kbs.co.kr/80fa/kbs_proxy/aod/kbs_coolfm_mp3.m3u8",  "KR", "Korea Płd.", "ko", "pop/kpop", 128),

            // ══════════════════════ IRLANDIA (IE) ══════════════════════
            S("RTÉ Radio 1",          "https://icecast2.rte.ie/radio1",                            "IE", "Irlandia", "en", "news/talk",  128),
            S("RTÉ 2FM",             "https://icecast2.rte.ie/2fm",                                "IE", "Irlandia", "en", "pop",        128),

            // ══════════════════════ GRECJA (GR) ══════════════════════
            S("ERT Trito",            "https://radiostreaming.ert.gr/ert-trito",                    "GR", "Grecja",   "el", "culture",    128),
            S("Kosmos FM",           "https://radiostreaming.ert.gr/ert-kosmos",                    "GR", "Grecja",   "el", "world/jazz", 128),

            // ══════════════════════ INDIE (IN) ══════════════════════
            S("AIR Vividh Bharati",   "https://air.pc.cdn.bitgravity.com/air/live/pbaudio001/playlist.m3u8", "IN", "Indie", "hi", "bollywood", 128),
            S("Radio Mirchi",         "https://radioindia.net/radio/mirchi98/icecast.audio",        "IN", "Indie",    "hi", "pop/bollywood",128),

            // ══════════════════════ KANADA (CA) ══════════════════════
            S("CBC Radio One",        "https://cbcliveradio-lh.akamaihd.net/i/CBCR1_OTT@382392/master.m3u8", "CA", "Kanada", "en", "news",  128),
            S("CBC Music",           "https://cbcliveradio-lh.akamaihd.net/i/CBCR2_OTT@382393/master.m3u8",  "CA", "Kanada", "en", "eclectic",128),

            // ══════════════════════ AUSTRALIA (AU) ══════════════════════
            S("ABC Triple J",        "https://live-radio01.mediahubaustralia.com/2TJW/mp3/",       "AU", "Australia","en", "alternative",128),
            S("ABC Classic",         "https://live-radio01.mediahubaustralia.com/2FMW/mp3/",       "AU", "Australia","en", "classical",  128),
            S("ABC Jazz",            "https://live-radio01.mediahubaustralia.com/JAZW/mp3/",       "AU", "Australia","en", "jazz",       128),

            // ══════════════════════ NOWA ZELANDIA (NZ) ══════════════════════
            S("RNZ National",        "https://radionz.streamguys1.com/national",                   "NZ", "Nowa Zelandia","en","news",    128),
            S("RNZ Concert",         "https://radionz.streamguys1.com/concert",                    "NZ", "Nowa Zelandia","en","classical",128),

            // ══════════════════════ MEKSYK (MX) ══════════════════════
            S("Radio UNAM",          "https://live.unam.cloud/radioUNAM",                          "MX", "Meksyk",   "es", "culture",    128),
            S("Ibero 90.9",          "https://ibero909.uia.mx:8000/ibero909",                      "MX", "Meksyk",   "es", "alternative",128),

            // ══════════════════════ ARGENTYNA (AR) ══════════════════════
            S("Radio Nacional Argentina","https://sa.mp3.icecast.magma.edge-access.net/sc_rad1",   "AR", "Argentyna","es", "news/culture",128),

            // ══════════════════════ UKRAINA (UA) ══════════════════════
            S("Hromadske Radio",      "https://radio.hromadske.ua/listen/hromadske/aacp48",         "UA", "Ukraina",  "uk", "news",       128),
        };

        db.ExternalRadioStations.AddRange(stations);
        await db.SaveChangesAsync();

        logger.LogInformation("Seeded {Count} external radio stations", stations.Count);
    }
}
