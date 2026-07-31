import { redirect } from "next/navigation";

/**
 * Root page — redirects to the login screen.
 * The login page handles redirecting authenticated users to their dashboard.
 */
export default function RootPage() {
  redirect("/login");
}
