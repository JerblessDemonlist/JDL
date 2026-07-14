import { fetchEditors, fetchLeaderboard, fetchPlayerInfo, fetchRecentChanges, fetchInProgress, fetchIcons } from '../content.js';
import { localize, embed } from '../util.js';
import Spinner from '../components/Spinner.js';

const roleIconMap = {
    owner: "crown",
    admin: "user-gear",
    helper: "user-shield",
    dev: "code",
    trial: "user-lock",
};

export default {
    components: { Spinner },
    data: () => ({
        loading: true,
        editors: [],
        leaderboard: [],
        playerInfo: {},
        recentChanges: [],
        inProgress: [],
        icons: {},
        roleIconMap,
    }),
template: `
    <main v-if="loading">
        <Spinner></Spinner>
    </main>
    <main v-else class="page-home">
        <div class="home-content">
            <div class="home-hero">
                <div class="home-hero-left">
                    <div class="home-logo">
                        <img src="./jerblesslist_icon.png" alt="JDL Logo">
                    </div>
                </div>
                <div class="home-hero-right">
                    <div class="home-editors">
                        <div v-for="editor in editors" :key="editor.name" class="home-editor">
                            <img :src="\`/assets/\${roleIconMap[editor.role]}.svg\`" :alt="editor.role">
                            <a v-if="editor.link" class="type-label-lg link" target="_blank" :href="editor.link">{{ editor.name }}</a>
                            <p v-else>{{ editor.name }}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="home-section">
                <h2>General Information</h2>
                <p>Welcome to the Jerbless Demonlist! This list includes every extreme demon (Any level harder than Red World) beaten by Jerbless members.</p>
            </div>
            <div class="home-section">
                <h2>Players</h2>
                <div class="home-players">
                    <div v-for="entry in leaderboard" :key="entry.user" class="home-player">
                        <div class="home-player-left">
                            <div class="home-player-name-row">
                                <h3>{{ entry.user }}</h3>
                                <div class="home-player-icons" v-if="icons[entry.user]">
                                    <img v-for="(src, type) in icons[entry.user]" :key="type" :src="src" :alt="type" class="home-player-icon">
                                </div>
                            </div>
                            <div class="home-player-meta">
                                <div class="home-player-location" v-if="playerInfo[entry.user]?.country">
                                    <img :src="\`https://flagcdn.com/24x18/\${playerInfo[entry.user].country.toLowerCase()}.png\`" :alt="playerInfo[entry.user].country" class="home-player-flag">
                                    <span v-if="playerInfo[entry.user]?.state">{{ playerInfo[entry.user].state }}</span>
                                </div>
                                <span class="home-player-points">{{ localize(entry.total) }} points</span>
                            </div>
                            <p v-if="playerInfo[entry.user]?.description" class="home-player-description">{{ playerInfo[entry.user].description }}</p>
                            <div class="home-player-links">
                                <a v-if="playerInfo[entry.user]?.youtube" :href="playerInfo[entry.user].youtube" target="_blank" class="home-player-link">YouTube</a>
                                <a v-if="playerInfo[entry.user]?.twitch" :href="playerInfo[entry.user].twitch" target="_blank" class="home-player-link">Twitch</a>
                            </div>
                        </div>
                        <div class="home-player-right">
                            <div class="home-player-hardest" v-if="hardestCompletion(entry)">
                                <span class="type-title-sm">Hardest Completion</span>
                                <p class="home-player-hardest-name">{{ hardestCompletion(entry).level }}</p>
                                <iframe v-if="hardestCompletion(entry).link" class="home-player-video" :src="embed(hardestCompletion(entry).link)" frameborder="0"></iframe>
                                <p v-else class="home-player-no-video">No Video</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="home-section" v-if="recentChanges.length > 0">
                <h2>Recent Changes</h2>
                <div class="home-changes">
                    <div v-for="change in recentChanges" :key="change.date" class="home-change">
                        <span class="home-change-date">{{ change.date }}</span>
                        <p>{{ change.description }}</p>
                    </div>
                </div>
            </div>
            <div class="home-section" v-if="inProgress.length > 0">
                <h2>Levels In Progress</h2>
                <div class="home-progress">
                    <div v-for="level in inProgress" :key="level.levelName" class="home-progress-item">
                        <div class="home-progress-header">
                            <h3>{{ level.levelName }}</h3>
                            <span class="type-label-lg">{{ level.player }}</span>
                        </div>
                        <p>{{ level.note }}</p>
                    </div>
                </div>
            </div>
        </div>
    </main>
`,
    async mounted() {
        const [editors, [leaderboard], playerInfo, recentChanges, inProgress, icons] = await Promise.all([
            fetchEditors(),
            fetchLeaderboard(),
            fetchPlayerInfo(),
            fetchRecentChanges(),
            fetchInProgress(),
            fetchIcons(),
        ]);

        this.editors = editors || [];
        this.leaderboard = leaderboard;
        this.playerInfo = playerInfo;
        this.recentChanges = recentChanges;
        this.inProgress = inProgress;
        this.icons = icons;

        this.loading = false;

    },
    
    methods: {
        localize,
        embed,
        hardestCompletion(entry) {
            const all = [...entry.verified, ...entry.completed].sort((a, b) => a.rank - b.rank);
            return all[0] || null;
        },
    },
};
