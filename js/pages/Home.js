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
            <p>Placeholder - more sections coming</p>
        </main>
    `,
};
