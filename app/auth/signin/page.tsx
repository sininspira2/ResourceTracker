import SignInForm from "./SignInForm";

// Ensure this page is always dynamically rendered
export const dynamic = "force-dynamic";

export default function SignInPage() {
  // This is a Server Component, so we can safely access process.env
  const isDevelopment = process.env.NODE_ENV === "development";

  return <SignInForm isDevelopment={isDevelopment} />;
}
