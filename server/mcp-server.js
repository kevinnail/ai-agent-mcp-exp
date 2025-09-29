import 'dotenv/config';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';

// NWS API configuration
const NWS_API_BASE = 'https://api.weather.gov';
const USER_AGENT = 'MCP-Weather-Tool/1.0';

// Helper function to make NWS API requests
async function makeNWSRequest(url) {
  const headers = {
    'User-Agent': USER_AGENT,
    Accept: 'application/geo+json',
  };

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error making NWS request:', error);
    return null;
  }
}

// Helper function to format weather alerts
function formatAlert(feature) {
  const props = feature.properties || {};
  return [
    `Event: ${props.event || 'Unknown'}`,
    `Area: ${props.areaDesc || 'Unknown'}`,
    `Severity: ${props.severity || 'Unknown'}`,
    `Status: ${props.status || 'Unknown'}`,
    `Headline: ${props.headline || 'No headline'}`,
    '---',
  ].join('\n');
}

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

  server.tool(
    'get_weather_for_city',
    'Get weather forecast and alerts for a city by name (handles geocoding automatically)',
    {
      city: z
        .string()
        .describe(
          'City name or address (e.g., "Eugene Oregon", "Tokyo Japan")'
        ),
    },
    async ({ city }) => {
      try {
        // First, geocode the city
        const encodedLocation = encodeURIComponent(city);
        const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodedLocation}&format=json&limit=1`;

        console.log('Geocoding URL:', geocodeUrl);

        const geocodeResponse = await fetch(geocodeUrl, {
          headers: {
            'User-Agent': USER_AGENT,
          },
        });

        if (!geocodeResponse.ok) {
          throw new Error(`Geocoding API error: ${geocodeResponse.status}`);
        }

        const geocodeData = await geocodeResponse.json();

        if (!geocodeData || geocodeData.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No coordinates found for location: ${city}`,
              },
            ],
          };
        }

        const result = geocodeData[0];
        const latitude = parseFloat(result.lat);
        const longitude = parseFloat(result.lon);
        const displayName = result.display_name;

        console.log('Geocoded coordinates:', {
          latitude,
          longitude,
          displayName,
        });

        // Now get weather forecast
        const pointsUrl = `${NWS_API_BASE}/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`;
        const pointsData = await makeNWSRequest(pointsUrl);

        if (!pointsData) {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to retrieve grid point data for ${city}. This location may not be supported by the NWS API (only US locations are supported).`,
              },
            ],
          };
        }

        const forecastUrl = pointsData.properties?.forecast;
        if (!forecastUrl) {
          return {
            content: [
              {
                type: 'text',
                text: 'Failed to get forecast URL from grid point data',
              },
            ],
          };
        }

        const forecastData = await makeNWSRequest(forecastUrl);
        if (!forecastData) {
          return {
            content: [
              {
                type: 'text',
                text: 'Failed to retrieve forecast data',
              },
            ],
          };
        }

        const periods = forecastData.properties?.periods || [];
        if (periods.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'No forecast periods available',
              },
            ],
          };
        }

        // Format forecast periods
        const formattedForecast = periods.map((period) =>
          [
            `${period.name || 'Unknown'}:`,
            `Temperature: ${period.temperature || 'Unknown'}°${period.temperatureUnit || 'F'}`,
            `Wind: ${period.windSpeed || 'Unknown'} ${period.windDirection || ''}`,
            `${period.shortForecast || 'No forecast available'}`,
            '---',
          ].join('\n')
        );

        // Get alerts for the state
        const stateCode =
          result.address?.state || result.address?.state_code || 'OR'; // Default to OR if no state found
        const alertsUrl = `${NWS_API_BASE}/alerts?area=${stateCode}`;
        const alertsData = await makeNWSRequest(alertsUrl);

        let alertsText = '';
        if (
          alertsData &&
          alertsData.features &&
          alertsData.features.length > 0
        ) {
          const formattedAlerts = alertsData.features.map((feature) => {
            const props = feature.properties || {};
            return [
              `Event: ${props.event || 'Unknown'}`,
              `Area: ${props.areaDesc || 'Unknown'}`,
              `Severity: ${props.severity || 'Unknown'}`,
              `Status: ${props.status || 'Unknown'}`,
              `Headline: ${props.headline || 'No headline'}`,
              '---',
            ].join('\n');
          });
          alertsText = `\n\nWeather Alerts:\n${formattedAlerts.join('\n')}`;
        } else {
          alertsText = '\n\nNo active weather alerts.';
        }

        const forecastText = `Weather Forecast:\nForecast for ${displayName}:\n\n${formattedForecast.join('\n')}${alertsText}`;

        return {
          content: [
            {
              type: 'text',
              text: forecastText,
            },
          ],
        };
      } catch (error) {
        console.error('Weather for city failed:', error);
        return {
          content: [
            {
              type: 'text',
              text: `Failed to get weather for "${city}": ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Register weather tools
  server.tool(
    'get_alerts',
    'Get weather alerts for a state',
    {
      state: z
        .string()
        .length(2)
        .describe('Two-letter state code (e.g. CA, NY)'),
    },
    async ({ state }) => {
      const stateCode = state.toUpperCase();
      const alertsUrl = `${NWS_API_BASE}/alerts?area=${stateCode}`;
      const alertsData = await makeNWSRequest(alertsUrl);

      if (!alertsData) {
        return {
          content: [
            {
              type: 'text',
              text: 'Failed to retrieve alerts data',
            },
          ],
        };
      }

      const features = alertsData.features || [];
      if (features.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `No active alerts for ${stateCode}`,
            },
          ],
        };
      }

      const formattedAlerts = features.map(formatAlert);
      const alertsText = `Active alerts for ${stateCode}:\n\n${formattedAlerts.join('\n')}`;

      return {
        content: [
          {
            type: 'text',
            text: alertsText,
          },
        ],
      };
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
