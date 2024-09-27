import * as React from 'react';
import fakeDataProvider from 'ra-data-fakerest';
import { QueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Browser } from '../../storybook/FakeBrowser';
import { CoreAdmin } from '../../core/CoreAdmin';
import { CoreAdminContext } from '../../core/CoreAdminContext';
import { CoreAdminUI } from '../../core/CoreAdminUI';
import { Resource } from '../../core/Resource';
import { AuthProvider, DataProvider } from '../../types';
import { TestMemoryRouter } from '../../routing/TestMemoryRouter';
import { EditControllerProps, useEditController } from './useEditController';

export default {
    title: 'ra-core/controller/useEditController',
};

const styles = {
    mainContainer: {
        margin: '20px 10px',
    },
};

const defaultDataProvider = fakeDataProvider(
    {
        posts: [
            { id: 1, title: 'Post #1', votes: 90 },
            { id: 2, title: 'Post #2', votes: 20 },
            { id: 3, title: 'Post #3', votes: 30 },
            { id: 4, title: 'Post #4', votes: 40 },
            { id: 5, title: 'Post #5', votes: 50 },
            { id: 6, title: 'Post #6', votes: 60 },
            { id: 7, title: 'Post #7', votes: 70 },
        ],
    },
    process.env.NODE_ENV === 'development'
);

const Post = (props: Partial<EditControllerProps>) => {
    const params = useEditController({
        id: 1,
        resource: 'posts',
        ...props,
    });
    return (
        <div style={styles.mainContainer}>
            {params.isPending ? (
                <p>Loading...</p>
            ) : (
                <div>
                    {params.record.title} - {params.record.votes} votes
                </div>
            )}
        </div>
    );
};

const defaultAuthProvider: AuthProvider = {
    checkAuth: () => new Promise(resolve => setTimeout(resolve, 500)),
    login: () => Promise.resolve(),
    logout: () => Promise.resolve(),
    checkError: () => Promise.resolve(),
    getPermissions: () => Promise.resolve(),
};

export const Authenticated = ({
    authProvider = defaultAuthProvider,
    dataProvider = defaultDataProvider,
}: {
    authProvider?: AuthProvider;
    dataProvider?: DataProvider;
}) => {
    return (
        <TestMemoryRouter initialEntries={['/posts/1']}>
            <CoreAdminContext
                dataProvider={dataProvider}
                authProvider={authProvider}
            >
                <CoreAdminUI>
                    <Resource name="posts" edit={Post} />
                </CoreAdminUI>
            </CoreAdminContext>
        </TestMemoryRouter>
    );
};

export const DisableAuthentication = ({
    authProvider = defaultAuthProvider,
    dataProvider = defaultDataProvider,
}: {
    authProvider?: AuthProvider;
    dataProvider?: DataProvider;
}) => {
    return (
        <TestMemoryRouter initialEntries={['/posts/1']}>
            <CoreAdminContext
                dataProvider={dataProvider}
                authProvider={authProvider}
            >
                <CoreAdminUI>
                    <Resource
                        name="posts"
                        edit={<Post disableAuthentication />}
                    />
                </CoreAdminUI>
            </CoreAdminContext>
        </TestMemoryRouter>
    );
};

export const CanAccess = ({
    authProviderDelay = 300,
}: {
    authProviderDelay?: number;
}) => {
    return (
        <TestMemoryRouter initialEntries={['/posts']}>
            <AccessControlAdmin
                authProviderDelay={authProviderDelay}
                queryClient={new QueryClient()}
            />
        </TestMemoryRouter>
    );
};

const AccessControlAdmin = ({
    authProviderDelay,
    queryClient,
}: {
    authProviderDelay?: number;
    queryClient: QueryClient;
}) => {
    const [authorizedResources, setAuthorizedResources] = React.useState({
        'posts.list': true,
        'posts.create': false,
        'posts.edit': true,
        'posts.show': false,
    });

    const authProvider: AuthProvider = {
        login: () => Promise.reject(new Error('Not implemented')),
        logout: () => Promise.reject(new Error('Not implemented')),
        checkAuth: () => Promise.resolve(),
        checkError: () => Promise.reject(new Error('Not implemented')),
        getPermissions: () => Promise.resolve(undefined),
        canAccess: ({ action, resource }) =>
            new Promise(resolve => {
                setTimeout(() => {
                    resolve(authorizedResources[`${resource}.${action}`]);
                }, authProviderDelay);
            }),
    };
    return (
        <AccessControlUI
            queryClient={queryClient}
            authorizedResources={authorizedResources}
            setAuthorizedResources={setAuthorizedResources}
        >
            <CoreAdmin
                authProvider={authProvider}
                dataProvider={defaultDataProvider}
                queryClient={queryClient}
                unauthorized={Unauthorized}
                loading={Loading}
                authenticationError={AuthenticationError}
            >
                <Resource
                    name="posts"
                    list={
                        <div>
                            <div>List</div>
                            <Link to="/posts/1">Edit</Link>
                        </div>
                    }
                    edit={<Post />}
                />
            </CoreAdmin>
        </AccessControlUI>
    );
};

const AccessControlUI = ({
    children,
    setAuthorizedResources,
    authorizedResources,
    queryClient,
}: {
    children: React.ReactNode;
    setAuthorizedResources: Function;
    authorizedResources: {
        'posts.list': boolean;
        'posts.create': boolean;
        'posts.edit': boolean;
        'posts.show': boolean;
    };
    queryClient: QueryClient;
}) => {
    return (
        <div>
            <div>
                <label>
                    <input
                        type="checkbox"
                        checked={authorizedResources['posts.list']}
                        onChange={() => {
                            setAuthorizedResources(state => ({
                                ...state,
                                'posts.list':
                                    !authorizedResources['posts.list'],
                            }));

                            queryClient.clear();
                        }}
                    />
                    posts.list access
                </label>
                <br />
                <label>
                    <input
                        type="checkbox"
                        checked={authorizedResources['posts.create']}
                        onChange={() => {
                            setAuthorizedResources(state => ({
                                ...state,
                                'posts.create':
                                    !authorizedResources['posts.create'],
                            }));

                            queryClient.clear();
                        }}
                    />
                    posts.create access
                </label>
                <br />
                <label>
                    <input
                        type="checkbox"
                        checked={authorizedResources['posts.edit']}
                        onChange={() => {
                            setAuthorizedResources(state => ({
                                ...state,
                                'posts.edit':
                                    !authorizedResources['posts.edit'],
                            }));

                            queryClient.clear();
                        }}
                    />
                    posts.edit access
                </label>
                <br />
                <label>
                    <input
                        type="checkbox"
                        checked={authorizedResources['posts.show']}
                        onChange={() => {
                            setAuthorizedResources(state => ({
                                ...state,
                                'posts.show':
                                    !authorizedResources['posts.show'],
                            }));

                            queryClient.clear();
                        }}
                    />
                    posts.show access
                </label>
            </div>
            <Browser>{children}</Browser>
        </div>
    );
};

const Unauthorized = () => {
    return (
        <div>
            <div>Unauthorized</div>
        </div>
    );
};
const AuthenticationError = () => {
    return (
        <div>
            <div>AuthenticationError</div>
        </div>
    );
};

const Loading = () => <div>Loading...</div>;
