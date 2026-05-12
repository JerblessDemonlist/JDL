import { fetchLeaderboard, fetchIcons, fetchAchievements, fetchPlayerAchievements } from '../content.js';
import { localize } from '../util.js';

import Spinner from '../components/Spinner.js';

export default {
    components: {
        Spinner,
    },
    data: () => ({
        leaderboard: [],
        icons: {},
        achievements: [],
        playerAchievements: {},
        loading: true,
        selected: 0,
        err: [],
    }),
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-leaderboard-container">
            <div class="page-leaderboard">
                <div class="error-container">
                    <p class="error" v-if="err.length > 0">
                        Leaderboard may be incorrect, as the following levels could not be loaded: {{ err.join(', ') }}
                    </p>
                </div>
                <div class="board-container">
                    <table class="board">
                        <tr v-for="(ientry, i) in leaderboard">
                            <td class="rank">
                                <p class="type-label-lg">#{{ i + 1 }}</p>
                            </td>
                            <td class="total">
                                <p class="type-label-lg">{{ localize(ientry.total) }}</p>
                            </td>
                            <td class="user" :class="{ 'active': selected == i }">
                                <button @click="selected = i">
                                    <span class="type-label-lg">{{ ientry.user }}</span>
                                </button>
                            </td>
                        </tr>
                    </table>
                </div>
                <div class="player-container">
                    <div class="player">
                        <div class="player-header">
                            <h1>#{{ selected + 1 }} {{ entry.user }}</h1>
                            <div class="user-icons" v-if="icons[entry.user]">
                                <img v-for="(src, type) in icons[entry.user]" :key="type" :src="src" :alt="type" class="user-icon">
                            </div>
                        </div>
                        <h3>{{ entry.total }} points</h3>
                            <div v-if="entryAchievements.length > 0" class="achievements">
                                <h2>Achievements ({{ entryAchievements.length }})</h2>
                                <div class="achievement-list">
                                    <div v-for="achievement in entryAchievements" :key="achievement.id" class="achievement">
                                        <span class="achievement-name type-label-lg">{{ achievement.name }}</span>
                                        <div class="achievement-badge-container">
                                                <img :src="achievement.image" :alt="achievement.name" class="achievement-badge">
                                            <div class="achievement-tooltip">{{ achievement.description }}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        <h2 v-if="entry.packs && entry.packs.length > 0">
                            Completed Packs ({{ entry.packs.length }})
                        </h2>
                        <table v-if="entry.packs && entry.packs.length > 0" class="table">
                            <tr v-for="pack in entry.packs.sort((a, b) => b.score - a.score)">
                                <td class="level">
                                    <span class="type-label-lg">{{ pack.name }}</span>
                                </td>
                                <td class="score">
                                    <p>+{{ localize(pack.score) }}</p>
                                </td>
                            </tr>
                        </table>
                        <h2 v-if="entry.verified.length + entry.completed.length > 0">
                            Completed Levels ({{ entry.verified.length + entry.completed.length}})
                        </h2>
                        <table class="table">
                            <tr v-for="score in [...entry.verified, ...entry.completed].sort((a, b) => b.score - a.score)">
                                <td class="rank">
                                    <p>#{{ score.rank }}</p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="score.link">
                                        <strong v-if="entry.verified.includes(score)">{{ score.level }} ⭐</strong>
                                        <template v-else>{{ score.level }}</template>
                                    </a>
                                </td>
                                <td class="score">
                                    <p>+{{ localize(score.score) }}</p>
                                </td>
                            </tr>
                        </table>
                        <h2 v-if="entry.progressed.length > 0">Progressed ({{entry.progressed.length}})</h2>
                        <table class="table">
                            <tr v-for="score in entry.progressed">
                                <td class="rank">
                                    <p>#{{ score.rank }}</p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="score.link">{{ score.percent }}% {{ score.level }}</a>
                                </td>
                                <td class="score">
                                    <p>+{{ localize(score.score) }}</p>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    `,
computed: {
    entry() {
        return this.leaderboard[this.selected];
    },
    entryAchievements() {
        if (!this.entry) return [];
        const user = this.entry.user;
        const total = this.entry.total;
        const levelsCompleted = this.entry.verified.length + this.entry.completed.length;
        const packsCompleted = this.entry.packs.length;
        const earned = [];

        // Points achievements - highest tier only
        const pointsTiers = [
            { id: 'points_1', threshold: 500 },
            { id: 'points_2', threshold: 1000 },
            { id: 'points_3', threshold: 2000 },
            { id: 'points_4', threshold: 5000 },
            { id: 'points_5', threshold: 10000 },
        ];
        const highestPoints = [...pointsTiers].reverse().find(t => total >= t.threshold);
        if (highestPoints) {
            const achievement = this.achievements.find(a => a.id === highestPoints.id);
            if (achievement) earned.push({ ...achievement, unlockedOn: 'Auto' });
        }

        // Levels achievements - highest tier only
        const levelsTiers = [
            { id: 'levels_1', threshold: 5 },
            { id: 'levels_2', threshold: 10 },
            { id: 'levels_3', threshold: 25 },
            { id: 'levels_4', threshold: 50 },
            { id: 'levels_5', threshold: 100 },
            { id: 'levels_6', threshold: 200 },
        ];
        const highestLevels = [...levelsTiers].reverse().find(t => levelsCompleted >= t.threshold);
        if (highestLevels) {
            const achievement = this.achievements.find(a => a.id === highestLevels.id);
            if (achievement) earned.push({ ...achievement, unlockedOn: 'Auto' });
        }

        // Packs achievements - highest tier only
        const packsTiers = [
            { id: 'packs_1', threshold: 1 },
            { id: 'packs_2', threshold: 3 },
            { id: 'packs_3', threshold: 5 },
            { id: 'packs_4', threshold: 10 },
            { id: 'packs_5', threshold: 25 },
        ];
        const highestPacks = [...packsTiers].reverse().find(t => packsCompleted >= t.threshold);
        if (highestPacks) {
            const achievement = this.achievements.find(a => a.id === highestPacks.id);
            if (achievement) earned.push({ ...achievement, unlockedOn: 'Auto' });
        }

        // Manual achievements
        const manual = this.playerAchievements[user] || [];
        manual.forEach(({ id, unlockedOn }) => {
            const achievement = this.achievements.find(a => a.id === id);
            if (achievement) earned.push({ ...achievement, unlockedOn });
        });

        return earned;
    },
},
async mounted() {
    const [[leaderboard, err], icons, achievements, playerAchievements] = await Promise.all([
        fetchLeaderboard(),
        fetchIcons(),
        fetchAchievements(),
        fetchPlayerAchievements(),
    ]);
    this.leaderboard = leaderboard;
    this.err = err;
    this.icons = icons;
    this.achievements = achievements;
    this.playerAchievements = playerAchievements;
    this.loading = false;
        },
        methods: {
            localize,
        },
    };
