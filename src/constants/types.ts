export type APIErrorResponse = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};
