const $ = id => document.getElementById(id);

const loginScreen = $("loginScreen");
const tradingPlatform = $("tradingPlatform");
const loginForm = $("loginForm");
const loginPassword = $("loginPassword");

let balance = 1000000;
let startingBalance = 1000000;
let price = 1346.10;
let startPrice = price;
let highPrice = price;
let lowPrice = price;
let positions = [];
let history = [];
let currentSide = "buy";
let candles = [];

const canvas = $("chart");
const ctx = canvas.getContext("2d");

function money(v) {
    return (v < 0 ? "-₦" : "₦") + Math.abs(v).toLocaleString("en-NG", {
        minimumFractionDigits: 2, maximumFractionDigits: 2
    });
}

function notify(message) {
    const t = $("toast");
    t.textContent = message;
    t.classList.add("show");
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => t.classList.remove("show"), 2500);
}

function showPlatform() {
    loginScreen.style.display = "none";
    tradingPlatform.classList.remove("hidden");
}

function showLogin() {
    loginScreen.style.display = "flex";
    tradingPlatform.classList.add("hidden");
}

function saveSession(email) {
    localStorage.setItem("naijaTradeLoggedIn", "true");
    localStorage.setItem("naijaTradeUser", email);
}

function logout() {
    localStorage.removeItem("naijaTradeLoggedIn");
    localStorage.removeItem("naijaTradeUser");
    showLogin();
    notify("Signed out.");
}

$("logoutBtn").addEventListener("click", logout);

loginForm.addEventListener("submit", e => {
    e.preventDefault();
    const email = $("loginEmail").value.trim();
    const password = loginPassword.value;
    if (!email || password.length < 6) {
        notify("Enter a valid email and a password of at least 6 characters.");
        return;
    }
    saveSession(email);
    $("userEmail").textContent = email;
    showPlatform();
    notify("Welcome to NaijaTrade.");
});

$("demoLogin").addEventListener("click", () => {
    const email = "demo@naijatrade.com";
    saveSession(email);
    $("userEmail").textContent = email;
    showPlatform();
    notify("Demo account loaded.");
});

$("togglePassword").addEventListener("click", () => {
    const visible = loginPassword.type === "text";
    loginPassword.type = visible ? "password" : "text";
    $("togglePassword").textContent = visible ? "Show" : "Hide";
});

$("forgotPassword").addEventListener("click", e => {
    e.preventDefault();
    notify("Password recovery is not connected in this offline demo.");
});

function resizeCanvas() {
    const r = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = r.width * dpr;
    canvas.height = r.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawChart();
}
window.addEventListener("resize", resizeCanvas);

function generateCandles() {
    candles = [];
    let p = price - 15;
    for (let i = 0; i < 90; i++) {
        const open = p;
        const close = open + (Math.random() - .48) * 5;
        candles.push({
            open, close,
            high: Math.max(open, close) + Math.random() * 3,
            low: Math.min(open, close) - Math.random() * 3
        });
        p = close;
    }
    price = candles[candles.length - 1].close;
    startPrice = price;
    highPrice = price;
    lowPrice = price;
}
generateCandles();

function drawChart() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0d131d";
    ctx.fillRect(0, 0, w, h);
    const data = candles.slice(-70);
    if (!data.length) return;

    let hi = Math.max(...data.map(c => c.high));
    let lo = Math.min(...data.map(c => c.low));
    const range = hi - lo || 1;
    const left = 45, right = 58, top = 15, bottom = 28;
    const cw = (w - left - right) / data.length;
    const y = v => top + ((hi - v) / range) * (h - top - bottom);

    ctx.strokeStyle = "#1b2634";
    ctx.fillStyle = "#657386";
    ctx.font = "10px Arial";

    for (let i = 0; i < 6; i++) {
        const gy = top + i * (h - top - bottom) / 5;
        ctx.beginPath(); ctx.moveTo(left, gy); ctx.lineTo(w - right, gy); ctx.stroke();
        const val = hi - i * range / 5;
        ctx.fillText(val.toFixed(2), w - 53, gy + 3);
    }

    data.forEach((c, i) => {
        const x = left + i * cw + cw / 2;
        const bullish = c.close >= c.open;
        const color = bullish ? "#16c784" : "#ea3943";
        ctx.strokeStyle = color; ctx.fillStyle = color;
        ctx.beginPath(); ctx.moveTo(x, y(c.high)); ctx.lineTo(x, y(c.low)); ctx.stroke();
        const topY = Math.min(y(c.open), y(c.close));
        const body = Math.max(1, Math.abs(y(c.open) - y(c.close)));
        ctx.fillRect(x - cw * .31, topY, cw * .62, body);
    });

    const py = y(price);
    ctx.setLineDash([5, 5]); ctx.strokeStyle = "#3772ff";
    ctx.beginPath(); ctx.moveTo(left, py); ctx.lineTo(w - right, py); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#3772ff"; ctx.fillRect(w - right, py - 10, right, 20);
    ctx.fillStyle = "#fff"; ctx.fillText(price.toFixed(2), w - right + 4, py + 3);
}

function tick() {
    price = Math.max(1200, price + (Math.random() - .49) * .7);
    const last = candles[candles.length - 1];
    last.close = price;
    last.high = Math.max(last.high, price);
    last.low = Math.min(last.low, price);

    if (Math.random() > .85) {
        const open = price;
        const close = price + (Math.random() - .5) * 3;
        candles.push({ open, close, high: Math.max(open, close) + Math.random() * 2, low: Math.min(open, close) - Math.random() * 2 });
        if (candles.length > 120) candles.shift();
    }

    highPrice = Math.max(highPrice, price);
    lowPrice = Math.min(lowPrice, price);
    updateMarket();
    updatePositions();
    drawChart();
}

setInterval(tick, 1000);

function updateMarket() {
    $("currentPrice").textContent = price.toFixed(2);
    $("orderPrice").value = price.toFixed(2);
    $("highPrice").textContent = highPrice.toFixed(2);
    $("lowPrice").textContent = lowPrice.toFixed(2);

    const ch = ((price - startPrice) / startPrice) * 100;
    $("priceChange").textContent = (ch >= 0 ? "+" : "") + ch.toFixed(2) + "%";
    $("priceChange").className = ch >= 0 ? "positive" : "negative";
    updateOrderSummary();
}

function updateOrderSummary() {
    const amount = Number($("amount").value) || 0;
    const orderPrice = Number($("orderPrice").value) || price;
    const value = amount * orderPrice;
    const fee = value * .001;
    $("positionValue").textContent = money(value);
    $("fee").textContent = money(fee);
    $("total").textContent = money(value + fee);
}

$("amount").addEventListener("input", updateOrderSummary);
$("orderPrice").addEventListener("input", updateOrderSummary);

$("buyTab").addEventListener("click", () => {
    currentSide = "buy";
    $("buyTab").classList.add("active");
    $("sellTab").classList.remove("active");
    $("tradeButton").textContent = "Buy USD";
    $("tradeButton").className = "trade-button";
});

$("sellTab").addEventListener("click", () => {
    currentSide = "sell";
    $("sellTab").classList.add("active");
    $("buyTab").classList.remove("active");
    $("tradeButton").textContent = "Sell USD";
    $("tradeButton").className = "trade-button sell";
});

$("tradeButton").addEventListener("click", executeTrade);

function executeTrade() {
    const amount = Number($("amount").value);
    if (!amount || amount <= 0) { notify("Enter a valid amount."); return; }
    const value = amount * price;
    const fee = value * .001;
    const total = value + fee;
    if (total > balance) { notify("Insufficient demo balance."); return; }

    balance -= total;
    positions.push({
        id: Date.now(), market: "USD/NGN", side: currentSide, amount, entry: price, fee, pl: 0
    });
    updateAccount();
    renderPositions();
    notify(currentSide === "buy" ? "Buy order executed." : "Sell order executed.");
}

function updatePositions() {
    let total = 0;
    positions.forEach(p => {
        p.pl = p.side === "buy" ? (price - p.entry) * p.amount : (p.entry - price) * p.amount;
        total += p.pl;
    });
    $("openPL").textContent = money(total);
    $("openPL").className = total >= 0 ? "positive" : "negative";
    $("plPercent").textContent = ((total / startingBalance) * 100).toFixed(2) + "%";
    $("equity").textContent = money(balance + total);
    $("buyingPower").textContent = money(balance);
}

function updateAccount() {
    updatePositions();
    $("balance").textContent = money(balance);
}

function renderPositions() {
    const table = $("positionsTable");
    if (!positions.length) {
        table.innerHTML = '<tr class="empty-row"><td colspan="7">No open positions</td></tr>';
        $("positionCount").textContent = "0 positions";
        return;
    }

    table.innerHTML = "";
    positions.forEach(p => {
        const row = document.createElement("tr");
        row.innerHTML = `
      <td>${p.market}</td>
      <td class="${p.side === "buy" ? "side-buy" : "side-sell"}">${p.side.toUpperCase()}</td>
      <td>$${p.amount.toFixed(2)}</td>
      <td>${p.entry.toFixed(2)}</td>
      <td>${price.toFixed(2)}</td>
      <td class="${p.pl >= 0 ? "positive" : "negative"}">${money(p.pl)}</td>
      <td><button class="close-position" data-id="${p.id}">Close</button></td>`;
        table.appendChild(row);
    });

    $("positionCount").textContent = positions.length + (positions.length === 1 ? " position" : " positions");
    document.querySelectorAll(".close-position").forEach(btn => {
        btn.addEventListener("click", () => closePosition(Number(btn.dataset.id)));
    });
}

function closePosition(id) {
    const index = positions.findIndex(p => p.id === id);
    if (index < 0) return;
    const p = positions[index];
    const pl = p.side === "buy" ? (price - p.entry) * p.amount : (p.entry - price) * p.amount;

    balance += p.amount * price + pl;
    history.unshift({ time: new Date(), market: p.market, side: p.side, amount: p.amount, price, pl });
    positions.splice(index, 1);

    updateAccount();
    renderPositions();
    renderHistory();
    notify("Position closed: " + money(pl));
}

function renderHistory() {
    const table = $("historyTable");
    if (!history.length) {
        table.innerHTML = '<tr class="empty-row"><td colspan="6">No completed trades</td></tr>';
        return;
    }
    table.innerHTML = "";
    history.forEach(t => {
        const row = document.createElement("tr");
        row.innerHTML = `
      <td>${t.time.toLocaleTimeString()}</td>
      <td>${t.market}</td>
      <td class="${t.side === "buy" ? "side-buy" : "side-sell"}">${t.side.toUpperCase()}</td>
      <td>$${t.amount.toFixed(2)}</td>
      <td>${t.price.toFixed(2)}</td>
      <td class="${t.pl >= 0 ? "positive" : "negative"}">${money(t.pl)}</td>`;
        table.appendChild(row);
    });
}

document.querySelectorAll(".time").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".time").forEach(x => x.classList.remove("active"));
        btn.classList.add("active");
        notify("Timeframe changed to " + btn.dataset.time);
    });
});

$("resetChart").addEventListener("click", () => {
    price = 1346.10;
    generateCandles();
    drawChart();
    updateMarket();
    notify("Chart reset.");
});

const modal = $("depositModal");
$("depositBtn").addEventListener("click", () => modal.classList.add("show"));
$("closeModal").addEventListener("click", () => modal.classList.remove("show"));

$("confirmDeposit").addEventListener("click", () => {
    const amount = Number($("depositAmount").value);
    if (!amount || amount <= 0) { notify("Enter a valid amount."); return; }
    balance += amount;
    updateAccount();
    $("depositAmount").value = "";
    modal.classList.remove("show");
    notify("Added " + money(amount) + " demo funds.");
});

window.addEventListener("click", e => {
    if (e.target === modal) modal.classList.remove("show");
});

const saved = localStorage.getItem("naijaTradeLoggedIn");
const savedEmail = localStorage.getItem("naijaTradeUser");
if (saved === "true") {
    $("userEmail").textContent = savedEmail || "demo@naijatrade.com";
    showPlatform();
}

resizeCanvas();
updateAccount();
renderPositions();
renderHistory();
updateOrderSummary();
