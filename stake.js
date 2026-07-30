(function (global) {
  "use strict";

  function normalizeDecimal(raw) {
    if (typeof raw !== "string" && typeof raw !== "number") return null;
    const normalized = String(raw).trim().replace(/\s+/g, "").replace(",", ".");
    const value = Number(normalized);
    return Number.isFinite(value) ? value : null;
  }

  function findStakes(text) {
    if (typeof text !== "string" || !text.trim()) return [];

    const results = [];
    const seen = new Set();

    const add = (type, value, original, index) => {
      if (!Number.isFinite(value) || value <= 0) return;
      const key = `${type}:${value}:${index}`;
      if (seen.has(key)) return;
      seen.add(key);
      results.push({ type, value, original: original.trim(), index });
    };

    // Unidade explícita: 1u, 1,5 u, 2 un, 0.75 unidade(s)
    const unitRegex = /(?:^|[^\p{L}\p{N}])(?:(?:stake|entrada|unidade|unidades|flat|risco)\s*[:\-–—]?\s*)?(\d+(?:[.,]\d+)?)\s*(u|un|und|unidade|unidades)\b/giu;
    for (const match of text.matchAll(unitRegex)) {
      const value = normalizeDecimal(match[1]);
      add("unit", value, match[0], match.index ?? 0);
    }

    // Percentual com contexto explícito: Stake: 1,25%, Entrada 2%, Risco 0,5%.
    const percentRegex = /\b(stake|entrada|risco|gest[aã]o|exposi[cç][aã]o|confian[cç]a)\s*[:\-–—]?\s*(\d+(?:[.,]\d+)?)\s*%/giu;
    for (const match of text.matchAll(percentRegex)) {
      const value = normalizeDecimal(match[2]);
      add("percentage", value, match[0], match.index ?? 0);
    }

    // Percentuais enviados como stake, inclusive quando o Telegram separa
    // emoji, número e símbolo em elementos HTML diferentes.
    // Exemplos: "1,37%", "🍎 1,37%", "🔴\n1,37\n%".
    // Termos estatísticos conhecidos são ignorados para reduzir falsos positivos.
    const blockedPercentContext = /\b(?:ev|roi|yield|cashback|aproveitamento|taxa|probabilidade|margem|lucro|green|red|acerto|assertividade)\b/iu;
    const compactText = text.replace(/[\t ]+/g, " ");
    const loosePercentRegex = /(\d+(?:[.,]\d+)?)\s*(?:\n\s*)?%/gu;

    for (const match of compactText.matchAll(loosePercentRegex)) {
      const value = normalizeDecimal(match[1]);
      const index = match.index ?? 0;
      const lineStart = compactText.lastIndexOf("\n", index) + 1;
      const nextBreak = compactText.indexOf("\n", index + match[0].length);
      const lineEnd = nextBreak === -1 ? compactText.length : nextBreak;
      const line = compactText.slice(lineStart, lineEnd).trim();

      // Analisa também um pequeno contexto anterior, pois alguns layouts do
      // Telegram colocam o rótulo e o percentual em elementos separados.
      const contextStart = Math.max(0, index - 45);
      const context = compactText.slice(contextStart, lineEnd);
      if (blockedPercentContext.test(line) || blockedPercentContext.test(context)) {
        continue;
      }

      // Aceita linha sem palavras (emoji + percentual), contexto explícito de
      // stake ou percentuais pequenos, padrão comum de gestão de apostas.
      const hasLetters = /\p{L}/u.test(line);
      const hasStakeContext = /\b(?:stake|entrada|risco|gest[aã]o|unidade|aposta)\b/iu.test(context);
      if (!hasLetters || hasStakeContext || (value !== null && value <= 10)) {
        add("percentage", value, match[0], index);
      }
    }

    return results.sort((a, b) => a.index - b.index);
  }

  function calculateStake(stake, bankroll, totalUnits, percentageMode = "literal") {
    if (!stake || !["unit", "percentage"].includes(stake.type)) {
      throw new Error("Stake inválida.");
    }

    const bank = Number(bankroll);
    const units = Number(totalUnits);

    if (!Number.isFinite(bank) || bank <= 0) {
      throw new Error("Configure uma banca válida.");
    }

    if (stake.type === "unit" || (stake.type === "percentage" && percentageMode === "as-units")) {
      if (!Number.isFinite(units) || units <= 0) {
        throw new Error("Configure uma gestão em unidades válida.");
      }
      return stake.value * (bank / units);
    }

    return bank * (stake.value / 100);
  }

  // Trunca para duas casas: 5.839 -> 5.83. Não arredonda para cima.
  function truncateToCents(value) {
    if (!Number.isFinite(value)) return null;
    return Math.trunc((value + 1e-9) * 100) / 100;
  }

  function formatBetValue(value) {
    const truncated = truncateToCents(value);
    if (truncated === null) return "—";
    return truncated.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  global.StakeReaderCore = {
    normalizeDecimal,
    findStakes,
    calculateStake,
    truncateToCents,
    formatBetValue
  };
})(typeof window !== "undefined" ? window : globalThis);
