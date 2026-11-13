document.addEventListener('DOMContentLoaded', () => {
  if (window.__dgDraftBehaviorInitialized) return
  window.__dgDraftBehaviorInitialized = true

  const toggle = document.querySelector('[data-nav-toggle]')
  const links = document.querySelector('[data-nav-links]')

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.getAttribute('data-open') === 'true'
      links.setAttribute('data-open', String(!open))
      toggle.setAttribute('aria-expanded', String(!open))
      toggle.textContent = open ? 'Menu' : 'Close'
    })
  }

  const year = document.querySelector('[data-year]')
  if (year) year.textContent = String(new Date().getFullYear())
})
