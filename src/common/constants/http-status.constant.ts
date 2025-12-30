import { StatusCodes } from "http-status-codes";

export const HTTP_STATUS = {
  // Success
  OK: StatusCodes.OK,
  CREATED: StatusCodes.CREATED,
  NO_CONTENT: StatusCodes.NO_CONTENT,

  // Client Errors
  BAD_REQUEST: StatusCodes.BAD_REQUEST,
  UNAUTHORIZED: StatusCodes.UNAUTHORIZED,
  FORBIDDEN: StatusCodes.FORBIDDEN,
  NOT_FOUND: StatusCodes.NOT_FOUND,
  CONFLICT: StatusCodes.CONFLICT,
  UNPROCESSABLE_ENTITY: StatusCodes.UNPROCESSABLE_ENTITY,
  TOO_MANY_REQUESTS: StatusCodes.TOO_MANY_REQUESTS,

  // Server Errors
  INTERNAL_SERVER_ERROR: StatusCodes.INTERNAL_SERVER_ERROR,
  SERVICE_UNAVAILABLE: StatusCodes.SERVICE_UNAVAILABLE,
} as const;
