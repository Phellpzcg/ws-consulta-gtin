import https from "node:https";

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Variável de ambiente ausente: ${name}`);
  return v;
}

export function createMtlsAgent(): https.Agent {
  const pfxBase64 = mustEnv("CERT_PFX_BASE64");
  const passphrase = mustEnv("CERT_PFX_PASSWORD");

  const pfx = Buffer.from(pfxBase64, "base64");

  return new https.Agent({
    pfx,
    passphrase,
    // A NT exige TLS 1.2
    minVersion: "TLSv1.2",
    maxVersion: "TLSv1.2",
    keepAlive: true
  });
}
