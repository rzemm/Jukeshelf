import { signInAnonymously } from "firebase/auth";
import { auth } from "@/lib/firebase";

export async function ensureAnonymousAuth() {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  const credential = await signInAnonymously(auth);
  return credential.user;
}
