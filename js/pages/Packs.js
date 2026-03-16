import { fetchList, fetchPacks } from '../content.js'
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
  const [list, packs] = await Promise.all([
    fetchList(),
    fetchPacks()
  ])

  const levels = list
    .filter(([level]) => level !== null)
    .map(([level]) => level)

  this.levels = levels
  this.packs = packs

  if (packs.length > 0) {
    this.selectPack(packs[0])
  }

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

    <div class="packs-layout">

      <!-- LEFT: Levels -->
      <aside class="level-list">
        <h3>Levels</h3>

        <div
          v-for="level in packLevels"
          :key="level.id"
          class="level-item"
          :class="{ active: selectedLevel && selectedLevel.id === level.id }"
          @click="selectLevel(level)"
        >
          {{ level.name }}
        </div>

      </aside>


      <!-- MIDDLE: Level Info -->
      <section class="level-detail">

        <div v-if="selectedLevel">

          <h1>{{ selectedLevel.name }}</h1>

          <p><b>Author:</b> {{ selectedLevel.author }}</p>
          <p><b>Verifier:</b> {{ selectedLevel.verifier }}</p>
          <p><b>Length:</b> {{ selectedLevel.length }}</p>
          <p><b>Tags:</b> {{ selectedLevel.tags }}</p>

        </div>

      </section>


      <!-- RIGHT: Packs -->
      <aside class="pack-list">

        <h3>Packs</h3>

        <button
          v-for="pack in packs"
          :key="pack.id"
          class="pack-item"
          :class="{ active: selectedPack && selectedPack.id === pack.id }"
          :style="{ backgroundColor: pack.color }"
          @click="selectPack(pack)"
        >
          {{ pack.name }}
        </button>

      </aside>

    </div>

  </main>
`
}
