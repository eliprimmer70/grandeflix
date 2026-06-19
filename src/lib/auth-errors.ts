export function formatSignupError(message: string): {
  text: string;
  showSetupLink: boolean;
} {
  const lower = message.toLowerCase();
  if (
    lower.includes("rate limit") ||
    lower.includes("email rate") ||
    lower.includes("over_email_send_rate_limit")
  ) {
    return {
      text: "Too many signup attempts. Wait an hour or disable email confirmation in Supabase.",
      showSetupLink: true,
    };
  }
  return { text: message, showSetupLink: false };
}
