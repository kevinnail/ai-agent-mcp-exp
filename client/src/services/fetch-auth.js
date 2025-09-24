const BASE_URL = process.env.REACT_APP_BASE_URL || '';

/* Auth related functions */

export async function getUser() {
  try {
    const resp = await fetch(`${BASE_URL}/api/v1/users/me`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
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

export async function signUpUser(email, password) {
  try {
    const resp = await fetch(`${BASE_URL}/api/v1/users`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });
    const data = await resp.json();

    if (resp.ok) {
      await signInUser(email, password);
      return data;
    } else {
      throw new Error(data.message || 'Failed to sign up');
    }
  } catch (error) {
    console.error('Error in signUpUser:', error);
    throw error;
  }
}

export async function signInUser(email, password) {
  try {
    const resp = await fetch(`${BASE_URL}/api/v1/users/sessions`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
      mode: 'cors',
    });

    const data = await resp.json();
    if (resp.ok) {
      return data.user;
    } else {
      throw new Error(data.message || 'Failed to sign in');
    }
  } catch (error) {
    console.error('Error in signInUser:', error);
    throw error;
  }
}

export async function signOutUser() {
  try {
    const resp = await fetch(`${BASE_URL}/api/v1/users/sessions`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (resp.ok) {
      return true;
    } else {
      throw new Error('Failed to sign out');
    }
  } catch (error) {
    console.error('Error in signOutUser:', error);
    throw error;
  }
}
