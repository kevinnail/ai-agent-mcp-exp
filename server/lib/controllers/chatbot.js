import express from 'express';
import {
  executeToolViaMcp,
  getToolsFromMcpServer,
} from '../services/McpService.js';

const router = express.Router();

// Sample API endpoint
router.post('/', async (req, res) => {
  let mcpResult = null;
  const mcpTools = await getToolsFromMcpServer();
  const userPrompt = req.body.message;
  const systemPrompt = `You are an AI assistant with access to the following tools:
1. **echo_message** - Echo back a message with optional formatting
   - Parameters: message (string), uppercase (boolean, optional), repeat (number 1-5, optional)
   - Use this to repeat or format user messages

2. **calculate** - Perform basic mathematical calculations
   - Parameters: operation (add/subtract/multiply/divide), a (number), b (number)
   - Use this for arithmetic operations

When users ask for calculations or want to echo/format messages, use the appropriate tool. 
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
    // const raw =
    //   data.message && typeof data.message.content === 'string'
    //     ? data.message.content.trim()
    //     : JSON.stringify(data);

    const toolsCalled = data.message?.tool_calls || [];
    for (const call of toolsCalled) {
      // eslint-disable-next-line no-console
      console.log(' Individual tool call:', JSON.stringify(call, null, 2));
      try {
        // if (call.function && call.function.name === 'create_calendar_event') {
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

          mcpResult = await executeToolViaMcp(call);
        } else {
          // eslint-disable-next-line no-console
          console.log('⚠️ Unknown tool call structure or function name');
        }
      } catch (error) {
        console.error('❌ Error invoking tool call:', error);

        // Check if this is a token expiration error
        if (
          error.message &&
          error.message.includes(
            'User does not have valid Google Calendar tokens'
          )
        ) {
          console.info(
            '🔑 Google Calendar token expired - this will be handled by the UI'
          );
          // Don't throw here, just log and continue - the UI will handle the token refresh
        }
      }
    }
  } catch (e) {
    console.error(e);
  }
  res.json({ message: mcpResult.content[0].text });
});

export default router;
