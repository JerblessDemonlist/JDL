import { round, score } from './score.js';

/**
 * Path to directory containing `_list.json` and all levels
 */
const dir = '/data';

export async function fetchList() {
    const listResult = await fetch(`${dir}/_list.json`);
    try {
        const list = await listResult.json();
        return await Promise.all(
            list.map(async (path, rank) => {
                const levelResult = await fetch(`${dir}/levels/${path}.json`);
                try {
                    const level = await levelResult.json();
                    return [
                        {
                            ...level,
                            path,
                            records: level.records.sort(
                                (a, b) => b.percent - a.percent,
                            ),
                        },
                        null,
                    ];
                } catch {
                    console.error(`Failed to load level #${rank + 1} ${path}.`);
                    return [null, path];
                }
            }),
        );
    } catch {
        console.error(`Failed to load list.`);
        return null;
    }
}

export async function fetchJerblessList() {
    const dir = '/data/jerbless';
    const listResult = await fetch(`${dir}/_list.json`);
    try {
        const list = await listResult.json();
        return await Promise.all(
            list.map(async (path, rank) => {
                const levelResult = await fetch(`${dir}/${path}.json`);
                try {
                    const level = await levelResult.json();
                    return [
                        {
                            ...level,
                            path,
                            records: level.records.sort(
                                (a, b) => b.percent - a.percent,
                            ),
                        },
                        null,
                    ];
                } catch {
                    console.error(`Failed to load level #${rank + 1} ${path}.`);
                    return [null, path];
                }
            }),
        );
    } catch {
        console.error(`Failed to load jerbless list.`);
        return null;
    }
}

export async function fetchEditors() {
    try {
        const editorsResults = await fetch(`${dir}/_editors.json`);
        const editors = await editorsResults.json();
        return editors;
    } catch {
        return null;
    }
}

//
export async function fetchLeaderboard() {
    const list = await fetchList();
    const packs = await fetchPacks();
    
    // NEW: Define totalLevels (N) based on the length of the fetched list
    const totalLevels = list.length;

    const scoreMap = {};
    const errs = [];
    list.forEach(([level, err], rank) => {
        if (err) {
            errs.push(err);
            return;
        }

        // Verification
        const verifier = Object.keys(scoreMap).find(
            (u) => u.toLowerCase() === level.verifier.toLowerCase(),
        ) || level.verifier;
        scoreMap[verifier] ??= {
            verified: [],
            completed: [],
            progressed: [],
            packs: [],
        };
        const { verified } = scoreMap[verifier];
        verified.push({
            rank: rank + 1,
            level: level.name,
            // UPDATED: Now passing totalLevels as the second argument
            score: score(rank + 1, totalLevels, 100, level.percentToQualify),
            link: level.verification,
        });

        // Records
        level.records.forEach((record) => {
            const user = Object.keys(scoreMap).find(
                (u) => u.toLowerCase() === record.user.toLowerCase(),
            ) || record.user;
            scoreMap[user] ??= {
                verified: [],
                completed: [],
                progressed: [],
                packs: [],
            };
            const { completed, progressed } = scoreMap[user];
            if (record.percent === 100) {
                completed.push({
                    rank: rank + 1,
                    level: level.name,
                    // UPDATED: Now passing totalLevels as the second argument
                    score: score(rank + 1, totalLevels, 100, level.percentToQualify),
                    link: record.link,
                });
                return;
            }

            progressed.push({
                rank: rank + 1,
                level: level.name,
                percent: record.percent,
                // UPDATED: Now passing totalLevels as the second argument
                score: score(rank + 1, totalLevels, record.percent, level.percentToQualify),
                link: record.link,
            });
        });
    });

  // Track pack completions
packs.forEach((pack) => {
    const userCompletions = {};

    pack.levels.forEach((levelId) => {
        const level = list.find(([l]) => l && l.id === levelId)?.[0];
        if (!level) return;

        // Count the verifier as having completed this level
        const verifier = Object.keys(scoreMap).find(
            (u) => u.toLowerCase() === level.verifier.toLowerCase(),
        ) || level.verifier;
        userCompletions[verifier] ??= 0;
        userCompletions[verifier]++;

        // Count 100% record completions as before
        level.records.forEach((record) => {
            if (record.percent === 100) {
                const user = Object.keys(scoreMap).find(
                    (u) => u.toLowerCase() === record.user.toLowerCase(),
                ) || record.user;
                userCompletions[user] ??= 0;
                userCompletions[user]++;
            }
        });
    });

    // Award points for users who completed all levels in the pack
    Object.entries(userCompletions).forEach(([user, completed]) => {
        if (completed === pack.levels.length) {
            const scoredUser = Object.keys(scoreMap).find(
                (u) => u.toLowerCase() === user.toLowerCase(),
            ) || user;

            scoreMap[scoredUser] ??= {
                verified: [],
                completed: [],
                progressed: [],
                packs: [],
            };

            let totalLevelScore = 0;
            pack.levels.forEach((levelId) => {
                const levelIndex = list.findIndex(([l]) => l && l.id === levelId);
                if (levelIndex !== -1) {
                    const [level] = list[levelIndex];
                    const levelScore = score(levelIndex + 1, totalLevels, 100, level.percentToQualify);
                    totalLevelScore += levelScore;
                }
            });
            const packScore = totalLevelScore / 2;

            scoreMap[scoredUser].packs.push({
                name: pack.name,
                id: pack.id,
                score: round(packScore),
                levelCount: pack.levels.length,
            });
        }
    });
});
    
    // Wrap in extra Object containing the user and total score
    const res = Object.entries(scoreMap).map(([user, scores]) => {
        const { verified, completed, progressed, packs } = scores;
        const total = [verified, completed, progressed, packs]
            .flat()
            .reduce((prev, cur) => prev + cur.score, 0);

        return {
            user,
            total: round(total),
            verified,
            completed,
            progressed,
            packs,
        };
    });
    
    // Sort by total score
    return [res.sort((a, b) => b.total - a.total), errs];
}

export async function fetchPacks() {
    try {
        const res = await fetch('/data/packs.json');
        return await res.json();
    } catch {
        console.error("Failed to load packs.");
        return [];
    }
}
export async function fetchTiers() {
    try {
        const res = await fetch('/data/tiers.json');
        return await res.json();
    } catch {
        console.error("Failed to load tiers.");
        return [];
    }
}
export async function fetchIcons() {
    try {
        const res = await fetch('/data/icons.json');
        return await res.json();
    } catch {
        console.error("Failed to load icons.");
        return {};
    }
}
export async function fetchAchievements() {
    try {
        const res = await fetch('/data/achievements.json');
        return await res.json();
    } catch {
        console.error("Failed to load achievements.");
        return [];
    }
}

export async function fetchPlayerAchievements() {
    try {
        const res = await fetch('/data/player-achievements.json');
        return await res.json();
    } catch {
        console.error("Failed to load player achievements.");
        return {};
    }
}

export async function fetchPlayerInfo() {
    try {
        const res = await fetch('/data/player-info.json');
        return await res.json();
    } catch {
        console.error("Failed to load player info.");
        return {};
    }
}

export async function fetchRecentChanges() {
    try {
        const res = await fetch('/data/recent-changes.json');
        return await res.json();
    } catch {
        console.error("Failed to load recent changes.");
        return [];
    }
}

export async function fetchInProgress() {
    try {
        const res = await fetch('/data/in-progress.json');
        return await res.json();
    } catch {
        console.error("Failed to load in-progress levels.");
        return [];
    }
}
