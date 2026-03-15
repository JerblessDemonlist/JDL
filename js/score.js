/**
 * Numbers of decimal digits to round to
 */
const scale = 3;

/**
 * Calculate the score awarded when having a certain percentage on a list level
 * @param {Number} rank Position on the list (starting at 1)
 * @param {Number} totalLevels Total number of levels on the list (N)
 * @param {Number} percent Percentage of completion
 * @param {Number} minPercent Minimum percentage required
 * @returns {Number}
 */
export function score(rank, totalLevels, percent, minPercent) {
    if (percent < minPercent) return 0;

    const N = totalLevels;
    
    /**
     * ADJUST THIS VALUE (k) TO CONTROL DROP-OFF:
     * 1.0 = Linear (A straight line from 300 down to 1)
     * 2.5 = Smooth curve (Significant rewards for top tier, but "less drastic" drop)
     * 4.3 = Very steep (The AREDL/Pointercrate style)
     */
    const k = 2.5; 

    // 1. Calculate the distribution ratio (from 1.0 at rank #1 to 0.0 at rank #N)
    let distribution = Math.pow((N - rank) / Math.max(1, N - 1), k);

    // 2. Map that distribution to your point range (300 to 1)
    let baseScore = 1 + (300 - 1) * distribution;

    // 3. Calculate score based on player percentage
    let finalScore = baseScore * ((percent - (minPercent - 1)) / (100 - (minPercent - 1)));
    
    // 4. Apply 33% penalty for non-100% completions
    if (percent != 100) {
        return round(finalScore - finalScore / 3);
    }

    return Math.max(round(finalScore), 0);
}

/**
 * Rounds a number to the defined scale
 */
export function round(num) {
    if (!('' + num).includes('e')) {
        return +(Math.round(num + 'e+' + scale) + 'e-' + scale);
    } else {
        var arr = ('' + num).split('e');
        var sig = +arr[1] + scale > 0 ? '+' : '';
        return +(Math.round(+arr[0] + 'e' + sig + (+arr[1] + scale)) + 'e-' + scale);
    }
}
