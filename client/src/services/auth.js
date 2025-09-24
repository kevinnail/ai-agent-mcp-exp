import { signInUser, signOutUser, signUpUser } from './fetch-auth.js';

export async function authUser(email, password, type) {
  if (type === 'sign-up') {
    return await signUpUser(email, password);
  } else {
    return await signInUser(email, password);
  }
}

export async function signOut() {
  await signOutUser();
}
