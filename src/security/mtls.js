import https from "node:https";

function mustEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Variável de ambiente ausente: ${name}`);
  return v;
}

export function createMtlsAgent() {
  const pfxBase64 = mustEnv("CERT_PFX_BASE64");
  const passphrase = mustEnv("CERT_PFX_PASSWORD");

  const pfx = Buffer.from(pfxBase64, "base64");

  return new https.Agent({
    pfx,
    passphrase,
    minVersion: "TLSv1.2",
    maxVersion: "TLSv1.2",
    keepAlive: true
  });
}
