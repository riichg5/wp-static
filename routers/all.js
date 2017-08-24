function registRouter (app, router, middleware, handlers) {
    router.all(
        '/*',
         handlers.proxy()
    );
}

module.exports = registRouter;