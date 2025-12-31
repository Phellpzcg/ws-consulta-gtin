import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  trimValues: true,
  ignoreDeclaration: true,
  removeNSPrefix: true
});

function asArray(v) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function findNode(obj, key) {
  if (!obj || typeof obj !== "object") return null;
  if (Object.prototype.hasOwnProperty.call(obj, key)) return obj[key];

  for (const k of Object.keys(obj)) {
    const found = findNode(obj[k], key);
    if (found) return found;
  }
  return null;
}

export function parseSoapXml(rawXml) {
  const obj = parser.parse(rawXml);

  const ret = findNode(obj, "retConsGTIN");

  if (!ret) {
    return { cStat: "0", xMotivo: "Não foi possível localizar retConsGTIN no XML de resposta." };
  }

  const cStat = String(ret?.cStat ?? "0");
  const xMotivo = String(ret?.xMotivo ?? "Sem xMotivo");

  const tpGTIN = ret?.infGTIN?.tpGTIN ? String(ret.infGTIN.tpGTIN) : null;
  const xProd = ret?.infGTIN?.xProd ? String(ret.infGTIN.xProd) : null;
  const ncm = ret?.infGTIN?.NCM ? String(ret.infGTIN.NCM) : null;

  const cest = [];
  if (ret?.infGTIN) {
    for (const k of ["CEST1", "CEST2", "CEST3", "CEST"]) {
      const v = ret.infGTIN[k];
      if (v) {
        for (const item of asArray(v)) {
          const s = String(item).trim();
          if (s) cest.push(s);
        }
      }
    }
  }

  return { cStat, xMotivo, tpGTIN, xProd, ncm, cest };
}
