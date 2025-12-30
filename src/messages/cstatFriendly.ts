export function friendlyForCStat(cStat: string): string {
  const map: Record<string, string> = {
    "9490": "GTIN encontrado e validado na base do CCG.",
    "9491": "GTIN com dígito verificador inválido. Revise o código digitado.",
    "9492": "GTIN fora do escopo GS1 Brasil (prefixos 789/790).",
    "9493": "Certificado não habilitado como emitente NF-e/NFC-e para consulta GTIN. Troque o certificado.",
    "9494": "GTIN não encontrado na base do CCG.",
    "9496": "O proprietário da marca não autorizou a publicação deste GTIN.",
    "9497": "GTIN encontrado, porém NCM não informado na base. Retornando dados disponíveis.",
    "9498": "GTIN encontrado, porém NCM informado é inválido. Retornando dados disponíveis.",
    "656": "Consumo indevido identificado pelo serviço. Aguarde e tente novamente."
  };
  return map[cStat] || "Resposta recebida do serviço. Verifique cStat/xMotivo para detalhes.";
}

