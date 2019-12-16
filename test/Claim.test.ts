import { DecodeTokenParams, GetAccountPropertiesParams, SetAccountPropertyParams } from '@somedotone/ardor-ts';
import { Claim, ClaimCheckParams, CreateClaimParams, EntityCheckParams, EntityType, Error, ErrorCode, State, VerifyClaimParams } from '../src/index';
import config from './config';
import RequestMock from "./mocks/RequestMock";


if(config.test.claimModule.runTests) {
    describe('Claim module tests', () => {

        test('create / verify claim success', async () => {
            const decodeTokenCallback = (params: DecodeTokenParams): { account: string, valid: boolean } => {
                return {account: config.account.erin.address, valid: true};
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => fail('should not reach here');
            
            let propCnt = 0;
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                
                if(propCnt === 0) {
                    expect(params.recipient).toBe(config.account.erin.address);
                    expect(params.setter).toBe(config.account.david.address);
                    expect(params.property).toBe('ap://test-context');
                    
                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '001|l|a|0000-0000-0000-00000|test-leaf-payload' };
                }

                if(propCnt === 1) {
                    expect(params.recipient).toBe(config.account.david.address);
                    expect(params.setter).toBe(config.account.charlie.address);
                    expect(params.property).toBe('ap://test-context');
                    
                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '001|i|a|0000-0000-0000-00000|test-intermediate-payload' };
                }

                if(propCnt === 2) {
                    expect(params.recipient).toBe(config.account.charlie.address);
                    expect(params.setter).toBe(config.account.bob.address);
                    expect(params.property).toBe('ap://test-context');
                    
                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '001|i|a|0000-0000-0000-00000|test-intermediate-payload' };
                }

                if(propCnt === 3) {
                    expect(params.recipient).toBe(config.account.bob.address);
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');
                    
                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '001|i|a|0000-0000-0000-00000|test-intermediate-payload' };
                }

                if(propCnt === 4) {
                    expect(params.recipient).toBe(config.account.alice.address);
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');
                    
                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '001|r|a|0000-0000-0000-00000|test-root-payload' };
                }
                

                fail('should not reach here');
                return { context: 'none', dataFieldsString: 'none' };
            }

            const testClaim = new Claim(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback, decodeTokenCallback));


            const createParams: CreateClaimParams = {
                attestationContext: 'test-context',
                attestationPath: [ config.account.david.address, config.account.charlie.address, config.account.bob.address, config.account.alice.address ],
                payload: 'test-claim-payload',
                passphrase: config.account.erin.secret
            };

            const claimObject = testClaim.createClaim(createParams, true);


            const claimCheckCb = (claim: ClaimCheckParams): boolean => {
                expect(claim.claim.creatorAccount).toBe(config.account.erin.address);
                expect(claim.claim.payload).toBe('test-claim-payload');


                const timeWindow = 10 * 1000;
                const currentTime = (new Date()).getTime();
                expect(claim.creationTime + timeWindow).toBeGreaterThan(currentTime);
                expect(claim.creationTime - timeWindow).toBeLessThan(currentTime);

                return true;
            }

            let entCnt = 0;
            const entityCheckCb = (entity: EntityCheckParams): boolean => {
                if(entCnt === 0) {
                    expect(entity.account).toBe(config.account.erin.address);
                    expect(entity.entityType).toBe(EntityType.LEAF);
                    expect(entity.state).toBe(State.ACTIVE);
                    expect(entity.payload).toBe("test-leaf-payload");
                    expect(entity.protocolVersion).toBe("001");

                    entCnt++;
                    return true;
                }

                if(entCnt === 1) {
                    expect(entity.account).toBe(config.account.david.address);
                    expect(entity.entityType).toBe(EntityType.INTERMEDIATE);
                    expect(entity.state).toBe(State.ACTIVE);
                    expect(entity.payload).toBe("test-intermediate-payload");

                    entCnt++;
                    return true;
                }

                if(entCnt === 2) {
                    expect(entity.account).toBe(config.account.charlie.address);
                    expect(entity.entityType).toBe(EntityType.INTERMEDIATE);
                    expect(entity.state).toBe(State.ACTIVE);
                    expect(entity.payload).toBe("test-intermediate-payload");

                    entCnt++;
                    return true;
                }

                if(entCnt === 3) {
                    expect(entity.account).toBe(config.account.bob.address);
                    expect(entity.entityType).toBe(EntityType.INTERMEDIATE);
                    expect(entity.state).toBe(State.ACTIVE);
                    expect(entity.payload).toBe("test-intermediate-payload");

                    entCnt++;
                    return true;
                }

                if(entCnt === 4) {
                    expect(entity.account).toBe(config.account.alice.address);
                    expect(entity.entityType).toBe(EntityType.ROOT);
                    expect(entity.state).toBe(State.ACTIVE);
                    expect(entity.payload).toBe("test-root-payload");

                    entCnt++;
                    return true;
                }

                fail('should not reach here');
                return false;
            }


            const verifyParams: VerifyClaimParams = {
                trustedRootAccount: config.account.alice.address, 
                claim: claimObject, 
                claimCheckCallback: claimCheckCb, 
                entityCheckCallback: entityCheckCb
            };

            const response = await testClaim.verifyClaim(config.node.url.testnet, verifyParams, true);
            expect(response.activeRootAccount).toBe(config.account.alice.address);
            expect(String(response.verifiedTrustChain)).toBe(String([ config.account.erin.address, config.account.david.address, config.account.charlie.address, config.account.bob.address, config.account.alice.address ]));
        });


        test('verifyClaim root attest leaf success', async () => {
            const decodeTokenCallback = (params: DecodeTokenParams): { account: string, valid: boolean } => {
                return {account: config.account.bob.address, valid: true};
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => fail('should not reach here');
            
            let propCnt = 0;
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                
                if(propCnt === 0) {
                    expect(params.recipient).toBe(config.account.bob.address);
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');
                    
                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '001|l|a|0000-0000-0000-00000|test-leaf-payload' };
                }

                if(propCnt === 1) {
                    expect(params.recipient).toBe(config.account.alice.address);
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');
                    
                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '001|r|a|0000-0000-0000-00000|test-root-payload' };
                }
                

                fail('should not reach here');
                return { context: 'none', dataFieldsString: 'none' };
            }

            const testClaim = new Claim(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback, decodeTokenCallback));


            const createParams: CreateClaimParams = {
                attestationContext: 'test-context',
                attestationPath: [ config.account.alice.address ],
                payload: 'test-claim-payload',
                passphrase: config.account.bob.secret
            };

            const claimObject = testClaim.createClaim(createParams, true);


            const claimCheckCb = (claim: ClaimCheckParams): boolean => {
                expect(claim.claim.creatorAccount).toBe(config.account.bob.address);

                const timeWindow = 10 * 1000;
                const currentTime = (new Date()).getTime();
                expect(claim.creationTime + timeWindow).toBeGreaterThan(currentTime);
                expect(claim.creationTime - timeWindow).toBeLessThan(currentTime);

                return true;
            }

            let entCnt = 0;
            const entityCheckCb = (entity: EntityCheckParams): boolean => {
                if(entCnt === 0) {
                    expect(entity.account).toBe(config.account.bob.address);
                    expect(entity.entityType).toBe(EntityType.LEAF);
                    expect(entity.state).toBe(State.ACTIVE);
                    expect(entity.payload).toBe("test-leaf-payload");

                    entCnt++;
                    return true;
                }

                if(entCnt === 1) {
                    expect(entity.account).toBe(config.account.alice.address);
                    expect(entity.entityType).toBe(EntityType.ROOT);
                    expect(entity.state).toBe(State.ACTIVE);
                    expect(entity.payload).toBe("test-root-payload");

                    entCnt++;
                    return true;
                }

                fail('should not reach here');
                return false;
            }


            const verifyParams: VerifyClaimParams = {
                trustedRootAccount: config.account.alice.address, 
                claim: claimObject, 
                claimCheckCallback: claimCheckCb, 
                entityCheckCallback: entityCheckCb
            };

            const response = await testClaim.verifyClaim(config.node.url.testnet, verifyParams, true);
            expect(response.activeRootAccount).toBe(config.account.alice.address);
            expect(String(response.verifiedTrustChain)).toBe(String([ config.account.bob.address, config.account.alice.address ]));
        });


        test('verifyClaim intermediate create claim success', async () => {
            const decodeTokenCallback = (params: DecodeTokenParams): { account: string, valid: boolean } => {
                return {account: config.account.bob.address, valid: true};
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => fail('should not reach here');
            
            let propCnt = 0;
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                
                if(propCnt === 0) {
                    expect(params.recipient).toBe(config.account.bob.address);
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');
                    
                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '001|i|a|0000-0000-0000-00000|test-intermediate-payload' };
                }

                if(propCnt === 1) {
                    expect(params.recipient).toBe(config.account.alice.address);
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');
                    
                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '001|r|a|0000-0000-0000-00000|test-root-payload' };
                }
                

                fail('should not reach here');
                return { context: 'none', dataFieldsString: 'none' };
            }

            const testClaim = new Claim(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback, decodeTokenCallback));


            const createParams: CreateClaimParams = {
                attestationContext: 'test-context',
                attestationPath: [ config.account.alice.address ],
                payload: 'test-claim-payload',
                passphrase: config.account.bob.secret
            };

            const claimObject = testClaim.createClaim(createParams, true);


            const claimCheckCb = (claim: ClaimCheckParams): boolean => {
                expect(claim.claim.creatorAccount).toBe(config.account.bob.address);

                const timeWindow = 10 * 1000;
                const currentTime = (new Date()).getTime();
                expect(claim.creationTime + timeWindow).toBeGreaterThan(currentTime);
                expect(claim.creationTime - timeWindow).toBeLessThan(currentTime);

                return true;
            }

            let entCnt = 0;
            const entityCheckCb = (entity: EntityCheckParams): boolean => {
                if(entCnt === 0) {
                    expect(entity.account).toBe(config.account.bob.address);
                    expect(entity.entityType).toBe(EntityType.INTERMEDIATE);
                    expect(entity.state).toBe(State.ACTIVE);
                    expect(entity.payload).toBe("test-intermediate-payload");

                    entCnt++;
                    return true;
                }

                if(entCnt === 1) {
                    expect(entity.account).toBe(config.account.alice.address);
                    expect(entity.entityType).toBe(EntityType.ROOT);
                    expect(entity.state).toBe(State.ACTIVE);
                    expect(entity.payload).toBe("test-root-payload");

                    entCnt++;
                    return true;
                }

                fail('should not reach here');
                return false;
            }


            const verifyParams: VerifyClaimParams = {
                trustedRootAccount: config.account.alice.address, 
                claim: claimObject, 
                claimCheckCallback: claimCheckCb, 
                entityCheckCallback: entityCheckCb
            };

            const response = await testClaim.verifyClaim(config.node.url.testnet, verifyParams, true);
            expect(response.activeRootAccount).toBe(config.account.alice.address);
            expect(String(response.verifiedTrustChain)).toBe(String([ config.account.bob.address, config.account.alice.address ]));
        });


        test('verifyClaim root create claim success', async () => {
            const decodeTokenCallback = (params: DecodeTokenParams): { account: string, valid: boolean } => {
                return {account: config.account.alice.address, valid: true};
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => fail('should not reach here');
            
            let propCnt = 0;
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                
                if(propCnt === 0) {
                    expect(params.recipient).toBe(config.account.alice.address);
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');
                    
                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '001|r|a|0000-0000-0000-00000|test-root-payload' };
                }

                fail('should not reach here');
                return { context: 'none', dataFieldsString: 'none' };
            }

            const testClaim = new Claim(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback, decodeTokenCallback));


            const claimCheckCb = (claim: ClaimCheckParams): boolean => {
                expect(claim.claim.creatorAccount).toBe(config.account.alice.address);

                const timeWindow = 10 * 1000;
                const currentTime = (new Date()).getTime();
                expect(claim.creationTime + timeWindow).toBeGreaterThan(currentTime);
                expect(claim.creationTime - timeWindow).toBeLessThan(currentTime);

                return true;
            }

            let entCnt = 0;
            const entityCheckCb = (entity: EntityCheckParams): boolean => {
                if(entCnt === 0) {
                    expect(entity.account).toBe(config.account.alice.address);
                    expect(entity.entityType).toBe(EntityType.ROOT);
                    expect(entity.state).toBe(State.ACTIVE);
                    expect(entity.payload).toBe("test-root-payload");

                    entCnt++;
                    return true;
                }

                fail('should not reach here');
                return false;
            }


            let createParams: CreateClaimParams = {
                attestationContext: 'test-context',
                payload: 'test-claim-payload',
                passphrase: config.account.alice.secret
            };

            let verifyParams: VerifyClaimParams = {
                trustedRootAccount: config.account.alice.address, 
                claim: testClaim.createClaim(createParams, true), 
                claimCheckCallback: claimCheckCb, 
                entityCheckCallback: entityCheckCb
            };

            let response = await testClaim.verifyClaim(config.node.url.testnet, verifyParams, true);
            expect(response.activeRootAccount).toBe(config.account.alice.address);
            expect(String(response.verifiedTrustChain)).toBe(String([ config.account.alice.address ]));


            entCnt = 0;
            propCnt = 0;
            createParams.attestationPath = [];

            verifyParams.claim = testClaim.createClaim(createParams, true);
            response = await testClaim.verifyClaim(config.node.url.testnet, verifyParams, true);
            expect(response.activeRootAccount).toBe(config.account.alice.address);
            expect(String(response.verifiedTrustChain)).toBe(String([ config.account.alice.address ]));


            entCnt = 0;
            propCnt = 0;
            createParams.attestationPath = undefined;

            verifyParams.claim = testClaim.createClaim(createParams, true);
            response = await testClaim.verifyClaim(config.node.url.testnet, verifyParams, true);
            expect(response.activeRootAccount).toBe(config.account.alice.address);
            expect(String(response.verifiedTrustChain)).toBe(String([ config.account.alice.address ]));
        });


        test('verifyClaim root in the middle of path error', async () => {
            const decodeTokenCallback = (params: DecodeTokenParams): { account: string, valid: boolean } => {
                return {account: config.account.charlie.address, valid: true};
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => fail('should not reach here');
            
            let propCnt = 0;
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                
                if(propCnt === 0) {
                    expect(params.recipient).toBe(config.account.charlie.address);
                    expect(params.setter).toBe(config.account.bob.address);
                    expect(params.property).toBe('ap://test-context');
                    
                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '001|l|a|0000-0000-0000-00000|test-leaf-payload' };
                }

                if(propCnt === 1) {
                    expect(params.recipient).toBe(config.account.bob.address);
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');
                    
                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '001|r|a|0000-0000-0000-00000|test-root-payload' };
                }
                

                fail('should not reach here');
                return { context: 'none', dataFieldsString: 'none' };
            }

            const testClaim = new Claim(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback, decodeTokenCallback));


            const createParams: CreateClaimParams = {
                attestationContext: 'test-context',
                attestationPath: [ config.account.bob.address, config.account.alice.address ],
                payload: 'test-claim-payload',
                passphrase: config.account.charlie.secret
            };

            const claimObject = testClaim.createClaim(createParams, true);
            

            try {
                await testClaim.verifyClaim(config.node.url.testnet, { claim: claimObject, trustedRootAccount: config.account.alice.address }, true);
                fail('should not reach here');
            } catch(e) {
                const error = e as Error;
                expect(error.code).toBe(ErrorCode.ROOT_ENTITY_IN_MIDDLE_OF_PATH);
                expect(error.description).toBeDefined();
            } 
        });


        test('verifyClaim leaf as attestor error', async () => {
            const decodeTokenCallback = (params: DecodeTokenParams): { account: string, valid: boolean } => {
                return { account: config.account.charlie.address, valid: true };
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => fail('should not reach here');
            
            let propCnt = 0;
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                
                if(propCnt === 0) {
                    expect(params.recipient).toBe(config.account.charlie.address);
                    expect(params.setter).toBe(config.account.bob.address);
                    expect(params.property).toBe('ap://test-context');
                    
                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '001|l|a|0000-0000-0000-00000|test-leaf-payload' };
                }

                if(propCnt === 1) {
                    expect(params.recipient).toBe(config.account.bob.address);
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');
                    
                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '001|l|a|0000-0000-0000-00000|test-root-payload' };
                }
                

                fail('should not reach here');
                return { context: 'none', dataFieldsString: 'none' };
            }

            const testClaim = new Claim(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback, decodeTokenCallback));


            const createParams: CreateClaimParams = {
                attestationContext: 'test-context',
                attestationPath: [ config.account.bob.address, config.account.alice.address ],
                payload: 'test-claim-payload',
                passphrase: config.account.charlie.secret
            };

            const claimObject = testClaim.createClaim(createParams, true);


            try {
                await testClaim.verifyClaim(config.node.url.testnet, { claim: claimObject, trustedRootAccount: config.account.alice.address }, true);
                fail('should not reach here');
            } catch(e) {
                const error = e as Error;
                expect(error.code).toBe(ErrorCode.LEAF_ATTESTOR_NOT_ALLOWED);
                expect(error.description).toBeDefined();
            } 
        });


        test('verifyClaim token invalid error', async () => {
            const decodeTokenCallback = (params: DecodeTokenParams): { account: string, valid: boolean } => {
                return {account: config.account.charlie.address, valid: false};
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => fail('should not reach here');
            
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                fail('should not reach here');
                return { context: 'none', dataFieldsString: 'none' };
            }

            const testClaim = new Claim(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback, decodeTokenCallback));


            const createParams: CreateClaimParams = {
                attestationContext: 'test-context',
                attestationPath: [ config.account.bob.address, config.account.alice.address ],
                payload: 'test-claim-payload',
                passphrase: config.account.charlie.secret
            };

            const claimObject = testClaim.createClaim(createParams, true);


            try {
                await testClaim.verifyClaim(config.node.url.testnet, { claim: claimObject, trustedRootAccount: config.account.alice.address }, true);
                fail('should not reach here');
            } catch(e) {
                const error = e as Error;
                expect(error.code).toBe(ErrorCode.INVALID_SIGNATURE);
                expect(error.description).toBeDefined();
            } 
        });


        test('verifyClaim wrong claim creator error', async () => {
            const decodeTokenCallback = (params: DecodeTokenParams): { account: string, valid: boolean } => {
                return {account: config.account.bob.address, valid: true};
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => fail('should not reach here');
            
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                fail('should not reach here');
                return { context: 'none', dataFieldsString: 'none' };
            }

            const testClaim = new Claim(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback, decodeTokenCallback));


            const createParams: CreateClaimParams = {
                attestationContext: 'test-context',
                attestationPath: [ config.account.bob.address, config.account.alice.address ],
                payload: 'test-claim-payload',
                passphrase: config.account.charlie.secret
            };

            const claimObject = testClaim.createClaim(createParams, true);


            try {
                await testClaim.verifyClaim(config.node.url.testnet, { claim: claimObject, trustedRootAccount: config.account.alice.address }, true);
                fail('should not reach here');
            } catch(e) {
                const error = e as Error;
                expect(error.code).toBe(ErrorCode.WRONG_CLAIM_CREATOR_ACCOUNT);
                expect(error.description).toBeDefined();
            } 
        });


        test('verifyClaim claim callback returned false error', async () => {
            const decodeTokenCallback = (params: DecodeTokenParams): { account: string, valid: boolean } => {
                return {account: config.account.charlie.address, valid: true};
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => fail('should not reach here');
            
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                fail('should not reach here');
                return { context: 'none', dataFieldsString: 'none' };
            }

            const testClaim = new Claim(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback, decodeTokenCallback));


            const createParams: CreateClaimParams = {
                attestationContext: 'test-context',
                payload: 'test-claim-payload',
                passphrase: config.account.charlie.secret
            };

            const claimObject = testClaim.createClaim(createParams, true);


            const claimCheckCb = (claim: ClaimCheckParams): boolean => {
                return false;
            }


            const verifyParams: VerifyClaimParams = {
                trustedRootAccount: config.account.alice.address, 
                claim: claimObject, 
                claimCheckCallback: claimCheckCb
            };

            try {
                await testClaim.verifyClaim(config.node.url.testnet, verifyParams, true);
                fail('should not reach here');
            } catch(e) {
                const error = e as Error;
                expect(error.code).toBe(ErrorCode.CLAIM_CALLBACK_ERROR);
                expect(error.description).toBeDefined();
            } 
        });


        test('verifyClaim entity callback returned false error', async () => {
            const decodeTokenCallback = (params: DecodeTokenParams): { account: string, valid: boolean } => {
                return {account: config.account.bob.address, valid: true};
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => fail('should not reach here');
            
            let propCnt = 0;
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                
                if(propCnt === 0) {
                    expect(params.recipient).toBe(config.account.bob.address);
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');
                    
                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '001|l|a|0000-0000-0000-00000|test-intermediate-payload' };
                }


                fail('should not reach here');
                return { context: 'none', dataFieldsString: 'none' };
            }

            const testClaim = new Claim(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback, decodeTokenCallback));


            const createParams: CreateClaimParams = {
                attestationContext: 'test-context',
                attestationPath: [ config.account.alice.address ],
                payload: 'test-claim-payload',
                passphrase: config.account.bob.secret
            };

            const claimObject = testClaim.createClaim(createParams, true);


            const entityCheckCb = (entity: EntityCheckParams): boolean => {
                return false;
            }


            const verifyParams: VerifyClaimParams = {
                trustedRootAccount: config.account.alice.address, 
                claim: claimObject, 
                entityCheckCallback: entityCheckCb
            };

            try {
                await testClaim.verifyClaim(config.node.url.testnet, verifyParams, true);
                fail('should not reach here');
            } catch(e) {
                const error = e as Error;
                expect(error.code).toBe(ErrorCode.ENTITY_CALLBACK_ERROR);
                expect(error.description).toBeDefined();
            } 
        });


        test('verifyClaim deprecation success', async () => {
            const decodeTokenCallback = (params: DecodeTokenParams): { account: string, valid: boolean } => {
                return {account: config.account.erin.address, valid: true};
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => fail('should not reach here');
            
            let propCnt = 0;
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                
                if(propCnt === 0) {
                    expect(params.recipient).toBe(config.account.erin.address);
                    expect(params.setter).toBe(config.account.david.address);
                    expect(params.property).toBe('ap://test-context');
                    
                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '001|l|a|0000-0000-0000-00000|test-leaf-payload' };
                }

                if(propCnt === 1) {
                    expect(params.recipient).toBe(config.account.david.address);
                    expect(params.setter).toBe(config.account.bob.address);
                    expect(params.property).toBe('ap://test-context');
                    
                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '001|i|d|' + config.account.charlie.address.substring("ARDOR-".length) + '|test-intermediate-deprecated-payload' };
                }

                if(propCnt === 2) {
                    expect(params.recipient).toBe(config.account.charlie.address);
                    expect(params.setter).toBe(config.account.bob.address);
                    expect(params.property).toBe('ap://test-context');
                    
                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '001|i|a|0000-0000-0000-00000|test-intermediate-payload' };
                }

                if(propCnt === 3) {
                    expect(params.recipient).toBe(config.account.bob.address);
                    expect(params.setter).toBe(config.account.bob.address);
                    expect(params.property).toBe('ap://test-context');
                    
                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '001|r|d|' + config.account.alice.address.substring("ARDOR-".length) + '|test-root-deprecated-payload' };
                }

                if(propCnt === 4) {
                    expect(params.recipient).toBe(config.account.alice.address);
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');
                    
                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '001|r|a|0000-0000-0000-00000|test-root-payload' };
                }
                

                fail('should not reach here');
                return { context: 'none', dataFieldsString: 'none' };
            }

            const testClaim = new Claim(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback, decodeTokenCallback));


            const createParams: CreateClaimParams = {
                attestationContext: 'test-context',
                attestationPath: [ config.account.david.address, config.account.bob.address ],
                payload: 'test-claim-deprecation-payload',
                passphrase: config.account.erin.secret
            };

            const claimObject = testClaim.createClaim(createParams, true);


            let entCnt = 0;
            const entityCheckCb = (entity: EntityCheckParams): boolean => {
                if(entCnt === 0) {
                    expect(entity.account).toBe(config.account.erin.address);
                    expect(entity.entityType).toBe(EntityType.LEAF);
                    expect(entity.state).toBe(State.ACTIVE);
                    expect(entity.payload).toBe("test-leaf-payload");

                    entCnt++;
                    return true;
                }

                if(entCnt === 1) {
                    expect(entity.account).toBe(config.account.david.address);
                    expect(entity.entityType).toBe(EntityType.INTERMEDIATE);
                    expect(entity.state).toBe(State.DEPRECATED);
                    expect(entity.payload).toBe("test-intermediate-deprecated-payload");

                    entCnt++;
                    return true;
                }

                if(entCnt === 2) {
                    expect(entity.account).toBe(config.account.charlie.address);
                    expect(entity.entityType).toBe(EntityType.INTERMEDIATE);
                    expect(entity.state).toBe(State.ACTIVE);
                    expect(entity.payload).toBe("test-intermediate-payload");

                    entCnt++;
                    return true;
                }

                if(entCnt === 3) {
                    expect(entity.account).toBe(config.account.bob.address);
                    expect(entity.entityType).toBe(EntityType.ROOT);
                    expect(entity.state).toBe(State.DEPRECATED);
                    expect(entity.payload).toBe("test-root-deprecated-payload");

                    entCnt++;
                    return true;
                }

                if(entCnt === 4) {
                    expect(entity.account).toBe(config.account.alice.address);
                    expect(entity.entityType).toBe(EntityType.ROOT);
                    expect(entity.state).toBe(State.ACTIVE);
                    expect(entity.payload).toBe("test-root-payload");

                    entCnt++;
                    return true;
                }

                fail('should not reach here');
                return false;
            }


            const verifyParams: VerifyClaimParams = {
                trustedRootAccount: config.account.alice.address, 
                claim: claimObject, 
                entityCheckCallback: entityCheckCb
            };

            const response = await testClaim.verifyClaim(config.node.url.testnet, verifyParams, true);
            expect(response.activeRootAccount).toBe(config.account.alice.address);
            expect(String(response.verifiedTrustChain)).toBe(String([ config.account.erin.address, config.account.david.address, config.account.charlie.address, config.account.bob.address, config.account.alice.address ]));
        });


        test('verifyClaim multiple deprecation hops success', async () => {
            const decodeTokenCallback = (params: DecodeTokenParams): { account: string, valid: boolean } => {
                return {account: config.account.frank.address, valid: true};
            }

            let propCnt = 0;
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                
                if(propCnt === 0) {
                    expect(params.recipient).toBe(config.account.frank.address);
                    expect(params.setter).toBe(config.account.erin.address);
                    expect(params.property).toBe('ap://test-context');
                    
                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '001|l|a|0000-0000-0000-00000|test-leaf-payload' };
                }

                if(propCnt === 1) {
                    expect(params.recipient).toBe(config.account.erin.address);
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');
                    
                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '001|i|d|' + config.account.david.address.substring("ARDOR-".length) + '|test-intermediate-deprecated-payload' };
                }

                if(propCnt === 2) {
                    expect(params.recipient).toBe(config.account.david.address);
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');
                    
                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '001|i|d|' + config.account.charlie.address.substring("ARDOR-".length) + '|test-intermediate-deprecated-payload' };
                }

                if(propCnt === 3) {
                    expect(params.recipient).toBe(config.account.charlie.address);
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');
                    
                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '001|i|d|' + config.account.bob.address.substring("ARDOR-".length) + '|test-intermediate-deprecated-payload' };
                }

                if(propCnt === 4) {
                    expect(params.recipient).toBe(config.account.bob.address);
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');
                    
                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '001|i|a|0000-0000-0000-00000|test-intermediate-payload' };
                }

                if(propCnt === 5) {
                    expect(params.recipient).toBe(config.account.alice.address);
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');
                    
                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '001|r|a|0000-0000-0000-00000|test-root-payload' };
                }
                

                fail('should not reach here');
                return { context: 'none', dataFieldsString: 'none' };
            }

            const testClaim = new Claim(new RequestMock(getAccountPropertyCallback, undefined, decodeTokenCallback));


            const createParams: CreateClaimParams = {
                attestationContext: 'test-context',
                attestationPath: [ config.account.erin.address, config.account.alice.address ],
                payload: 'test-claim-deprecation-payload',
                passphrase: config.account.frank.secret
            };

            const claimObject = testClaim.createClaim(createParams, true);


            let entCnt = 0;
            const entityCheckCb = (entity: EntityCheckParams): boolean => {
                if(entCnt === 0) {
                    expect(entity.account).toBe(config.account.frank.address);
                    expect(entity.entityType).toBe(EntityType.LEAF);
                    expect(entity.state).toBe(State.ACTIVE);
                    expect(entity.payload).toBe("test-leaf-payload");

                    entCnt++;
                    return true;
                }

                if(entCnt === 1) {
                    expect(entity.account).toBe(config.account.erin.address);
                    expect(entity.entityType).toBe(EntityType.INTERMEDIATE);
                    expect(entity.state).toBe(State.DEPRECATED);
                    expect(entity.payload).toBe("test-intermediate-deprecated-payload");

                    entCnt++;
                    return true;
                }

                if(entCnt === 2) {
                    expect(entity.account).toBe(config.account.david.address);
                    expect(entity.entityType).toBe(EntityType.INTERMEDIATE);
                    expect(entity.state).toBe(State.DEPRECATED);
                    expect(entity.payload).toBe("test-intermediate-deprecated-payload");

                    entCnt++;
                    return true;
                }

                if(entCnt === 3) {
                    expect(entity.account).toBe(config.account.charlie.address);
                    expect(entity.entityType).toBe(EntityType.INTERMEDIATE);
                    expect(entity.state).toBe(State.DEPRECATED);
                    expect(entity.payload).toBe("test-intermediate-deprecated-payload");

                    entCnt++;
                    return true;
                }

                if(entCnt === 4) {
                    expect(entity.account).toBe(config.account.bob.address);
                    expect(entity.entityType).toBe(EntityType.INTERMEDIATE);
                    expect(entity.state).toBe(State.ACTIVE);
                    expect(entity.payload).toBe("test-intermediate-payload");

                    entCnt++;
                    return true;
                }

                if(entCnt === 5) {
                    expect(entity.account).toBe(config.account.alice.address);
                    expect(entity.entityType).toBe(EntityType.ROOT);
                    expect(entity.state).toBe(State.ACTIVE);
                    expect(entity.payload).toBe("test-root-payload");

                    entCnt++;
                    return true;
                }

                fail('should not reach here');
                return false;
            }


            const verifyParams: VerifyClaimParams = {
                trustedRootAccount: config.account.alice.address, 
                claim: claimObject, 
                entityCheckCallback: entityCheckCb
            };

            const response = await testClaim.verifyClaim(config.node.url.testnet, verifyParams, true);
            expect(response.activeRootAccount).toBe(config.account.alice.address);
            expect(String(response.verifiedTrustChain)).toBe(String([ config.account.frank.address, config.account.erin.address, config.account.david.address, config.account.charlie.address, config.account.bob.address, config.account.alice.address ]));
        });


        test('verifyClaim too many deprecation hops error', async () => {
            const decodeTokenCallback = (params: DecodeTokenParams): { account: string, valid: boolean } => {
                return {account: config.account.charlie.address, valid: true};
            }
            
            let propCnt = 0;
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                
                if(propCnt === 0) {
                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '001|l|a|0000-0000-0000-00000|test-leaf-payload' };
                } else {
                    if(propCnt % 2 === 1) {
                        propCnt++;
                        return { context: 'ap://test-context', dataFieldsString: '001|r|d|' + config.account.alice.address.substring("ARDOR-".length) + '|test-root-bob-payload' };
                    }

                    if(propCnt %2 === 0) {
                        propCnt++;
                        return { context: 'ap://test-context', dataFieldsString: '001|r|d|' + config.account.bob.address.substring("ARDOR-".length) + '|test-leaf-alice-payload' };
                    }
                }


                fail('should not reach here');
                return { context: 'none', dataFieldsString: 'none' };
            }

            const testClaim = new Claim(new RequestMock(getAccountPropertyCallback, undefined, decodeTokenCallback));


            const createParams: CreateClaimParams = {
                attestationContext: 'test-context',
                attestationPath: [ config.account.bob.address ],
                payload: 'test-claim-payload',
                passphrase: config.account.charlie.secret
            };

            const claimObject = testClaim.createClaim(createParams, true);

            try {
                await testClaim.verifyClaim(config.node.url.testnet, { claim: claimObject, trustedRootAccount: config.account.bob.address }, true);
                fail('should not reach here');
            } catch(e) {
                const error = e as Error;
                expect(error.code).toBe(ErrorCode.TOO_MANY_DEPRECATION_HOPS);
                expect(error.description).toBeDefined();
            } 
        });


        test('verifyClaim trusted root not found error', async () => {
            const decodeTokenCallback = (params: DecodeTokenParams): { account: string, valid: boolean } => {
                return {account: config.account.bob.address, valid: true};
            }

            let propCnt = 0;
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                
                if(propCnt === 0) {
                    expect(params.recipient).toBe(config.account.bob.address);
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');
                    
                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '001|l|a|0000-0000-0000-00000|test-leaf-payload' };
                }

                if(propCnt === 1) {
                    expect(params.recipient).toBe(config.account.alice.address);
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');
                    
                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '001|r|a|0000-0000-0000-00000|test-root-payload' };
                }


                fail('should not reach here');
                return { context: 'none', dataFieldsString: 'none' };
            }

            const testClaim = new Claim(new RequestMock(getAccountPropertyCallback, undefined, decodeTokenCallback));


            const createParams: CreateClaimParams = {
                attestationContext: 'test-context',
                attestationPath: [ config.account.alice.address ],
                payload: 'test-claim-payload',
                passphrase: config.account.bob.secret
            };

            const claimObject = testClaim.createClaim(createParams, true);


            try {
                await testClaim.verifyClaim(config.node.url.testnet, {trustedRootAccount: config.account.bob.address, claim: claimObject}, true);
                fail('should not reach here');
            } catch(e) {
                const error = e as Error;
                expect(error.code).toBe(ErrorCode.TRUSTED_ROOT_NOT_FOUND);
                expect(error.description).toBeDefined();
            } 
        });


        test('verifyClaim trusted root is deprecated success', async () => {
            const decodeTokenCallback = (params: DecodeTokenParams): { account: string, valid: boolean } => {
                return {account: config.account.charlie.address, valid: true};
            }

            let propCnt = 0;
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                
                if(propCnt === 0) {
                    expect(params.recipient).toBe(config.account.charlie.address);
                    expect(params.setter).toBe(config.account.bob.address);
                    expect(params.property).toBe('ap://test-context');
                    
                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '001|l|a|0000-0000-0000-00000|test-leaf-payload' };
                }

                if(propCnt === 1) {
                    expect(params.recipient).toBe(config.account.bob.address);
                    expect(params.setter).toBe(config.account.bob.address);
                    expect(params.property).toBe('ap://test-context');
                    
                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '001|r|d|' + config.account.alice.address.substring("ARDOR-".length) + '|test-root-deprecated-payload' };
                }

                if(propCnt === 2) {
                    expect(params.recipient).toBe(config.account.alice.address);
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');
                    
                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '001|r|a|0000-0000-0000-00000|test-root-payload' };
                }


                fail('should not reach here');
                return { context: 'none', dataFieldsString: 'none' };
            }

            const testClaim = new Claim(new RequestMock(getAccountPropertyCallback, undefined, decodeTokenCallback));


            const createParams: CreateClaimParams = {
                attestationContext: 'test-context',
                attestationPath: [ config.account.bob.address ],
                payload: 'test-claim-payload',
                passphrase: config.account.charlie.secret
            };

            const claimObject = testClaim.createClaim(createParams, true);


            const response = await testClaim.verifyClaim(config.node.url.testnet, {trustedRootAccount: config.account.bob.address, claim: claimObject}, true);
            expect(response.activeRootAccount).toBe(config.account.alice.address);
            expect(response.verifiedTrustChain).toEqual(expect.arrayContaining([ config.account.bob.address ]));
        });


        test('verifyClaim claim creator is deprecated error', async () => {
            const decodeTokenCallback = (params: DecodeTokenParams): { account: string, valid: boolean } => {
                return {account: config.account.bob.address, valid: true};
            }

            let propCnt = 0;
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {

                if(propCnt === 0) {
                    expect(params.recipient).toBe(config.account.bob.address);
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');
                    
                    propCnt++;
                    return { context: 'ap://test-context', dataFieldsString: '001|l|d|' + config.account.alice.address.substring("ARDOR-".length) + '|test-leaf-deprecated-payload' };
                }

                fail('should not reach here');
                return { context: 'none', dataFieldsString: 'none' };
            }

            const testClaim = new Claim(new RequestMock(getAccountPropertyCallback, undefined, decodeTokenCallback));


            const createParams: CreateClaimParams = {
                attestationContext: 'test-context',
                attestationPath: [ config.account.alice.address ],
                payload: 'test-claim-payload',
                passphrase: config.account.bob.secret
            };

            const claimObject = testClaim.createClaim(createParams, true);


            try {
                await testClaim.verifyClaim(config.node.url.testnet, {trustedRootAccount: config.account.alice.address, claim: claimObject}, true);
                fail('should not reach here');
            } catch(e) {
                const error = e as Error;
                expect(error.code).toBe(ErrorCode.CLAIM_CREATOR_DEPRECATED);
                expect(error.description).toBeDefined();
            } 
        });

    });       
} else {
    test('dummy', () => { 
        expect(true).toBeTruthy(); 
    });
}