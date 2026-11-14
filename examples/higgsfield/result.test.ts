import { describe, expect, it } from "vitest";
import { completedVideoUrl } from "./result";

describe("Higgsfield generation result", () => {
  it("returns the video URL only after completion", () => {
    expect(
      completedVideoUrl({
        status: "completed",
        video: { url: "https://cdn.example.test/video.mp4?signature=opaque" },
      }),
    ).toBe("https://cdn.example.test/video.mp4?signature=opaque");
  });

  it.each([
    "failed",
    "canceled",
    "cancelled",
    "nsfw",
    "moderated",
    "blocked",
    "queued",
    "in_progress",
    "unknown",
  ])("rejects %s even if a video URL is present", (status) => {
    expect(() =>
      completedVideoUrl({ status, video: { url: "https://cdn.example.test/video.mp4" } }),
    ).toThrow();
  });

  it.each([
    undefined,
    null,
    {},
    { status: "completed" },
    { status: "completed", video: { url: "not-a-url" } },
    { status: "completed", video: { url: "http://cdn.example.test/video.mp4" } },
    { status: "completed", video: { url: "https://user:secret@cdn.example.test/video.mp4" } },
  ])("rejects an invalid or unsafe result", (result) => {
    expect(() => completedVideoUrl(result)).toThrow();
  });
});
