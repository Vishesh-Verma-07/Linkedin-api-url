export class VoyagerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class AuthRedirectError extends VoyagerError {}

export class UnexpectedHtmlError extends VoyagerError {}

export function isSessionFailure(
  err: unknown,
): err is AuthRedirectError | UnexpectedHtmlError {
  return err instanceof AuthRedirectError || err instanceof UnexpectedHtmlError;
}
