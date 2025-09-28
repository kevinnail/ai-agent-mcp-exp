const MCP_SERVER_URL = process.env.MCP_SERVER_URL;

function extractFromSSEChunk(chunk, extractFn) {
  const lines = chunk.split('\n');
  for (const line of lines) {
    if (line.startsWith('data:')) {
      const jsonStr = line.slice(5).trim();
      if (jsonStr === '[DONE]') {
        return { done: true };
      }
      if (jsonStr) {
        try {
          const event = JSON.parse(jsonStr);
          const result = extractFn(event);
          if (result !== null) {
            return { data: result };
          }
        } catch (err) {
          console.error('Bad JSON in SSE chunk:', err, jsonStr);
        }
      }
    }
  }
  return null;
}

async function getMcpSessionId() {
  try {
    const response = await fetch(`${MCP_SERVER_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'initialize',
        params: {
          protocolVersion: '2025-03-26',
          capabilities: {},
          clientInfo: {
            name: 'thunderclient-test',
            version: '1.0.0',
          },
        },
        id: 1,
      }),
    });

    return response.headers.get('mcp-session-id');
  } catch (error) {
    console.error('Failed to get MCP session ID:', error);
    return null;
  }
}

export async function getToolsFromMcpServer() {
  try {
    const sessionId = await getMcpSessionId();

    const response = await fetch(`${MCP_SERVER_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        'Mcp-Session-Id': sessionId,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/list',
        id: 1,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let tools = [];

    let done = false;
    while (!done) {
      const result = await reader.read();
      done = result.done;

      if (!done) {
        buffer += decoder.decode(result.value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          const chunkResult = extractFromSSEChunk(part, (event) => {
            if (event.result?.tools) {
              return event.result.tools;
            }
            console.info('Other event:', event);
            return null;
          });

          if (chunkResult?.done) {
            return tools;
          }
          if (chunkResult?.data) {
            tools = chunkResult.data;
          }
        }
      }
    }
    return tools;
  } catch (error) {
    console.error('Failed to get tools from MCP server:', error);
    return [];
  }
}

export async function executeToolViaMcp(toolCall) {
  try {
    const sessionId = await getMcpSessionId();

    const args = toolCall.function.arguments;

    const convertedArgs = {};

    if (toolCall.function.name === 'calculate') {
      // Convert string arguments to numbers dynamically
      for (const [key, value] of Object.entries(args)) {
        // Only convert if the value is a string that represents a valid number
        if (
          typeof value === 'string' &&
          !isNaN(value) &&
          !isNaN(parseFloat(value))
        ) {
          convertedArgs[key] = Number(value);
        } else {
          convertedArgs[key] = value; // Keep original value for non-numeric strings
        }
      }
    } else if (toolCall.function.name === 'echo_message') {
      const args = toolCall.function.arguments;
      args.repeat = Number(args.repeat);
      args.uppercase = Boolean(args.uppercase);
    }

    const response = await fetch(`${MCP_SERVER_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',

        'Mcp-Session-Id': sessionId,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: toolCall.function.name,
          arguments:
            toolCall.function.name === 'calculate' ? convertedArgs : args,
        },
        id: 2,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Handle streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let result = null;

    let done = false;
    while (!done) {
      const readResult = await reader.read();
      done = readResult.done;

      if (!done) {
        buffer += decoder.decode(readResult.value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          const chunkResult = extractFromSSEChunk(part, (event) => {
            if (event.result) {
              return event.result;
            }
            return null;
          });

          if (chunkResult?.done) {
            return result;
          }
          if (chunkResult?.data) {
            result = chunkResult.data;
          }
        }
      }
    }
    return result;
  } catch (error) {
    console.error('MCP tool execution failed:', error);
    return null;
  }
}
