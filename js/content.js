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
        const { verified, completed } = scoreMap[verifier];
        verified.push({
            rank: rank + 1,
            level: level.name,
            // UPDATED: Now passing totalLevels as the second argument
            score: score(rank + 1, totalLevels, 100, level.percentToQualify),
            link: level.verification,
        });
        completed.push({
        rank: rank + 1,
        level: level.name,
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
    packs.forEach((pack, packIndex) => {
        const userCompletions = {};
        
        // For each level ID in the pack, find the level and check who completed it
        pack.levels.forEach((levelId) => {
            const level = list.find(([l]) => l && l.id === levelId)?.[0];
            if (!level) return;
            
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
                
                // Calculate pack score based on sum of level scores divided by 2
                let totalLevelScore = 0;
                pack.levels.forEach((levelId) => {
                    // Find this level's rank in the original list
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
