import { getClerkClientConfigError, isClerkClientConfigured } from "@/lib/clerk-env";

type ClerkRootProviderProps = {
  children: React.ReactNode;
};

function ClerkSetupBanner({ message }: { message: string }) {
  return (
    <div className="clerk-config-banner" role="alert">
      <strong>Clerk setup incomplete.</strong> {message}{" "}
      <a href="https://dashboard.clerk.com" target="_blank" rel="noreferrer">
        dashboard.clerk.com
      </a>
      . Profile save still works with <code>local-dev-user</code> when signed out.
    </div>
  );
}

/** Banners only — ClerkProvider lives in root layout. */
export function ClerkRootProvider({ children }: ClerkRootProviderProps) {
  const clientError = getClerkClientConfigError();

  if (!isClerkClientConfigured()) {
    return (
      <>
        <ClerkSetupBanner message={clientError ?? "Missing publishable key."} />
        {children}
      </>
    );
  }

  return (
    <>
      {!process.env.CLERK_SECRET_KEY?.trim() ? (
        <ClerkSetupBanner message="Add CLERK_SECRET_KEY for API sign-in and extension pairing." />
      ) : null}
      {children}
    </>
  );
}
