import express from 'express';
import {
  executeToolViaMcp,
  getToolsFromMcpServer,
} from '../services/McpService.js';

const router = express.Router();

// Sample API endpoint
router.post('/', async (req, res) => {
  const mcpTools = await getToolsFromMcpServer();
  const userPrompt = req.body.message;
  const systemPrompt = `You are an AI assistant with access to the following tools:
1. **echo_message** - Echo back a message with optional formatting
   - Parameters: message (string), uppercase (boolean, optional), repeat (number 1-5, optional)
   - Use this to repeat or format user messages

2. **calculate** - Perform basic mathematical calculations
   - Parameters: operation (add/subtract/multiply/divide), a (number), b (number)
   - Use this for arithmetic operations

3. **get_alerts** - Get weather alerts for a state
   - Parameters: state (2-letter state code like CA, NY)
   - Use this to get active weather alerts for a US state

4. **get_weather_for_city** - Get weather forecast for any city by name
   - Parameters: city (string) - City name or address (e.g., "Eugene Oregon", "Tokyo Japan")
   - Use this for ALL weather requests - it handles geocoding automatically
   - Works for any city worldwide

5. **get_forecast** - Get weather forecast for specific coordinates (DEPRECATED)
   - Parameters: latitude (number -90 to 90), longitude (number -180 to 180), location_name (string, optional)
   - DO NOT USE THIS TOOL - use get_weather_for_city instead

CRITICAL: For ANY weather request, ALWAYS use get_weather_for_city with the city name. DO NOT use get_forecast.

When users ask for calculations, weather information, or want to echo/format messages, use the appropriate tool. 
Always provide clear, helpful responses and use the tools when they would be beneficial to the user's request.
`;

  const tools = mcpTools.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description || tool.title || 'No description',
      parameters: tool.inputSchema || {},
    },
  }));

  // Client-side timeout
  const controller = new AbortController();
  const clientTimeout = setTimeout(() => controller.abort(), 20 * 60 * 1000); // 20m

  let resultArray = [];

  try {
    const payload = {
      model: process.env.OLLAMA_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      tools,
      keep_alive: '20m',
      options: { temperature: 0.3, top_p: 0.9 },
      stream: false,
    };

    const response = await fetch(`${process.env.OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(clientTimeout);
    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${errBody}`);
    }

    const data = await response.json();
    const toolsCalled = data.message?.tool_calls || [];

    // Process all tool calls and collect results
    for (const call of toolsCalled) {
      try {
        if (call.function) {
          let args = call.function.arguments;
          // Parse arguments if they're a string
          if (typeof args === 'string') {
            try {
              args = JSON.parse(args);
            } catch (parseError) {
              console.error(
                '❌ Failed to parse tool call arguments:',
                parseError
              );
              continue;
            }
          }

          const toolResult = await executeToolViaMcp(call);
          if (toolResult) {
            resultArray.push({
              tool: call.function.name,
              result: toolResult,
            });
          }
        } else {
          console.log('⚠️ Unknown tool call structure or function name');
        }
      } catch (error) {
        console.error('❌ Error invoking tool call:', error);
        // Continue processing other tool calls even if one fails
      }
    }

    // Format the response for the frontend
    let formattedMessage = '';
    if (resultArray.length > 0) {
      formattedMessage = resultArray
        .map((item) => {
          if (item.tool === 'calculate' && item.result?.content?.[0]?.text) {
            return `Calculation result: ${item.result.content[0].text}`;
          }
          if (item.tool === 'echo_message' && item.result?.content?.[0]?.text) {
            return `${item.result.content[0].text}`;
          }
          if (
            item.tool === 'get_weather_for_city' &&
            item.result?.content?.[0]?.text
          ) {
            return `${item.result.content[0].text}`;
          }
          if (item.tool === 'get_alerts' && item.result?.content?.[0]?.text) {
            return `Weather Alerts:\n${item.result.content[0].text}`;
          }
          return `Tool ${item.tool} result: ${JSON.stringify(item.result)}`;
        })
        .join('\n\n');
    } else {
      formattedMessage = 'No tool calls were executed.';
    }

    res.json({ message: formattedMessage });
  } catch (e) {
    console.error(e);
  }
});

router.get('/tools', async (req, res) => {
  const mcpTools = await getToolsFromMcpServer();
  res.json(mcpTools);
});

export default router;
