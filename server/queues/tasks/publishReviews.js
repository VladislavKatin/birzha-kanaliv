const { Review } = require('../../models');
const { Op } = require('sequelize');

/**
 * Publish reviews that are older than 7 days.
 * Reviews start as hidden and become public after the grace period.
 *
 * @async
 */
async function publishDueReviews() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    try {
        const [count] = await Review.update(
            { isPublished: true },
            {
                where: {
                    isPublished: false,
                    createdAt: { [Op.lte]: sevenDaysAgo },
                },
            }
        );

        if (count > 0) {
            console.log(`  📝 Published ${count} review(s)`);
        }
    } catch (err) {
        console.error('❌ Publish reviews error:', err.message);
    }
}

module.exports = { publishDueReviews };
