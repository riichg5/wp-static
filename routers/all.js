function registRouter (app, router, middleware, handlers) {
    router.get(
        '/*',
         handlers.proxy()
    );
}

module.exports = registRouter;