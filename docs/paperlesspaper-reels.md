# Reel handoff for iPhone

This fork adds a manual handoff for saved Instagram Reel drafts to Postiz v2.23.0.

1. Save an Instagram post containing one MP4 as a Postiz draft.
2. Open **Reels** in the menu, or the handoff link on a saved draft.
3. Scan its QR code on the iPhone and sign in to the same Postiz workspace.
4. Copy the post caption, prepare the video, then tap **Share or save video**.
5. Choose **Save Video** and select the video in Instagram. If Instagram is offered directly by iOS, it may also be used as a share target.
6. Add subtitles, music or stickers in Instagram, paste the caption, and save or publish there.

Instagram's publishing API does not expose the app's native draft editor. The
handoff does not create or synchronize native Instagram drafts. Postiz cannot
observe whether sharing resulted in an Instagram draft or a publication, so the
original Postiz draft remains unchanged. This release transfers the post caption,
not timed subtitle tracks or editable Instagram caption stickers.

## Access and implementation

The authenticated `/reels` and `/reels/:id` pages read organization-scoped drafts.
Only root posts with one MP4, state `DRAFT`, and an Instagram integration are
eligible. Stories, deleted integrations/posts and scheduled/published posts are
excluded. The API returns only the media URLs, caption and account labels.
QR codes contain the page URL, with no credentials; they are generated locally.
Media continues to use Postiz's existing upload hosting/access model.

File preparation and sharing are separate taps to preserve Safari's user
activation requirement. In-memory preparation is limited to 200 MiB; original
video and download fallbacks are available. Closing or cancelling the share sheet
never changes a post's state. Cross-origin storage must allow CORS for preparation;
otherwise users can open the original video.

## Development and deployment

Base: upstream tag `v2.23.0`, commit `1e4c8dd5c4f70c4d0abd01e23cc42d5b533d1ab9`.
Use Node 22 and pnpm 10.6.1. Run `pnpm install --frozen-lockfile`,
`pnpm run test:reels`, and `pnpm run build`. No Prisma schema changes are required.

The **Paperlesspaper image** workflow builds Linux AMD64 images tagged
`ghcr.io/paperlesspaper/postiz-app:reels-<full commit SHA>`. Deploy an exact tag;
preserve the existing environment, volumes and other Compose services.
Rollback by restoring the previous image reference and redeploying.

Tests cover media eligibility, organization scoping, caption copying, preparation,
size/MIME/network errors, share cancellation and unsupported sharing. The local
browser check uses a separate fixture backend and an existing sample MP4.
The actual iPhone Photos/Instagram share sheet needs a real-device acceptance test.
