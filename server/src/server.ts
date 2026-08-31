import 'dotenv/config';
import { env } from './lib/env';
import app from './app';

app.listen(env.port, () => {
  console.log(`HookWatch server running on http://localhost:${env.port}`);
});
