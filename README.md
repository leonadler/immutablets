# Performant immutable structures for TypeScript.

[![npm version](https://badge.fury.io/js/immutablets.svg)](https://www.npmjs.com/package/immutablets)
[![travis build status](https://travis-ci.org/leonadler/immutablets.svg)](https://travis-ci.org/leonadler/immutablets/)

Designed for use with rxjs observables and Angular, but works without dependencies.


## What is an immutable application state?

In short: If an object A equals object B, all properties of A are equal to the same property of B.
Since most applications read data way more than modifying it, getting notified of changes
instead of comparing values to previous values is way more efficient.

This plays nicely with angulars change detection, which compares by reference (===) and assumes
that any input that receives the same value as before was not changed.


## Getting started

```Bash
npm install immutablets
```

Define your application state as a class decorated with `@Immutable`:

```TypeScript
import { Immutable } from 'immutablets';

@Immutable()
class ApplicationState {
    folders: { [id: number]: Folder };
    files: { [id: number]: File };
    currentFolder: number;

    openFolder(folderId: number) {
        this.currentFolder = folderId;
    }

    filesLoaded(folderId: number, files: File[]) {
        this.folders = { ...this.folders, [folderId]: { ...this.folders[folderId], files } };
    }
}
```

Observe the application state for changes:

```TypeScript
@Component({
    template: `
        <file-list [files]="(currentFolder | async)?.files">
        </file-list>`,
    changeDetection: ChangeDetectionStrategy.OnPush
})
class FolderDetailsComponent {
    currentFolder: Observable<Folder>;
    constructor(private appState: ApplicationState) {
        this.currentFolder = observeChanges(appState, Observable)
            .map(state => state.folders[state.currentFolder])
            .distinctUntilChanged();
    }
}
```

## Write mutation-safe code and get notified when you did not

Instead of forcing you to use a different data structure to store your data, you will be encouraged
to write mutation-safe code with plain javascript objects and arrays.

### Checking your code for object mutations

If any method call changes properties of an existing reference
instead of creating a new object, a MethodNonImmutableError will be thrown:

```TypeScript
@Immutable()
class BadFolderListImplementation {
    private folders: Folder[];
    add(newFolder: Folder) {
        this.folders.push(newFolder);
        //           ^ push changes the array, therefore
        //             a MethodNonImmutableError is thrown.
    }
}
```

When the method creates a new object instead of changing an existing one, no error is thrown:

```TypeScript
    add(newFolder: Folder) {
        this.folders = [...this.folders, newFolder];
    }
```

## Documentation

(work in progress)

* [How to use](docs/how-to-use.md)
* [@Immutable](docs/immutable-decorator.md)
* [ImmutableStateStore](docs/immutable-state-store.md)
* [Utility functions](docs/utility-functions.md)

## License

[MIT](LICENSE)
