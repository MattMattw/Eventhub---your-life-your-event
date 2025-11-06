const buildSearchQuery = (baseQuery = {}, options = {}) => {
    const {
        search,
        status,
        startDate,
        endDate,
        category,
        price,
        tags,
        sortBy,
        sortOrder = 'desc'
    } = options;

    const query = { ...baseQuery };

    // Ricerca testuale
    if (search) {
        if (options.searchFields) {
            query.$or = options.searchFields.map(field => ({
                [field]: { $regex: search, $options: 'i' }
            }));
        }
    }

    // Filtro per stato
    if (status) {
        query.status = status;
    }

    // Filtro per date
    if (startDate || endDate) {
        query.startDate = {};
        if (startDate) {
            query.startDate.$gte = new Date(startDate);
        }
        if (endDate) {
            query.startDate.$lte = new Date(endDate);
        }
    }

    // Filtro per categoria
    if (category) {
        query.category = category;
    }

    // Filtro per prezzo
    if (price) {
        const { min, max } = price;
        if (min !== undefined || max !== undefined) {
            query.price = {};
            if (min !== undefined) query.price.$gte = min;
            if (max !== undefined) query.price.$lte = max;
        }
    }

    // Filtro per tag
    if (tags && tags.length > 0) {
        query.tags = { $in: tags };
    }

    return {
        query,
        sort: { [sortBy || 'createdAt']: sortOrder === 'asc' ? 1 : -1 }
    };
};

module.exports = buildSearchQuery;