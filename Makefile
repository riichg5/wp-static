SRC_DIR=.
BUILD_DIR=./build
MODULES_DIR=$(SRC_DIR)/node_modules

JSLINT=$(MODULES_DIR)/jslint/bin/jslint.js
JSLINT_OPTIONS=--sloppy --stupid --node --color
JSHINT=$(MODULES_DIR)/jshint/bin/jshint

TESTS = $(shell find test -type f -name "*.test.js")
TEST_TIMEOUT = 5000
MOCHA_REPORTER = spec

# Default targets
all: test lint

$(BUILD_DIR):
	mkdir $(BUILD_DIR)

clean:
	-rm -rf $(BUILD_DIR)

restore: package.json
	npm install

test: restore runtests

runtest :
	# ./node_modules/mocha/bin/mocha -R spec -t 60000 ./test/spec/*
	@NODE_ENV=test ./node_modules/mocha/bin/mocha \
     	--reporter $(MOCHA_REPORTER) \
        -r should \
     	--timeout $(TEST_TIMEOUT) \
     	$(TESTS)

lint:
	find . -name "*.js" -not -regex "\./node_modules.*" -not -regex "\./lib/soap.*" -not -regex "\./test.*" -print0 | xargs -0 $(JSLINT) $(JSLINT_OPTIONS)

hint:
	$(JSHINT) *

install: test lint
	cp ./upstart/pulse.conf /etc/init/
	cp ./logrotate/pulse /etc/logrotate.d/

init_demo:
	cp -rf ./config/pm2/pm2_demo.json ./pm2_config.json
	cp -rf ./config/pm2/pm2_crawler_demo.json ./pm2_crawler.json

init_production:
	cp -rf ./config/pm2/pm2_production.json ./pm2_config.json
	cp -rf ./config/pm2/pm2_crawler_production.json ./pm2_crawler.json

init_qph_dev:
	cp -rf ./config/pm2/qph/pm2_qph_dev.json ./pm2_config.json
	cp -rf ./config/config/qph/qph_dev.json ./config/development.json
	cp -rf ./config/config/qph/default.json ./config/default.json

.PHONY: all restore test lint clean


