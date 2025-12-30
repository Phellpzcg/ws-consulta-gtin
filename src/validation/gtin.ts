export type GtinValidation = {
  ok: boolean;
  gtinOriginal: string;
  gtinNormalizado: string; // 14 dígitos
  errorCStat?: "9491" | "9492";
  errorFriendly?: string;
};

export function normalizeDigits(input: string): string {
  return (input || "").replace(/\D+/g, "");
}

export function leftPad14(digits: string): string {
  return digits.padStart(14, "0");
}

// Cálculo do dígito verificador GTIN (mod 10) para 14 dígitos
export function isValidGtin14(gtin14: string): boolean {
  if (!/^\d{14}$/.test(gtin14)) return false;

  const digits = gtin14.split("").map((c) => Number(c));
  const check = digits[13];

  let sum = 0;
  // Pesos alternados da direita para a esquerda, excluindo DV:
  // posição (da direita, começando em 1) => peso 3 (ímpar) e 1 (par)
  // Para GTIN-14 padrão GS1: aplicar 3 no 1º, 1 no 2º, 3 no 3º...
  let pos = 1;
  for (let i = 12; i >= 0; i--) {
    const weight = pos % 2 === 1 ? 3 : 1;
    sum += digits[i] * weight;
    pos++;
  }
  const mod = sum % 10;
  const computed = mod === 0 ? 0 : 10 - mod;
  return computed === check;
}

export function validateGtin(input: string): GtinValidation {
  const gtinOriginal = input || "";
  const digits = normalizeDigits(gtinOriginal);

  // Aceitar 8/12/13/14 e normalizar para 14
  if (![8, 12, 13, 14].includes(digits.length)) {
    return {
      ok: false,
      gtinOriginal,
      gtinNormalizado: "",
      errorCStat: "9491",
      errorFriendly: "Formato de GTIN inválido. Informe 8, 12, 13 ou 14 dígitos."
    };
  }

  const gtin14 = leftPad14(digits);

  // Prefixo GS1 Brasil: 789/790 (após normalização)
  const prefix3 = gtin14.slice(1, 4); // ignora o primeiro dígito de embalagem do GTIN-14
  if (prefix3 !== "789" && prefix3 !== "790") {
    return {
      ok: false,
      gtinOriginal,
      gtinNormalizado: gtin14,
      errorCStat: "9492",
      errorFriendly: "GTIN fora do escopo GS1 Brasil (prefixos 789/790)."
    };
  }

  if (!isValidGtin14(gtin14)) {
    return {
      ok: false,
      gtinOriginal,
      gtinNormalizado: gtin14,
      errorCStat: "9491",
      errorFriendly: "GTIN com dígito verificador inválido. Revise o código digitado."
    };
  }

  return { ok: true, gtinOriginal, gtinNormalizado: gtin14 };
}

