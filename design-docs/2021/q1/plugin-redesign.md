---
title: Plugin Design Doc
author: Kevin Siegler (@topocount)
created: 2021-02-02
---

# Plugin Design Doc

## Overview

SourceCred plugins are almost completely beholden to their datasources.
A local cache exists, but its only real purpose is to provide a local source of data for graph creation.
Plugin caches cannot stand by themselves for too long and are easily blown out by upstream changes.
Additionally, caches are only built in environments local to graph creation.
They cannot easily be shared over a network, or provide any real source of truth outside of the API.

@hammadj has designed an new [plugin model] that relies upon a `DataProvider` and `DataArchive` as a persistent mirror of data from a specific platform.
This is a significant improvement over the existing model described above because it allows for the persistence of cred data independent of a platform ability (or willingness) to provide the raw information needed to build cred data over time.
![snapshot of plugin model]

[plugin model]: https://lucid.app/lucidchart/591bf744-fdbe-4aa2-a0c5-4be90f436a71/view?page=0_0#
[snapshot of plugin model]: https://cdn.discordapp.com/attachments/714955718788382750/806248646625984542/Blank_diagram_-_Page_1.png

## Informal Specification

### DataProvider

A `DataProvider` acts as a mirror for some source of community activity.
In terms of our current use cases, this means that it will periodically query an API and store successful responses persistently in an archive.
DataProviders are specifically responsible for:

- obtaining data from the API
- writing successfully obtained data to a `DataArchive`

### DataArchive

A `DataArchive` is a platform or package in which mirrored data is stored.
A `DataArchive` could be built around [SQLite], [Ceramic], [Github], or anything else that can persist data.
DataArchives are specifically responsible for:

- storing data received from a `DataProvider` persistently
- serving this mirrored data via its own API to plugins.
- Implementing and exporting a `DataAdapter`, which will provide a common interface
  across Archives, and is utilized by plugins to read data from the archive.

Developers will be responsible for contructing each data source's `DataArchive` [schema].
Schemas should do the following:

- store all classes of information in an easily accessible schema. Try to normalize data as much as possible. to enforce consistency across the dataset
- maintain synchronization timestamps so it's easy to see how recently each table or class of data has been updated.

[sqlite]: https://sqlite.org/index.html
[ceramic]: https://developers.ceramic.network
[github]: https://docs.github.com/en
[schema]: https://en.wikipedia.org/wiki/Database_schema

## Implementation Steps

The proof of concept for this design will be a Discord Datastore and a props
plugin that builds a graph from the data provided by the store.

1. Spec out an interface for the `DataProvider` and DataAdapter. These interfaces
   should make it possible for a service to interact with the `DataProvider`, while
   still allowing for a enough flexibility for `DataProvider`s to be written for
   arbitrary APIs.
   SourceCred typically implements major changes incrementally, with a strong bias towards integrating early and then adding features as the need emerges.
   In keeping with this pattern, the initial API interfaces will be simply `read` and `write`. for the DataStore and DataAdapter, rspectively.

2. Implement a `DataProvider` for Discord
3. Implement a `DataArchive` and `DataAdapter` class for Discord using Ceramic.
4. Implement a [Props] plugin that is only concerned with constructing a graph
   from props channel activity.
5. (optional) fork the Discord plugin and refactor it to consume the discourse
   `DataArchive` as opposed to the Discord API directly.

[props]: https://sourcecred.io/docs/beta/our-platforms#special-channels

## Future Considerations

Some potential future features include:

- creating more granular APIs for `DataArchives` more suitable for micro-plugins
  dependent upon Discord data.
- Implementing additional microplugins, e.g. for meetings.
- Implementing this stack for Github to expand support for project management
  workflows.
