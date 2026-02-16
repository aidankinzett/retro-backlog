import type { SQLiteDatabase } from 'expo-sqlite';
import {
  updateGameEnrichment,
  insertScreenshots,
  deleteScreenshotsByGame,
  type Game,
} from '@/services/database';
import { getGameDetails, getGameScreenshots } from '@/services/rawg';

/**
 * Enrich a single game with full RAWG details and screenshots.
 * Call this after inserting a game from Browse.
 */
export async function enrichGame(db: SQLiteDatabase, game: Game): Promise<void> {
  const slug = game.rawg_slug ?? game.rawg_id;
  if (!slug) return;

  const details = await getGameDetails(slug);

  await updateGameEnrichment(db, game.id, {
    metacritic: details.metacritic,
    rawg_rating: details.rating,
    release_date: details.released,
    background_image: details.background_image,
    developer: details.developers?.[0]?.name ?? null,
    publisher: details.publishers?.[0]?.name ?? null,
    description: details.description_raw ?? null,
    playtime: details.playtime,
    esrb_rating: details.esrb_rating?.name ?? null,
    website: details.website ?? null,
    metacritic_url: details.metacritic_url ?? null,
    rawg_id: details.id,
    genre: details.genres?.map((g) => g.name).join(', ') || null,
  });

  if (details.id) {
    const screenshotsRes = await getGameScreenshots(details.id);
    await deleteScreenshotsByGame(db, game.id);
    await insertScreenshots(
      db,
      screenshotsRes.results.map((s) => ({
        id: String(s.id),
        game_id: game.id,
        image_url: s.image,
        width: s.width,
        height: s.height,
      }))
    );
  }
}
