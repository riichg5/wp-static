module.exports = {
    "env": {
        "es6": true,
        "node": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "sourceType": "module"
    },
    "parser": "babel-eslint",
    "globals":{
        "_util": true,
        "_base": true,
        "_": true,
        "_config": true,
        "_utils": true,
        "_logger": true,
        "describe": true,
        "before": true,
        "after": true,
        "it": true,
        "CONST": true,
        "ERRORS": true,
        "_co": true,
        "_throw": true,
        "_resolve": true,
        "_reject": true
    },
    "rules": {
        "no-console": "off",
        "indent": "off",
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "off"
        ],
        "semi": [
            "warn",
            "always"
        ],
        "no-unused-vars": [
            "warn"
        ],
        "no-duplicate-case": 2,//switch中的case标签不能重复
        "default-case": 2//switch语句最后必须有default
    }
};