// Gestion des utilisateurs
let users = JSON.parse(localStorage.getItem('tm_users')) || [];
let currentUser = JSON.parse(localStorage.getItem('tm_currentUser')) || null;

// Gestion des tontines par utilisateur
function getUserTontines() {
  if (!currentUser) return [];
  return JSON.parse(localStorage.getItem('tm_tontines_' + currentUser.username)) || [];
}
function saveUserTontines(tontines) {
  localStorage.setItem('tm_tontines_' + currentUser.username, JSON.stringify(tontines));
}

// Auth affichage & logique
function showApp() {
  document.getElementById('auth-section').style.display = 'none';
  document.getElementById('app-section').style.display = '';
  renderTontines();
}
function showAuth() {
  document.getElementById('auth-section').style.display = '';
  document.getElementById('app-section').style.display = 'none';
}

// Connexion
document.getElementById('login-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const found = users.find(u => u.username === username && u.password === password);
  if (found) {
    currentUser = found;
    localStorage.setItem('tm_currentUser', JSON.stringify(currentUser));
    showApp();
  } else {
    alert('Utilisateur ou mot de passe incorrect');
  }
  this.reset();
});

// Inscription
document.getElementById('register-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const username = document.getElementById('register-username').value.trim();
  const password = document.getElementById('register-password').value;
  if (users.some(u => u.username === username)) {
    alert('Ce nom d\'utilisateur existe déjà');
    return;
  }
  if (username.length < 2 || password.length < 4) {
    alert('Nom ou mot de passe trop court');
    return;
  }
  const newUser = { username, password };
  users.push(newUser);
  localStorage.setItem('tm_users', JSON.stringify(users));
  alert('Compte créé ! Connectez-vous.');
  this.reset();
});

// Déconnexion
document.getElementById('logout-btn').addEventListener('click', function() {
  currentUser = null;
  localStorage.removeItem('tm_currentUser');
  showAuth();
});

// Tontines logique
function renderTontines() {
  if (!currentUser) return;
  const tontines = getUserTontines();
  const container = document.getElementById('tontine-cards');
  container.innerHTML = '';
  tontines.forEach((t, idx) => {
    const card = document.createElement('div');
    card.className = 'tontine-card';
    card.innerHTML = `
      <h3>${t.name}</h3>
      <p>Montant : <strong>${t.amount} FCFA</strong></p>
      <p>Fréquence : <strong>${t.frequency}</strong></p>
      <p>Membres : ${t.members.length}</p>
      <button onclick="addMember(${idx})">Ajouter un membre</button>
      <button onclick="trackPayments(${idx})">Suivi des paiements</button>
      <button onclick="exportCSV(${idx})">Exporter en Excel</button>
    `;
    container.appendChild(card);
  });
}

document.getElementById('tontine-form').addEventListener('submit', function(e) {
  e.preventDefault();
  if (!currentUser) return;
  const name = document.getElementById('tontine-name').value;
  const amount = document.getElementById('cotisation-amount').value;
  const frequency = document.getElementById('cotisation-frequency').value;
  const tontines = getUserTontines();
  tontines.push({
    name,
    amount,
    frequency,
    members: [],
    payments: []
  });
  saveUserTontines(tontines);
  renderTontines();
  this.reset();
});

// Ajout de membre
window.addMember = function(idx) {
  if (!currentUser) return;
  const tontines = getUserTontines();
  const member = prompt('Nom du membre à ajouter :');
  if (member && member.trim()) {
    tontines[idx].members.push(member.trim());
    saveUserTontines(tontines);
    renderTontines();
  }
};

// Suivi des paiements
window.trackPayments = function(idx) {
  if (!currentUser) return;
  const tontines = getUserTontines();
  let html = `Membres de la tontine "${tontines[idx].name}"\n`;
  tontines[idx].members.forEach((m, i) => {
    html += `${m} : [Marquer payé]\n`;
  });
  // Version alert simple
  let list = tontines[idx].members.map((m, i) => `${m} : payé ? ${tontines[idx].payments.some(p => p.member === m) ? 'Oui' : 'Non'}`).join('\n');
  const memberIdx = prompt(`Suivi des paiements\n${list}\nEntrez le numéro du membre à marquer comme payé :\n(1 = premier membre)`);
  const num = parseInt(memberIdx);
  if (!isNaN(num) && tontines[idx].members[num - 1]) {
    const now = new Date().toISOString();
    tontines[idx].payments.push({
      member: tontines[idx].members[num - 1],
      date: now,
    });
    saveUserTontines(tontines);
    alert('Paiement enregistré');
  }
};

// Export Excel (CSV)
window.exportCSV = function(idx) {
  if (!currentUser) return;
  const tontines = getUserTontines();
  const tontine = tontines[idx];
  let csv = "Nom,Membre,Paiement enregistré\n";
  tontine.members.forEach(m => {
    const paid = tontine.payments.some(p => p.member === m) ? "Oui" : "Non";
    csv += `${tontine.name},${m},${paid}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${tontine.name}-cotisations.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Affichage bouton soutien
document.getElementById('support-btn').onclick = function() {
  document.getElementById('airtel-support').style.display = 'block';
};

// Initialisation
if (currentUser) {
  showApp();
} else {
  showAuth();
}
