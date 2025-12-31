import { XMLParser } from "fast-xml-parser";

export type WsParsed = {
  cStat: string;
  xMotivo: string;
  tpGTIN?: string;
  xProd?: string;
  ncm?: string;
  cest?: string[];
};

// Parse tolerante: o retorno real vem dentro do envelope SOAP e contém retConsGTIN
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  trimValues: true,
  ignoreDeclaration: true,
  removeNSPrefix: true
});

function asArray<T>(v: T | T[] | undefined): T[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

export function parseSoapXml(rawXml: string): WsParsed {
  const obj = parser.parse(rawXml);

  // Caminho aproximado: Envelope > Body > ccgConsGTINResponse > nfeResultMsg (pode variar)
  // Vamos procurar por qualquer nó que contenha "retConsGTIN" como objeto.
  const jsonStr = JSON.stringify(obj);

  // Estratégia: localizar "retConsGTIN" no objeto parseado
  // (evita depender de um caminho fixo, pois alguns WS mudam nomes internos)
  if (!jsonStr.includes("retConsGTIN")) {
    // fallback: retorna erro genérico
    return { cStat: "0", xMotivo: "Não foi possível localizar retConsGTIN no XML de resposta." };
  }

  // Re-parse via busca em profundidade
  const ret = findNode(obj, "retConsGTIN") as any;

  const cStat = String(ret?.cStat ?? "0");
  const xMotivo = String(ret?.xMotivo ?? "Sem xMotivo");

  const tpGTIN = ret?.infGTIN?.tpGTIN ? String(ret.infGTIN.tpGTIN) : undefined;
  const xProd = ret?.infGTIN?.xProd ? String(ret.infGTIN.xProd) : undefined;
  const ncm = ret?.infGTIN?.NCM ? String(ret.infGTIN.NCM) : undefined;

  // CEST pode vir como CEST1/2/3, ou como lista dependendo da implementação
  const cest: string[] = [];
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

  return { cStat, xMotivo, tpGTIN, xProd, ncm, cest: cest.length ? cest : [] };
}

function findNode(obj: any, key: string): any | null {
  if (!obj || typeof obj !== "object") return null;
  if (Object.prototype.hasOwnProperty.call(obj, key)) return obj[key];

  for (const k of Object.keys(obj)) {
    const child = obj[k];
    const found = findNode(child, key);
    if (found) return found;
  }
  return null;
}

