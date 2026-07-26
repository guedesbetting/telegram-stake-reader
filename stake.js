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

    // Percentual isolado em uma linha, inclusive quando precedido somente por emoji.
    // Exemplos reconhecidos: "1,74%", "🍎 1,74%", "🔴 2 %".
    // Linhas como "EV 10%" ou "Cashback 5%" não são interpretadas automaticamente.
    let lineOffset = 0;
    for (const line of text.split(/\r?\n/)) {
      const standalone = line.match(/^\s*[^\p{L}\p{N}%]*?\s*(\d+(?:[.,]\d+)?)\s*%\s*$/u);
      if (standalone) {
        const value = normalizeDecimal(standalone[1]);
        const numberIndex = line.indexOf(standalone[1]);
        add("percentage", value, line, lineOffset + Math.max(0, numberIndex));
      }
      lineOffset += line.length + 1;
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
