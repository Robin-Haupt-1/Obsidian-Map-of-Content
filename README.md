## Top Level Indexer (Obsidian Plugin)

I'm working on creating a plugin for Obsidian.md to analyze each note's relationship within a semantic context, all centering around one "Top Level Index" note.

The goal is to create a tool to sort all the user's notes in a way that is both hierachical and flexible. It's a modern implementation of the classic Zettelkasten prefix system used by Niklas Luhmann.

In my implementation, each note can be a parent, child, category and/or tag at the same time, and changes to the semantic connections of one note are automatically propagated to the path information of all notes that are related to it in some way.