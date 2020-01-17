/*
 *  Copyright (C) 2019  Attila Aldemir <a_aldemir@hotmail.de>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { GetAccountPropertiesParams } from '@somedotone/ardor-ts';
import { Entity, EntityType, GetEntityParams, State, Error, ErrorCode } from '../src/index';
import config from './config';
import RequestMock from "./mocks/RequestMock";


if (config.test.entityModule.runTests) {
    describe('Entity module tests', () => {

        test('getEntity default attestor success', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string; dataFieldsString: string } => {
                expect(params.recipient).toBe(config.account.alice.address);
                expect(params.setter).toBe(config.account.alice.address);
                expect(params.property).toBe('ap://test-context');

                return { context: 'ap://test-context', dataFieldsString: '200|r|a|0000-0000-0000-00000|test-root-payload' };
            };

            const testEntity = new Entity(new RequestMock(getAccountPropertyCallback));


            const getEntityParams: GetEntityParams = {
                account: config.account.alice.address,
                attestationContext: 'ap://test-context'
            };

            const response = await testEntity.getEntity(config.node.url.testnet, getEntityParams);
            expect(response.account).toBe(config.account.alice.address);
            expect(response.attestationContext).toBe('ap://test-context');
            expect(response.entityType).toBe(EntityType.ROOT);
            expect(response.payload).toBe('test-root-payload');
            expect(response.protocolVersion).toBe('200');
            expect(response.redirectAccount).toBe('0000-0000-0000-00000');
            expect(response.state).toBe(State.ACTIVE);
        });


        test('getEntity specified attestor success', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string; dataFieldsString: string } => {
                expect(params.recipient).toBe(config.account.bob.address);
                expect(params.setter).toBe(config.account.alice.address);
                expect(params.property).toBe('ap://test-context');

                return { context: 'ap://test-context', dataFieldsString: '200|r|a|0000-0000-0000-00000|test-root-payload' };
            };

            const testEntity = new Entity(new RequestMock(getAccountPropertyCallback));


            const getEntityParams: GetEntityParams = {
                account: config.account.bob.address,
                attestationContext: 'ap://test-context',
                attestor: config.account.alice.address
            };

            const response = await testEntity.getEntity(config.node.url.testnet, getEntityParams);
            expect(response.account).toBe(config.account.bob.address);
            expect(response.attestationContext).toBe('ap://test-context');
            expect(response.entityType).toBe(EntityType.ROOT);
            expect(response.payload).toBe('test-root-payload');
            expect(response.protocolVersion).toBe('200');
            expect(response.redirectAccount).toBe('0000-0000-0000-00000');
            expect(response.state).toBe(State.ACTIVE);
        });


        test('getEntity attestation context not found error', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string; dataFieldsString: string } => {
                expect(params.recipient).toBe(config.account.bob.address);
                expect(params.setter).toBe(config.account.alice.address);
                expect(params.property).toBe('ap://test-context');

                return { context: 'none', dataFieldsString: 'none' };
            };

            const testEntity = new Entity(new RequestMock(getAccountPropertyCallback));


            const getEntityParams: GetEntityParams = {
                account: config.account.bob.address,
                attestationContext: 'ap://test-context',
                attestor: config.account.alice.address
            };

            try {
                await testEntity.getEntity(config.node.url.testnet, getEntityParams);
                fail('should not reach here');
            } catch (e) {
                const error = e as Error;
                expect(error.code).toBe(ErrorCode.ATTESTATION_CONTEXT_NOT_FOUND);
                expect(error.description).toBeDefined();
            }
        });


        test('getEntity attestation context without prefix success', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string; dataFieldsString: string } => {
                expect(params.property).toBe('ap://test-context');

                return { context: 'ap://test-context', dataFieldsString: '200|r|a|0000-0000-0000-00000|test-root-payload' };
            };

            const testEntity = new Entity(new RequestMock(getAccountPropertyCallback));


            const getEntityParams: GetEntityParams = {
                account: config.account.alice.address,
                attestationContext: 'test-context'
            };

            const response = await testEntity.getEntity(config.node.url.testnet, getEntityParams);
            expect(response.attestationContext).toBe('ap://test-context');
        });

    });
} else {
    test('dummy', () => {
        expect(true).toBeTruthy();
    });
}