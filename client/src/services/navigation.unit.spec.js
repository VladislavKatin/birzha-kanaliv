import assert from 'node:assert/strict';
import { buildAuthRedirectPath, resolvePostAuthPath } from './navigation.js';

export function runNavigationUnitTests() {
    assert.equal(
        buildAuthRedirectPath('/offers'),
        '/auth?next=%2Foffers',
    );

    assert.equal(
        resolvePostAuthPath('?next=%2Foffers', '/dashboard'),
        '/offers',
    );

    assert.equal(
        resolvePostAuthPath('?next=https://evil.example.com', '/dashboard'),
        '/dashboard',
    );
}
