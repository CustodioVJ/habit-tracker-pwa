/* eslint-disable no-console */
// Wait for a specified number of seconds, then run the check-deploy logic.
const waitSeconds = Number(process.argv[2] || '180');
console.log(`Waiting ${waitSeconds}s before checking deployment...`);
const end = Date.now() + waitSeconds * 1000;
while (Date.now() < end) {
  /* busy-wait */
}

const BASE = 'https://habit-tracker-api-ulu9.onrender.com/api/v1';
const email = `deploy_${Date.now()}@test.com`;

async function main() {
  const reg = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123', name: 'Deploy Check' }),
  });
  const regJson = await reg.json();
  const token = regJson.accessToken || regJson.token;

  const habit = await fetch(`${BASE}/habits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      name: 'Check Habit',
      categoryId: null,
      frequencyType: 'daily',
      frequencyConfig: { type: 'daily' },
    }),
  });
  const habitJson = await habit.json();
  const habitId = habitJson.id || habitJson.habit?.id;

  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
  const check = await fetch(`${BASE}/habits/${habitId}/check-ins`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ date: today, completed: true }),
  });
  const checkJson = await check.json();
  console.log('Check-in status:', check.status);
  console.log('Check-in body:', JSON.stringify(checkJson));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
