
prepare: install hooks

install:
	npm ci

coverage: install
	npm run coverage

ci: install
	npm test
	npm run lint

hooks:
	git config core.hooksPath .tools/git-hooks
	chmod +x .tools/git-hooks/*

publish:
	bash .tools/publish.sh master
