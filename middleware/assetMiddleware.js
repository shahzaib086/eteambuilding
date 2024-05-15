module.exports = function (req, res, next) {
    res.locals.asset = function (path) {
        return `/${path}`; // Replace '/assets/' with your asset path
    };
    next();
};