import { z } from 'zod';

// Provider types
export const LLMProvider = z.enum([
  'openai',
  'anthropic',
  'deepseek',
  'google',
  'openrouter',
  'ollama',
  'openaiCompatible'
]);
export type LLMProvider = z.infer<typeof LLMProvider>;

// Input schema for the getSecondOpinion tool
export const GetSecondOpinionSchema = z.object({
  prompt: z.string().min(1),
  provider: LLMProvider,
  model: z.string().min(1),
  systemPrompt: z.string().optional().nullable(),
  temperature: z.number().min(0).max(1).optional(),
  maxTokens: z.number().positive().optional().default(1024),
  reasoning_effort: z.union([ // Primarily for OpenAI o-series
    z.literal('low'),
    z.literal('medium'),
    z.literal('high')
  ]).optional().nullable(),
  // Add other potential parameters if needed based on updated APIs
  top_p: z.number().min(0).max(1).optional(),
  top_k: z.number().positive().optional(),
  stop_sequences: z.array(z.string()).optional(),
  stream: z.boolean().optional(), // For Google Gemini
  frequency_penalty: z.number().min(-2.0).max(2.0).optional(), // For OpenAI
  presence_penalty: z.number().min(-2.0).max(2.0).optional() // For OpenAI
});

export type GetSecondOpinionInput = z.infer<typeof GetSecondOpinionSchema>;

// Configuration interfaces for each provider
export interface OpenAIConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface AnthropicConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface DeepSeekConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface GoogleConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface OpenRouterConfig {
  apiKey: string;
}

export interface OllamaConfig {
  baseUrl: string;
}

export interface OpenAICompatibleConfig {
  apiKey?: string; // Optional: Some services don't require an API key
  baseUrl: string;
  availableModels?: string[];
}

export interface MeshConfig {
  migrationSigningSecret?: string;
  defaultDiscordWebhookUrl?: string;
  webhookHostAllowlist: string[];
}

// Server configuration interface
export interface ServerConfig {
  openai?: OpenAIConfig;
  anthropic?: AnthropicConfig;
  deepseek?: DeepSeekConfig;
  google?: GoogleConfig;
  openrouter?: OpenRouterConfig;
  ollama?: OllamaConfig;
  openaiCompatible?: OpenAICompatibleConfig;
  mesh?: MeshConfig;
}

export const VesselStatusSchema = z.enum(['online', 'degraded', 'offline', 'maintenance']);
export type VesselStatus = z.infer<typeof VesselStatusSchema>;

export const ForumChannelSchema = z.enum(['general', 'ops', 'research', 'alerts']);
export type ForumChannel = z.infer<typeof ForumChannelSchema>;

export const RegisterVesselSchema = z.object({
  vesselId: z.string().min(1),
  endpoint: z.string().url().optional().nullable(),
  region: z.string().min(1).optional().nullable(),
  capabilities: z.array(z.string().min(1)).max(64).optional(),
  maxAgents: z.number().int().positive().optional().nullable(),
  metadata: z.record(z.string(), z.string()).optional().nullable()
});
export type RegisterVesselInput = z.infer<typeof RegisterVesselSchema>;

export const CreateMigrationBundleSchema = z.object({
  agentId: z.string().min(1),
  sourceVesselId: z.string().min(1),
  targetVesselId: z.string().min(1),
  state: z.string().min(1),
  stateFormat: z.enum(['json', 'yaml', 'text']).optional(),
  capabilities: z.array(z.string().min(1)).max(128).optional(),
  ttlSeconds: z.number().int().min(30).max(86400).optional(),
  metadata: z.record(z.string(), z.string()).optional().nullable()
});
export type CreateMigrationBundleInput = z.infer<typeof CreateMigrationBundleSchema>;

export const VerifyMigrationBundleSchema = z.object({
  bundle: z.string().min(1),
  allowExpired: z.boolean().optional()
});
export type VerifyMigrationBundleInput = z.infer<typeof VerifyMigrationBundleSchema>;

export const CreateForumPostSchema = z.object({
  agentId: z.string().min(1),
  vesselId: z.string().min(1),
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(5000),
  channel: ForumChannelSchema.optional(),
  tags: z.array(z.string().min(1)).max(20).optional(),
  broadcastToDiscord: z.boolean().optional(),
  discordWebhookUrl: z.string().url().optional().nullable(),
  discordThreadName: z.string().min(1).max(100).optional().nullable()
});
export type CreateForumPostInput = z.infer<typeof CreateForumPostSchema>;

export const ListForumPostsSchema = z.object({
  channel: ForumChannelSchema.optional(),
  tag: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional()
});
export type ListForumPostsInput = z.infer<typeof ListForumPostsSchema>;

export const SendDiscordWebhookSchema = z.object({
  webhookUrl: z.string().url().optional().nullable(),
  content: z.string().min(1).max(2000),
  username: z.string().max(80).optional().nullable(),
  threadName: z.string().min(1).max(100).optional().nullable()
});
export type SendDiscordWebhookInput = z.infer<typeof SendDiscordWebhookSchema>;

export interface VesselRecord {
  vesselId: string;
  endpoint?: string;
  region?: string;
  capabilities: string[];
  maxAgents?: number;
  metadata: Record<string, string>;
  status: VesselStatus;
  registeredAt: string;
  updatedAt: string;
}

export interface AgentMigrationBundle {
  version: '1.0';
  bundleId: string;
  agentId: string;
  sourceVesselId: string;
  targetVesselId: string;
  createdAt: string;
  expiresAt: string;
  stateFormat: 'json' | 'yaml' | 'text';
  state: string;
  capabilities: string[];
  metadata: Record<string, string>;
  checksum: string;
  signature?: string;
}

export interface MigrationVerificationResult {
  valid: boolean;
  checksumMatches: boolean;
  signatureMatches: boolean;
  signatureRequired: boolean;
  isExpired: boolean;
  reasons: string[];
  bundle: AgentMigrationBundle;
}

export interface ForumPost {
  postId: string;
  agentId: string;
  vesselId: string;
  title: string;
  body: string;
  channel: ForumChannel;
  tags: string[];
  createdAt: string;
}

export interface WebhookDeliveryResult {
  ok: boolean;
  status: number;
  url: string;
  responseBody: string;
}

// Error types
export interface LLMError {
  isError: true;
  content: { type: 'text'; text: string }[];
}

// Response types
export interface LLMResponse {
  isError: false;
  content: { type: 'text'; text: string }[];
}