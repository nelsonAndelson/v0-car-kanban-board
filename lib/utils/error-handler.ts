export interface AppError {
  message: string;
  code?: string;
  isTableMissing?: boolean;
  details?: Record<string, unknown>;
}

interface SupabaseErrorLike {
  message?: string;
  code?: string;
  details?: unknown;
  hint?: string;
  error_description?: string;
  msg?: string;
  status?: string | number;
}

export function handleSupabaseError(error: unknown): AppError {
  // Cast error for type safety
  const errorObj = error as SupabaseErrorLike;

  // Enhanced logging with more details (only in development)
  if (process.env.NODE_ENV === "development") {
    console.error("🔍 Supabase Error Analysis");
    console.error("Raw error object:", error);
    console.error("Error type:", typeof error);
    console.error("Error constructor:", error?.constructor?.name);
    console.error("Error message:", errorObj?.message);
    console.error("Error code:", errorObj?.code);
    console.error("Error details:", errorObj?.details);
    console.error("Error hint:", errorObj?.hint);
    console.error(
      "Full error keys:",
      error && typeof error === "object"
        ? Object.keys(error)
        : "No keys - error is falsy"
    );
  }

  // Handle null/undefined errors
  if (!error) {
    return {
      message: "An unknown error occurred (error object is null/undefined)",
      code: "NULL_ERROR",
      details: { originalError: error },
    };
  }

  // Handle string errors
  if (typeof error === "string") {
    return {
      message: error,
      code: "STRING_ERROR",
      details: { originalError: error },
    };
  }

  // Handle error objects
  const errorMessage =
    errorObj.message ||
    errorObj.error_description ||
    errorObj.msg ||
    "An unexpected error occurred";

  // Check for table missing errors with more comprehensive checking
  const isTableMissing =
    (typeof errorMessage === "string" &&
      (errorMessage.toLowerCase().includes("does not exist") ||
        errorMessage.toLowerCase().includes("relation") ||
        errorMessage.toLowerCase().includes("permission denied"))) ||
    errorObj.code === "42P01"; // PostgreSQL error code for undefined table

  return {
    message: errorMessage,
    code: errorObj.code || String(errorObj.status) || "UNKNOWN_CODE",
    isTableMissing,
    details: {
      originalError: error,
      errorKeys: error && typeof error === "object" ? Object.keys(error) : [],
    },
  };
}
