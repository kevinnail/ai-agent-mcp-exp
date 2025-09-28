import 'dotenv/config';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';

const app = express();
app.use(express.json());

// Map to store transports by session ID
const transports = {};

// Create and configure MCP server
function createServer() {
  const server = new McpServer({
    name: 'mcp-server',
    version: '1.0.0',
  });

  server.tool(
    'echo_message',
    'Echo back a message with optional formatting',
    {
      message: z.string().describe('Message to echo back'),
      uppercase: z.boolean().optional().describe('Convert to uppercase'),
      repeat: z
        .number()
        .min(1)
        .max(5)
        .optional()
        .describe('Number of times to repeat (1-5)'),
    },
    async (args) => {
      try {
        let result = args.message;

        if (args.uppercase) {
          result = result.toUpperCase();
        }

        if (args.repeat && args.repeat > 1) {
          result = Array(args.repeat).fill(result).join(' | ');
        }

        return {
          content: [
            {
              type: 'text',
              text: `${result}`,
            },
          ],
        };
      } catch (error) {
        console.error('Echo tool failed:', error);
        return {
          content: [
            {
              type: 'text',
              text: `Failed to echo message: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    'calculate',
    'Perform basic mathematical calculations',
    {
      operation: z
        .enum(['add', 'subtract', 'multiply', 'divide'])
        .describe('Mathematical operation'),
      a: z.number().describe('First number'),
      b: z.number().describe('Second number'),
    },
    async (args) => {
      console.log('args', args);
      try {
        let result;
        let operationText = '';
        switch (args.operation) {
          case 'add':
            result = args.a + args.b;
            operationText = '+';
            break;
          case 'subtract':
            result = args.a - args.b;
            operationText = '-';
            break;
          case 'multiply':
            result = args.a * args.b;
            operationText = '*';
            break;
          case 'divide':
            if (args.b === 0) {
              throw new Error('Division by zero');
            }
            operationText = '/';
            result = args.a / args.b;
            break;
          default:
            throw new Error('Invalid operation');
        }

        return {
          content: [
            {
              type: 'text',
              text: `${args.a} ${operationText} ${args.b} = ${result}`,
            },
          ],
        };
      } catch (error) {
        console.error('Calculate tool failed:', error);
        return {
          content: [
            {
              type: 'text',
              text: `Calculation failed: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  return server;
}

app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  let transport;

  if (sessionId && transports[sessionId]) {
    // Reuse existing session
    transport = transports[sessionId];
  } else {
    // New initialization
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (id) => {
        transports[id] = transport;
      },
      enableDnsRebindingProtection: true,
      allowedHosts: ['127.0.0.1', 'localhost:4001'],
    });

    const server = createServer();
    await server.connect(transport);

    // Clean up when closed
    transport.onclose = () => {
      if (transport.sessionId) {
        delete transports[transport.sessionId];
      }
    };
  }

  await transport.handleRequest(req, res, req.body);
});

app.get('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
});

// Start the server
const PORT = process.env.MCP_SERVER_PORT;
app.listen(PORT, (error) => {
  if (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log(`MCP HTTP Server listening on port ${PORT}`);
});
