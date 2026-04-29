export type AssetResolverFetch = typeof globalThis.fetch;

export type AssetResolutionStatus = "ready" | "skipped" | "missing" | "failed";

export type AssetResolutionErrorCode =
  | "fetch_unavailable"
  | "timeout"
  | "network_error"
  | "invalid_response";

export interface AssetResolverOptions {
  kind: "avatar";
  sourceUrl: string | null;
  fallbackUrl: string | null;
  fetchRemoteAssets: boolean;
  requestTimeoutMs: number;
  fetch?: AssetResolverFetch;
}

export interface ResolvedAssetReference {
  kind: "avatar";
  sourceUrl: string | null;
  fallbackUrl: string | null;
  resolvedUrl: string | null;
  mediaType: string | null;
  status: AssetResolutionStatus;
  errorCode: AssetResolutionErrorCode | null;
}

interface AssetFetchSuccess {
  mediaType: string;
  resolvedUrl: string;
}

interface AssetFetchFailure {
  errorCode: AssetResolutionErrorCode;
}

export async function resolveAssetReference(
  options: AssetResolverOptions,
): Promise<ResolvedAssetReference> {
  const candidateUrls = collectCandidateUrls(options.sourceUrl, options.fallbackUrl);

  if (candidateUrls.length === 0) {
    return {
      kind: options.kind,
      sourceUrl: options.sourceUrl,
      fallbackUrl: options.fallbackUrl,
      resolvedUrl: null,
      mediaType: null,
      status: "missing",
      errorCode: null,
    };
  }

  let skippedCandidate: ResolvedAssetReference | null = null;
  let lastFailure: AssetFetchFailure | null = null;

  for (const candidateUrl of candidateUrls) {
    if (!isRemoteUrl(candidateUrl)) {
      return {
        kind: options.kind,
        sourceUrl: options.sourceUrl,
        fallbackUrl: options.fallbackUrl,
        resolvedUrl: candidateUrl,
        mediaType: getPassthroughMediaType(candidateUrl),
        status: "ready",
        errorCode: null,
      };
    }

    if (!options.fetchRemoteAssets) {
      skippedCandidate ??= {
        kind: options.kind,
        sourceUrl: options.sourceUrl,
        fallbackUrl: options.fallbackUrl,
        resolvedUrl: candidateUrl,
        mediaType: null,
        status: "skipped",
        errorCode: null,
      };
      continue;
    }

    if (options.fetch === undefined) {
      lastFailure = { errorCode: "fetch_unavailable" };
      continue;
    }

    const fetchedAsset = await fetchAssetAsDataUrl(candidateUrl, options.fetch, options.requestTimeoutMs);

    if ("errorCode" in fetchedAsset) {
      lastFailure = fetchedAsset;
      continue;
    }

    return {
      kind: options.kind,
      sourceUrl: options.sourceUrl,
      fallbackUrl: options.fallbackUrl,
      resolvedUrl: fetchedAsset.resolvedUrl,
      mediaType: fetchedAsset.mediaType,
      status: "ready",
      errorCode: null,
    };
  }

  if (skippedCandidate !== null) {
    return skippedCandidate;
  }

  return {
    kind: options.kind,
    sourceUrl: options.sourceUrl,
    fallbackUrl: options.fallbackUrl,
    resolvedUrl: null,
    mediaType: null,
    status: lastFailure === null ? "missing" : "failed",
    errorCode: lastFailure?.errorCode ?? null,
  };
}

function collectCandidateUrls(
  sourceUrl: string | null,
  fallbackUrl: string | null,
): string[] {
  const candidateUrls: string[] = [];

  if (sourceUrl !== null) {
    candidateUrls.push(sourceUrl);
  }

  if (fallbackUrl !== null && fallbackUrl !== sourceUrl) {
    candidateUrls.push(fallbackUrl);
  }

  return candidateUrls;
}

function isRemoteUrl(url: string): boolean {
  const protocol = new URL(url).protocol;

  return protocol === "http:" || protocol === "https:";
}

function getPassthroughMediaType(url: string): string | null {
  if (!url.startsWith("data:")) {
    return null;
  }

  const match = /^data:([^;,]+)?[;,]/u.exec(url);
  return match?.[1] ?? null;
}

async function fetchAssetAsDataUrl(
  url: string,
  fetchImplementation: AssetResolverFetch,
  requestTimeoutMs: number,
): Promise<AssetFetchSuccess | AssetFetchFailure> {
  const abortController = new AbortController();
  const timeoutHandle = setTimeout(() => abortController.abort(), requestTimeoutMs);

  try {
    const response = await fetchImplementation(url, {
      signal: abortController.signal,
    });

    if (!response.ok) {
      return { errorCode: "invalid_response" };
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const mediaType = getResponseMediaType(response.headers.get("content-type"));

    return {
      mediaType,
      resolvedUrl: `data:${mediaType};base64,${buffer.toString("base64")}`,
    };
  } catch (error) {
    return {
      errorCode: isAbortError(error) ? "timeout" : "network_error",
    };
  } finally {
    clearTimeout(timeoutHandle);
  }
}

function getResponseMediaType(contentTypeHeader: string | null): string {
  const mediaType = contentTypeHeader?.split(";", 1)[0]?.trim();

  return mediaType === undefined || mediaType.length === 0
    ? "application/octet-stream"
    : mediaType;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}
