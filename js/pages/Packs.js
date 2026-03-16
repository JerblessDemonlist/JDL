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

  <!-- LEFT: Levels in selected pack -->
  <aside class="level-list">
    <h3>Levels</h3>
    <div
      v-for="level in packLevels"
      :key="level.id"
      class="level-item"
      @click="selectLevel(level)"
    >
      {{ level.name }}
    </div>
  </aside>

  <!-- MIDDLE: Selected level -->
  <section class="level-detail">
    <div v-if="selectedLevel">
      <h2>{{ selectedLevel.name }}</h2>
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
      :style="{ backgroundColor: pack.color }"
      @click="selectPack(pack)"
    >
      {{ pack.name }}
    </button>
  </aside>

</div>

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
