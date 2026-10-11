/** Demo salon OTP: any 6 digits. No SMS is sent. */
export function isValidDemoOtp(code: string) {
  return /^\d{6}$/.test(code.trim());
}

/** Platform admin has no roles in MVP; a static demo enter is enough. */
export function canEnterAdminDemo() {
  return true;
}
