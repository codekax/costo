/**
 * @deprecated Use `getWorkspaceContext` / `requireWorkspaceContext` from
 * `@/lib/workspace-context` instead. Re-exported here only to keep imports
 * working during migration; this file will be removed.
 */

export {
  getWorkspaceContext as getActiveWorkspace,
  setActiveWorkspaceCookie,
} from '@/lib/workspace-context';
