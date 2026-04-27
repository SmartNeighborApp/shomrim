// auth.js — שומרים

async function doLogin() {
  const phone = document.getElementById('loginPhone').value.trim();
  const pin = document.getElementById('loginPin').value.trim();

  if (!phone || !pin) return showError('loginError', 'יש למלא טלפון ו־PIN');
  if (pin.length !== 4) return showError('loginError', 'PIN חייב להיות 4 ספרות');

  document.querySelector('.btn-primary').classList.add('loading');

  const { data, error } = await supabase
    .from('shomrim_users')
    .select('*')
    .eq('phone', phone)
    .eq('pin', pin)
    .single();

  document.querySelector('.btn-primary').classList.remove('loading');

  if (error || !data) return showError('loginError', 'טלפון או PIN שגויים');

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));

  if (data.role === ROLES.CHILD) {
    window.location.href = 'child.html';
  } else {
    window.location.href = 'parent.html';
  }
}

async function doRegister() {
  const name = document.getElementById('regName').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const pin = document.getElementById('regPin').value.trim();
  const role = selectedRole;

  if (!name) return showError('registerError', 'יש למלא שם מלא');
  if (!phone || phone.length < 9) return showError('registerError', 'יש למלא מספר טלפון תקין');
  if (!pin || pin.length !== 4) return showError('registerError', 'PIN חייב להיות 4 ספרות');

  if (role === ROLES.CHILD) {
    const age = document.getElementById('regAge').value;
    const parentPhone = document.getElementById('regParentPhone').value.trim();
    if (!age) return showError('registerError', 'יש למלא גיל');
    if (!parentPhone) return showError('registerError', 'יש למלא טלפון הורה');
  }

  if (role === ROLES.PARENT) {
    const idNumber = document.getElementById('regId').value.trim();
    const declared = document.getElementById('regDeclare').checked;
    if (!idNumber || idNumber.length !== 9) return showError('registerError', 'יש למלא תעודת זהות תקינה');
    if (!declared) return showError('registerError', 'יש לאשר את ההצהרה');
  }

  // בדיקה אם הטלפון כבר קיים
  const { data: existing } = await supabase
    .from('shomrim_users')
    .select('id')
    .eq('phone', phone)
    .single();

  if (existing) return showError('registerError', 'מספר הטלפון כבר רשום במערכת');

  const userData = {
    name,
    phone,
    pin,
    role,
    age: role === ROLES.CHILD ? parseInt(document.getElementById('regAge').value) : null,
    id_number: role === ROLES.PARENT ? document.getElementById('regId').value.trim() : null,
    declared_no_criminal: role === ROLES.PARENT ? document.getElementById('regDeclare').checked : false,
    is_verified: false
  };

  const { data, error } = await supabase
    .from('shomrim_users')
    .insert([userData])
    .select()
    .single();

  if (error) return showError('registerError', 'שגיאה בהרשמה — נסי שוב');

  // שמירת קשר ילד-הורה
  if (role === ROLES.CHILD) {
    const parentPhone = document.getElementById('regParentPhone').value.trim();
    const { data: parentData } = await supabase
      .from('shomrim_users')
      .select('id')
      .eq('phone', parentPhone)
      .single();

    if (parentData) {
      await supabase.from('shomrim_children_parents').insert([{
        child_id: data.id,
        parent_id: parentData.id,
        is_real_parent: true
      }]);
    }
  }

  showSuccess('registerSuccess', '✅ נרשמת בהצלחה! כעת תוכל/י להתחבר');
  setTimeout(() => showTab('login'), 2000);
}

function getSession() {
  const s = sessionStorage.getItem(SESSION_KEY);
  return s ? JSON.parse(s) : null;
}

function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.href = 'index.html';
}
