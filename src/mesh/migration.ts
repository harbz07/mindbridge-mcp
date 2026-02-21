import { createHash, createHmac, randomUUID } from 'node:crypto';
import {
  AgentMigrationBundle,
  CreateMigrationBundleInput,
  MigrationVerificationResult
} from '../types.js';

type UnsignedBundle = Omit<AgentMigrationBundle, 'checksum' | 'signature'>;

function normalizeRecord(record: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(record).sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
  );
}

function canonicalizeBundle(bundle: UnsignedBundle): string {
  return JSON.stringify({
    version: bundle.version,
    bundleId: bundle.bundleId,
    agentId: bundle.agentId,
    sourceVesselId: bundle.sourceVesselId,
    targetVesselId: bundle.targetVesselId,
    createdAt: bundle.createdAt,
    expiresAt: bundle.expiresAt,
    stateFormat: bundle.stateFormat,
    state: bundle.state,
    capabilities: [...bundle.capabilities].sort((a, b) => a.localeCompare(b)),
    metadata: normalizeRecord(bundle.metadata)
  });
}

function checksum(payload: string): string {
  return createHash('sha256').update(payload).digest('hex');
}

export class MigrationBundleService {
  private readonly signingSecret?: string;

  constructor(signingSecret?: string) {
    this.signingSecret = signingSecret;
  }

  public createBundle(input: CreateMigrationBundleInput): AgentMigrationBundle {
    const now = new Date();
    const ttlSeconds = input.ttlSeconds ?? 900;
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

    const unsignedBundle: UnsignedBundle = {
      version: '1.0',
      bundleId: randomUUID(),
      agentId: input.agentId,
      sourceVesselId: input.sourceVesselId,
      targetVesselId: input.targetVesselId,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      stateFormat: input.stateFormat || 'json',
      state: input.state,
      capabilities: Array.from(new Set(input.capabilities || [])).sort((a, b) =>
        a.localeCompare(b)
      ),
      metadata: normalizeRecord(input.metadata || {})
    };

    const payload = canonicalizeBundle(unsignedBundle);
    const bundleChecksum = checksum(payload);
    const bundleSignature = this.signingSecret
      ? createHmac('sha256', this.signingSecret).update(payload).digest('hex')
      : undefined;

    return {
      ...unsignedBundle,
      checksum: bundleChecksum,
      signature: bundleSignature
    };
  }

  public encodeBundle(bundle: AgentMigrationBundle): string {
    const jsonBundle = JSON.stringify(bundle);
    return Buffer.from(jsonBundle, 'utf-8').toString('base64url');
  }

  public decodeBundle(bundle: string): AgentMigrationBundle {
    const trimmedBundle = bundle.trim();
    const bundleString = trimmedBundle.startsWith('{')
      ? trimmedBundle
      : Buffer.from(trimmedBundle, 'base64url').toString('utf-8');

    return JSON.parse(bundleString) as AgentMigrationBundle;
  }

  public verifyBundle(bundle: string, allowExpired = false): MigrationVerificationResult {
    const parsedBundle = this.decodeBundle(bundle);

    const unsignedBundle: UnsignedBundle = {
      version: parsedBundle.version,
      bundleId: parsedBundle.bundleId,
      agentId: parsedBundle.agentId,
      sourceVesselId: parsedBundle.sourceVesselId,
      targetVesselId: parsedBundle.targetVesselId,
      createdAt: parsedBundle.createdAt,
      expiresAt: parsedBundle.expiresAt,
      stateFormat: parsedBundle.stateFormat,
      state: parsedBundle.state,
      capabilities: parsedBundle.capabilities,
      metadata: parsedBundle.metadata
    };

    const payload = canonicalizeBundle(unsignedBundle);
    const expectedChecksum = checksum(payload);
    const checksumMatches = expectedChecksum === parsedBundle.checksum;

    const signatureRequired = Boolean(this.signingSecret);
    const signatureMatches = signatureRequired
      ? Boolean(parsedBundle.signature) &&
        createHmac('sha256', this.signingSecret || '')
          .update(payload)
          .digest('hex') === parsedBundle.signature
      : true;

    const expirationTimestamp = Date.parse(parsedBundle.expiresAt);
    const isExpired = !Number.isFinite(expirationTimestamp) || Date.now() > expirationTimestamp;

    const reasons: string[] = [];
    if (!checksumMatches) {
      reasons.push('Checksum mismatch');
    }
    if (signatureRequired && !signatureMatches) {
      reasons.push('Signature mismatch or missing signature');
    }
    if (!allowExpired && isExpired) {
      reasons.push('Bundle has expired');
    }

    return {
      valid: reasons.length === 0,
      checksumMatches,
      signatureMatches,
      signatureRequired,
      isExpired,
      reasons,
      bundle: parsedBundle
    };
  }
}
