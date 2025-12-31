import https from "node:https";
import { requireApiKey } from "../../src/security/auth.js";
import { createMtlsAgent } from "../../src/security/mtls.js";
import { validateGtin } from "../../src/validation/gtin.js";
import { buildSoapEnvelope } from "../../src/soap/buildEnvelope.js";
import { parseSoapXml } from "../../src/soap/parseResponse.js";
import { friendlyForCStat } from "../../src/messages/cstatFriendly.js";

function json(status, body) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

function mustEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Variável de ambiente ausente: ${name}`);
  return v;
}

export default async function handler(req) {
  const traceId = `${new Date().toISOString()}-${Math.random().toString(16).slice(2)}`;

  try {
    requireApiKey(req);

    if (req.method !== "POST") {
      return json(405, { ok: false, traceId, error: "Método não permitido. Use POST." });
    }

    const body = await req.json().catch(() => ({}));
    const input = String(body?.gtin ?? "");

    const v = validateGtin(input);
    if (!v.ok) {
      const cStat = v.errorCStat || "9491";
      return json(200, {
        ok: false,
        traceId,
        status: { cStat, xMotivo: v.errorFriendly, friendly: v.errorFriendly },
        input: { gtinOriginal: v.gtinOriginal, gtinNormalizado: v.gtinNormalizado || "" },
        data: null,
        rawXml: null
      });
    }

    const wsUrl = mustEnv("WS_CCG_URL");
    const soapXml = buildSoapEnvelope(v.gtinNormalizado);
    const agent = createMtlsAgent();

    const rawXml = await callSoap(wsUrl, soapXml, agent);
    const parsed = parseSoapXml(rawXml);
    const friendly = friendlyForCStat(parsed.cStat);

    const ok = parsed.cStat === "9490";

    return json(200, {
      ok,
      traceId,
      status: { cStat: parsed.cStat, xMotivo: parsed.xMotivo, friendly },
      input: { gtinOriginal: v.gtinOriginal, gtinNormalizado: v.gtinNormalizado },
      data: {
        tpGTIN: parsed.tpGTIN,
        xProd: parsed.xProd,
        ncm: parsed.ncm,
        cest: parsed.cest || []
      },
      rawXml
    });
  } catch (e) {
    const statusCode = Number(e?.statusCode || 500);
    return json(statusCode, {
      ok: false,
      traceId,
      error: e?.message || "Erro interno",
      rawXml: null
    });
  }
}

async function callSoap(url, soapXml, agent) {
  const timeoutMs = Number(process.env.REQUEST_TIMEOUT_MS || 15000);

  return new Promise((resolve, reject) => {
    const u = new URL(url);

    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: "POST",
        port: u.port || 443,
        headers: {
          "Content-Type": "application/soap+xml; charset=utf-8",
          "Content-Length": Buffer.byteLength(soapXml)
        },
        agent,
        timeout: timeoutMs
      },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      }
    );

    req.on("timeout", () => {
      req.destroy(new Error("Timeout ao consultar o WS."));
    });

    req.on("error", (err) => reject(err));

    req.write(soapXml);
    req.end();
  });
}
