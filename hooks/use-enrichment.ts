import { useEffect, useRef } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import {
  getGamesNeedingEnrichment,
  updateGameEnrichment,
  insertScreenshots,
  deleteScreenshotsByGame,
} from '@/services/database';
import { getGameDetails, getGameScreenshots } from '@/services/rawg';

export function useEnrichment() {
  const db = useSQLiteContext();
  const runningRef = useRef(false);

  useEffect(() => {
    if (runningRef.current) return;

    const enrichBatch = async () => {
      runningRef.current = true;
      try {
        const games = await getGamesNeedingEnrichment(db);
        for (const game of games) {
          try {
            const slug = game.rawg_slug ?? game.rawg_id;
            if (!slug) continue;

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
              genre: details.genres?.map((g) => g.name).join(', ') ?? null,
            });

            // Fetch and store screenshots
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

            // Small delay between API calls to be respectful
            await new Promise((r) => setTimeout(r, 500));
          } catch (err) {
            console.error(`Enrichment failed for ${game.title}:`, err);
          }
        }
      } finally {
        runningRef.current = false;
      }
    };

    enrichBatch();

    // Re-run every 5 minutes
    const interval = setInterval(enrichBatch, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [db]);
}
