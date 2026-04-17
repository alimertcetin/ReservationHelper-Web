import Handlebars from 'handlebars';

// Helper for Equality: {{#eq accountType "BANK"}} ... {{/eq}}
Handlebars.registerHelper('eq', function (a, b, options) {
    return a === b ? options.fn(this) : options.inverse(this);
});

// Helper for Comparisons: {{#compare total ">" 5000}} ... {{/compare}}
Handlebars.registerHelper('compare', function (v1, operator, v2, options) {
    const operators = {
        '==':  (a, b) => a == b,
        '==️=': (a, b) => a === b,
        '!=':  (a, b) => a != b,
        '>':   (a, b) => a > b,
        '<':   (a, b) => a < b,
        '>=':  (a, b) => a >= b,
        '<=':  (a, b) => a <= b,
    };
    const result = operators[operator](v1, v2);
    return result ? options.fn(this) : options.inverse(this);
});