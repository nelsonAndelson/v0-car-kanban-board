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

  // Enhanced logging with more details
  console.group("🔍 Supabase Error Analysis");
  console.log("Raw error object:", error);
  console.log("Error type:", typeof error);
  console.log("Error constructor:", error?.constructor?.name);
  console.log("Error message:", errorObj?.message);
  console.log("Error code:", errorObj?.code);
  console.log("Error details:", errorObj?.details);
  console.log("Error hint:", errorObj?.hint);
  console.log(
    "Full error keys:",
    error && typeof error === "object"
      ? Object.keys(error)
      : "No keys - error is falsy"
  );
  console.groupEnd();

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
