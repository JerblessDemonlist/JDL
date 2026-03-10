const scale = 3;

function getRawSum(totalLevels) {
    let sum = 0;
    const k = 1.18;
    const N = totalLevels;
    for (let i = 1; i <= N; i++) {
        sum += 3 + 297 * Math.pow((N - i) / Math.max(1, N - 1), k);
    }
    return sum;
}

export function score(rank, totalLevels, percent, minPercent) {
    if (percent < minPercent) return 0;

    const k = 1.18;
    const N = totalLevels;

    let rawScore = 3 + 297 * Math.pow((N - rank) / Math.max(1, N - 1), k);
    let rawSum = getRawSum(N);
    let base10kScore = (rawScore / rawSum) * 10000;

    let finalScore = base10kScore * ((percent - (minPercent - 1)) / (100 - (minPercent - 1)));
    if (percent != 100) {
        return round(finalScore - finalScore / 3);
    }
    return Math.max(round(finalScore), 0);
}

export function round(num) {
    if (!('' + num).includes('e')) {
        return +(Math.round(num + 'e+' + scale) + 'e-' + scale);
    } else {
        var arr = ('' + num).split('e');
        var sig = +arr[1] + scale > 0 ? '+' : '';
        return +(Math.round(+arr[0] + 'e' + sig + (+arr[1] + scale)) + 'e-' + scale);
    }
}
