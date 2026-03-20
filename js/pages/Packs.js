import { store } from '../main.js';
import { fetchList, fetchPacks } from '../content.js';
import { embed } from '../util.js';
import Spinner from '../components/Spinner.js';
import LevelAuthors from '../components/List/LevelAuthors.js';

export default {
    components: { Spinner, LevelAuthors },

    data: () => ({
        store,
        levels: [],
        packs: [],
        selectedPack: null,
        selectedLevel: null,
        loading: true,
    }),

    async mounted() {
        const [list, packs] = await Promise.all([fetchList(), fetchPacks()]);

        const levels = list
            .filter(([level]) => level !== null)
            .map(([level]) => level);

        this.levels = levels;
        this.packs = packs;

        if (packs.length > 0) {
            this.selectPack(packs[0]);
        }

        this.loading = false;
    },

    methods: {
        selectPack(pack) {
            this.selectedPack = pack;
            const resolvedLevels = this.resolveLevels(pack.levels);
            this.selectedLevel = resolvedLevels[0];
        },

        resolveLevels(levelIds) {
            // Keep the order from the pack
            return levelIds.map(id => this.levels.find(level => level.id === id)).filter(Boolean);
        },

        selectLevel(level) {
            this.selectedLevel = level;
        },
    },

    computed: {
        packLevels() {
            if (!this.selectedPack) return [];
            return this.resolveLevels(this.selectedPack.levels);
        },
        video() {
            if (!this.selectedLevel?.verification) {
                return;
            }
            return embed(this.selectedLevel.verification);
        },
    },

    template: `
        <main v-if="loading">
            <Spinner />
        </main>
        <main v-else class="page-list">
            <div class="list-container">
                <table class="list">
                    <tr v-for="pack in packs" :key="pack.id">
                        <td class="level" :class="{ 'active': selectedPack && selectedPack.id === pack.id }">
                            <button @click="selectPack(pack)">
                                <span class="type-label-lg">{{ pack.name }}</span>
                            </button>
                        </td>
                    </tr>
                </table>
            </div>
            <div class="level-container">
                <div class="level" v-if="selectedLevel">
                    <h1>{{ selectedLevel.name }}</h1>
                    <LevelAuthors :author="selectedLevel.author" :creators="selectedLevel.creators" :verifier="selectedLevel.verifier"></LevelAuthors>
                    <iframe class="video" id="videoframe" :src="video" frameborder="0"></iframe>
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">ID</div>
                            <p>{{ selectedLevel.id }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">Enjoyment</div>
                            <p>{{ selectedLevel.enjoyment || 'N/A' }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">Tags</div>
                            <p>{{ selectedLevel.tags || 'N/A' }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">Length</div>
                            <p>{{ selectedLevel.length || 'N/A' }}</p>
                        </li>
                    </ul>
                    <h2>Records</h2>
                    <table class="records">
                        <tr v-for="record in selectedLevel.records" class="record">
                            <td class="percent">
                                <p>{{ record.percent }}%</p>
                            </td>
                            <td class="user">
                                <a :href="record.link" target="_blank" class="type-label-lg">{{ record.user }}</a>
                            </td>
                            <td class="mobile">
                                <img v-if="record.mobile" :src="\`/assets/phone-landscape\${store.dark ? '-dark' : ''}.svg\`" alt="Mobile">
                            </td>
                            <td class="hz">
                                <p>{{ record.hz }}Hz</p>
                            </td>
                        </tr>
                    </table>
                </div>
            </div>
            <div class="meta-container">
                <div class="meta">
                    <div v-if="selectedPack">
                        <h2 class="type-title-lg" style="margin-bottom: 1rem;" >{{ selectedPack.name }}</h2>
                        <p>{{ selectedPack.description }}</p>
                        <br>
                        <h3 class="type-title-md" style="margin-bottom: 1rem;">Levels</h3>
                        <table class="list">
                            <tr v-for="level in packLevels" :key="level.id">
                                <td class="level" :class="{ 'active': selectedLevel && selectedLevel.id === level.id }">
                                    <button @click="selectLevel(level)">
                                        <span class="type-label-lg">{{ level.name }}</span>
                                    </button>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    `,
};
