namespace AudioVerse.SetupWizard;

public static class CertScriptTemplate
{
    public static string GenerateSh() => """
        #!/bin/sh
        set -e
        mkdir -p certs
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
          -keyout certs/privkey.pem -out certs/fullchain.pem \
          -subj "/CN=localhost"
        echo "Generated self-signed certs in ./certs"
        """;

    public static string GeneratePs1() => """
        param([string]$OutDir = './certs')
        New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
        $cert = New-SelfSignedCertificate -DnsName 'localhost' -CertStoreLocation Cert:\LocalMachine\My
        $pwd = ConvertTo-SecureString -String 'password' -Force -AsPlainText
        Export-PfxCertificate -Cert $cert -FilePath (Join-Path $OutDir 'cert.pfx') -Password $pwd
        """;
}
