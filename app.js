const initialBalanceCents = 4825075;
let balanceCents = initialBalanceCents;
let balanceVisible = true;

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

const balanceAmount = document.querySelector("#balance-amount");
const availableAmount = document.querySelector("#available-amount");
const balanceToggle = document.querySelector("#balance-toggle");
const transferForm = document.querySelector("#transfer-form");
const feedback = document.querySelector("#transfer-feedback");
const transactionList = document.querySelector("#transaction-list");
const accountForm = document.querySelector("#create-account-form");
const password = document.querySelector("#account-password");
const passwordConfirm = document.querySelector("#account-password-confirm");
const authScreen = document.querySelector("#auth-screen");
const bankApp = document.querySelector("#bank-app");

function formatCurrency(cents) {
  return currencyFormatter.format(cents / 100);
}

function isValidClabe(clabe) {
  if (!/^\d{18}$/.test(clabe)) {
    return false;
  }

  const weights = [3, 7, 1];
  const sum = [...clabe.slice(0, 17)].reduce(
    (total, digit, index) => total + Number(digit) * weights[index % weights.length],
    0,
  );
  const checkDigit = (10 - (sum % 10)) % 10;

  return checkDigit === Number(clabe[17]);
}

function renderBalance() {
  balanceAmount.innerHTML = balanceVisible
    ? `${formatCurrency(balanceCents)} <span>MXN</span>`
    : "•••••• <span>MXN</span>";
  availableAmount.textContent = `${formatCurrency(balanceCents)} MXN`;
}

function validatePasswordConfirmation() {
  const passwordsMatch = password.value === passwordConfirm.value;
  passwordConfirm.setCustomValidity(
    passwordConfirm.value && !passwordsMatch
      ? "Las contraseñas no coinciden."
      : "",
  );
}

password.addEventListener("input", validatePasswordConfirmation);
passwordConfirm.addEventListener("input", validatePasswordConfirmation);

function addTransferRow(recipient, accountNumber, amountCents) {
  const row = document.createElement("tr");
  const movementCell = document.createElement("td");
  const icon = document.createElement("span");
  const name = document.createElement("span");
  const type = document.createElement("span");
  const dateCell = document.createElement("td");
  const date = document.createElement("time");
  const amountCell = document.createElement("td");

  icon.className = "merchant-icon merchant-transfer";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = "↗";
  name.className = "transaction-name";
  name.append(document.createTextNode(`Transferencia a ${recipient}`));
  type.className = "transaction-type";
  type.textContent = `CLABE •••• ${accountNumber.slice(-4)}`;
  name.append(type);
  movementCell.append(icon, name);

  const now = new Date();
  date.dateTime = now.toISOString();
  date.textContent = new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);
  dateCell.append(date);

  amountCell.className = "amount-column amount-negative";
  amountCell.textContent = `−${formatCurrency(amountCents)}`;
  row.append(movementCell, dateCell, amountCell);
  transactionList.prepend(row);
}

accountForm.addEventListener("submit", (event) => {
  event.preventDefault();

  validatePasswordConfirmation();

  if (!accountForm.reportValidity()) {
    return;
  }

  const name = document.querySelector("#account-holder").value.trim();
  const email = document.querySelector("#account-email").value.trim();
  const firstName = name.split(/\s+/)[0];
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  document.querySelector("#user-first-name").textContent = firstName;
  document.querySelector("#user-full-name").textContent = name;
  document.querySelector("#user-email").textContent = email;
  document.querySelector(".avatar").textContent = initials;
  document.querySelector(".profile-button").setAttribute(
    "aria-label",
    `Perfil de ${name}`,
  );

  accountForm.reset();
  authScreen.hidden = true;
  bankApp.hidden = false;
  document.querySelector("#skip-link").href = "#contenido";
  document.querySelector("#page-title").focus();
});

balanceToggle.addEventListener("click", () => {
  balanceVisible = !balanceVisible;
  balanceToggle.setAttribute("aria-pressed", String(!balanceVisible));
  balanceToggle.setAttribute(
    "aria-label",
    balanceVisible ? "Ocultar saldo" : "Mostrar saldo",
  );
  renderBalance();
});

transferForm.addEventListener("input", () => {
  feedback.textContent = "";
  feedback.classList.remove("is-error");
});

transferForm.addEventListener("submit", (event) => {
  event.preventDefault();
  feedback.classList.remove("is-error");

  if (!transferForm.reportValidity()) {
    return;
  }

  const formData = new FormData(transferForm);
  const recipient = String(formData.get("recipient")).trim();
  const accountNumber = String(formData.get("accountNumber")).trim();
  const amount = Number(formData.get("amount"));
  const amountCents = Math.round(amount * 100);

  if (!recipient) {
    feedback.textContent = "Ingresa el nombre del beneficiario.";
    feedback.classList.add("is-error");
    return;
  }

  if (!isValidClabe(accountNumber)) {
    feedback.textContent = "La CLABE no es válida. Verifica sus 18 dígitos.";
    feedback.classList.add("is-error");
    return;
  }

  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    feedback.textContent = "Ingresa un importe válido.";
    feedback.classList.add("is-error");
    return;
  }

  if (amountCents > balanceCents) {
    feedback.textContent = "El importe supera tu saldo disponible.";
    feedback.classList.add("is-error");
    return;
  }

  balanceCents -= amountCents;
  renderBalance();
  addTransferRow(recipient, accountNumber, amountCents);
  feedback.textContent = `Transferencia de ${formatCurrency(amountCents)} preparada para ${recipient}. Esta demostración no envía dinero.`;
  transferForm.reset();
  document.querySelector("#recipient").focus();
});

renderBalance();
