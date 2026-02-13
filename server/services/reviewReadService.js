function calculateRatingSummary(reviews) {
    if (!Array.isArray(reviews) || reviews.length === 0) {
        return { average: 0, count: 0 };
    }

    const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

    return {
        average: Math.round(avgRating * 10) / 10,
        count: reviews.length,
    };
}

async function listPublishedReviews({
    Review,
    YouTubeAccount,
    channelId,
    fromChannelAttributes,
    limit,
}) {
    const query = {
        where: {
            toChannelId: channelId,
            isPublished: true,
        },
        include: [
            {
                model: YouTubeAccount,
                as: 'fromChannel',
                attributes: fromChannelAttributes,
            },
        ],
        order: [['createdAt', 'DESC']],
    };

    if (typeof limit === 'number') {
        query.limit = limit;
    }

    const reviews = await Review.findAll(query);

    return {
        reviews,
        rating: calculateRatingSummary(reviews),
    };
}

module.exports = {
    calculateRatingSummary,
    listPublishedReviews,
};
