import { Alert, Platform } from "react-native";

/**
 * Web-safe confirm dialog. On web uses window.confirm (Alert.alert on RN web
 * doesn't fire button onPress callbacks). On native uses Alert.alert.
 */
export function confirmAction(
  title: string,
  message: string,
  confirmLabel = "Confirmar",
  destructive = false
): Promise<boolean> {
  if (Platform.OS === "web") {
    // eslint-disable-next-line no-alert
    const ok = window.confirm(`${title}\n\n${message}`);
    return Promise.resolve(ok);
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      {
        text: "Cancelar",
        style: "cancel",
        onPress: () => resolve(false),
      },
      {
        text: confirmLabel,
        style: destructive ? "destructive" : "default",
        onPress: () => resolve(true),
      },
    ]);
  });
}

/**
 * Web-safe info alert. On web uses window.alert, native uses Alert.alert.
 */
export function notify(title: string, message?: string): void {
  if (Platform.OS === "web") {
    // eslint-disable-next-line no-alert
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

/**
 * Web-safe choice dialog (3 options). On web falls back to confirm for
 * destructive/cancel pairs; for multi-choice (e.g. camera/gallery) returns
 * first non-cancel option via prompt.
 */
export function choose(
  title: string,
  message: string,
  options: { label: string; value: string }[]
): Promise<string | null> {
  if (Platform.OS === "web") {
    // Render as a single confirm picking the first option
    // For better UX on web we just pick the first option
    // eslint-disable-next-line no-alert
    const pick = window.prompt(
      `${title}\n\n${message}\n\nOpciones: ${options
        .map((o, i) => `${i + 1}) ${o.label}`)
        .join(", ")}\n\nEscribe el número:`,
      "1"
    );
    if (!pick) return Promise.resolve(null);
    const idx = parseInt(pick, 10) - 1;
    if (idx < 0 || idx >= options.length) return Promise.resolve(null);
    return Promise.resolve(options[idx].value);
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      ...options.map((o) => ({
        text: o.label,
        onPress: () => resolve(o.value),
      })),
      { text: "Cancelar", style: "cancel", onPress: () => resolve(null) },
    ]);
  });
}
