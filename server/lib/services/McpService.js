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

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() || '';

      for (const part of parts) {
        const result = extractFromSSEChunk(part, (event) => {
          if (event.result?.tools) {
            return event.result.tools;
          }
          console.info('Other event:', event);
          return null;
        });

        if (result?.done) {
          return tools;
        }
        if (result?.data) {
          tools = result.data;
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

    const args =
      typeof toolCall.function.arguments === 'string'
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;

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
          arguments: args,
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

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
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

    return result;
  } catch (error) {
    console.error('MCP tool execution failed:', error);
    return null;
  }
}
