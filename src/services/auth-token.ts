import { ENV } from "@/constants/env";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

let inMemoryToken: string | null = null;

export function getAuthToken() {
  return inMemoryToken;
}

export async function loadAuthToken() {
  if (Platform.OS === "web") {
    return inMemoryToken;
  }

  inMemoryToken = await SecureStore.getItemAsync(ENV.AUTH_TOKEN_KEY);
  return inMemoryToken;
}

export async function saveAuthToken(token: string) {
  inMemoryToken = token;

  if (Platform.OS !== "web") {
    await SecureStore.setItemAsync(ENV.AUTH_TOKEN_KEY, token, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }
}

export async function removeAuthToken() {
  inMemoryToken = null;

  if (Platform.OS !== "web") {
    await SecureStore.deleteItemAsync(ENV.AUTH_TOKEN_KEY);
  }
}
