# Fork of File Explorer++ by kelszo

This is a low effort 99% vibe coded fork of the File Explorer++ plugin by kelszo.

Implemented https://github.com/kelszo/obsidian-file-explorer-plus/issues/30.

Seems to work (or at least doesn't fail immediately) after doing some basic testing

Probably won't work on this any more.

### AI generated README:

⚠️ **Heads up - This is experimental stuff!**

-   Don't try this in your main vault without backups!
-   I've only done minimal testing

## What's Different in This Fork?

I kicked out the file path and name filtering because it was unstable and unreliable (especially if you move files around or rename them). This also means you can't hide/pin folders anymore since they can't have front matter or tags.

Instead, this version lets you:

-   Filter files using tags: pinned and hidden
-   Use front matter properties for filtering
-   Flip hide filters around (show only hidden files)

## Known Quirks

-   No folder hiding/pinning
-   No filtering by file paths or names
-   Might have some undiscovered issues

## Want to Try It?

Feel free to experiment, but seriously - backup your vault first! If you find minor bugs, let me know and I might fix them. But heads up - if there are deeper issues, I probably won't dive into major refinements since this isn't my main focus.

Also feel free to build on this yourself.
