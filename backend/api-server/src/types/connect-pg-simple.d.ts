declare module "connect-pg-simple" {
  import type session from "express-session";

  interface ConnectPgSimpleOptions {
    pool?: unknown;
    conString?: string;
    tableName?: string;
    schemaName?: string;
    createTableIfMissing?: boolean;
    pruneSessionInterval?: number | false;
    errorLog?: (error: unknown) => void;
    disableTouch?: boolean;
    ttl?: number;
  }

  function connectPgSimple(
    sessionMiddleware: typeof session,
  ): new (options?: ConnectPgSimpleOptions) => session.Store;

  export default connectPgSimple;
}