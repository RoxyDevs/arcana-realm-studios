// src/music/music.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MusicService {
  constructor(private readonly prisma: PrismaService) {}

  // =====================================================
  // =============== PERFIL DE SALA ======================
  // =====================================================

  /**
   * Obtiene o crea el perfil musical de una sala
   * (usado por el bot en !fillplaylist)
   */
  async getOrCreateProfile(roomId: string) {
    const existing = await this.prisma.roomMusicProfile.findUnique({
      where: { roomId },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.roomMusicProfile.create({
      data: {
        roomId,
        favoriteGenres: [],
        skippedTracks: [],
        playedTracks: [],
      },
    });
  }

  async getRoomProfile(roomId: string) {
    const profile = await this.prisma.roomMusicProfile.findUnique({
      where: { roomId },
    });

    if (!profile) {
      throw new NotFoundException('Perfil musical no encontrado para esta sala.');
    }

    return profile;
  }

  // =====================================================
  // =============== REGISTRO DE CANCIONES ===============
  // =====================================================

  async recordTrack(
    roomId: string,
    trackTitle: string,
    genre?: string,
    artist?: string,
    bpm?: number,
  ) {
    const profile = await this.getOrCreateProfile(roomId);

    // Guardamos las últimas 100 canciones reproducidas
    const playedTracks = [...profile.playedTracks, trackTitle].slice(-100);

    // Actualizamos géneros favoritos
    let favoriteGenres = profile.favoriteGenres;
    if (genre) {
      favoriteGenres = Array.from(new Set([...favoriteGenres, genre]));
    }

    return this.prisma.roomMusicProfile.update({
      where: { roomId },
      data: {
        playedTracks,
        favoriteGenres,
        lastActiveAt: new Date(),
      },
    });
  }

  // =====================================================
  // =============== FILL PLAYLIST =======================
  // =====================================================

  async fillPlaylist(roomId: string, recentTracks: string[] = [], mood?: string) {
    const profile = await this.getOrCreateProfile(roomId);

    const recommendations = this.buildRecommendations(
      recentTracks.length > 0 ? recentTracks : profile.playedTracks.slice(-10),
      profile.favoriteGenres,
      mood,
    );

    await this.prisma.roomMusicProfile.update({
      where: { roomId },
      data: { lastActiveAt: new Date() },
    });

    return {
      success: true,
      roomId,
      mood: mood ?? 'default',
      recommendations,
      action: 'FILL_PLAYLIST',
    };
  }

  // =====================================================
  // =================== AUTO DJ =========================
  // =====================================================

  async autoDj(roomId: string, mood?: string) {
    const profile = await this.getOrCreateProfile(roomId);

    const songs = this.buildRecommendations(
      profile.playedTracks.slice(-10),
      profile.favoriteGenres,
      mood,
    );

    return {
      success: true,
      roomId,
      mood: mood ?? 'auto',
      autoDj: true,
      queue: songs.slice(0, 20),
      profile,
      action: 'AUTO_DJ',
    };
  }

  // =====================================================
  // =============== RECOMENDACIONES =====================
  // =====================================================

  private buildRecommendations(
    recentTracks: string[],
    favoriteGenres: string[],
    mood?: string,
  ): string[] {
    const basePool = this.recommendationPool();
    const moodFilter = mood?.toLowerCase();

    let candidates = basePool;

    // Filtrar por mood si existe
    if (moodFilter) {
      candidates = basePool.filter((track) =>
        track.moods.some((m) => m.includes(moodFilter)),
      );
    }

    const selected = new Set<string>();
    const results: string[] = [];

    const addTrack = (track: { title: string }) => {
      if (results.length >= 30) return;
      if (selected.has(track.title)) return;
      selected.add(track.title);
      results.push(track.title);
    };

    // Priorizar canciones recientes similares
    recentTracks.slice(-10).forEach((recent) => {
      candidates
        .filter((track) =>
          track.title.toLowerCase().includes(recent.toLowerCase()),
        )
        .slice(0, 2)
        .forEach(addTrack);
    });

    // Priorizar por géneros favoritos
    favoriteGenres.forEach((genre) => {
      candidates
        .filter((track) =>
          track.genre.toLowerCase().includes(genre.toLowerCase()),
        )
        .slice(0, 3)
        .forEach(addTrack);
    });

    // Rellenar con el pool restante
    candidates.slice(0, 30).forEach(addTrack);

    return results.slice(0, 25);
  }

  // =====================================================
  // =============== POOL DE CANCIONES ===================
  // =====================================================

  private recommendationPool() {
    return [
      { title: 'Breaking Benjamin - The Diary of Jane', genre: 'Rock', moods: ['party', 'rock'] },
      { title: 'Skillet - Monster', genre: 'Rock', moods: ['party', 'energetic'] },
      { title: 'Papa Roach - Last Resort', genre: 'Rock', moods: ['party', 'angry'] },
      { title: 'Disturbed - Down with the Sickness', genre: 'Metal', moods: ['angry', 'party'] },
      { title: 'Linkin Park - Numb', genre: 'Nu Metal', moods: ['emotional', 'chill'] },
      { title: 'Evanescence - Bring Me to Life', genre: 'Gothic Rock', moods: ['emotional', 'gothic'] },
      { title: 'The Weeknd - Blinding Lights', genre: 'Synthwave', moods: ['party', 'cyberpunk'] },
      { title: 'The Prodigy - Firestarter', genre: 'Electronic', moods: ['cyberpunk', 'party'] },
      { title: 'Grimes - Oblivion', genre: 'Electro Pop', moods: ['chill', 'cyberpunk'] },
      { title: 'Billie Eilish - Bury a Friend', genre: 'Alt Pop', moods: ['gothic', 'chill'] },
      // Puedes agregar muchas más canciones aquí
    ];
  }
}