import assert from 'node:assert/strict';
import { resolvePostAuthPath } from './navigation.js';

export function runNavigationFunctionalTests() {
    assert.equal(resolvePostAuthPath('?next=%2Fauth', '/dashboard'), '/dashboard');
    assert.equal(resolvePostAuthPath('?next=%2Fauth%3Fnext%3D%252Foffers', '/dashboard'), '/dashboard');
    assert.equal(resolvePostAuthPath('?next=%2Foffers%3Ftype%3Dsubs', '/dashboard'), '/offers?type=subs');
}
