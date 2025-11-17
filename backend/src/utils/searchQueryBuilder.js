const buildSearchQuery = (baseQuery = {}, options = {}) => {
    options = options || {};
    const {
        search,
        status,
        startDate,
        endDate,
        category,
        price,
        tags,
        sortBy,
        sortOrder = 'desc',
        dateField = 'startDate' // aggiunto: campo data configurabile
    } = options;

    const query = { ...baseQuery };

    // helper di sanitizzazione per date
    const sanitizeDate = (d) => {
        if (!d) return null;
        const dt = new Date(d);
        return isNaN(dt.getTime()) ? null : dt;
    };

    // escape per evitare che caratteri speciali rompano il regex
    const escapeRegex = (str) => {
        return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    const startDt = sanitizeDate(startDate);
    const endDt = sanitizeDate(endDate);

    // Ricerca testuale con fallback su title/description per evitare crash
    if (search) {
        const regex = { $regex: escapeRegex(search), $options: 'i' };
        if (Array.isArray(options.searchFields) && options.searchFields.length > 0) {
            const fieldsOr = options.searchFields.map(field => ({ [field]: regex }));
            query.$or = Array.isArray(query.$or) ? query.$or.concat(fieldsOr) : fieldsOr;
        } else {
            // fallback non invasivo: cerca in title e description se presenti
            const fallbackOr = [
                { title: regex },
                { description: regex }
            ];
            query.$or = Array.isArray(query.$or) ? query.$or.concat(fallbackOr) : fallbackOr;
        }
    }

    // Filtro per stato
    if (status) {
        query.status = status;
    }

    // Filtro per date usando il campo configurabile
    if (startDt || endDt) {
        const dateObj = {};
        if (startDt) dateObj.$gte = startDt;
        if (endDt) dateObj.$lte = endDt;
        if (Object.keys(dateObj).length) query[dateField] = dateObj;
    }

    // Filtro per categoria
    if (category) {
        query.category = category;
    }

    // Filtro per prezzo con sanitizzazione numerica
    if (price && typeof price === 'object') {
        const { min, max } = price;
        const minN = typeof min === 'string' ? parseFloat(min) : min;
        const maxN = typeof max === 'string' ? parseFloat(max) : max;
        if ((minN !== undefined && !Number.isNaN(minN)) || (maxN !== undefined && !Number.isNaN(maxN))) {
            query.price = {};
            if (minN !== undefined && !Number.isNaN(minN)) query.price.$gte = minN;
            if (maxN !== undefined && !Number.isNaN(maxN)) query.price.$lte = maxN;
        }
    }

    // Filtro per tag con supporto anche per stringhe CSV
    if (Array.isArray(tags) && tags.length > 0) {
        query.tags = { $in: tags };
    } else if (typeof tags === 'string' && tags.trim()) {
        query.tags = { $in: tags.split(',').map(t => t.trim()).filter(Boolean) };
    }

    const sortField = sortBy || 'createdAt';
    const sort = { [sortField]: sortOrder === 'asc' ? 1 : -1 };

    return { query, sort };
};

module.exports = buildSearchQuery;
// compatibilità con import ES
module.exports.default = buildSearchQuery;
module.exports.buildSearchQuery = buildSearchQuery;