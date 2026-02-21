import { randomUUID } from 'node:crypto';
import {
  CreateForumPostInput,
  ForumPost,
  ListForumPostsInput,
  RegisterVesselInput,
  VesselRecord
} from '../types.js';

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );
}

function normalizeMetadata(metadata?: Record<string, string> | null): Record<string, string> {
  if (!metadata) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(metadata).sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
  );
}

export class AgentMeshStore {
  private readonly vessels: Map<string, VesselRecord>;

  private readonly forumPosts: ForumPost[];

  private readonly maxForumPosts: number;

  constructor(maxForumPosts = 500) {
    this.vessels = new Map();
    this.forumPosts = [];
    this.maxForumPosts = maxForumPosts;
  }

  public registerVessel(input: RegisterVesselInput): VesselRecord {
    const now = new Date().toISOString();
    const existing = this.vessels.get(input.vesselId);

    const vessel: VesselRecord = {
      vesselId: input.vesselId,
      endpoint: input.endpoint || undefined,
      region: input.region || undefined,
      capabilities: uniqueSorted(input.capabilities || []),
      maxAgents: input.maxAgents ?? undefined,
      metadata: normalizeMetadata(input.metadata),
      status: 'online',
      registeredAt: existing?.registeredAt || now,
      updatedAt: now
    };

    this.vessels.set(input.vesselId, vessel);
    return vessel;
  }

  public listVessels(includeOffline = true): VesselRecord[] {
    const vessels = Array.from(this.vessels.values())
      .filter((vessel) => includeOffline || vessel.status !== 'offline')
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    return vessels;
  }

  public createForumPost(input: CreateForumPostInput): ForumPost {
    const post: ForumPost = {
      postId: randomUUID(),
      agentId: input.agentId,
      vesselId: input.vesselId,
      title: input.title,
      body: input.body,
      channel: input.channel || 'general',
      tags: uniqueSorted(input.tags || []),
      createdAt: new Date().toISOString()
    };

    this.forumPosts.unshift(post);

    if (this.forumPosts.length > this.maxForumPosts) {
      this.forumPosts.length = this.maxForumPosts;
    }

    return post;
  }

  public listForumPosts(filters: ListForumPostsInput): ForumPost[] {
    const { channel, tag, limit } = filters;
    const normalizedTag = tag?.trim().toLowerCase();
    const resultLimit = limit || 25;

    return this.forumPosts
      .filter((post) => !channel || post.channel === channel)
      .filter(
        (post) =>
          !normalizedTag || post.tags.some((postTag) => postTag.toLowerCase() === normalizedTag)
      )
      .slice(0, resultLimit);
  }
}
