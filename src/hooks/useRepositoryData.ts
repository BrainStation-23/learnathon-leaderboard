
// This file is kept for backward compatibility
// It re-exports the new hook from the repository directory
import useRepositoryData from "./repository/useRepositoryData";
export default useRepositoryData;

// Re-export the types
export type { ProgressCallback } from "./repository/types";

// Re-export everything from the hook for backward compatibility
export * from "./repository/useRepositoryData";
