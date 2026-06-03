export * from "./generated/api";
export * from "./generated/types";

// Both ./generated/api (zod schemas) and ./generated/types (TS interfaces)
// export these request/response body names. Consumers of this package want the
// runtime zod schemas, so explicitly re-export them from ./generated/api to
// resolve the `export *` ambiguity (TS2308).
export {
  CreateApplicationBody,
  LoginBody,
  RegisterBody,
  ResendOtpBody,
  ResendOtpResponse,
  UpdateApplicationBody,
  UploadDocumentBody,
  VerifyOtpBody,
} from "./generated/api";
