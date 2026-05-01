import { z } from 'zod';

export const WorkspaceKindSchema = z.enum(['personal', 'shared']);
export const WorkspaceRoleSchema = z.enum(['owner', 'editor']);

export type WorkspaceKind = z.infer<typeof WorkspaceKindSchema>;
export type WorkspaceRole = z.infer<typeof WorkspaceRoleSchema>;

export const CreateWorkspaceSchema = z.object({
  name: z.string().trim().min(1).max(80),
  kind: z.literal('shared'),
});

export const UpdateWorkspaceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
});

export const DeleteWorkspaceSchema = z.object({
  id: z.string().uuid(),
  confirmation: z.string(),
});

export const TransferOwnershipSchema = z.object({
  workspaceId: z.string().uuid(),
  toUserId: z.string().uuid(),
});

export const LeaveWorkspaceSchema = z.object({
  workspaceId: z.string().uuid(),
});
