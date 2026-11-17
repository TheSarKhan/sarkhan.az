import 'dotenv/config';
import { createApp } from './app.js';
import { getWalletConfig } from './config.js';

const port = Number.parseInt(process.env.PORT || '3001', 10);
const host = process.env.HOST || '127.0.0.1';

const app = createApp();
const walletStatus = getWalletConfig();

app.listen(port, host, () => {
  console.log(
    `[sarkhan-api] Listening on http://${host}:${port} (walletConfigured=${walletStatus.configured})`,
  );
});
