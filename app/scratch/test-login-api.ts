async function testLogin(port: number, username: string, password: string) {
  console.log(`\nTesting login API on http://localhost:${port}/api/admin/login`);
  console.log(`Payload: { username: '${username}', password: '${password}' }`);
  
  try {
    const res = await fetch(`http://localhost:${port}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    console.log(`Status: ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.log(`Response body:`, text);
    return true;
  } catch (err: any) {
    if (err.cause && err.cause.code === 'ECONNREFUSED') {
      console.log(`Port ${port} refused connection.`);
      return false;
    }
    console.error(`Fetch failed:`, err.message);
    return false;
  }
}

async function run() {
  const ports = [3000, 3001, 3002, 3003];
  let activePort = 0;
  
  for (const port of ports) {
    try {
      const res = await fetch(`http://localhost:${port}`);
      if (res.ok || res.status) {
        console.log(`Found active server on port ${port}`);
        activePort = port;
        break;
      }
    } catch (e) {}
  }
  
  if (!activePort) {
    console.log("Could not find active Next.js server on ports 3000-3003.");
    return;
  }
  
  console.log("\n=== TRYING OLD CREDENTIALS ===");
  await testLogin(activePort, 'bendahara', 'admin123');
  
  console.log("\n=== TRYING NEW CREDENTIALS ===");
  await testLogin(activePort, 'admin_baru', 'password123');
}

run();
