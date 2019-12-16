import { ChainId, DeleteAccountPropertyParams, GetAccountPropertiesParams, SetAccountPropertyParams } from '@somedotone/ardor-ts';
import { Attestation, attestation, CreateAttestationUncheckedParams, CreateIntermediateAttestationParams, CreateLeafAttestationParams, CreateRootAttestationParams, EntityType, Error, ErrorCode, RevokeAttestationUncheckedParams, RevokeIntermediateAttestationParams, RevokeLeafAttestationParams, RevokeRootAttestationParams, State, UpdateIntermediateAttestationParams, UpdateLeafAttestationParams, UpdateRootAttestationParams } from "../src/index";
import config from './config';
import RequestMock from './mocks/RequestMock';


if(config.test.attestationModule.runTests) {
    describe('Attestation module tests', () => {

        if(config.test.attestationModule.runNodeDependentTests) {
            test('createRootAttestation node error', async () => {
                const params: CreateRootAttestationParams = {
                    passphrase: config.account.alice.secret + "42",
                    payload: "test-payload",
                    attestationContext: "test-context"
                }
                
                try {
                    await attestation.createRootAttestation(config.node.url.testnet, params);
                    fail('should not reach here');
                } catch (e) {
                    const error = e as Error;
                    expect(error.code).toBe(ErrorCode.NODE_ERROR);
                    expect(error.description).toBeDefined();
                }
            });


            test('createRootAttestation connection error', async () => {
                const params: CreateRootAttestationParams = {
                    passphrase: config.account.alice.secret,
                    payload: "test-payload",
                    attestationContext: "test-context"
                }
                
                try {
                    await attestation.createRootAttestation(config.node.url.testnet + "__", params);
                    fail('should not reach here');
                } catch (e) {
                    const error = e as Error;
                    expect(error.code).toBe(ErrorCode.CONNECTION_ERROR);
                    expect(error.description).toBeDefined();
                }
            });
        }
        
    
        test('createRootAttestation success', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                expect(params.recipient).toBe(config.account.alice.address);
                expect(params.setter).toBe(config.account.alice.address);
                expect(params.property).toBe('ap://test-context');

                return { context: 'none', dataFieldsString: 'none' };
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => {
                expect(params.chain).toBe(ChainId.IGNIS);
                expect(params.secretPhrase).toBe(config.account.alice.secret);
                expect(params.recipient).toBe(config.account.alice.address);
                expect(params.property).toBe('ap://test-context');
                expect(params.value).toBe('001|r|a|0000-0000-0000-00000|test-root-payload');
            }
            
            const testAttestation = new Attestation(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback));


            const params: CreateRootAttestationParams = {
                passphrase: config.account.alice.secret,
                payload: "test-root-payload",
                attestationContext: "ap://test-context"
            }
            
            const response = await testAttestation.createRootAttestation(config.node.url.testnet, params);
            expect(response.transactionId).toBeDefined();
        });


        test('createRootAttestation no checks success', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                fail('should not reach here');
                return { context: 'none', dataFieldsString: 'none' };
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams) => {
                expect(params.chain).toBe(ChainId.IGNIS);
                expect(params.secretPhrase).toBe(config.account.alice.secret);
                expect(params.recipient).toBe(config.account.alice.address);
                expect(params.property).toBe('ap://test-context');
                expect(params.value).toBe('001|r|a|0000-0000-0000-00000|test-root-payload');
            }
            
            const testAttestation = new Attestation(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback));


            const params: CreateAttestationUncheckedParams = {
                passphrase: config.account.alice.secret,
                payload: "test-root-payload",
                attestationContext: "ap://test-context",
                entityType: EntityType.ROOT,
                account: config.account.alice.secret
            }
            
            const response = await testAttestation.createAttestationUnchecked(config.node.url.testnet, params);
            expect(response.transactionId).toBeDefined();
        });


        test('createRootAttestation context already set error', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                return { context: 'ap://test-context', dataFieldsString: 'test-root-payload' };
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => {
                fail('should not reach here');
            }

            const testAttestation = new Attestation(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback));


            const params: CreateRootAttestationParams = {
                passphrase: config.account.alice.secret,
                payload: "test-root-payload",
                attestationContext: "ap://test-context"
            }
            
            try {
                await testAttestation.createRootAttestation(config.node.url.testnet, params);
                fail('should not reach here');
            } catch (e) {
                const error = e as Error;
                expect(error.code).toBe(ErrorCode.ATTESTATION_CONTEXT_ALREADY_SET);
                expect(error.description).toBeDefined();
            }
        });


        test('createRootAttestation payload too long error', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                fail('should not reach here');
                return { context: 'none', dataFieldsString: 'none' };
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => {
                fail('should not reach here');
            }

            const testAttestation = new Attestation(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback));


            const params: CreateRootAttestationParams = {
                passphrase: config.account.alice.secret,
                payload: "ZvKaqnqD7Ehr3ixN6Nur0JIEQGqfaSdbfwEKUZJ2O1BTOD9Rd6yfVcU7dZHaRBodb3mmMc0mzkVJu287HrGxinprpvnxk4FGHPAg0IzohZhxpb8vBGO7ZXthWm1amv2inu",
                attestationContext: "test-context"
            }
            
            try {
                await testAttestation.createRootAttestation(config.node.url.testnet, params);
                fail('should not reach here');
            } catch (e) {
                const error = e as Error;
                expect(error.code).toBe(ErrorCode.PAYLOAD_TOO_LONG);
                expect(error.description).toBeDefined();
            }
        });


        test('createIntermediateAttestation default attestor success', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                expect(params.recipient).toBe(config.account.alice.address);
                expect(params.setter).toBe(config.account.alice.address);
                return { context: 'ap://test-context', dataFieldsString: '001|r|a|0000-0000-0000-00000|test-root-payload' };
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => {
                expect(params.chain).toBe(ChainId.IGNIS);
                expect(params.secretPhrase).toBe(config.account.alice.secret);
                expect(params.recipient).toBe(config.account.bob.address);
                expect(params.property).toBe('ap://test-context');
                expect(params.value).toBe('001|i|a|0000-0000-0000-00000|test-intermediate-payload');
            }
            
            const testAttestation = new Attestation(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback));


            const params: CreateIntermediateAttestationParams = {
                passphrase: config.account.alice.secret,
                payload: "test-intermediate-payload",
                attestationContext: "test-context",
                intermediateAccount: config.account.bob.address
            }
            
            const response = await testAttestation.createIntermediateAttestation(config.node.url.testnet, params);
            expect(response.transactionId).toBeDefined();
        });


        test('createIntermediateAttestation payload contains separator success', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                expect(params.recipient).toBe(config.account.alice.address);
                expect(params.setter).toBe(config.account.alice.address);
                return { context: 'ap://test-context', dataFieldsString: '001|r|a|0000-0000-0000-00000|test|root|payload' };
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => {
                expect(params.recipient).toBe(config.account.bob.address);
                expect(params.property).toBe('ap://test-context');
                expect(params.value).toBe('001|i|a|0000-0000-0000-00000|test|intermediate|payload');
            }
            
            const testAttestation = new Attestation(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback));


            const params: CreateIntermediateAttestationParams = {
                passphrase: config.account.alice.secret,
                payload: "test|intermediate|payload",
                attestationContext: "test-context",
                intermediateAccount: config.account.bob.address
            }
            
            const response = await testAttestation.createIntermediateAttestation(config.node.url.testnet, params);
            expect(response.transactionId).toBeDefined();
        });


        test('createIntermediateAttestation defined attestor success', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                expect(params.recipient).toBe(config.account.bob.address);
                expect(params.setter).toBe(config.account.alice.address);
                return { context: 'ap://test-context', dataFieldsString: '001|r|a|0000-0000-0000-00000|test-root-payload' };
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => {
                expect(params.recipient).toBe(config.account.charlie.address);
                expect(params.property).toBe('ap://test-context');
                expect(params.value).toBe('001|i|a|0000-0000-0000-00000|test-intermediate-payload');
            }
            
            const testAttestation = new Attestation(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback));


            const params: CreateIntermediateAttestationParams = {
                passphrase: config.account.bob.secret,
                payload: "test-intermediate-payload",
                myAttestorAccount: config.account.alice.address,
                attestationContext: "test-context",
                intermediateAccount: config.account.charlie.address
            }
            
            const response = await testAttestation.createIntermediateAttestation(config.node.url.testnet, params);
            expect(response.transactionId).toBeDefined();
        });


        test('createIntermediateAttestation no checks success', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                fail('should not reach here');
                return { context: 'none', dataFieldsString: 'none' };
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => {
                expect(params.chain).toBe(ChainId.IGNIS);
                expect(params.secretPhrase).toBe(config.account.bob.secret);
                expect(params.recipient).toBe(config.account.charlie.address);
                expect(params.property).toBe('ap://test-context');
                expect(params.value).toBe('001|i|a|0000-0000-0000-00000|test-intermediate-payload');
            }
            
            const testAttestation = new Attestation(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback));


            const params: CreateAttestationUncheckedParams = {
                passphrase: config.account.bob.secret,
                payload: "test-intermediate-payload",
                entityType: EntityType.INTERMEDIATE,
                attestationContext: "test-context",
                account: config.account.charlie.address
            }
            
            const response = await testAttestation.createAttestationUnchecked(config.node.url.testnet, params);
            expect(response.transactionId).toBeDefined();
        });


        test('createIntermediateAttestation context not found error', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                expect(params.recipient).toBe(config.account.alice.address);
                return { context: 'ap://test-context', dataFieldsString: 'none' };
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => {
                fail('should not reach here');
            }

            const testAttestation = new Attestation(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback));


            const params: CreateIntermediateAttestationParams = {
                passphrase: config.account.alice.secret,
                payload: "test-intermediate-payload",
                attestationContext: "test-context",
                intermediateAccount: config.account.bob.address
            }
            
            try {
                await testAttestation.createIntermediateAttestation(config.node.url.testnet, params);
                fail('should not reach here');
            } catch (e) {
                const error = e as Error;
                expect(error.code).toBe(ErrorCode.ATTESTATION_CONTEXT_NOT_FOUND);
                expect(error.description).toBeDefined();
            }
        });


        test('createIntermediateAttestation wrong number of data fields error', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                expect(params.recipient).toBe(config.account.alice.address);
                return { context: 'ap://test-context', dataFieldsString: '001|i|0000-0000-0000-00000|test-intermediate-payload' };
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => {
                fail('should not reach here');
            }

            const testAttestation = new Attestation(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback));


            const params: CreateIntermediateAttestationParams = {
                passphrase: config.account.alice.secret,
                payload: "test-intermediate-payload",
                attestationContext: "test-context",
                intermediateAccount: config.account.bob.address
            }
            
            try {
                await testAttestation.createIntermediateAttestation(config.node.url.testnet, params);
                fail('should not reach here');
            } catch (e) {
                const error = e as Error;
                expect(error.code).toBe(ErrorCode.WRONG_NUMBER_OF_DATA_FIELDS);
                expect(error.description).toBeDefined();
            }
        });


        test('createIntermediateAttestation wrong version length error', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                expect(params.recipient).toBe(config.account.alice.address);
                return { context: 'ap://test-context', dataFieldsString: '01|i|a|0000-0000-0000-00000|test-intermediate-payload' };
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => {
                fail('should not reach here');
            }

            const testAttestation = new Attestation(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback));


            const params: CreateIntermediateAttestationParams = {
                passphrase: config.account.alice.secret,
                payload: "test-intermediate-payload",
                attestationContext: "test-context",
                intermediateAccount: config.account.bob.address
            }
            
            try {
                await testAttestation.createIntermediateAttestation(config.node.url.testnet, params);
                fail('should not reach here');
            } catch (e) {
                const error = e as Error;
                expect(error.code).toBe(ErrorCode.WRONG_VERSION_LENGTH);
                expect(error.description).toBeDefined();
            }
        });


        test('createIntermediateAttestation wrong version error', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                expect(params.recipient).toBe(config.account.alice.address);
                return { context: 'ap://test-context', dataFieldsString: '002|i|a|0000-0000-0000-00000|test-intermediate-payload' };
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => {
                fail('should not reach here');
            }

            const testAttestation = new Attestation(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback));


            const params: CreateIntermediateAttestationParams = {
                passphrase: config.account.alice.secret,
                payload: "test-intermediate-payload",
                attestationContext: "test-context",
                intermediateAccount: config.account.bob.address
            }
            
            try {
                await testAttestation.createIntermediateAttestation(config.node.url.testnet, params);
                fail('should not reach here');
            } catch (e) {
                const error = e as Error;
                expect(error.code).toBe(ErrorCode.WRONG_VERSION);
                expect(error.description).toBeDefined();
            }
        });


        test('createIntermediateAttestation wrong entity type length error', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                expect(params.recipient).toBe(config.account.alice.address);
                return { context: 'ap://test-context', dataFieldsString: '001|ie|a|0000-0000-0000-00000|test-intermediate-payload' };
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => {
                fail('should not reach here');
            }

            const testAttestation = new Attestation(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback));


            const params: CreateIntermediateAttestationParams = {
                passphrase: config.account.alice.secret,
                payload: "test-intermediate-payload",
                attestationContext: "test-context",
                intermediateAccount: config.account.bob.address
            }
            
            try {
                await testAttestation.createIntermediateAttestation(config.node.url.testnet, params);
                fail('should not reach here');
            } catch (e) {
                const error = e as Error;
                expect(error.code).toBe(ErrorCode.WRONG_ENTITY_TYPE_LENGTH);
                expect(error.description).toBeDefined();
            }
        });


        test('createIntermediateAttestation unknown entity type error', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                expect(params.recipient).toBe(config.account.alice.address);
                return { context: 'ap://test-context', dataFieldsString: '001|b|a|0000-0000-0000-00000|test-intermediate-payload' };
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => {
                fail('should not reach here');
            }

            const testAttestation = new Attestation(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback));


            const params: CreateIntermediateAttestationParams = {
                passphrase: config.account.alice.secret,
                payload: "test-intermediate-payload",
                attestationContext: "test-context",
                intermediateAccount: config.account.bob.address
            }
            
            try {
                await testAttestation.createIntermediateAttestation(config.node.url.testnet, params);
                fail('should not reach here');
            } catch (e) {
                const error = e as Error;
                expect(error.code).toBe(ErrorCode.UNKNOWN_ENTITY_TYPE);
                expect(error.description).toBeDefined();
            }
        });


        test('createIntermediateAttestation wrong state type length error', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                expect(params.recipient).toBe(config.account.alice.address);
                return { context: 'ap://test-context', dataFieldsString: '001|i|ai|0000-0000-0000-00000|test-intermediate-payload' };
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => {
                fail('should not reach here');
            }

            const testAttestation = new Attestation(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback));


            const params: CreateIntermediateAttestationParams = {
                passphrase: config.account.alice.secret,
                payload: "test-intermediate-payload",
                attestationContext: "test-context",
                intermediateAccount: config.account.bob.address
            }
            
            try {
                await testAttestation.createIntermediateAttestation(config.node.url.testnet, params);
                fail('should not reach here');
            } catch (e) {
                const error = e as Error;
                expect(error.code).toBe(ErrorCode.WRONG_STATE_TYPE_LENGTH);
                expect(error.description).toBeDefined();
            }
        });


        test('createIntermediateAttestation unknown state type error', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                expect(params.recipient).toBe(config.account.alice.address);
                return { context: 'ap://test-context', dataFieldsString: '001|i|z|0000-0000-0000-00000|test-intermediate-payload' };
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => {
                fail('should not reach here');
            }

            const testAttestation = new Attestation(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback));


            const params: CreateIntermediateAttestationParams = {
                passphrase: config.account.alice.secret,
                payload: "test-intermediate-payload",
                attestationContext: "test-context",
                intermediateAccount: config.account.bob.address
            }
            
            try {
                await testAttestation.createIntermediateAttestation(config.node.url.testnet, params);
                fail('should not reach here');
            } catch (e) {
                const error = e as Error;
                expect(error.code).toBe(ErrorCode.UNKNOWN_STATE_TYPE);
                expect(error.description).toBeDefined();
            }
        });


        test('createIntermediateAttestation wrong redirect account length error', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                expect(params.recipient).toBe(config.account.alice.address);
                return { context: 'ap://test-context', dataFieldsString: '001|i|a|0000-0000-0000-000000|test-intermediate-payload' };
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => {
                fail('should not reach here');
            }

            const testAttestation = new Attestation(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback));


            const params: CreateIntermediateAttestationParams = {
                passphrase: config.account.alice.secret,
                payload: "test-intermediate-payload",
                attestationContext: "test-context",
                intermediateAccount: config.account.bob.address
            }
            
            try {
                await testAttestation.createIntermediateAttestation(config.node.url.testnet, params);
                fail('should not reach here');
            } catch (e) {
                const error = e as Error;
                expect(error.code).toBe(ErrorCode.WRONG_REDIRECT_ACCOUNT_LENGTH);
                expect(error.description).toBeDefined();
            }
        });


        test('createIntermediateAttestation invalid redirect account error', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                expect(params.recipient).toBe(config.account.alice.address);
                return { context: 'ap://test-context', dataFieldsString: '001|i|a|000O-0000-0000-00000|test-intermediate-payload' };
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => {
                fail('should not reach here');
            }

            const testAttestation = new Attestation(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback));


            const params: CreateIntermediateAttestationParams = {
                passphrase: config.account.alice.secret,
                payload: "test-intermediate-payload",
                attestationContext: "test-context",
                intermediateAccount: config.account.bob.address
            }
            
            try {
                await testAttestation.createIntermediateAttestation(config.node.url.testnet, params);
                fail('should not reach here');
            } catch (e) {
                const error = e as Error;
                expect(error.code).toBe(ErrorCode.INVALID_REDIRECT_ACCOUNT);
                expect(error.description).toBeDefined();
            }
        });


        test('createIntermediateAttestation attestation not allowed error', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                expect(params.recipient).toBe(config.account.alice.address);
                return { context: 'ap://test-context', dataFieldsString: '001|l|a|0000-0000-0000-00000|test-intermediate-payload' };
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => {
                fail('should not reach here');
            }

            const testAttestation = new Attestation(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback));


            const params: CreateIntermediateAttestationParams = {
                passphrase: config.account.alice.secret,
                payload: "test-intermediate-payload",
                attestationContext: "test-context",
                intermediateAccount: config.account.bob.address
            }
            
            try {
                await testAttestation.createIntermediateAttestation(config.node.url.testnet, params);
                fail('should not reach here');
            } catch (e) {
                const error = e as Error;
                expect(error.code).toBe(ErrorCode.ATTESTATION_NOT_ALLOWED);
                expect(error.description).toBeDefined();
            }
        });


        test('createIntermediateAttestation entity not active error', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                expect(params.recipient).toBe(config.account.alice.address);
                return { context: 'ap://test-context', dataFieldsString: '001|i|i|0000-0000-0000-00000|test-intermediate-payload' };
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => {
                fail('should not reach here');
            }

            const testAttestation = new Attestation(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback));


            const params: CreateIntermediateAttestationParams = {
                passphrase: config.account.alice.secret,
                payload: "test-intermediate-payload",
                attestationContext: "test-context",
                intermediateAccount: config.account.bob.address
            }
            
            try {
                await testAttestation.createIntermediateAttestation(config.node.url.testnet, params);
                fail('should not reach here');
            } catch (e) {
                const error = e as Error;
                expect(error.code).toBe(ErrorCode.ENTITY_NOT_ACTIVE);
                expect(error.description).toBeDefined();
            }
        });


        test('createIntermediateAttestation self attestation error', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                fail('should not reach here');
                return { context: 'none', dataFieldsString: 'none' };
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => {
                fail('should not reach here');
            }

            const testAttestation = new Attestation(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback));


            const params: CreateIntermediateAttestationParams = {
                passphrase: config.account.alice.secret,
                payload: "test-intermediate-payload",
                attestationContext: "test-context",
                intermediateAccount: config.account.alice.address
            }
            
            try {
                await testAttestation.createIntermediateAttestation(config.node.url.testnet, params);
                fail('should not reach here');
            } catch (e) {
                const error = e as Error;
                expect(error.code).toBe(ErrorCode.SELF_ATTESTATION_NOT_ALLOWED);
                expect(error.description).toBeDefined();
            }
        });


        test('createLeafAttestation success', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                expect(params.recipient).toBe(config.account.bob.address);
                return { context: 'ap://test-context', dataFieldsString: '001|r|a|0000-0000-0000-00000|test-root-payload' };
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => {
                expect(params.chain).toBe(ChainId.IGNIS);
                expect(params.secretPhrase).toBe(config.account.bob.secret);
                expect(params.recipient).toBe(config.account.charlie.address);
                expect(params.property).toBe('ap://test-context')
                expect(params.value).toBe('001|l|a|0000-0000-0000-00000|test-leaf-payload')
            }
            
            const testAttestation = new Attestation(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback));


            const params: CreateLeafAttestationParams = {
                passphrase: config.account.bob.secret,
                payload: "test-leaf-payload",
                attestationContext: "test-context",
                leafAccount: config.account.charlie.address
            }
            
            const response = await testAttestation.createLeafAttestation(config.node.url.testnet, params);
            expect(response.transactionId).toBeDefined();
        });


        test('updateRootAttestation new state and payload success', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                expect(params.recipient).toBe(config.account.alice.address);
                return { context: 'ap://test-context', dataFieldsString: '001|r|a|0000-0000-0000-00000|test-root-payload' };
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => {
                expect(params.chain).toBe(ChainId.IGNIS);
                expect(params.secretPhrase).toBe(config.account.alice.secret);
                expect(params.recipient).toBe(config.account.alice.address);
                expect(params.property).toBe('ap://test-context')
                expect(params.value).toBe('001|r|i|0000-0000-0000-00000|test-new-payload')
            }
            
            const testAttestation = new Attestation(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback));


            const params: UpdateRootAttestationParams = {
                passphrase: config.account.alice.secret,
                attestationContext: "test-context",
                newState: State.INACTIVE,
                newPayload: "test-new-payload"
            }
            
            const response = await testAttestation.updateRootAttestation(config.node.url.testnet, params);
            expect(response.transactionId).toBeDefined();
        });


        test('updateRootAttestation inactive to active success', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                expect(params.recipient).toBe(config.account.alice.address);
                return { context: 'ap://test-context', dataFieldsString: '001|r|i|0000-0000-0000-00000|test-root-payload' };
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => {
                expect(params.chain).toBe(ChainId.IGNIS);
                expect(params.secretPhrase).toBe(config.account.alice.secret);
                expect(params.recipient).toBe(config.account.alice.address);
                expect(params.property).toBe('ap://test-context')
                expect(params.value).toBe('001|r|a|0000-0000-0000-00000|test-root-payload')
            }
            
            const testAttestation = new Attestation(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback));


            const params: UpdateRootAttestationParams = {
                passphrase: config.account.alice.secret,
                attestationContext: "test-context",
                newState: State.ACTIVE
            }
            
            const response = await testAttestation.updateRootAttestation(config.node.url.testnet, params);
            expect(response.transactionId).toBeDefined();
        });


        test('updateRootAttestation same state error', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                expect(params.recipient).toBe(config.account.alice.address);
                return { context: 'ap://test-context', dataFieldsString: '001|r|a|0000-0000-0000-00000|test-root-payload' };
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => {
                fail('should not reach here');
            }

            const testAttestation = new Attestation(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback));


            const params: UpdateRootAttestationParams = {
                passphrase: config.account.alice.secret,
                attestationContext: "test-context",
                newState: State.ACTIVE
            }

            try {
                await testAttestation.updateRootAttestation(config.node.url.testnet, params);
                fail('should not reach here');
            } catch (e) {
                const error = e as Error;
                expect(error.code).toBe(ErrorCode.STATE_ALREADY_SET);
                expect(error.description).toBeDefined();
            }
        });


        test('updateRootAttestation same payload error', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                expect(params.recipient).toBe(config.account.alice.address);
                return { context: 'ap://test-context', dataFieldsString: '001|r|a|0000-0000-0000-00000|test-root-payload' };
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => {
                fail('should not reach here');
            }

            const testAttestation = new Attestation(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback));


            const params: UpdateRootAttestationParams = {
                passphrase: config.account.alice.secret,
                attestationContext: "test-context",
                newPayload: "test-root-payload"
            }

            try {
                await testAttestation.updateRootAttestation(config.node.url.testnet, params);
                fail('should not reach here');
            } catch (e) {
                const error = e as Error;
                expect(error.code).toBe(ErrorCode.PAYLOAD_ALREADY_SET);
                expect(error.description).toBeDefined();
            }
        });


        test('updateRootAttestation attestation not allowed error', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                expect(params.recipient).toBe(config.account.alice.address);
                return { context: 'ap://test-context', dataFieldsString: '001|i|a|0000-0000-0000-00000|test-root-payload' };
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => {
                fail('should not reach here');
            }

            const testAttestation = new Attestation(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback));


            const params: UpdateRootAttestationParams = {
                passphrase: config.account.alice.secret,
                attestationContext: "test-context",
                newState: State.INACTIVE,
                newPayload: "test-new-payload"
            }

            try {
                await testAttestation.updateRootAttestation(config.node.url.testnet, params);
                fail('should not reach here');
            } catch (e) {
                const error = e as Error;
                expect(error.code).toBe(ErrorCode.ATTESTATION_NOT_ALLOWED);
                expect(error.description).toBeDefined();
            }
        });


        test('updateRootAttestation deprecation success', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                if(params.recipient === config.account.alice.address) {
                    return { context: 'ap://test-context', dataFieldsString: '001|r|a|0000-0000-0000-00000|test-root-payload' };
                }

                if(params.recipient === config.account.bob.address) {
                    return { context: 'none', dataFieldsString: 'none' };
                }

                fail('should not reach here');
                return { context: 'error', dataFieldsString: 'error' };
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => {
                if(params.recipient === config.account.alice.address) {
                    expect(params.chain).toBe(ChainId.IGNIS);
                    expect(params.secretPhrase).toBe(config.account.alice.secret);
                    expect(params.property).toBe('ap://test-context')
                    expect(params.value).toBe('001|r|d|' + config.account.bob.address.substring("ARDOR-".length) + '|test-root-payload')
                    return;
                }

                if(params.recipient === config.account.bob.address) {
                    expect(params.property).toBe('ap://test-context')
                    expect(params.value).toBe('001|r|a|0000-0000-0000-00000|test-new-payload')
                    return;
                }

                fail('should not reach here');
            }
            
            const testAttestation = new Attestation(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback));


            const params: UpdateRootAttestationParams = {
                passphrase: config.account.alice.secret,
                attestationContext: "test-context",
                newPayload: "test-new-payload",
                newRootAccount: config.account.bob.address
            }
            
            const response = await testAttestation.updateRootAttestation(config.node.url.testnet, params);
            expect(response.transactionId).toBeDefined();
        });


        test('updateRootAttestation deprecation context already set error', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                if(params.recipient === config.account.alice.address) {
                    return { context: 'ap://test-context', dataFieldsString: '001|r|a|0000-0000-0000-00000|test-root-payload' };
                }

                if(params.recipient === config.account.bob.address) {
                    return { context: 'ap://test-context', dataFieldsString: '001|r|a|0000-0000-0000-00000|test-root-payload' };
                }

                fail('should not reach here');
                return { context: 'error', dataFieldsString: 'error' };
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => {
                fail('should not reach here');
            }
            
            const testAttestation = new Attestation(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback));


            const params: UpdateRootAttestationParams = {
                passphrase: config.account.alice.secret,
                attestationContext: "test-context",
                newRootAccount: config.account.bob.address
            }
            
            try {
                await testAttestation.updateRootAttestation(config.node.url.testnet, params);
                fail('should not reach here');
            } catch (e) {
                const error = e as Error;
                expect(error.code).toBe(ErrorCode.ATTESTATION_CONTEXT_ALREADY_SET);
                expect(error.description).toBeDefined();
            }
        });


        test('updateIntermediateAttestation deprecation success', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                expect(params.property).toBe('ap://test-context');

                if(params.recipient === config.account.alice.address) {
                    return { context: 'ap://test-context', dataFieldsString: '001|r|a|0000-0000-0000-00000|test-root-payload' };
                }

                if(params.recipient === config.account.bob.address) {
                    return { context: 'ap://test-context', dataFieldsString: '001|i|a|0000-0000-0000-00000|test-intermediate-payload' };
                }

                if(params.recipient === config.account.charlie.address) {
                    return { context: 'none', dataFieldsString: 'none' };
                }

                fail('should not reach here');
                return { context: 'error', dataFieldsString: 'error' };
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => {
                if(params.recipient === config.account.bob.address) {
                    expect(params.property).toBe('ap://test-context')
                    expect(params.value).toBe('001|i|d|' + config.account.charlie.address.substring("ARDOR-".length) + '|test-intermediate-payload')
                    return;
                }

                if(params.recipient === config.account.charlie.address) {
                    expect(params.property).toBe('ap://test-context')
                    expect(params.value).toBe('001|i|a|0000-0000-0000-00000|test-new-payload')
                    return;
                }

                fail('should not reach here');
            }
            
            const testAttestation = new Attestation(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback));


            const params: UpdateIntermediateAttestationParams = {
                passphrase: config.account.alice.secret,
                attestationContext: "test-context",
                newPayload: "test-new-payload",
                intermediateAccount: config.account.bob.address,
                newIntermediateAccount: config.account.charlie.address
            }
            
            const response = await testAttestation.updateIntermediateAttestation(config.node.url.testnet, params);
            expect(response.transactionId).toBeDefined();
        });


        test('updateLeafAttestation deprecation success', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                if(params.recipient === config.account.alice.address) {
                    return { context: 'ap://test-context', dataFieldsString: '001|i|a|0000-0000-0000-00000|test-intermediate-payload' };
                }

                if(params.recipient === config.account.bob.address) {
                    return { context: 'ap://test-context', dataFieldsString: '001|l|a|0000-0000-0000-00000|test-leaf-payload' };
                }

                if(params.recipient === config.account.charlie.address) {
                    return { context: 'none', dataFieldsString: 'none' };
                }

                fail('should not reach here');
                return { context: 'error', dataFieldsString: 'error' };
            }

            const setAccountPropertyCallback = (params: SetAccountPropertyParams): void => {
                if(params.recipient === config.account.bob.address) {
                    expect(params.property).toBe('ap://test-context')
                    expect(params.value).toBe('001|l|d|' + config.account.charlie.address.substring("ARDOR-".length) + '|test-leaf-payload')
                    return;
                }

                if(params.recipient === config.account.charlie.address) {
                    expect(params.property).toBe('ap://test-context')
                    expect(params.value).toBe('001|l|a|0000-0000-0000-00000|test-new-payload')
                    return;
                }

                fail('should not reach here');
            }
            
            const testAttestation = new Attestation(new RequestMock(getAccountPropertyCallback, setAccountPropertyCallback));


            const params: UpdateLeafAttestationParams = {
                passphrase: config.account.alice.secret,
                attestationContext: "test-context",
                newPayload: "test-new-payload",
                leafAccount: config.account.bob.address,
                newLeafAccount: config.account.charlie.address
            }
            
            const response = await testAttestation.updateLeafAttestation(config.node.url.testnet, params);
            expect(response.transactionId).toBeDefined();
        });


        test('revokeRootAttestation success', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                if(params.recipient === config.account.alice.address) {
                    expect(params.property).toBe('ap://test-context');
                    expect(params.setter).toBe(config.account.alice.address);

                    return { context: 'ap://test-context', dataFieldsString: '001|r|a|0000-0000-0000-00000|test-root-payload' };
                }

                fail('should not reach here');
                return { context: 'error', dataFieldsString: 'error' };
            }

            const deleteAccountPropertyCallback = (params: DeleteAccountPropertyParams): void => {
                if(params.recipient === config.account.alice.address) {
                    expect(params.chain).toBe(ChainId.IGNIS);
                    expect(params.secretPhrase).toBe(config.account.alice.secret);
                    expect(params.property).toBe('ap://test-context')
                    return;
                }

                fail('should not reach here');
            }
            
            const testAttestation = new Attestation(new RequestMock(getAccountPropertyCallback, undefined, undefined, deleteAccountPropertyCallback));


            const params: RevokeRootAttestationParams = {
                passphrase: config.account.alice.secret,
                attestationContext: "test-context",
            }
            
            const response = await testAttestation.revokeRootAttestation(config.node.url.testnet, params);
            expect(response.transactionId).toBeDefined();
        });


        test('revokeRootAttestation entity type mismatch error', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                if(params.recipient === config.account.alice.address) {
                    return { context: 'ap://test-context', dataFieldsString: '001|i|a|0000-0000-0000-00000|test-root-payload' };
                }

                fail('should not reach here');
                return { context: 'error', dataFieldsString: 'error' };
            }

            const deleteAccountPropertyCallback = (params: DeleteAccountPropertyParams): void => {
                if(params.recipient === config.account.alice.address) {
                    expect(params.chain).toBe(ChainId.IGNIS);
                    expect(params.secretPhrase).toBe(config.account.alice.secret);
                    expect(params.property).toBe('ap://test-context')
                    return;
                }

                fail('should not reach here');
            }
            
            const testAttestation = new Attestation(new RequestMock(getAccountPropertyCallback, undefined, undefined, deleteAccountPropertyCallback));


            const params: RevokeRootAttestationParams = {
                passphrase: config.account.alice.secret,
                attestationContext: "test-context",
            }
            
            try {
                await testAttestation.revokeRootAttestation(config.node.url.testnet, params);
                fail('should not reach here');
            } catch(e) {
                const error = e as Error;
                expect(error.code).toBe(ErrorCode.ENTITY_MISMATCH);
                expect(error.description).toBeDefined();
            }
        });


        test('revokeIntermediateAttestation attestor success', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                if(params.recipient === config.account.bob.address) {
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');

                    return { context: 'ap://test-context', dataFieldsString: '001|i|a|0000-0000-0000-00000|test-root-payload' };
                }

                fail('should not reach here');
                return { context: 'error', dataFieldsString: 'error' };
            }

            const deleteAccountPropertyCallback = (params: DeleteAccountPropertyParams): void => {
                if(params.recipient === config.account.bob.address) {
                    expect(params.chain).toBe(ChainId.IGNIS);
                    expect(params.secretPhrase).toBe(config.account.alice.secret);
                    expect(params.property).toBe('ap://test-context')
                    return;
                }

                fail('should not reach here');
            }
            
            const testAttestation = new Attestation(new RequestMock(getAccountPropertyCallback, undefined, undefined, deleteAccountPropertyCallback));


            const params: RevokeIntermediateAttestationParams = {
                passphrase: config.account.alice.secret,
                attestationContext: "test-context",
                intermediateAccount: config.account.bob.address
            }
            
            const response = await testAttestation.revokeIntermediateAttestation(config.node.url.testnet, params);
            expect(response.transactionId).toBeDefined();
        });


        test('revokeIntermediateAttestation self success', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                if(params.recipient === config.account.alice.address) {
                    return { context: 'ap://test-context', dataFieldsString: '001|i|a|0000-0000-0000-00000|test-root-payload' };
                }

                fail('should not reach here');
                return { context: 'error', dataFieldsString: 'error' };
            }

            const deleteAccountPropertyCallback = (params: DeleteAccountPropertyParams): void => {
                if(params.recipient === config.account.alice.address) {
                    expect(params.chain).toBe(ChainId.IGNIS);
                    expect(params.secretPhrase).toBe(config.account.alice.secret);
                    expect(params.property).toBe('ap://test-context')
                    return;
                }

                fail('should not reach here');
            }
            
            const testAttestation = new Attestation(new RequestMock(getAccountPropertyCallback, undefined, undefined, deleteAccountPropertyCallback));


            const params: RevokeIntermediateAttestationParams = {
                passphrase: config.account.alice.secret,
                attestationContext: "test-context",
            }
            
            const response = await testAttestation.revokeIntermediateAttestation(config.node.url.testnet, params);
            expect(response.transactionId).toBeDefined();
        });


        test('revokeLeafAttestation attestor success', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                if(params.recipient === config.account.bob.address) {
                    expect(params.setter).toBe(config.account.alice.address);
                    expect(params.property).toBe('ap://test-context');

                    return { context: 'ap://test-context', dataFieldsString: '001|l|a|0000-0000-0000-00000|test-root-payload' };
                }

                fail('should not reach here');
                return { context: 'error', dataFieldsString: 'error' };
            }

            const deleteAccountPropertyCallback = (params: DeleteAccountPropertyParams): void => {
                if(params.recipient === config.account.bob.address) {
                    expect(params.chain).toBe(ChainId.IGNIS);
                    expect(params.secretPhrase).toBe(config.account.alice.secret);
                    expect(params.property).toBe('ap://test-context')
                    return;
                }

                fail('should not reach here');
            }
            
            const testAttestation = new Attestation(new RequestMock(getAccountPropertyCallback, undefined, undefined, deleteAccountPropertyCallback));


            const params: RevokeLeafAttestationParams = {
                passphrase: config.account.alice.secret,
                attestationContext: "test-context",
                leafAccount: config.account.bob.address
            }
            
            const response = await testAttestation.revokeLeafAttestation(config.node.url.testnet, params);
            expect(response.transactionId).toBeDefined();
        });


        test('revokeAttestationUnchecked success', async () => {
            const deleteAccountPropertyCallback = (params: DeleteAccountPropertyParams): void => {
                if(params.recipient === config.account.bob.address) {
                    expect(params.chain).toBe(ChainId.IGNIS);
                    expect(params.secretPhrase).toBe(config.account.alice.secret);
                    expect(params.property).toBe('ap://test-context')
                    return;
                }

                fail('should not reach here');
            }
            
            const testAttestation = new Attestation(new RequestMock(undefined, undefined, undefined, deleteAccountPropertyCallback));

            
            const params: RevokeAttestationUncheckedParams = {
                passphrase: config.account.alice.secret,
                attestationContext: "test-context",
                account: config.account.bob.address
            }
            
            const response = await testAttestation.revokeAttestationUnchecked(config.node.url.testnet, params);
            expect(response.transactionId).toBeDefined();
        });

    });       
} else {
    test('dummy', () => { 
        expect(true).toBeTruthy(); 
    });
}