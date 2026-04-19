import Handlebars from 'handlebars';

// Helper for Equality: {{#eq accountType "BANK"}} ... {{/eq}}
Handlebars.registerHelper('eq', function (a, b, options) {
    return a === b ? options.fn(this) : options.inverse(this);
});

// Helper for Comparisons: {{#compare total ">" 5000}} ... {{/compare}}
Handlebars.registerHelper('compare', function (v1, operator, v2, options) {
    const operators = {
        '==':  (a, b) => a == b,
        '===': (a, b) => a === b,
        '!=':  (a, b) => a != b,
        '>':   (a, b) => a > b,
        '<':   (a, b) => a < b,
        '>=':  (a, b) => a >= b,
        '<=':  (a, b) => a <= b,
    };
    const result = operators[operator](v1, v2);
    return result ? options.fn(this) : options.inverse(this);
});

/* Helper for Date Format:
{{formatDate myDate "DD-MM-YYYY"}}
{{formatDate myDate "dddd, DD-MM-YYYY"}}
{{formatDate myDate "ddd, MM/DD/YY" "en-US"}}
{{formatDate myDate "dddd DD.MM.YYYY" "tr-TR"}}
*/
Handlebars.registerHelper('formatDate', function (dateStr, format, locale = 'tr-TR') {
    if (!dateStr) return '';

    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;

    // Build parts using Intl
    const parts = new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'long'
    }).formatToParts(date);

    const map = {};
    parts.forEach(({ type, value }) => {
        map[type] = value;
    });

    // Normalize tokens
    const tokens = {
        YYYY: map.year,
        YY: map.year.slice(-2),
        MM: map.month,
        DD: map.day,
        dddd: map.weekday, // full day name (Monday)
        ddd: map.weekday.slice(0, 3) // short (Mon) — simple fallback
    };

    return format.replace(/YYYY|YY|MM|DD|dddd|ddd/g, t => tokens[t] || t);
});