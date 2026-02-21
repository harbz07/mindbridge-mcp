import { ProviderFactory, REASONING_MODELS } from './providers/index.js';
import { loadConfig } from './config.js';
import {
  CreateForumPostSchema,
  CreateMigrationBundleSchema,
  GetSecondOpinionSchema,
  ListForumPostsSchema,
  RegisterVesselSchema,
  SendDiscordWebhookSchema,
  VerifyMigrationBundleSchema,
  WebhookDeliveryResult
} from './types.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AgentMeshStore, DiscordWebhookService, MigrationBundleService } from './mesh/index.js';

class MindBridgeServer extends McpServer {
  private providerFactory: ProviderFactory;

  private meshStore: AgentMeshStore;

  private migrationBundleService: MigrationBundleService;

  private discordWebhookService: DiscordWebhookService;

  constructor() {
    super({
      name: 'mindbridge',
      version: '1.2.0'
    }, {
      capabilities: {
        tools: {}
      }
    });

    const config = loadConfig();
    this.providerFactory = new ProviderFactory(config);
    this.meshStore = new AgentMeshStore();
    this.migrationBundleService = new MigrationBundleService(config.mesh?.migrationSigningSecret);
    this.discordWebhookService = new DiscordWebhookService(config.mesh);

    // Register tools
    this.registerTools();
  }

  private toJsonResponse(payload: unknown): { content: { type: 'text'; text: string }[] } {
    return {
      content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }]
    };
  }

  private toErrorResponse(error: unknown): {
    content: { type: 'text'; text: string }[];
    isError: true;
  } {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`
        }
      ],
      isError: true
    };
  }

  private async broadcastForumPost(
    postTitle: string,
    postBody: string,
    agentId: string,
    vesselId: string,
    channel: string,
    webhookUrl?: string | null,
    threadName?: string | null
  ): Promise<WebhookDeliveryResult> {
    const content = [
      `**[${channel.toUpperCase()}] ${postTitle}**`,
      postBody,
      '',
      `Agent: \`${agentId}\``,
      `Vessel: \`${vesselId}\``
    ].join('\n');

    return this.discordWebhookService.sendMessage({
      webhookUrl,
      content,
      username: 'MindBridge Agent Forum',
      threadName
    });
  }

  private registerTools(): void {
    // Register getSecondOpinion tool
    this.tool('getSecondOpinion',
      'Get responses from various LLM providers',
      GetSecondOpinionSchema.shape,
      async (params) => {
        try {
          // Validate provider exists
          const providerName = params.provider.toLowerCase();
          if (!this.providerFactory.hasProvider(providerName)) {
            const availableProviders = this.providerFactory.getAvailableProviders();
            throw new Error(
              `Provider "${params.provider}" not configured. Available providers: ${availableProviders.join(', ')}`
            );
          }

          const provider = this.providerFactory.getProvider(providerName)!;

          // Validate model exists for provider
          if (!provider.isValidModel(params.model)) {
            const availableModels = provider.getAvailableModels();
            throw new Error(
              `Model "${params.model}" not found for provider "${params.provider}". Available models: ${availableModels.join(', ')}`
            );
          }

          // Check reasoning effort compatibility
          if (params.reasoning_effort && !provider.supportsReasoningEffort()) {
            console.warn(
              `Warning: Provider "${params.provider}" does not support reasoning_effort parameter. It will be ignored.`
            );
          }

          // Get response from provider
          const result = await provider.getResponse(params);

          if (result.isError) {
            return {
              content: [{ type: 'text', text: `Error: ${result.content[0].text}` }],
              isError: true
            };
          }

          return {
            content: result.content
          };
        } catch (error) {
          return this.toErrorResponse(error);
        }
      }
    );

    // Register listProviders tool
    this.tool('listProviders',
      'List all configured LLM providers and their available models',
      {},
      async () => {
        try {
          const providers = this.providerFactory.getAvailableProviders();
          const result: Record<string, {
            models: string[];
            supportsReasoning: boolean;
          }> = {};

          for (const provider of providers) {
            result[provider] = {
              models: this.providerFactory.getAvailableModelsForProvider(provider),
              supportsReasoning: this.providerFactory.supportsReasoningEffort(provider)
            };
          }

          return this.toJsonResponse(result);
        } catch (error) {
          return this.toErrorResponse(error);
        }
      }
    );

    // Register listReasoningModels tool
    this.tool('listReasoningModels',
      'List all available models that support reasoning capabilities',
      {},
      async () => {
        try {
          return this.toJsonResponse({
            models: REASONING_MODELS,
            description:
              'These models are specifically optimized for reasoning tasks and support the reasoning_effort parameter.'
          });
        } catch (error) {
          return this.toErrorResponse(error);
        }
      }
    );

    this.tool(
      'registerVessel',
      'Register or update a vessel for agent migration routing',
      RegisterVesselSchema.shape,
      async (params) => {
        try {
          const vessel = this.meshStore.registerVessel(params);
          return this.toJsonResponse(vessel);
        } catch (error) {
          return this.toErrorResponse(error);
        }
      }
    );

    this.tool(
      'listVessels',
      'List registered vessels and their capabilities',
      {},
      async () => {
        try {
          return this.toJsonResponse({
            vessels: this.meshStore.listVessels()
          });
        } catch (error) {
          return this.toErrorResponse(error);
        }
      }
    );

    this.tool(
      'createMigrationBundle',
      'Create a signed migration package for moving an agent',
      CreateMigrationBundleSchema.shape,
      async (params) => {
        try {
          const bundle = this.migrationBundleService.createBundle(params);
          const encodedBundle = this.migrationBundleService.encodeBundle(bundle);
          return this.toJsonResponse({
            bundle,
            encodedBundle
          });
        } catch (error) {
          return this.toErrorResponse(error);
        }
      }
    );

    this.tool(
      'verifyMigrationBundle',
      'Verify migration bundle checksum, signature, and TTL',
      VerifyMigrationBundleSchema.shape,
      async (params) => {
        try {
          const verification = this.migrationBundleService.verifyBundle(
            params.bundle,
            params.allowExpired ?? false
          );
          return this.toJsonResponse(verification);
        } catch (error) {
          return this.toErrorResponse(error);
        }
      }
    );

    this.tool(
      'postAgentForumUpdate',
      'Create an agent forum post and optionally fan out to Discord',
      CreateForumPostSchema.shape,
      async (params) => {
        try {
          const post = this.meshStore.createForumPost(params);
          let discordDelivery: WebhookDeliveryResult | undefined;

          if (params.broadcastToDiscord) {
            try {
              discordDelivery = await this.broadcastForumPost(
                post.title,
                post.body,
                post.agentId,
                post.vesselId,
                post.channel,
                params.discordWebhookUrl,
                params.discordThreadName
              );
            } catch (error) {
              discordDelivery = {
                ok: false,
                status: 0,
                url: params.discordWebhookUrl || 'DEFAULT_DISCORD_WEBHOOK_URL',
                responseBody:
                  error instanceof Error ? error.message : 'Unknown Discord delivery error'
              };
            }
          }

          return this.toJsonResponse({
            post,
            discordDelivery
          });
        } catch (error) {
          return this.toErrorResponse(error);
        }
      }
    );

    this.tool(
      'listAgentForumUpdates',
      'List recent agent forum updates with filters',
      ListForumPostsSchema.shape,
      async (params) => {
        try {
          const posts = this.meshStore.listForumPosts(params);
          return this.toJsonResponse({
            count: posts.length,
            posts
          });
        } catch (error) {
          return this.toErrorResponse(error);
        }
      }
    );

    this.tool(
      'sendDiscordWebhook',
      'Send a Discord webhook message with host allowlist checks',
      SendDiscordWebhookSchema.shape,
      async (params) => {
        try {
          const delivery = await this.discordWebhookService.sendMessage(params);
          return this.toJsonResponse(delivery);
        } catch (error) {
          return this.toErrorResponse(error);
        }
      }
    );
  }
}

export default MindBridgeServer;
