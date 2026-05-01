import { z } from 'zod';

export const SendInvitationSchema = z.object({
  workspaceId: z.string().uuid(),
  email: z.string().email().toLowerCase().trim(),
  role: z.literal('editor'),
});

export const AcceptInvitationSchema = z.object({
  token: z.string().uuid(),
});

export const RevokeInvitationSchema = z.object({
  invitationId: z.string().uuid(),
});

export const ChangeMemberRoleSchema = z.object({
  workspaceId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(['owner', 'editor']),
});

export const RemoveMemberSchema = z.object({
  workspaceId: z.string().uuid(),
  userId: z.string().uuid(),
});
