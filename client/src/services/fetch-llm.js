const BASE_URL = process.env.REACT_APP_BASE_URL || '';

export async function sendPrompt(message) {
  console.log('hi were sending prompts');
  try {
    const resp = await fetch(`${BASE_URL}/api/v1/chatbot`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ message }),
    });

    if (resp.ok) {
      const user = await resp.json();
      return user;
    }
    return null;
  } catch (error) {
    console.error('Error in getUser:', error);
    throw new Error(`Failed to get user: ${error.message}`);
  }
}
