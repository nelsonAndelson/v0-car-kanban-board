export interface AppError {
  message: string
  code?: string
  isTableMissing?: boolean
  details?: any
}

export function handleSupabaseError(error: any): AppError {
  // Enhanced logging with more details
  console.group("🔍 Supabase Error Analysis")
  console.log("Raw error object:", error)
  console.log("Error type:", typeof error)
  console.log("Error constructor:", error?.constructor?.name)
  console.log("Error message:", error?.message)
  console.log("Error code:", error?.code)
  console.log("Error details:", error?.details)
  console.log("Error hint:", error?.hint)
  console.log("Full error keys:", error ? Object.keys(error) : "No keys - error is falsy")
  console.groupEnd()

  // Handle null/undefined errors
  if (!error) {
    return {
      message: "An unknown error occurred (error object is null/undefined)",
      code: "NULL_ERROR",
      details: { originalError: error },
    }
  }

  // Handle string errors
  if (typeof error === "string") {
    return {
      message: error,
      code: "STRING_ERROR",
      details: { originalError: error },
    }
  }

  // Handle error objects
  const errorMessage = error.message || error.error_description || error.msg || "An unexpected error occurred"

  // Check for table missing errors with more comprehensive checking
  const isTableMissing =
    (typeof errorMessage === "string" &&
      (errorMessage.toLowerCase().includes("does not exist") ||
        errorMessage.toLowerCase().includes("relation") ||
        errorMessage.toLowerCase().includes("permission denied"))) ||
    error.code === "42P01" // PostgreSQL error code for undefined table

  return {
    message: errorMessage,
    code: error.code || error.status || "UNKNOWN_CODE",
    isTableMissing,
    details: {
      originalError: error,
      errorKeys: Object.keys(error),
    },
  }
}
