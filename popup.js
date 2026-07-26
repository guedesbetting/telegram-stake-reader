"use strict";

const bankrollInput = document.querySelector("#bankroll");
const managementInput = document.querySelector("#management");
const enabledInput = document.querySelector("#enabled");
const overlayPositionInput = document.querySelector("#overlayPosition");
const percentageModeInput = document.querySelector("#percentageMode");
const percentageHelp = document.querySelector("#percentageHelp");
const unitValue = document.querySelector("#unitValue");
const saveButton = document.querySelector("#save");
const status = document.querySelector("#status");

function parsePtBrNumber(raw) {
  const clean = String(raw ?? "")
    .trim()
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  const value = Number(clean);
  return Number.isFinite(value) ? value : null;
}

function updatePercentageHelp() {
  percentageHelp.textContent = percentageModeInput.value === "as-units"
    ? "Ex.: 1,74% será calculado como 1,74u conforme sua gestão."
    : "Ex.: 1,74% será calculado como 1,74% do valor total da banca.";
}

function updatePreview() {
  const bankroll = parsePtBrNumber(bankrollInput.value);
  const management = parsePtBrNumber(managementInput.value);
  if (!bankroll || bankroll <= 0 || !management || management <= 0) {
    unitValue.textContent = "R$ 0,00";
    return;
  }
  const exact = bankroll / management;
  unitValue.textContent = `R$ ${StakeReaderCore.formatBetValue(exact)}`;
}

async function loadSettings() {
  const settings = await chrome.storage.local.get({
    bankroll: 1000,
    management: 100,
    enabled: true,
    overlayPosition: "bottom-left",
    percentageMode: "as-units"
  });
  bankrollInput.value = String(settings.bankroll).replace(".", ",");
  managementInput.value = String(settings.management).replace(".", ",");
  enabledInput.checked = Boolean(settings.enabled);
  overlayPositionInput.value = settings.overlayPosition || "bottom-left";
  percentageModeInput.value = settings.percentageMode || "as-units";
  updatePreview();
  updatePercentageHelp();
}

async function saveSettings() {
  const bankroll = parsePtBrNumber(bankrollInput.value);
  const management = parsePtBrNumber(managementInput.value);

  if (!bankroll || bankroll <= 0) {
    status.textContent = "Informe uma banca maior que zero.";
    return;
  }
  if (!management || management <= 0) {
    status.textContent = "Informe uma gestão maior que zero.";
    return;
  }

  await chrome.storage.local.set({
    bankroll,
    management,
    enabled: enabledInput.checked,
    overlayPosition: overlayPositionInput.value,
    percentageMode: percentageModeInput.value
  });

  status.textContent = "Configurações salvas.";
  updatePreview();
  setTimeout(() => { status.textContent = ""; }, 1800);
}

bankrollInput.addEventListener("input", updatePreview);
managementInput.addEventListener("input", updatePreview);
percentageModeInput.addEventListener("change", updatePercentageHelp);
saveButton.addEventListener("click", () => {
  saveSettings().catch((error) => {
    console.error(error);
    status.textContent = "Não foi possível salvar.";
  });
});

loadSettings().catch((error) => {
  console.error(error);
  status.textContent = "Não foi possível carregar as configurações.";
});
