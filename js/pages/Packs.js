import { fetchList } from '../content.js'
import Spinner from '../components/Spinner.js'

export default {
  components: { Spinner },

  data: () => ({
    levels: [],
    packs: [],
    selectedPack: null,
    selectedLevel: null,
    loading: true
  }),

  async mounted() {
    const list = await fetchList()

    const levels = list
      .filter(([level]) => level !== null)
      .map(([level]) => level)

    this.levels = levels

    // temporary example pack
    this.packs = [
      {
        id: "example",
        name: "Example Pack",
        color: "#ff5555",
        levels: [25610878]
      }
    ]

    this.selectPack(this.packs[0])
    this.loading = false
  },

  methods: {
    selectPack(pack) {
      this.selectedPack = pack
      const resolvedLevels = this.resolveLevels(pack.levels)
      this.selectedLevel = resolvedLevels[0]
    },

    resolveLevels(levelIds) {
      return this.levels.filter(level =>
        levelIds.includes(level.id)
      )
    },

    selectLevel(level) {
      this.selectedLevel = level
    }
  },

  computed: {
    packLevels() {
      if (!this.selectedPack) return []
      return this.resolveLevels(this.selectedPack.levels)
    }
  },

  template: `
    <main v-if="loading">
      <Spinner />
    </main>

    <main v-else class="packs-page">

      <div class="pack-tabs">
        <button
          v-for="pack in packs"
          :key="pack.id"
          :style="{ backgroundColor: pack.color }"
          @click="selectPack(pack)"
        >
          {{ pack.name }}
        </button>
      </div>

      <div class="packs-layout">

        <aside class="level-list">
          <div
            v-for="level in packLevels"
            :key="level.id"
            @click="selectLevel(level)"
          >
            {{ level.name }}
          </div>
        </aside>

        <section class="level-detail">
          <div v-if="selectedLevel">
            <h2>{{ selectedLevel.name }}</h2>
            <p>Author: {{ selectedLevel.author }}</p>
          </div>
        </section>

      </div>
    </main>
  `
}
