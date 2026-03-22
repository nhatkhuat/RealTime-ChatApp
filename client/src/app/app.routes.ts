import { Routes } from '@angular/router';
import { Chat } from './chat/chat';
import { authGuard, loginGuard } from './guards/guards';

export const routes: Routes = [
    {
        path: 'chat',
        component: Chat,
        canActivate: [authGuard]
    },
    {
        path: 'register',
        loadComponent: () =>
            import('./register/register').then(m => m.Register),
        canActivate: [loginGuard]
    },
    {
        path: 'login',
        loadComponent: () =>
            import('./login/login').then(m => m.Login),
        canActivate: [loginGuard]
    }, {
        path: '**',
        redirectTo: 'chat',
        pathMatch: 'full'
    }
];
