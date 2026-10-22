// HM-01 · Owner home — Figma node 356:4833.
// The aggregate fixture includes earlier sample sales beyond the recent list.
const earlierSales = Object.freeze({ amount: 33000, count: 11, profit: 6700, missingCost: 1 });

function homeSalesSummary() {
  const sales = recorded();
  return {
    amount: earlierSales.amount + sum(sales),
    count: earlierSales.count + sales.length,
    profit: earlierSales.profit + sales.reduce((value, sale) => value + profit(sale.items || {}), 0),
    missingCost: earlierSales.missingCost,
  };
}

function homeSectionHeading(title, action = '', view = '') {
  return `<div class="home-section-heading"><h2>${title}</h2>${action ? `<button class="home-link" data-home-view="${view}">${action}</button>` : ''}</div>`;
}

function homePendingRow(payment) {
  const meta = payment.id === 1
    ? `${payment.method} · ${payment.age}`
    : `${payment.method} · ${payment.name ? `${payment.name} · ` : ''}${payment.age}`;
  return `<button class="home-payment" data-payment="${payment.id}" aria-label="Open ${money(payment.amount)} ${esc(payment.method)} payment">
    <span class="home-method">${icon(payment.method === 'Transfer' ? 'homeTransfer' : 'homeCash')}</span>
    <span class="home-payment-copy"><strong>${money(payment.amount)}</strong><span class="home-payment-meta">${esc(meta)}</span>${payment.note ? `<span class="home-payment-note">${esc(payment.note)}</span>` : ''}</span>
    ${payment.old ? `<span class="home-age">${icon('homeWarning')}<span>Over a day old</span></span>` : ''}
    <span class="home-chevron">${icon('homeChevron')}</span>
  </button>`;
}

function renderHome() {
  const summary = homeSalesSummary();
  const payments = pending().slice().sort((a, b) => a.stamp - b.stamp);
  $('#main').innerHTML = `
    <div class="home-topbar"><div><h1>Amaka Beauty</h1><p>Sat 3 Oct</p></div><button class="home-account" data-page="More" aria-label="Open account for Amaka Okafor"><span>AO</span></button></div>
    <div class="home-sections">
      <section class="home-wallet" aria-labelledby="wallet-heading">
        <div class="home-section-heading"><h2 id="wallet-heading">Wallet</h2></div>
        <div class="home-balance">
          <button class="home-balance-overview" data-action="wallet" aria-label="Open wallet, available balance ₦86,400"><span>Available balance</span><strong>₦86,400</strong></button>
          <div class="home-balance-footer"><div><span>Total received</span><strong>₦1,240,000</strong></div><button class="home-withdraw" data-action="withdraw">Withdraw</button></div>
        </div>
      </section>
      <section class="home-today" aria-label="Today’s sales">
        ${homeSectionHeading('Today’s sales', 'View sales', 'recorded')}
        <button class="home-sales-card" data-home-view="recorded" aria-label="View today’s sales, ${money(summary.amount)}, ${summary.count} sales">
          <strong class="home-sales-amount">${money(summary.amount)}</strong>
          <span class="home-sales-details"><span>${summary.count} sales</span><span class="home-profit"><strong>${money(summary.profit)}</strong><span>Profit</span></span></span>
          <span class="home-profit-note">Profit counts ${summary.count - summary.missingCost} of ${summary.count} sales · ${summary.missingCost} has no cost price</span>
        </button>
      </section>
      <section class="home-pending" aria-label="Pending payments">
        ${homeSectionHeading('Pending payments', `View all (${payments.length})`, 'pending')}
        <div class="home-payment-list">${payments.length ? payments.slice(0, 2).map(homePendingRow).join('') : '<p class="home-caught-up">You’re all caught up. No pending payments.</p>'}</div>
      </section>
    </div>
    <button class="home-record" data-action="new" aria-label="Record payment"><span class="home-record-icon">${icon('homePlus')}</span><span>Record payment</span></button>`;
}

function showHomeWallet(withdraw = false) {
  panel(withdraw ? 'Withdraw' : 'Wallet', `
    <div class="home-wallet-preview"><span>Available balance</span><strong>₦86,400</strong><div><span>Total received</span><strong>₦1,240,000</strong></div></div>
    <p class="subtitle">This wallet uses sample balances. ${withdraw ? 'Withdrawals will be available after the payment provider and backend are connected.' : 'Live balances and transactions will be available after the payment provider and backend are connected.'}</p>`, '<button class="primary" data-action="close">Done</button>');
}

document.addEventListener('click', event => {
  const view = event.target.closest('[data-home-view]');
  if (view) {
    close();
    page = 'Sales';
    tab = view.dataset.homeView;
    period = 'Today';
    query = '';
    render();
  }
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'wallet' || action === 'withdraw') showHomeWallet(action === 'withdraw');
});
