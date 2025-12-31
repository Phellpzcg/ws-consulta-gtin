export function normalizeDigits(input) {
  return (input || "").replace(/\D+/g, "");
}

export function leftPad14(digits) {
  return digits.padStart(14, "0");
}

export function isValidGtin14(gtin14) {
  if (!/^\d{14}$/.test(gtin14)) return false;

  const digits = gtin14.split("").map((c) => Number(c));
  const check = digits[13];

  let sum = 0;
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

export function validateGtin(input) {
  const gtinOriginal = input || "";
  const digits = normalizeDigits(gtinOriginal);

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

  // prefixo 789/790 (considerando o indicador de embalagem no GTIN-14)
  const prefix3 = gtin14.slice(1, 4);
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
