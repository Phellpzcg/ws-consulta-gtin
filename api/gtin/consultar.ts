import https from "node:https";
import { requireApiKey } from "../../src/security/auth";
import { createMtlsAgent } from "../../src/security/mtls";
import { validateGtin } from "../../src/validation/gtin";
import { buildSoapEnvelope } from "../../src/soap/buildEnvelope";
import { parseSoapXml } from "../../src/soap/parseResponse";
import { friendlyForCStat } from "../../src/messages/cstatFriendly";

function json(status: number, body: any): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Variável de ambiente ausente: ${name}`);
  return v;
}

export default async function handler(req: Request): Promise<Response> {
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

    // Regra: 9497/9498 retornam dados disponíveis (conforme documento)
    const ok = parsed.cStat === "9490";

    return json(200, {
      ok,
      traceId,
      status: { cStat: parsed.cStat, xMotivo: parsed.xMotivo, friendly },
      input: { gtinOriginal: v.gtinOriginal, gtinNormalizado: v.gtinNormalizado },
      data: {
        tpGTIN: parsed.tpGTIN ?? null,
        xProd: parsed.xProd ?? null,
        ncm: parsed.ncm ?? null,
        cest: parsed.cest ?? []
      },
      rawXml
    });
  } catch (e: any) {
    const statusCode = Number(e?.statusCode || 500);
    return json(statusCode, {
      ok: false,
      traceId,
      error: e?.message || "Erro interno",
      rawXml: null
    });
  }
}

async function callSoap(url: string, soapXml: string, agent: https.Agent): Promise<string> {
  const timeoutMs = Number(process.env.REQUEST_TIMEOUT_MS || 15000);

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        // SOAP 1.2:
        "Content-Type": "application/soap+xml; charset=utf-8"
      },
      body: soapXml,
      // @ts-expect-error Node fetch supports agent via dispatcher in undici; but Vercel Node runtime accepts this in practice in many cases.
      agent,
      signal: controller.signal
    });

    const text = await res.text();
    // Mesmo com HTTP != 200, o WS pode retornar envelope com cStat
    return text;
  } finally {
    clearTimeout(t);
  }
}

