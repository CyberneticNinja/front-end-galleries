// Login / register page flip.
// The "leaf" is a page hinged on the spine. Front: "New here? Register".
// Back: the registration form. Turning it covers the login form and
// uncovers the "Log in" prompt underneath.

const TURN_MS = 1100; // matches --turn-time in the CSS

const book = document.getElementById('book');
const loginPage = document.getElementById('login-page');
const loginPrompt = document.getElementById('login-prompt');
const registerPrompt = document.getElementById('register-prompt');
const registerPage = document.getElementById('register-page');

let busy = false;

function setInert(mode) {
  const register = mode === 'register';
  loginPage.inert = register;
  registerPrompt.inert = register;
  registerPage.inert = !register;
  loginPrompt.inert = !register;
}

function show(mode) {
  const register = mode === 'register';
  if (busy || book.classList.contains('is-turned') === register) return;
  busy = true;

  book.classList.add('is-turning');
  book.classList.toggle('is-turned', register);
  document.body.classList.toggle('is-register', register);
  setInert(mode);

  setTimeout(() => {
    book.classList.remove('is-turning');
    busy = false;
    // Put the cursor in the first field of the form now showing.
    const form = register ? registerPage : loginPage;
    form.querySelector('input')?.focus({ preventScroll: true });
  }, TURN_MS);
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-show]');
  if (btn) show(btn.dataset.show);
});

// ---- Boilerplate validation (nothing is sent anywhere) ----
const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

function message(form, text, ok = false) {
  const el = form.querySelector('.error, .note');
  el.className = ok ? 'note' : 'error';
  el.textContent = text;
}

document.getElementById('login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.target.elements;
  if (!emailOk(f.email.value)) return message(e.target, 'Enter a valid email address.');
  if (!f.password.value) return message(e.target, 'Enter your password.');
  message(e.target, 'Looks good. This is a demo, so nothing was sent.', true);
});

document.getElementById('register-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.target.elements;
  if (!f.first.value.trim() || !f.last.value.trim()) return message(e.target, 'Enter your first and last name.');
  if (!emailOk(f.email.value)) return message(e.target, 'Enter a valid email address.');
  if (f.password.value.length < 8) return message(e.target, 'Password needs at least 8 characters.');
  // The confirm field is hidden on small screens, so only check it when it's visible.
  if (f.confirm.offsetParent !== null && f.confirm.value !== f.password.value) {
    return message(e.target, "Passwords don't match.");
  }
  if (!f.terms.checked) return message(e.target, 'Please agree to the terms.');
  message(e.target, 'Account looks good. This is a demo, so nothing was sent.', true);
});

// Clear the message as soon as someone edits a field.
document.querySelectorAll('form').forEach((form) =>
  form.addEventListener('input', () => message(form, '')));

setInert('login');
