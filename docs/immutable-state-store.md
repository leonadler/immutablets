# ImmutableStateStore class

When an application grows to a certain size, the application state ends up to be one huge class.
`ImmutableStateStore` splits the state into smaller, maintainable classes ("branches").

## Example for a complex application state

Let's assume we are writing a software for monitoring cloud server instances.
We have one central provider for our app state (typed as `ApplicationState`).

```TypeScript
// app-state.d.ts
export interface ApplicationState {
    auth: AuthState;
    messages: MessageState;
    servers: ServerState;
}
```

```TypeScript
// app-state.service.ts
type ActionBranches = {
    auth: AuthActions;
    messages: MessageActions;
    servers: ServerActions;
};

@Injectable()
export class ApplicationStateService {

    /** Get the current app state tree as a plain object. */
    get state(): AppState {
        return this.stateSubject.value;
    }

    /** Actions that can change the application state. */
    readonly actions: ActionBranches;

    protected store: ImmutableStateStore<AppState, ActionBranches>;
    private stateSubject: BehaviorSubject<AppState>;

    constructor(auth: AuthActions,
                messages: MessageStateActions,
                servers: ServerActions) {

        this.store = new ImmutableStateStore<AppState, ActionBranches>({
            auth,
            messages,
            servers
        });
        this.actions = this.store.actions;
        this.stateSubject = new BehaviorSubject(this.store.state);
    }

    /**
     * Returns a stream of the state tree mapped by the passed selector function.
     * Emits the current state at that branch and every time the mapped branch changes.
     * If the mapped value did not change during an action, no values are emitted.
     */
    select<R>(selector: (state: AppState) => R): Observable<R> {
        return this.stateSubject
            .asObservable()
            .map(selector)
            .distinctUntilChanged();
    }
}
```

Now we can create action branches which handle only one aspect of the app. The constructor
of the action class defines the initial state, methods define actions that change the state:

```TypeScript
// auth-state.ts
export interface AuthState {
    loggedIn: boolean;
    loggingIn: boolean;
    username: string;
}

@Injectable()
@Immutable()
export class AuthActions extends StateActionBranch<AppState> {
    @CloneDepth(1) private auth: AuthState;

    constructor() {
        super({
            uses: ['auth'],
            initialState: {
                auth: {
                    isLoggedIn: false,
                    loggingIn: false,
                    username: ''
                }
            }
        });
    }

    /** Called when sending the login request to the server */
    loginStart() {
        this.auth.loggingIn = true;
    }

    /** Called when the login was successful */
    loginSuccess(username: string) {
        this.auth.loggingIn = false;
        this.auth.loggedIn = true;
        this.auth.username = username;
    }

    /** Called when the login request failed */
    loginFailed() {
        this.auth.loggingIn = false;
        this.auth.loggedIn = false;
    }
}

```

```TypeScript
// message-state.ts
export interface MessageState {
    loaded: boolean;
    loading: boolean;
    inbox: Message[];
    unread: number;
}

@Injectable()
@Immutable()
export class MessageActions extends StateActionBranch<AppState> {
    @CloneDepth(1) private messages: MessageState;

    constructor() {
        super({
            uses: ['messages'],
            initialState: {
                messages: {
                    loaded: false,
                    loading: false,
                    inbox: [],
                    unread: 0
                }
            }
        });
    }

    loadMessagesFromServer() {
        this.messages.loading = true;
    }

    messagesLoaded(list: Message[]) {
        this.messages.inbox = list;
        this.messages.loaded = true;
        this.messages.loading = false;
        this.messages.unread = list.filter(msg => !msg.read).length;
    }

    markedAsUnread(messageId: number) {
        for (let i = 0; i < this.messages.inbox.length; i++) {
            const message = this.messages.inbox[i];
            if (message.id === messageId) {
                if (!message.read) {
                    const newList = [
                        ...this.messages.inbox.slice(0, i),
                        { ...message, read: true },
                        ...this.messages.inbox.slice(i + 1)
                    ];
                    this.messages = {
                        ...this.messages,
                        list: newList,
                        unread: this.messages.unread - 1
                    };
                }
            }
        }
    }
}
```

```TypeScript
// server-state.ts
export interface ServerState {
    instances: ServerInstance[];
    loading: boolean;
}

@Injectable()
@Immutable()
export class MessageActions extends StateActionBranch<AppState> {
    @CloneDepth(1) private servers: ServerState;

    constructor() {
        super({
            uses: ['servers'],
            initialState: {
                servers: {
                    instances: [],
                    loading: false
                }
            }
        });
    }

    loadInstancesStart() {
        this.servers.loading = true;
    }

    instancesLoaded(list: ServerInstance[]) {
        this.servers.loading = false;
        this.servers.instances = list;
    }
}
```

The Application state is now emitted as one object of the type `ApplicationState`:

```TypeScript
ApplicationState {
    auth: AuthState;
    messages: MessageState;
    servers: ServerState;
}
```

We can now observe the app state everywhere we want to render parts of our application state:

```TypeScript
// server-list.component.ts
@Component({
    selector: 'server-list',
    template: `
        <h2>List of all servers:</h2>
        <div *ngFor="let server of (servers | async)">
            <p>{{ server.name }}</p>
            <p class="status">{{ server.status }}</p>
        </div>`
})
class ServerListComponent {
    servers: Observable<ServerInstance[]>;
    constructor(appState: ApplicationStateService) {
        this.servers = appState.map(state => state.servers.instances);
    }
}
```

```TypeScript
// login-form.component.ts
@Component({
    selector: 'login-form',
    template: `
        <form *ngIf="!(loggedIn | async)" (ngSubmit)="startLogin(form.value)" #form="ngForm">
            <input name="username" ngModel [disabled]="loggingIn | async">
            <input name="password" ngModel [disabled]="loggingIn | async" type="password">
        </form>`
})
class LoginFormComponent {
    loggingIn: Observable<boolean>;
    loggedIn: Observable<boolean>;
    constructor(private appState: ApplicationStateService) {
        this.loggingIn = appState.map(state => state.auth.loggingIn);
        this.loggedIn = appState.map(state => state.auth.loggedIn);
    }

    startLogin() {
        this.appState.actions.auth.loginStart();
        // ... send api request ...
        this.appState.actions.auth.loginSuccess(usernameFromServer);
    }
}
```
