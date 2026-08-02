export const AUDIT_LOGGER = Symbol("AUDIT_LOGGER");

/**
 * Every action that moves money or crosses a trust boundary (manual credit
 * grants, admin overrides) must be attributable after the fact — this is the
 * single write path for that trail (CLAUDE.md: "Audit logs" under Security).
 */
export interface IAuditLogger {
  log(params: {
    actorId: string | null;
    action: string;
    targetType: string;
    targetId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
}
