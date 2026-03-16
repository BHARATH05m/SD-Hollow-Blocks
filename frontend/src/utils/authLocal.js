const STORAGE_KEY = 'sdhb_users';
const OWNER_USERNAME = 'owner1';
const OWNER_PASSWORD = 'owner123';

function readUsers() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeUsers(users) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export function registerUser(email, password) {
  if (!email) throw new Error('Email is required');
  if (email.toLowerCase() === OWNER_USERNAME) {
    throw new Error('This id is reserved for owner');
  }
  const users = readUsers();
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('User already registered');
  }
  users.push({ email, password });
  writeUsers(users);
}

// returns 'owner' or 'user'
export function login(id, password) {
  if (!id) throw new Error('Id is required');

  if (id === OWNER_USERNAME) {
    if (password === OWNER_PASSWORD) return 'owner';
    throw new Error('Wrong password for owner');
  }

  const users = readUsers();
  const found = users.find(
    (u) => u.email.toLowerCase() === id.toLowerCase() && u.password === password
  );
  if (found) return 'user';

  throw new Error('User not found. Please register first.');
}

export const ownerHint = `Owner login: ${OWNER_USERNAME} / ${OWNER_PASSWORD}`;

