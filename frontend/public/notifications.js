export function pushSupport(env = window) {
  const ios =
    /iPad|iPhone|iPod/.test(env.navigator.userAgent) ||
    (env.navigator.platform === "MacIntel" && env.navigator.maxTouchPoints > 1);
  const installed =
    env.matchMedia("(display-mode: standalone)").matches ||
    env.navigator.standalone === true;
  if (ios && !installed)
    return {
      supported: false,
      message:
        "On iPhone or iPad, use Safari → Share → Add to Home Screen, then open Invent IO from its icon. Web notifications require iOS/iPadOS 16.4 or newer.",
    };
  if (!env.isSecureContext)
    return {
      supported: false,
      message: "Notifications require a secure HTTPS connection.",
    };
  if (
    !("serviceWorker" in env.navigator) ||
    !("PushManager" in env) ||
    !("Notification" in env)
  )
    return {
      supported: false,
      message:
        "This browser does not support web notifications. Try a supported, up-to-date browser.",
    };
  return { supported: true, message: "" };
}
export function decodeVapidKey(key) {
  const binary = atob(
    key.replace(/-/g, "+").replace(/_/g, "/") +
      "=".repeat((4 - (key.length % 4)) % 4),
  );
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}
export function createPush({ api, env = window } = {}) {
  let registration, publicKey;
  async function prepare() {
    const support = pushSupport(env);
    if (!support.supported) throw new Error(support.message);
    registration ||= await env.navigator.serviceWorker.register("./sw.js", {
      scope: "./",
      updateViaCache: "none",
    });
    registration = await env.navigator.serviceWorker.ready;
    const result = await api.request("/push/vapid-public-key");
    publicKey = result?.publicKey;
    if (!publicKey)
      throw new Error("Notifications are not configured on the server yet.");
    decodeVapidKey(publicKey);
    return { subscribed: !!(await registration.pushManager.getSubscription()) };
  }
  async function enable() {
    // Called only by the Allow button, never on page load.
    const permissionPromise = env.Notification.requestPermission();
    const permission = await permissionPromise;
    if (permission !== "granted")
      throw new Error(
        permission === "denied"
          ? "Notifications are blocked. You can enable them in your browser’s site settings."
          : "Notifications were not enabled. You can try again from Account.",
      );
    if (!registration || !publicKey) await prepare();
    let subscription = await registration.pushManager.getSubscription();
    const created = !subscription;
    subscription ||= await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: decodeVapidKey(publicKey),
    });
    const json = subscription.toJSON();
    try {
      await api.request("/push/subscriptions", {
        method: "POST",
        body: {
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        },
      });
    } catch (error) {
      if (created) await subscription.unsubscribe().catch(() => {});
      throw error;
    }
    return true;
  }
  async function disable() {
    if (!("serviceWorker" in env.navigator)) return;
    const reg =
      registration || (await env.navigator.serviceWorker.getRegistration("./"));
    const subscription = await reg?.pushManager.getSubscription();
    if (!subscription) return;
    // Stop delivery locally even if the API is offline; server prunes expired endpoints.
    await subscription.unsubscribe();
    await api.request("/push/subscriptions", {
      method: "DELETE",
      body: { endpoint: subscription.endpoint },
    });
  }
  return { prepare, enable, disable, support: () => pushSupport(env) };
}
