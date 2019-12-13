import { GetAccountPropertiesParams } from "ardor-ts";
import { Entity, EntityType, GetEntityParams, State, Error, ErrorCode } from "../src/index";
import config from './config';
import RequestMock from "./mocks/RequestMock";


if(config.test.entityModule.runTests) {
    describe('Entity module tests', () => {
    
        test('getEntity default attestor success', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                expect(params.recipient).toBe(config.account.alice.address);
                expect(params.setter).toBe(config.account.alice.address);
                expect(params.property).toBe('ap://test-context');

                return { context: 'ap://test-context', dataFieldsString: '001|r|a|0000-0000-0000-00000|test-root-payload' };
            }

            const testEntity = new Entity(new RequestMock(getAccountPropertyCallback));


            const params: GetEntityParams = {
                account: config.account.alice.address,
                attestationContext: 'ap://test-context'
            }
            
            const response = await testEntity.getEntity(config.node.url.testnet, params);
            expect(response.account).toBe(config.account.alice.address);
            expect(response.attestationContext).toBe('ap://test-context');
            expect(response.entityType).toBe(EntityType.ROOT);
            expect(response.payload).toBe('test-root-payload');
            expect(response.protocolVersion).toBe('001');
            expect(response.redirectAccount).toBe('0000-0000-0000-00000');
            expect(response.state).toBe(State.ACTIVE);
        });


        test('getEntity specified attestor success', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                expect(params.recipient).toBe(config.account.bob.address);
                expect(params.setter).toBe(config.account.alice.address);
                expect(params.property).toBe('ap://test-context');

                return { context: 'ap://test-context', dataFieldsString: '001|r|a|0000-0000-0000-00000|test-root-payload' };
            }

            const testEntity = new Entity(new RequestMock(getAccountPropertyCallback));


            const params: GetEntityParams = {
                account: config.account.bob.address,
                attestationContext: 'ap://test-context',
                attestor: config.account.alice.address
            }
            
            const response = await testEntity.getEntity(config.node.url.testnet, params);
            expect(response.account).toBe(config.account.bob.address);
            expect(response.attestationContext).toBe('ap://test-context');
            expect(response.entityType).toBe(EntityType.ROOT);
            expect(response.payload).toBe('test-root-payload');
            expect(response.protocolVersion).toBe('001');
            expect(response.redirectAccount).toBe('0000-0000-0000-00000');
            expect(response.state).toBe(State.ACTIVE);
        });


        test('getEntity attestation context not found error', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                expect(params.recipient).toBe(config.account.bob.address);
                expect(params.setter).toBe(config.account.alice.address);
                expect(params.property).toBe('ap://test-context');

                return { context: 'none', dataFieldsString: 'none' };
            }

            const testEntity = new Entity(new RequestMock(getAccountPropertyCallback));


            const params: GetEntityParams = {
                account: config.account.bob.address,
                attestationContext: 'ap://test-context',
                attestor: config.account.alice.address
            }
            
            try {
                await testEntity.getEntity(config.node.url.testnet, params);
                fail('should not reach here');
            } catch(e) {
                const error = e as Error;
                expect(error.code).toBe(ErrorCode.ATTESTATION_CONTEXT_NOT_FOUND);
                expect(error.description).toBeDefined();
            }
        });


        test('getEntity attestation context without prefix success', async () => {
            const getAccountPropertyCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => {
                expect(params.property).toBe('ap://test-context');

                return { context: 'ap://test-context', dataFieldsString: '001|r|a|0000-0000-0000-00000|test-root-payload' };
            }

            const testEntity = new Entity(new RequestMock(getAccountPropertyCallback));

            
            const params: GetEntityParams = {
                account: config.account.alice.address,
                attestationContext: 'test-context'
            }
            
            const response = await testEntity.getEntity(config.node.url.testnet, params);
            expect(response.attestationContext).toBe('ap://test-context');
        });

    });       
} else {
    test('dummy', () => { 
        expect(true).toBeTruthy(); 
    });
}