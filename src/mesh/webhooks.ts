import { MeshConfig, SendDiscordWebhookInput, WebhookDeliveryResult } from '../types.js';

const DEFAULT_ALLOWED_WEBHOOK_HOSTS = [
  'discord.com',
  'discordapp.com',
  'canary.discord.com',
  'ptb.discord.com'
];

function createAllowedHostSet(hosts: string[]): Set<string> {
  const normalizedHosts = hosts.map((host) => host.trim().toLowerCase()).filter(Boolean);
  const safeHosts = normalizedHosts.length > 0 ? normalizedHosts : DEFAULT_ALLOWED_WEBHOOK_HOSTS;
  return new Set(safeHosts);
}

function sanitizeWebhookLocation(url: URL): string {
  return `${url.origin}${url.pathname}`;
}

export class DiscordWebhookService {
  private readonly defaultWebhookUrl?: string;

  private readonly allowedHosts: Set<string>;

  constructor(config?: MeshConfig) {
    this.defaultWebhookUrl = config?.defaultDiscordWebhookUrl;
    this.allowedHosts = createAllowedHostSet(config?.webhookHostAllowlist || []);
  }

  private resolveWebhookUrl(inputWebhookUrl?: string | null): URL {
    const webhookUrl = inputWebhookUrl || this.defaultWebhookUrl;

    if (!webhookUrl) {
      throw new Error(
        'No webhook URL supplied. Provide webhookUrl or set DEFAULT_DISCORD_WEBHOOK_URL.'
      );
    }

    const parsedUrl = new URL(webhookUrl);
    if (parsedUrl.protocol !== 'https:') {
      throw new Error('Webhook URL must use HTTPS.');
    }

    if (!this.allowedHosts.has(parsedUrl.hostname.toLowerCase())) {
      throw new Error(
        `Webhook host "${parsedUrl.hostname}" is not allowed. Configure WEBHOOK_HOST_ALLOWLIST to permit it.`
      );
    }

    return parsedUrl;
  }

  public async sendMessage(input: SendDiscordWebhookInput): Promise<WebhookDeliveryResult> {
    const webhookUrl = this.resolveWebhookUrl(input.webhookUrl);
    const payload: Record<string, string> = {
      content: input.content
    };

    if (input.username) {
      payload.username = input.username;
    }

    if (input.threadName) {
      payload.thread_name = input.threadName;
    }

    const response = await fetch(webhookUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseBody = await response.text();
    if (!response.ok) {
      throw new Error(
        `Discord webhook failed (${response.status}): ${responseBody.slice(0, 500)}`
      );
    }

    return {
      ok: true,
      status: response.status,
      url: sanitizeWebhookLocation(webhookUrl),
      responseBody
    };
  }
}
