import { store } from '../main.js';
import { fetchList, fetchPacks, fetchLeaderboard, fetchTiers } from '../content.js';
import { embed } from '../util.js';
import { score, round } from '../score.js';
import Spinner from '../components/Spinner.js';
import LevelAuthors from '../components/List/LevelAuthors.js';

export default {
    components: { Spinner, LevelAuthors },

    data: () => ({
        store,
        levels: [],
        packs: [],
        tiers: [],
        selectedPack: null,
        selectedLevel: null,
        packCompleters: {},
        loading: true,
        searchQuery: '',
    }),

    async mounted() {
        const [list, packs, [leaderboard]] = await Promise.all([
            fetchList(),
            fetchPacks(),
            fetchLeaderboard(),
        ]);
        const tiers = await fetchTiers();

        const levels = list
            .filter(([level]) => level !== null)
            .map(([level]) => level);

        this.levels = levels;
        this.packs = packs;
        this.tiers = tiers;

        // Build pack completers map
        const completers = {};
        leaderboard.forEach((entry) => {
            if (entry.packs && entry.packs.length > 0) {
                entry.packs.forEach((pack) => {
                    if (!completers[pack.id]) {
                        completers[pack.id] = [];
                    }
                    completers[pack.id].push({
                        user: entry.user,
                        score: pack.score,
                    });
                });
            }
        });
        this.packCompleters = completers;

        if (packs.length > 0) {
            const packId = this.$route?.query?.pack;
            const preSelected = packId && packs.find((p) => p.id === packId);
            this.selectPack(preSelected || packs[0]);
        }

        this.loading = false;
    },

    methods: {
        round,
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
       packsGroupedByTier() {
        return this.tiers.map((tier) => ({
            ...tier,
            packs: this.filteredPacks.filter((pack) => pack.tier === tier.id),
        })).filter((tier) => tier.packs.length > 0);
    },
        filteredPacks() {
            if (!this.searchQuery) return this.packs;
            return this.packs.filter((pack) =>
                pack.name.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
    },
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
        packCompletersForSelected() {
            if (!this.selectedPack) return [];
            return (this.packCompleters[this.selectedPack.id] || []).sort((a, b) => b.score - a.score);
        },
        packScore() {
            if (!this.selectedPack) return 0;
            return this.packLevels.reduce((total, level) => {
            const rank = this.levels.indexOf(level) + 1;
            return total + score(rank, this.levels.length, 100, level.percentToQualify);
          }, 0) / 2;
        },
    },

    template: `
        <main v-if="loading">
            <Spinner />
        </main>
        <main v-else class="page-list">
            <div class="list-container">
                <div class="list-sticky">
                    <div class="search-container">
                        <input
                            type="text"
                            v-model="searchQuery"
                            placeholder="Search packs..."
                            class="search-bar"
                        />
                        <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''">✕</button>
                    </div>
                </div>
                <div v-for="tier in packsGroupedByTier" :key="tier.id">
                <span class="tier-heading" :style="{ borderColor: tier.color, backgroundColor: tier.color + '33', color: tier.color }">{{ tier.name }}</span>
                <table class="list">
                    <tr v-for="pack in tier.packs" :key="pack.id">
                        <td class="level" :class="{ 'active': selectedPack && selectedPack.id === pack.id }">
                                <button @click="selectPack(pack)">
                                    <span class="type-label-lg">{{ pack.name }}</span>
                                </button>
                            </td>
                        </tr>
                    </table>
                </div>
            </div>
            <div class="level-container">
                <div class="level" v-if="selectedLevel">
                    <h1>{{ selectedLevel.name }}</h1>
                    <LevelAuthors :author="selectedLevel.author" :creators="selectedLevel.creators" :verifier="selectedLevel.verifier"></LevelAuthors>
                    <iframe class="video" id="videoframe" :src="video" frameborder="0"></iframe>
                    <div class="stats">
                        <div class="stat">
                            <div class="type-title-sm">ID</div>
                            <p>{{ selectedLevel.id }}</p>
                        </div>
                        <div class="stat">
                            <div class="type-title-sm">Enjoyment</div>
                            <p>{{ selectedLevel.enjoyment || 'N/A' }}</p>
                        </div>
                        <div class="stat">
                            <div class="type-title-sm">Tags</div>
                            <p>{{ selectedLevel.tags && Array.isArray(selectedLevel.tags) && selectedLevel.tags.length > 0 ? selectedLevel.tags.join(', ') : (selectedLevel.tags || 'N/A') }}</p>
                        </div>
                        <div class="stat">
                            <div class="type-title-sm">Length</div>
                            <p>{{ selectedLevel.length || 'N/A' }}</p>
                        </div>
                    </div>
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
                        <p class="type-title-sm">Pack Points: +{{ round(packScore) }}</p>
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
                        <br>
                        <h3 class="type-title-md" style="margin-bottom: 1rem;" v-if="packCompletersForSelected.length > 0">Pack Victors ({{ packCompletersForSelected.length }})</h3>
                        <table v-if="packCompletersForSelected.length > 0" class="list" style="border-collapse: separate; border-spacing: 0 0.75rem;">
                            <tr v-for="completer in packCompletersForSelected" :key="completer.user">
                                <td class="level" >
                                    <span class="type-label-lg">{{ completer.user }}</span>
                                </td>
                            </tr>
                        </table>
                        <p v-else style="color: var(--gray);">No one has completed this pack yet.</p>
                    </div>
                </div>
            </div>
        </main>
    `,
};
