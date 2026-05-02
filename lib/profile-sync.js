/** Dispatched after profile/email/photo changes so layout chrome (navbar) refetches `/api/auth/me`. */
export const PROFILE_CHANGED_EVENT = "ttm-profile-changed";

export function notifyProfileChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PROFILE_CHANGED_EVENT));
}
