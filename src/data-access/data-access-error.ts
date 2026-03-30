export class DataAccessError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "DataAccessError";
    this.code = code;
  }
}

export function toDataAccessError(
  error: unknown,
  fallbackMessage: string
): DataAccessError {
  if (error instanceof DataAccessError) {
    return error;
  }

  if (error instanceof Error) {
    const supabaseCode =
      typeof (error as { code?: unknown }).code === "string"
        ? ((error as { code?: string }).code as string)
        : undefined;
    return new DataAccessError(error.message, supabaseCode);
  }

  if (typeof error === "object" && error !== null) {
    const maybeMessage = (error as { message?: unknown }).message;
    const maybeCode = (error as { code?: unknown }).code;
    return new DataAccessError(
      typeof maybeMessage === "string" ? maybeMessage : fallbackMessage,
      typeof maybeCode === "string" ? maybeCode : undefined
    );
  }

  return new DataAccessError(fallbackMessage);
}
