// /public_html/assets/js/contact.js
(function(){
  const cfg = (window.DIGITAL_GRANDPA_CONFIG||{}).webhook || {};
  const url = cfg.contactFormUrl;
  const form = document.getElementById('dg-contact-form');
  if (!form || !url) return console.error('Contact form/webhook not configured');

  // Capture UTM/aff from URL so Phoenix/GHL can attach them
  const qp = new URLSearchParams(location.search);
  const utm = {
    source: qp.get('utm_source') || '',
    medium: qp.get('utm_medium') || '',
    campaign: qp.get('utm_campaign') || '',
    content: qp.get('utm_content') || '',
    term: qp.get('utm_term') || '',
    aff: qp.get('aff') || qp.get('affiliate') || ''
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const payload = {
      event: 'lead.created',
      source: 'site',
      brand: 'DG',
      contact: {
        firstName: fd.get('first_name') || fd.get('name') || '',
        lastName: fd.get('last_name') || '',
        email: fd.get('email') || '',
        phone: fd.get('phone') || ''
      },
      utm
    };

    const btn = form.querySelector('[type=submit]');
    btn && (btn.disabled = true);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Webhook failed: ' + (await res.text()));
      form.reset();
      alert('Thank you! We received your info and will email you shortly.');
    } catch (err) {
      console.error(err);
      alert('Sorry—something went wrong. Please try again in a moment.');
    } finally {
      btn && (btn.disabled = false);
    }
  });
})();

