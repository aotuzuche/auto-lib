
git checkout master
git merge dev

#!/usr/bin/env sh
set -e
echo "Enter release version: "
read VERSION

read -p "Releasing $VERSION - are you sure? (y/n)" -n 1 -r
echo    # (optional) move to a new line
if [[ $REPLY =~ ^[Yy]$ ]]
then
  # build
  npm version $VERSION --no-git-tag-version
  VERSION=$VERSION

  # commit
  git tag v$VERSION
  git commit -am "build: release $VERSION"

  # publish
  git push origin master
  git push origin refs/tags/v$VERSION
  git checkout dev
  git rebase master
  git push origin dev

  npm run build
  npm publish

  # docs
  npm run changelog
  git commit -am "docs: add $VERSION docs"
  git push origin dev
fi
