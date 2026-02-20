// /public_html/assets/js/store.js
(async function() {
  const buyButtons = document.querySelectorAll('[data-price-id]');
  const emailInput = document.querySelector('#dg-checkout-email');
  const nameInput  = document.querySelector('#dg-checkout-name');
  const qtyInput   = document.querySelector('#dg-qty');

  let stripe, elements, paymentElement, clientSecret;

  async function createIntent(priceId, email, name, quantity) {
    const res = await fetch('/api/create_intent.php', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ priceId, email, name, quantity })
    });
    if (!res.ok) throw new Error('Failed to create intent');
    const json = await res.json();
    if (!stripe || !elements) {
      stripe = Stripe(json.publishableKey);
      const appearance = { theme: 'stripe' };
      const options = { clientSecret: json.clientSecret, appearance };
      elements = stripe.elements(options);
      paymentElement = elements.create('payment');
      paymentElement.mount('#payment-element');
    } else {
      await elements.update({ clientSecret: json.clientSecret });
    }
    clientSecret = json.clientSecret;
  }

  async function confirmPayment() {
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/thanks'
      },
      redirect: 'if_required'
    });
    if (error) {
      showStatus('Payment failed: ' + error.message, true);
    } else {
      showStatus('Payment processing…');
    }
  }

  function showStatus(msg, isErr=false) {
    const el = document.getElementById('dg-status');
    if (!el) return;
    el.textContent = msg;
    el.style.color = isErr ? '#c00' : '#0a0';
  }

  // Open modal / drawer, create PI when user clicks any Buy button
  buyButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const priceId = btn.getAttribute('data-price-id');
      const quantity = parseInt(qtyInput?.value || '1', 10);
      const email = (emailInput?.value || '').trim();
      const name  = (nameInput?.value  || '').trim();
      if (!email) { showStatus('Enter email to continue', true); emailInput?.focus(); return; }
      showStatus('Preparing secure checkout…');
      try {
        await createIntent(priceId, email, name, quantity);
        document.getElementById('dg-checkout').classList.remove('hidden');
        showStatus('Enter card and click Pay');
      } catch(err) {
        showStatus(err.message || 'Unexpected error', true);
      }
    });
  });

  const payBtn = document.getElementById('dg-pay');
  if (payBtn) payBtn.addEventListener('click', async () => { await confirmPayment(); });
})();

