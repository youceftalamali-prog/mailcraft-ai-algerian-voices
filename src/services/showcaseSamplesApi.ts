import type { ShowcaseAudioSample } from './adminStore';

type ShowcaseSamplesResponse = {
  success?: boolean;
  samples?: ShowcaseAudioSample[];
  message?: string;
};

async function readApiError(response: Response): Promise<string> {
  const payload = await response.json().catch(() => ({})) as { message?: string; error?: string };
  return payload.message || payload.error || `Request failed: ${response.status}`;
}

export async function loadShowcaseSamplesFromServer(): Promise<ShowcaseAudioSample[]> {
  const response = await fetch('/api/showcase-samples', {
    method: 'GET',
    credentials: 'same-origin',
  });
  if (!response.ok) throw new Error(await readApiError(response));
  const payload = await response.json() as ShowcaseSamplesResponse;
  if (!payload.success || !Array.isArray(payload.samples)) {
    throw new Error(payload.message || 'Invalid showcase samples response.');
  }
  return payload.samples;
}

/**
 * Synchronizes showcase metadata with the server, uploads only newly selected
 * audio files as binary data, and returns the canonical server URLs.
 * Existing recordings are preserved when their URL is already server-hosted.
 */
export async function saveShowcaseSamplesToServer(
  samples: ShowcaseAudioSample[],
): Promise<ShowcaseAudioSample[]> {
  const pendingUploads = samples.filter(
    (sample) => typeof sample.customAudioUrl === 'string' && sample.customAudioUrl.startsWith('data:audio/'),
  );

  const metadataSamples = samples.map(({ customAudioUrl: _audioUrl, ...sample }) => sample);
  const metadataResponse = await fetch('/api/admin/showcase-samples', {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ samples: metadataSamples }),
  });
  if (!metadataResponse.ok) throw new Error(await readApiError(metadataResponse));

  for (const sample of pendingUploads) {
    const dataUrl = sample.customAudioUrl as string;
    const blobResponse = await fetch(dataUrl);
    if (!blobResponse.ok) throw new Error('تعذر قراءة التسجيل الصوتي المحدد.');
    const audioBlob = await blobResponse.blob();
    if (!audioBlob.size || audioBlob.size > 5 * 1024 * 1024) {
      throw new Error('حجم ملف الصوت يجب ألا يتجاوز 5 ميغابايت.');
    }

    const declaredMime = dataUrl.match(/^data:(audio\/[a-z0-9.+-]+)/i)?.[1]?.toLowerCase();
    const mimeType = audioBlob.type.startsWith('audio/')
      ? audioBlob.type
      : declaredMime || 'audio/wav';
    const uploadResponse = await fetch(
      `/api/admin/showcase-samples/${encodeURIComponent(sample.id)}/audio`,
      {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': mimeType },
        body: audioBlob,
      },
    );
    if (!uploadResponse.ok) throw new Error(await readApiError(uploadResponse));
  }

  return loadShowcaseSamplesFromServer();
}
