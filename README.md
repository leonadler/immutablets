# ImmutableTS

Immutable, Observable, performant typed structures for TypeScript.

Designed for use with rxjs observables in angular2 projects - but works without dependencies.


## What is an immutable application state?

In short: If an object A equals object B, all properties of A are equal to the same property of B.
Since most applications read data way more than modifying it, getting notified of changes
instead of comparing values to previous values is way more efficient.

This plays nicely with angulars change detection, which compares by reference (===) and assumes
that any input that receives the same value as before was not changed.


## Getting started

```
npm install immutablets
```

Define application state as a class decorated with @Immutable:

```
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

```
@Component({
    template: `<file-list [files]="(currentFolder | async)?.files"></file-list>`,
    changeDetection: ChangeDetectionStrategy.OnPush
})
class FolderDetailsComponent {
    currentFolder: Observable<Folder>;
    constructor(private appState: ApplicationState) {
        this.currentFolder = Observable.from(observeChanges(appState))
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

```
@Immutable()
class BadFolderListImplementation {
    private folders: Folder[];
    add(newFolder: Folder) {
        this.folders.push(newFolder);
        //           ^ push changes the array without changing the "folders" reference.
        //             MethodNonImmutableError is thrown.
    }
}
```

When the method creates a new object instead of changing an existing one, no error is thrown:
```
    add(newFolder: Folder) {
        this.folders = [...this.folders, newFolder];
    }
```

## License

(MIT)[LICENSE]
