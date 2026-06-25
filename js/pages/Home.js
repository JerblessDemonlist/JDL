import { fetchEditors, fetchLeaderboard, fetchPlayerInfo, fetchRecentChanges, fetchInProgress, fetchIcons } from '../content.js';
import { localize } from '../util.js';
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
    <div class="home-section">
        <h2>General Information</h2>
        <p>
            Welcome to the Jerbless Demonlist! This list includes every extreme demon beaten by Jerbless members.
        </p>
    </div>
    <div class="home-section">
        <h2>List Editors</h2>
        <div class="home-editors">
            <div v-for="editor in editors" :key="editor.name" class="home-editor">
                <img :src="\`/assets/\${roleIconMap[editor.role]}.svg\`" :alt="editor.role">
                <a v-if="editor.link" class="type-label-lg link" target="_blank" :href="editor.link">{{ editor.name }}</a>
                <p v-else>{{ editor.name }}</p>
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
};
