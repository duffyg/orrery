module.exports = {
    "env": {
        "browser": true,
        "es2021": true
    },
    "extends": "standard",
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    "rules": {
        'indent': ['error', 4],
        'brace-style': ['error', 'stroustrup', { 'allowSingleLine': true }],
    },
    "globals": {
        "PlanetPosition": "readonly",
        "cordova": "readonly"
    }
}
