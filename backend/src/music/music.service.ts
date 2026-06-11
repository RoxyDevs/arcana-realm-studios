import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MusicService {
  constructor(private readonly prisma: PrismaService) {}

  async getRoomProfile(roomId: string) {
    const profile = await this.prisma.roomMusicProfile.findUnique({ where: { roomId } });
    if (!profile) {
      throw new NotFoundException('Perfil musical no encontrado para esta sala.');
    }
    return profile;
  }

  async recordTrack(roomId: string, trackTitle: string, genre?: string, artist?: string, bpm?: number) {
    const profile = await this.getOrCreateProfile(roomId);
    const playedTracks = [...profile.playedTracks, trackTitle].slice(-100);
    const favoriteGenres = genre ? Array.from(new Set([...profile.favoriteGenres, genre])) : profile.favoriteGenres;
    const skippedTracks = profile.skippedTracks;

    return this.prisma.roomMusicProfile.update({
      where: { roomId },
      data: {
        playedTracks,
        favoriteGenres,
        skippedTracks,
        lastActiveAt: new Date(),
      },
    });
  }

  async fillPlaylist(roomId: string, recentTracks: string[], mood?: string) {
    const profile = await this.getOrCreateProfile(roomId);
    const recommendations = this.buildRecommendations(recentTracks, profile.favoriteGenres, mood);

    await this.prisma.roomMusicProfile.update({
      where: { roomId },
      data: {
        lastActiveAt: new Date(),
      },
    });

    return { roomId, mood: mood ?? 'default', recommendations };
  }

  async autoDj(roomId: string, mood?: string) {
    const profile = await this.getOrCreateProfile(roomId);
    const songs = this.buildRecommendations(profile.playedTracks.slice(-10), profile.favoriteGenres, mood);

    return {
      roomId,
      mood: mood ?? 'auto',
      autoDj: true,
      queue: songs.slice(0, 20),
      profile,
    };
  }

  private async getOrCreateProfile(roomId: string) {
    const existing = await this.prisma.roomMusicProfile.findUnique({ where: { roomId } });
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

  private buildRecommendations(recentTracks: string[], favoriteGenres: string[], mood?: string) {
    const basePool = this.recommendationPool();
    const moodFilter = mood?.toLowerCase();
    const candidates = basePool.filter((track) => {
      if (!moodFilter) return true;
      return track.moods.some((moodTag) => moodTag.includes(moodFilter));
    });

    const selected = new Set<string>();
    const results: string[] = [];

    const addTrack = (track: { title: string }) => {
      if (results.length >= 30) return;
      if (selected.has(track.title)) return;
      selected.add(track.title);
      results.push(track.title);
    };

    recentTracks.slice(-10).forEach((recent) => {
      candidates.filter((track) => track.title.toLowerCase().includes(recent.toLowerCase())).slice(0, 2).forEach(addTrack);
    });

    favoriteGenres.forEach((genre) => {
      candidates.filter((track) => track.genre.toLowerCase().includes(genre.toLowerCase())).slice(0, 3).forEach(addTrack);
    });

    candidates.slice(0, 30).forEach(addTrack);
    return results.slice(0, 25);
  }

  private recommendationPool() {
    return [
      { title: 'Breaking Benjamin - The Diary of Jane', genre: 'Rock', moods: ['party', 'gothic', 'rock'] },
      { title: 'Skillet - Monster', genre: 'Rock', moods: ['party', 'energetic'] },
      { title: 'Papa Roach - Last Resort', genre: 'Rock', moods: ['party', 'angry'] },
      { title: 'Red - Breathe Into Me', genre: 'Rock', moods: ['emotional', 'rock'] },
      { title: 'Disturbed - Down with the Sickness', genre: 'Metal', moods: ['angry', 'party'] },
      { title: 'Chevelle - The Red', genre: 'Rock', moods: ['rock', 'gothic'] },
      { title: 'Shinedown - Sound of Madness', genre: 'Rock', moods: ['party', 'motivational'] },
      { title: 'Linkin Park - Numb', genre: 'Nu Metal', moods: ['emotional', 'chill'] },
      { title: 'Evanescence - Bring Me to Life', genre: 'Gothic Rock', moods: ['emotional', 'gothic'] },
      { title: 'Three Days Grace - Animal I Have Become', genre: 'Rock', moods: ['angry', 'party'] },
      { title: 'The Prodigy - Firestarter', genre: 'Electronic', moods: ['cyberpunk', 'party'] },
      { title: 'Grimes - Oblivion', genre: 'Electro Pop', moods: ['chill', 'cyberpunk'] },
      { title: 'Depeche Mode - Enjoy the Silence', genre: 'Synthpop', moods: ['chill', 'romantic'] },
      { title: 'The Weeknd - Blinding Lights', genre: 'Synthwave', moods: ['party', 'cyberpunk'] },
      { title: 'Billie Eilish - Bury a Friend', genre: 'Alt Pop', moods: ['gothic', 'chill'] },
      { title: 'Cigarettes After Sex - Apocalypse', genre: 'Dream Pop', moods: ['romantic', 'chill'] },
    ];
  }
}
