import "dotenv/config";

const youtubeSearchUrl = "https://www.googleapis.com/youtube/v3/search";
const maximumResultsPerChannel = 10;

const getApprovedChannelIds = () =>
  (process.env.YOUTUBE_APPROVED_CHANNEL_IDS ?? "")
    .split(",")
    .map((channelId) => channelId.trim())
    .filter(Boolean);

const createYouTubeApiUrl = (channelId) => {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY ontbreekt in de environment variables.");
  }

  const searchParams = new URLSearchParams({
    key: apiKey,
    channelId,
    part: "snippet",
    type: "video",
    order: "date",
    maxResults: String(maximumResultsPerChannel),
  });

  return `${youtubeSearchUrl}?${searchParams}`;
};

const fetchVideosForChannel = async (channelId) => {
  const response = await fetch(createYouTubeApiUrl(channelId));
  const responseData = await response.json();

  if (!response.ok) {
    const reason = responseData.error?.message ?? "Onbekende YouTube API-fout.";
    throw new Error(`YouTube API-fout: ${reason}`);
  }

  return responseData.items.map(({ id, snippet }) => ({
    id: id.videoId,
    title: snippet.title,
    channelName: snippet.channelTitle,
    channelId: snippet.channelId,
    thumbnailUrl: snippet.thumbnails.medium?.url ?? snippet.thumbnails.default.url,
    publishedAt: snippet.publishedAt,
  }));
};

export const fetchApprovedVideos = async () => {
  const approvedChannelIds = getApprovedChannelIds();

  if (approvedChannelIds.length === 0) {
    throw new Error(
      "YOUTUBE_APPROVED_CHANNEL_IDS bevat nog geen goedgekeurde channels.",
    );
  }

  const videosPerChannel = await Promise.all(
    approvedChannelIds.map(fetchVideosForChannel),
  );

  return videosPerChannel.flat();
};