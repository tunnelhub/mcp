import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import open from 'open';
import net from 'node:net';
import type { Server } from 'node:http';

function writeStderr(message: string): void {
  process.stderr.write(`${message}\n`);
}

export interface BrowserAuthTokens {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class BrowserAuthFlow {
  private port: number;

  private readonly server: express.Express;

  private readonly sessionId: string;

  constructor(port = Number(process.env.OAUTH_CALLBACK_PORT || 3333)) {
    this.port = port;
    this.sessionId = uuidv4();
    this.server = express();

    this.server.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
      }

      next();
    });

    this.server.use(express.json());
  }

  async authenticate(frontendUrl: string, tenantId?: string): Promise<BrowserAuthTokens> {
    this.port = await this.resolveCallbackPort(this.port);

    return new Promise((resolve, reject) => {
      const cleanup = (): void => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }

        if (httpServer) {
          httpServer.close();
        }
      };

      this.server.post('/auth/callback', (req, res) => {
        const { idToken, accessToken, refreshToken, expiresIn } = req.body as Partial<BrowserAuthTokens>;

        if (!idToken || !accessToken || !refreshToken || !expiresIn) {
          res.status(400).json({ success: false, message: 'Tokens not received' });
          cleanup();
          reject(new Error('Tokens not received from frontend auth flow.'));
          return;
        }

        res.json({ success: true });

        setTimeout(() => {
          cleanup();
          resolve({
            idToken,
            accessToken,
            refreshToken,
            expiresIn: Number(expiresIn),
          });
        }, 500);
      });

      this.server.get('/', (_req, res) => {
        const redirectUri = `http://localhost:${this.port}/auth/callback`;
        const authCliUrl = new URL(`${frontendUrl.replace(/\/$/, '')}/#/auth-cli`);
        const searchParams = new URLSearchParams({
          sessionId: this.sessionId,
          redirect_uri: redirectUri,
        });

        if (tenantId) {
          searchParams.set('tenantId', tenantId);
        }

        res.send(`<!DOCTYPE html>
<html>
  <head>
    <title>TunnelHub MCP Authentication</title>
    <style>
      body { font-family: Arial, sans-serif; text-align: center; padding: 40px; }
      .container { max-width: 600px; margin: 0 auto; }
      .spinner { border: 4px solid rgba(0, 0, 0, 0.1); width: 36px; height: 36px; border-radius: 50%; border-left-color: #09f; animation: spin 1s linear infinite; margin: 20px auto; }
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>TunnelHub MCP Authentication</h1>
      <p>You will be redirected to the TunnelHub login page.</p>
      <div class="spinner"></div>
      <p>Redirecting...</p>
    </div>
    <script>
      setTimeout(() => {
        window.location.href = ${JSON.stringify(`${authCliUrl.toString()}?${searchParams.toString()}`)};
      }, 1200);
    </script>
  </body>
</html>`);
      });

      this.server.get('/status', (_req, res) => {
        res.json({ status: 'running', sessionId: this.sessionId });
      });

      const timeoutHandle = setTimeout(() => {
        cleanup();
        reject(new Error('Authentication timed out after 5 minutes.'));
      }, 5 * 60 * 1000);

      const httpServer: Server = this.server.listen(this.port, async () => {
        const localUrl = `http://localhost:${this.port}`;
        writeStderr('');
        writeStderr('Starting TunnelHub MCP authentication...');
        writeStderr(`If browser does not open, visit:\n${localUrl}\n`);

        try {
          await open(localUrl);
        } catch (error) {
          writeStderr(`Failed to open browser automatically: ${String(error)}`);
        }
      });

      httpServer.on('error', (error: NodeJS.ErrnoException) => {
        cleanup();
        if (error.code === 'EADDRINUSE') {
          reject(new Error(`OAuth callback port ${this.port} already in use.`));
          return;
        }

        reject(error);
      });
    });
  }

  private async resolveCallbackPort(preferredPort: number): Promise<number> {
    if (await this.isPortFree(preferredPort)) {
      return preferredPort;
    }

    for (let port = preferredPort + 1; port <= preferredPort + 20; port += 1) {
      if (await this.isPortFree(port)) {
        writeStderr(`OAuth callback port ${preferredPort} busy. Using ${port}.`);
        return port;
      }
    }

    throw new Error(`No free OAuth callback port found from ${preferredPort} to ${preferredPort + 20}.`);
  }

  private async isPortFree(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const tester = net.createServer();

      tester.once('error', () => {
        resolve(false);
      });

      tester.once('listening', () => {
        tester.close(() => resolve(true));
      });

      tester.listen(port, '127.0.0.1');
    });
  }
}
