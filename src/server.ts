import { Server } from 'http';
import app from './app';
import seedSuperAdmin from './app/DB';
import config from './config';

const port = config.port || 9001;

async function main() {
  // Start Express server
  const server: Server = app.listen(port, () => {
    console.log('✅ Server is running at:', `http://localhost:${port}`);
  });

  // Seed default super admin if needed
  await seedSuperAdmin();
}

main();
