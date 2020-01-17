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

import { GetAccountPropertiesParams, SetAccountPropertyParams } from '@somedotone/ardor-ts';
import { Data, EntityCheckParams, EntityType, Error, ErrorCode, SignDataParams, SignedDataCheckParams, State, VerifySignedDataParams } from '../src/index';
import config from './config';
import RequestMock from "./mocks/RequestMock";


if (config.test.dataModule.runTests) {
    describe('Data module tests', () => {

        test('sign / verify signed data success', async () => {
            const decodeTokenCallback = (): { account: string; valid: boolean } => {
                return { account: config.account.erin.address, valid: true };
            };

            const setAccountPropertyCallback = (): void => fail('should not reach here');

            let propCnt = 0;
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string; dataFieldsString: string } => {

                if (propCnt === 0) {
                    expect(params.recipient).toBe(config.account.erin.address);
                    expect(params.setter).toBe(config.account.david.address);
                    expect(params.property).toBe('ap://test-context');

                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '200|l|a|0000-0000-0000-00000|test-leaf-payload' };
                }

                if (propCnt === 1) {
                    expect(params.recipient).toBe(config.account.david.address);
                    expect(params.setter).toBe(config.account.charlie.address);
                    expect(params.property).toBe('ap://test-context');

                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '200|i|a|0000-0000-0000-00000|test-intermediate-payload' };
                }

                if (propCnt === 2) {
                    expect(params.recipient).toBe(config.account.charlie.address);
                    expect(params.setter).toBe(config.account.bob.address);
                    expect(params.property).toBe('ap://test-context');

                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '200|i|a|0000-0000-0000-00000|test-intermediate-payload' };
                }

                if (propCnt === 3) {
                    expect(params.recipient).toBe(config.account.bob.address);
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');

                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '200|i|a|0000-0000-0000-00000|test-intermediate-payload' };
                }

                if (propCnt === 4) {
                    expect(params.recipient).toBe(config.account.alice.address);
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');

                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '200|r|a|0000-0000-0000-00000|test-root-payload' };
                }


                fail('should not reach here');
                return { context: 'none', dataFieldsString: 'none' };
            };

            const testData = new Data(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback, decodeTokenCallback));


            const signDataParams: SignDataParams = {
                attestationContext: 'test-context',
                attestationPath: [ config.account.david.address, config.account.charlie.address, config.account.bob.address, config.account.alice.address ],
                payload: 'test-signed-data-payload',
                passphrase: config.account.erin.secret
            };

            const signedData = testData.signData(signDataParams, true);


            const signedDataCheckCb = (params: SignedDataCheckParams): boolean => {
                expect(params.signedData.creatorAccount).toBe(config.account.erin.address);
                expect(params.signedData.payload).toBe('test-signed-data-payload');


                const timeWindow = 10 * 1000;
                const currentTime = (new Date()).getTime();
                expect(params.signatureTime + timeWindow).toBeGreaterThan(currentTime);
                expect(params.signatureTime - timeWindow).toBeLessThan(currentTime);

                return true;
            };

            let entCnt = 0;
            const entityCheckCb = (entity: EntityCheckParams): boolean => {
                if (entCnt === 0) {
                    expect(entity.account).toBe(config.account.erin.address);
                    expect(entity.entityType).toBe(EntityType.LEAF);
                    expect(entity.state).toBe(State.ACTIVE);
                    expect(entity.payload).toBe("test-leaf-payload");
                    expect(entity.protocolVersion).toBe("200");

                    entCnt++;
                    return true;
                }

                if (entCnt === 1) {
                    expect(entity.account).toBe(config.account.david.address);
                    expect(entity.entityType).toBe(EntityType.INTERMEDIATE);
                    expect(entity.state).toBe(State.ACTIVE);
                    expect(entity.payload).toBe("test-intermediate-payload");

                    entCnt++;
                    return true;
                }

                if (entCnt === 2) {
                    expect(entity.account).toBe(config.account.charlie.address);
                    expect(entity.entityType).toBe(EntityType.INTERMEDIATE);
                    expect(entity.state).toBe(State.ACTIVE);
                    expect(entity.payload).toBe("test-intermediate-payload");

                    entCnt++;
                    return true;
                }

                if (entCnt === 3) {
                    expect(entity.account).toBe(config.account.bob.address);
                    expect(entity.entityType).toBe(EntityType.INTERMEDIATE);
                    expect(entity.state).toBe(State.ACTIVE);
                    expect(entity.payload).toBe("test-intermediate-payload");

                    entCnt++;
                    return true;
                }

                if (entCnt === 4) {
                    expect(entity.account).toBe(config.account.alice.address);
                    expect(entity.entityType).toBe(EntityType.ROOT);
                    expect(entity.state).toBe(State.ACTIVE);
                    expect(entity.payload).toBe("test-root-payload");

                    entCnt++;
                    return true;
                }

                fail('should not reach here');
                return false;
            };


            const verifyParams: VerifySignedDataParams = {
                trustedRootAccount: config.account.alice.address,
                signedData,
                signedDataCheckCallback: signedDataCheckCb,
                entityCheckCallback: entityCheckCb
            };

            const response = await testData.verifySignedData(config.node.url.testnet, verifyParams, true);
            expect(response.activeRootAccount).toBe(config.account.alice.address);
            expect(String(response.verifiedTrustChain)).toBe(
                String([
                    config.account.erin.address,
                    config.account.david.address,
                    config.account.charlie.address,
                    config.account.bob.address,
                    config.account.alice.address
                ])
            );
        });


        test('verifySignedData root attest leaf success', async () => {
            const decodeTokenCallback = (): { account: string; valid: boolean } => {
                return { account: config.account.bob.address, valid: true };
            };

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => fail('should not reach here');

            let propCnt = 0;
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string; dataFieldsString: string } => {

                if (propCnt === 0) {
                    expect(params.recipient).toBe(config.account.bob.address);
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');

                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '200|l|a|0000-0000-0000-00000|test-leaf-payload' };
                }

                if (propCnt === 1) {
                    expect(params.recipient).toBe(config.account.alice.address);
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');

                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '200|r|a|0000-0000-0000-00000|test-root-payload' };
                }


                fail('should not reach here');
                return { context: 'none', dataFieldsString: 'none' };
            };

            const testData = new Data(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback, decodeTokenCallback));


            const signDataParams: SignDataParams = {
                attestationContext: 'test-context',
                attestationPath: [ config.account.alice.address ],
                payload: 'test-signed-data-payload',
                passphrase: config.account.bob.secret
            };

            const signedData = testData.signData(signDataParams, true);


            const signedDataCheckCb = (params: SignedDataCheckParams): boolean => {
                expect(params.signedData.creatorAccount).toBe(config.account.bob.address);

                const timeWindow = 10 * 1000;
                const currentTime = (new Date()).getTime();
                expect(params.signatureTime + timeWindow).toBeGreaterThan(currentTime);
                expect(params.signatureTime - timeWindow).toBeLessThan(currentTime);

                return true;
            };

            let entCnt = 0;
            const entityCheckCb = (entity: EntityCheckParams): boolean => {
                if (entCnt === 0) {
                    expect(entity.account).toBe(config.account.bob.address);
                    expect(entity.entityType).toBe(EntityType.LEAF);
                    expect(entity.state).toBe(State.ACTIVE);
                    expect(entity.payload).toBe("test-leaf-payload");

                    entCnt++;
                    return true;
                }

                if (entCnt === 1) {
                    expect(entity.account).toBe(config.account.alice.address);
                    expect(entity.entityType).toBe(EntityType.ROOT);
                    expect(entity.state).toBe(State.ACTIVE);
                    expect(entity.payload).toBe("test-root-payload");

                    entCnt++;
                    return true;
                }

                fail('should not reach here');
                return false;
            };


            const verifyParams: VerifySignedDataParams = {
                trustedRootAccount: config.account.alice.address,
                signedData,
                signedDataCheckCallback: signedDataCheckCb,
                entityCheckCallback: entityCheckCb
            };

            const response = await testData.verifySignedData(config.node.url.testnet, verifyParams, true);
            expect(response.activeRootAccount).toBe(config.account.alice.address);
            expect(String(response.verifiedTrustChain)).toBe(String([ config.account.bob.address, config.account.alice.address ]));
        });


        test('verifySignedData intermediate signed data success', async () => {
            const decodeTokenCallback = (): { account: string; valid: boolean } => {
                return { account: config.account.bob.address, valid: true };
            };

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => fail('should not reach here');

            let propCnt = 0;
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string; dataFieldsString: string } => {

                if (propCnt === 0) {
                    expect(params.recipient).toBe(config.account.bob.address);
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');

                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '200|i|a|0000-0000-0000-00000|test-intermediate-payload' };
                }

                if (propCnt === 1) {
                    expect(params.recipient).toBe(config.account.alice.address);
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');

                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '200|r|a|0000-0000-0000-00000|test-root-payload' };
                }


                fail('should not reach here');
                return { context: 'none', dataFieldsString: 'none' };
            };

            const testData = new Data(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback, decodeTokenCallback));


            const signDataParams: SignDataParams = {
                attestationContext: 'test-context',
                attestationPath: [ config.account.alice.address ],
                payload: 'test-signed-data-payload',
                passphrase: config.account.bob.secret
            };

            const signedData = testData.signData(signDataParams, true);


            const signedDataCheckCb = (params: SignedDataCheckParams): boolean => {
                expect(params.signedData.creatorAccount).toBe(config.account.bob.address);

                const timeWindow = 10 * 1000;
                const currentTime = (new Date()).getTime();
                expect(params.signatureTime + timeWindow).toBeGreaterThan(currentTime);
                expect(params.signatureTime - timeWindow).toBeLessThan(currentTime);

                return true;
            };

            let entCnt = 0;
            const entityCheckCb = (entity: EntityCheckParams): boolean => {
                if (entCnt === 0) {
                    expect(entity.account).toBe(config.account.bob.address);
                    expect(entity.entityType).toBe(EntityType.INTERMEDIATE);
                    expect(entity.state).toBe(State.ACTIVE);
                    expect(entity.payload).toBe("test-intermediate-payload");

                    entCnt++;
                    return true;
                }

                if (entCnt === 1) {
                    expect(entity.account).toBe(config.account.alice.address);
                    expect(entity.entityType).toBe(EntityType.ROOT);
                    expect(entity.state).toBe(State.ACTIVE);
                    expect(entity.payload).toBe("test-root-payload");

                    entCnt++;
                    return true;
                }

                fail('should not reach here');
                return false;
            };


            const verifyParams: VerifySignedDataParams = {
                trustedRootAccount: config.account.alice.address,
                signedData,
                signedDataCheckCallback: signedDataCheckCb,
                entityCheckCallback: entityCheckCb
            };

            const response = await testData.verifySignedData(config.node.url.testnet, verifyParams, true);
            expect(response.activeRootAccount).toBe(config.account.alice.address);
            expect(String(response.verifiedTrustChain)).toBe(String([ config.account.bob.address, config.account.alice.address ]));
        });


        test('verifySignedData root signed data success', async () => {
            const decodeTokenCallback = (): { account: string; valid: boolean } => {
                return { account: config.account.alice.address, valid: true };
            };

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => fail('should not reach here');

            let propCnt = 0;
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string; dataFieldsString: string } => {

                if (propCnt === 0) {
                    expect(params.recipient).toBe(config.account.alice.address);
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');

                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '200|r|a|0000-0000-0000-00000|test-root-payload' };
                }

                fail('should not reach here');
                return { context: 'none', dataFieldsString: 'none' };
            };

            const testData = new Data(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback, decodeTokenCallback));


            const signedDataCheckCb = (params: SignedDataCheckParams): boolean => {
                expect(params.signedData.creatorAccount).toBe(config.account.alice.address);

                const timeWindow = 10 * 1000;
                const currentTime = (new Date()).getTime();
                expect(params.signatureTime + timeWindow).toBeGreaterThan(currentTime);
                expect(params.signatureTime - timeWindow).toBeLessThan(currentTime);

                return true;
            };

            let entCnt = 0;
            const entityCheckCb = (entity: EntityCheckParams): boolean => {
                if (entCnt === 0) {
                    expect(entity.account).toBe(config.account.alice.address);
                    expect(entity.entityType).toBe(EntityType.ROOT);
                    expect(entity.state).toBe(State.ACTIVE);
                    expect(entity.payload).toBe("test-root-payload");

                    entCnt++;
                    return true;
                }

                fail('should not reach here');
                return false;
            };


            const signDataParams: SignDataParams = {
                attestationContext: 'test-context',
                payload: 'test-signed-data-payload',
                passphrase: config.account.alice.secret
            };

            const verifyParams: VerifySignedDataParams = {
                trustedRootAccount: config.account.alice.address,
                signedData: testData.signData(signDataParams, true),
                signedDataCheckCallback: signedDataCheckCb,
                entityCheckCallback: entityCheckCb
            };

            let response = await testData.verifySignedData(config.node.url.testnet, verifyParams, true);
            expect(response.activeRootAccount).toBe(config.account.alice.address);
            expect(String(response.verifiedTrustChain)).toBe(String([ config.account.alice.address ]));


            entCnt = 0;
            propCnt = 0;
            signDataParams.attestationPath = [];

            verifyParams.signedData = testData.signData(signDataParams, true);
            response = await testData.verifySignedData(config.node.url.testnet, verifyParams, true);
            expect(response.activeRootAccount).toBe(config.account.alice.address);
            expect(String(response.verifiedTrustChain)).toBe(String([ config.account.alice.address ]));


            entCnt = 0;
            propCnt = 0;
            signDataParams.attestationPath = undefined;

            verifyParams.signedData = testData.signData(signDataParams, true);
            response = await testData.verifySignedData(config.node.url.testnet, verifyParams, true);
            expect(response.activeRootAccount).toBe(config.account.alice.address);
            expect(String(response.verifiedTrustChain)).toBe(String([ config.account.alice.address ]));
        });


        test('verifySignedData root in the middle of path error', async () => {
            const decodeTokenCallback = (): { account: string; valid: boolean } => {
                return { account: config.account.charlie.address, valid: true };
            };

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => fail('should not reach here');

            let propCnt = 0;
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string; dataFieldsString: string } => {

                if (propCnt === 0) {
                    expect(params.recipient).toBe(config.account.charlie.address);
                    expect(params.setter).toBe(config.account.bob.address);
                    expect(params.property).toBe('ap://test-context');

                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '200|l|a|0000-0000-0000-00000|test-leaf-payload' };
                }

                if (propCnt === 1) {
                    expect(params.recipient).toBe(config.account.bob.address);
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');

                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '200|r|a|0000-0000-0000-00000|test-root-payload' };
                }


                fail('should not reach here');
                return { context: 'none', dataFieldsString: 'none' };
            };

            const testData = new Data(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback, decodeTokenCallback));


            const signDataParams: SignDataParams = {
                attestationContext: 'test-context',
                attestationPath: [ config.account.bob.address, config.account.alice.address ],
                payload: 'test-signed-data-payload',
                passphrase: config.account.charlie.secret
            };

            const signedData = testData.signData(signDataParams, true);


            try {
                await testData.verifySignedData(config.node.url.testnet, { signedData, trustedRootAccount: config.account.alice.address }, true);
                fail('should not reach here');
            } catch (e) {
                const error = e as Error;
                expect(error.code).toBe(ErrorCode.ROOT_ENTITY_IN_MIDDLE_OF_PATH);
                expect(error.description).toBeDefined();
            }
        });


        test('verifySignedData leaf as attestor error', async () => {
            const decodeTokenCallback = (): { account: string; valid: boolean } => {
                return { account: config.account.charlie.address, valid: true };
            };

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => fail('should not reach here');

            let propCnt = 0;
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string; dataFieldsString: string } => {

                if (propCnt === 0) {
                    expect(params.recipient).toBe(config.account.charlie.address);
                    expect(params.setter).toBe(config.account.bob.address);
                    expect(params.property).toBe('ap://test-context');

                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '200|l|a|0000-0000-0000-00000|test-leaf-payload' };
                }

                if (propCnt === 1) {
                    expect(params.recipient).toBe(config.account.bob.address);
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');

                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '200|l|a|0000-0000-0000-00000|test-root-payload' };
                }


                fail('should not reach here');
                return { context: 'none', dataFieldsString: 'none' };
            };

            const testData = new Data(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback, decodeTokenCallback));


            const signDataParams: SignDataParams = {
                attestationContext: 'test-context',
                attestationPath: [ config.account.bob.address, config.account.alice.address ],
                payload: 'test-signed-data-payload',
                passphrase: config.account.charlie.secret
            };

            const signedData = testData.signData(signDataParams, true);


            try {
                await testData.verifySignedData(config.node.url.testnet, { signedData, trustedRootAccount: config.account.alice.address }, true);
                fail('should not reach here');
            } catch (e) {
                const error = e as Error;
                expect(error.code).toBe(ErrorCode.LEAF_ATTESTOR_NOT_ALLOWED);
                expect(error.description).toBeDefined();
            }
        });


        test('verifySignedData token invalid error', async () => {
            const decodeTokenCallback = (): { account: string; valid: boolean } => {
                return { account: config.account.charlie.address, valid: false };
            };

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => fail('should not reach here');

            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string; dataFieldsString: string } => {
                fail('should not reach here');
                return { context: 'none', dataFieldsString: 'none' };
            };

            const testData = new Data(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback, decodeTokenCallback));


            const signDataParams: SignDataParams = {
                attestationContext: 'test-context',
                attestationPath: [ config.account.bob.address, config.account.alice.address ],
                payload: 'test-signed-data-payload',
                passphrase: config.account.charlie.secret
            };

            const signedData = testData.signData(signDataParams, true);


            try {
                await testData.verifySignedData(config.node.url.testnet, { signedData, trustedRootAccount: config.account.alice.address }, true);
                fail('should not reach here');
            } catch (e) {
                const error = e as Error;
                expect(error.code).toBe(ErrorCode.INVALID_SIGNATURE);
                expect(error.description).toBeDefined();
            }
        });


        test('verifySignedData wrong signed data creator error', async () => {
            const decodeTokenCallback = (): { account: string; valid: boolean } => {
                return { account: config.account.bob.address, valid: true };
            };

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => fail('should not reach here');

            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string; dataFieldsString: string } => {
                fail('should not reach here');
                return { context: 'none', dataFieldsString: 'none' };
            };

            const testData = new Data(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback, decodeTokenCallback));


            const signDataParams: SignDataParams = {
                attestationContext: 'test-context',
                attestationPath: [ config.account.bob.address, config.account.alice.address ],
                payload: 'test-signed-data-payload',
                passphrase: config.account.charlie.secret
            };

            const signedData = testData.signData(signDataParams, true);


            try {
                await testData.verifySignedData(config.node.url.testnet, { signedData, trustedRootAccount: config.account.alice.address }, true);
                fail('should not reach here');
            } catch (e) {
                const error = e as Error;
                expect(error.code).toBe(ErrorCode.WRONG_CREATOR_ACCOUNT);
                expect(error.description).toBeDefined();
            }
        });


        test('verifySignedData signed data callback returned false error', async () => {
            const decodeTokenCallback = (): { account: string; valid: boolean } => {
                return { account: config.account.charlie.address, valid: true };
            };

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => fail('should not reach here');

            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string; dataFieldsString: string } => {
                fail('should not reach here');
                return { context: 'none', dataFieldsString: 'none' };
            };

            const testData = new Data(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback, decodeTokenCallback));


            const signDataParams: SignDataParams = {
                attestationContext: 'test-context',
                payload: 'test-signed-data-payload',
                passphrase: config.account.charlie.secret
            };

            const signedData = testData.signData(signDataParams, true);


            const signedDataCheckCb = (params: SignedDataCheckParams): boolean => {
                return false;
            };


            const verifyParams: VerifySignedDataParams = {
                trustedRootAccount: config.account.alice.address,
                signedData,
                signedDataCheckCallback: signedDataCheckCb
            };

            try {
                await testData.verifySignedData(config.node.url.testnet, verifyParams, true);
                fail('should not reach here');
            } catch (e) {
                const error = e as Error;
                expect(error.code).toBe(ErrorCode.SIGNED_DATA_CALLBACK_ERROR);
                expect(error.description).toBeDefined();
            }
        });


        test('verifySignedData entity callback returned false error', async () => {
            const decodeTokenCallback = (): { account: string; valid: boolean } => {
                return { account: config.account.bob.address, valid: true };
            };

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => fail('should not reach here');

            let propCnt = 0;
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string; dataFieldsString: string } => {

                if (propCnt === 0) {
                    expect(params.recipient).toBe(config.account.bob.address);
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');

                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '200|l|a|0000-0000-0000-00000|test-intermediate-payload' };
                }


                fail('should not reach here');
                return { context: 'none', dataFieldsString: 'none' };
            };

            const testData = new Data(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback, decodeTokenCallback));


            const signDataParams: SignDataParams = {
                attestationContext: 'test-context',
                attestationPath: [ config.account.alice.address ],
                payload: 'test-signed-data-payload',
                passphrase: config.account.bob.secret
            };

            const signedData = testData.signData(signDataParams, true);


            const entityCheckCb = (entity: EntityCheckParams): boolean => {
                return false;
            };


            const verifyParams: VerifySignedDataParams = {
                trustedRootAccount: config.account.alice.address,
                signedData,
                entityCheckCallback: entityCheckCb
            };

            try {
                await testData.verifySignedData(config.node.url.testnet, verifyParams, true);
                fail('should not reach here');
            } catch (e) {
                const error = e as Error;
                expect(error.code).toBe(ErrorCode.ENTITY_CALLBACK_ERROR);
                expect(error.description).toBeDefined();
            }
        });


        test('verifySignedData deprecation success', async () => {
            const decodeTokenCallback = (): { account: string; valid: boolean } => {
                return { account: config.account.erin.address, valid: true };
            };

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => fail('should not reach here');

            let propCnt = 0;
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string; dataFieldsString: string } => {

                if (propCnt === 0) {
                    expect(params.recipient).toBe(config.account.erin.address);
                    expect(params.setter).toBe(config.account.david.address);
                    expect(params.property).toBe('ap://test-context');

                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '200|l|a|0000-0000-0000-00000|test-leaf-payload' };
                }

                if (propCnt === 1) {
                    expect(params.recipient).toBe(config.account.david.address);
                    expect(params.setter).toBe(config.account.bob.address);
                    expect(params.property).toBe('ap://test-context');

                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '200|i|d|' + config.account.charlie.address.substring("ARDOR-".length) + '|test-intermediate-deprecated-payload' };
                }

                if (propCnt === 2) {
                    expect(params.recipient).toBe(config.account.charlie.address);
                    expect(params.setter).toBe(config.account.bob.address);
                    expect(params.property).toBe('ap://test-context');

                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '200|i|a|0000-0000-0000-00000|test-intermediate-payload' };
                }

                if (propCnt === 3) {
                    expect(params.recipient).toBe(config.account.bob.address);
                    expect(params.setter).toBe(config.account.bob.address);
                    expect(params.property).toBe('ap://test-context');

                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '200|r|d|' + config.account.alice.address.substring("ARDOR-".length) + '|test-root-deprecated-payload' };
                }

                if (propCnt === 4) {
                    expect(params.recipient).toBe(config.account.alice.address);
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');

                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '200|r|a|0000-0000-0000-00000|test-root-payload' };
                }


                fail('should not reach here');
                return { context: 'none', dataFieldsString: 'none' };
            };

            const testData = new Data(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback, decodeTokenCallback));


            const signDataParams: SignDataParams = {
                attestationContext: 'test-context',
                attestationPath: [ config.account.david.address, config.account.bob.address ],
                payload: 'test-signed-data-deprecation-payload',
                passphrase: config.account.erin.secret
            };

            const signedData = testData.signData(signDataParams, true);


            let entCnt = 0;
            const entityCheckCb = (entity: EntityCheckParams): boolean => {
                if (entCnt === 0) {
                    expect(entity.account).toBe(config.account.erin.address);
                    expect(entity.entityType).toBe(EntityType.LEAF);
                    expect(entity.state).toBe(State.ACTIVE);
                    expect(entity.payload).toBe("test-leaf-payload");

                    entCnt++;
                    return true;
                }

                if (entCnt === 1) {
                    expect(entity.account).toBe(config.account.david.address);
                    expect(entity.entityType).toBe(EntityType.INTERMEDIATE);
                    expect(entity.state).toBe(State.DEPRECATED);
                    expect(entity.payload).toBe("test-intermediate-deprecated-payload");

                    entCnt++;
                    return true;
                }

                if (entCnt === 2) {
                    expect(entity.account).toBe(config.account.charlie.address);
                    expect(entity.entityType).toBe(EntityType.INTERMEDIATE);
                    expect(entity.state).toBe(State.ACTIVE);
                    expect(entity.payload).toBe("test-intermediate-payload");

                    entCnt++;
                    return true;
                }

                if (entCnt === 3) {
                    expect(entity.account).toBe(config.account.bob.address);
                    expect(entity.entityType).toBe(EntityType.ROOT);
                    expect(entity.state).toBe(State.DEPRECATED);
                    expect(entity.payload).toBe("test-root-deprecated-payload");

                    entCnt++;
                    return true;
                }

                if (entCnt === 4) {
                    expect(entity.account).toBe(config.account.alice.address);
                    expect(entity.entityType).toBe(EntityType.ROOT);
                    expect(entity.state).toBe(State.ACTIVE);
                    expect(entity.payload).toBe("test-root-payload");

                    entCnt++;
                    return true;
                }

                fail('should not reach here');
                return false;
            };


            const verifyParams: VerifySignedDataParams = {
                trustedRootAccount: config.account.alice.address,
                signedData,
                entityCheckCallback: entityCheckCb
            };

            const response = await testData.verifySignedData(config.node.url.testnet, verifyParams, true);
            expect(response.activeRootAccount).toBe(config.account.alice.address);
            expect(String(response.verifiedTrustChain)).toBe(
                String([
                    config.account.erin.address,
                    config.account.david.address,
                    config.account.charlie.address,
                    config.account.bob.address,
                    config.account.alice.address
                ])
            );
        });


        test('verifySignedData multiple deprecation hops success', async () => {
            const decodeTokenCallback = (): { account: string; valid: boolean } => {
                return { account: config.account.frank.address, valid: true };
            };

            let propCnt = 0;
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string; dataFieldsString: string } => {

                if (propCnt === 0) {
                    expect(params.recipient).toBe(config.account.frank.address);
                    expect(params.setter).toBe(config.account.erin.address);
                    expect(params.property).toBe('ap://test-context');

                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '200|l|a|0000-0000-0000-00000|test-leaf-payload' };
                }

                if (propCnt === 1) {
                    expect(params.recipient).toBe(config.account.erin.address);
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');

                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '200|i|d|' + config.account.david.address.substring("ARDOR-".length) + '|test-intermediate-deprecated-payload' };
                }

                if (propCnt === 2) {
                    expect(params.recipient).toBe(config.account.david.address);
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');

                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '200|i|d|' + config.account.charlie.address.substring("ARDOR-".length) + '|test-intermediate-deprecated-payload' };
                }

                if (propCnt === 3) {
                    expect(params.recipient).toBe(config.account.charlie.address);
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');

                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '200|i|d|' + config.account.bob.address.substring("ARDOR-".length) + '|test-intermediate-deprecated-payload' };
                }

                if (propCnt === 4) {
                    expect(params.recipient).toBe(config.account.bob.address);
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');

                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '200|i|a|0000-0000-0000-00000|test-intermediate-payload' };
                }

                if (propCnt === 5) {
                    expect(params.recipient).toBe(config.account.alice.address);
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');

                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '200|r|a|0000-0000-0000-00000|test-root-payload' };
                }


                fail('should not reach here');
                return { context: 'none', dataFieldsString: 'none' };
            };

            const testData = new Data(new RequestMock(getAccountPropertyCallback, undefined, decodeTokenCallback));


            const signDataParams: SignDataParams = {
                attestationContext: 'test-context',
                attestationPath: [ config.account.erin.address, config.account.alice.address ],
                payload: 'test-signed-data-deprecation-payload',
                passphrase: config.account.frank.secret
            };

            const signedData = testData.signData(signDataParams, true);


            let entCnt = 0;
            const entityCheckCb = (entity: EntityCheckParams): boolean => {
                if (entCnt === 0) {
                    expect(entity.account).toBe(config.account.frank.address);
                    expect(entity.entityType).toBe(EntityType.LEAF);
                    expect(entity.state).toBe(State.ACTIVE);
                    expect(entity.payload).toBe("test-leaf-payload");

                    entCnt++;
                    return true;
                }

                if (entCnt === 1) {
                    expect(entity.account).toBe(config.account.erin.address);
                    expect(entity.entityType).toBe(EntityType.INTERMEDIATE);
                    expect(entity.state).toBe(State.DEPRECATED);
                    expect(entity.payload).toBe("test-intermediate-deprecated-payload");

                    entCnt++;
                    return true;
                }

                if (entCnt === 2) {
                    expect(entity.account).toBe(config.account.david.address);
                    expect(entity.entityType).toBe(EntityType.INTERMEDIATE);
                    expect(entity.state).toBe(State.DEPRECATED);
                    expect(entity.payload).toBe("test-intermediate-deprecated-payload");

                    entCnt++;
                    return true;
                }

                if (entCnt === 3) {
                    expect(entity.account).toBe(config.account.charlie.address);
                    expect(entity.entityType).toBe(EntityType.INTERMEDIATE);
                    expect(entity.state).toBe(State.DEPRECATED);
                    expect(entity.payload).toBe("test-intermediate-deprecated-payload");

                    entCnt++;
                    return true;
                }

                if (entCnt === 4) {
                    expect(entity.account).toBe(config.account.bob.address);
                    expect(entity.entityType).toBe(EntityType.INTERMEDIATE);
                    expect(entity.state).toBe(State.ACTIVE);
                    expect(entity.payload).toBe("test-intermediate-payload");

                    entCnt++;
                    return true;
                }

                if (entCnt === 5) {
                    expect(entity.account).toBe(config.account.alice.address);
                    expect(entity.entityType).toBe(EntityType.ROOT);
                    expect(entity.state).toBe(State.ACTIVE);
                    expect(entity.payload).toBe("test-root-payload");

                    entCnt++;
                    return true;
                }

                fail('should not reach here');
                return false;
            };


            const verifyParams: VerifySignedDataParams = {
                trustedRootAccount: config.account.alice.address,
                signedData,
                entityCheckCallback: entityCheckCb
            };

            const response = await testData.verifySignedData(config.node.url.testnet, verifyParams, true);
            expect(response.activeRootAccount).toBe(config.account.alice.address);
            expect(String(response.verifiedTrustChain)).toBe(
                String([
                    config.account.frank.address,
                    config.account.erin.address,
                    config.account.david.address,
                    config.account.charlie.address,
                    config.account.bob.address,
                    config.account.alice.address
                ])
            );
        });


        test('verifySignedData too many deprecation hops error', async () => {
            const decodeTokenCallback = (): { account: string; valid: boolean } => {
                return { account: config.account.charlie.address, valid: true };
            };

            let propCnt = 0;
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string; dataFieldsString: string } => {

                if (propCnt === 0) {
                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '200|l|a|0000-0000-0000-00000|test-leaf-payload' };
                } else {
                    if (propCnt % 2 === 1) {
                        propCnt++;
                        return { context: 'ap://test-context', dataFieldsString: '200|r|d|' + config.account.alice.address.substring("ARDOR-".length) + '|test-root-bob-payload' };
                    }

                    if (propCnt %2 === 0) {
                        propCnt++;
                        return { context: 'ap://test-context', dataFieldsString: '200|r|d|' + config.account.bob.address.substring("ARDOR-".length) + '|test-leaf-alice-payload' };
                    }
                }


                fail('should not reach here');
                return { context: 'none', dataFieldsString: 'none' };
            };

            const testData = new Data(new RequestMock(getAccountPropertyCallback, undefined, decodeTokenCallback));


            const signDataParams: SignDataParams = {
                attestationContext: 'test-context',
                attestationPath: [ config.account.bob.address ],
                payload: 'test-signed-data-payload',
                passphrase: config.account.charlie.secret
            };

            const signedData = testData.signData(signDataParams, true);

            try {
                await testData.verifySignedData(config.node.url.testnet, { signedData, trustedRootAccount: config.account.bob.address }, true);
                fail('should not reach here');
            } catch (e) {
                const error = e as Error;
                expect(error.code).toBe(ErrorCode.TOO_MANY_DEPRECATION_HOPS);
                expect(error.description).toBeDefined();
            }
        });


        test('verifySignedData trusted root not found error', async () => {
            const decodeTokenCallback = (): { account: string; valid: boolean } => {
                return { account: config.account.bob.address, valid: true };
            };

            let propCnt = 0;
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string; dataFieldsString: string } => {

                if (propCnt === 0) {
                    expect(params.recipient).toBe(config.account.bob.address);
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');

                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '200|l|a|0000-0000-0000-00000|test-leaf-payload' };
                }

                if (propCnt === 1) {
                    expect(params.recipient).toBe(config.account.alice.address);
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');

                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '200|r|a|0000-0000-0000-00000|test-root-payload' };
                }


                fail('should not reach here');
                return { context: 'none', dataFieldsString: 'none' };
            };

            const testData = new Data(new RequestMock(getAccountPropertyCallback, undefined, decodeTokenCallback));


            const signDataParams: SignDataParams = {
                attestationContext: 'test-context',
                attestationPath: [ config.account.alice.address ],
                payload: 'test-signed-data-payload',
                passphrase: config.account.bob.secret
            };

            const signedData = testData.signData(signDataParams, true);


            try {
                await testData.verifySignedData(config.node.url.testnet, { trustedRootAccount: config.account.bob.address, signedData }, true);
                fail('should not reach here');
            } catch (e) {
                const error = e as Error;
                expect(error.code).toBe(ErrorCode.TRUSTED_ROOT_NOT_FOUND);
                expect(error.description).toBeDefined();
            }
        });


        test('verifySignedData trusted root is deprecated success', async () => {
            const decodeTokenCallback = (): { account: string; valid: boolean } => {
                return { account: config.account.charlie.address, valid: true };
            };

            let propCnt = 0;
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string; dataFieldsString: string } => {

                if (propCnt === 0) {
                    expect(params.recipient).toBe(config.account.charlie.address);
                    expect(params.setter).toBe(config.account.bob.address);
                    expect(params.property).toBe('ap://test-context');

                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '200|l|a|0000-0000-0000-00000|test-leaf-payload' };
                }

                if (propCnt === 1) {
                    expect(params.recipient).toBe(config.account.bob.address);
                    expect(params.setter).toBe(config.account.bob.address);
                    expect(params.property).toBe('ap://test-context');

                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '200|r|d|' + config.account.alice.address.substring("ARDOR-".length) + '|test-root-deprecated-payload' };
                }

                if (propCnt === 2) {
                    expect(params.recipient).toBe(config.account.alice.address);
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');

                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '200|r|a|0000-0000-0000-00000|test-root-payload' };
                }


                fail('should not reach here');
                return { context: 'none', dataFieldsString: 'none' };
            };

            const testData = new Data(new RequestMock(getAccountPropertyCallback, undefined, decodeTokenCallback));


            const signDataParams: SignDataParams = {
                attestationContext: 'test-context',
                attestationPath: [ config.account.bob.address ],
                payload: 'test-signed-data-payload',
                passphrase: config.account.charlie.secret
            };

            const signedData = testData.signData(signDataParams, true);
            const verifySignedDataParams: VerifySignedDataParams = {
                trustedRootAccount: config.account.bob.address,
                signedData
            };

            const response = await testData.verifySignedData(config.node.url.testnet, verifySignedDataParams, true);
            expect(response.activeRootAccount).toBe(config.account.alice.address);
            expect(response.verifiedTrustChain).toEqual(expect.arrayContaining([ config.account.bob.address ]));
        });


        test('verifySignedData signed data creator is deprecated error', async () => {
            const decodeTokenCallback = (): { account: string; valid: boolean } => {
                return { account: config.account.bob.address, valid: true };
            };

            let propCnt = 0;
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string; dataFieldsString: string } => {

                if (propCnt === 0) {
                    expect(params.recipient).toBe(config.account.bob.address);
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');

                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '200|l|d|' + config.account.alice.address.substring("ARDOR-".length) + '|test-leaf-deprecated-payload' };
                }

                fail('should not reach here');
                return { context: 'none', dataFieldsString: 'none' };
            };

            const testData = new Data(new RequestMock(getAccountPropertyCallback, undefined, decodeTokenCallback));


            const signDataParams: SignDataParams = {
                attestationContext: 'test-context',
                attestationPath: [ config.account.alice.address ],
                payload: 'test-signed-data-payload',
                passphrase: config.account.bob.secret
            };

            const signedData = testData.signData(signDataParams, true);


            try {
                await testData.verifySignedData(config.node.url.testnet, { trustedRootAccount: config.account.alice.address, signedData }, true);
                fail('should not reach here');
            } catch (e) {
                const error = e as Error;
                expect(error.code).toBe(ErrorCode.CREATOR_ACCOUNT_DEPRECATED);
                expect(error.description).toBeDefined();
            }
        });

    });
} else {
    test('dummy', () => {
        expect(true).toBeTruthy();
    });
}