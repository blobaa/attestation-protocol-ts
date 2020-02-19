# Attestation Protocol TypeScript

An implementation of the [Attestation Protocol](https://docu.blobaa.dev/Attestation-Protocol.html) written in [TypeScript](https://www.typescriptlang.org).


<details><summary><i>Table of Contents</i></summary>
<p>

- [Attestation Protocol TypeScript](#attestation-protocol-typescript)
  - [Installation](#installation)
  - [Development](#development)
  - [General](#general)
  - [APIs](#apis)
    - [Attestation](#attestation)
      - [createRootAttestation](#createrootattestation)
      - [createIntermediateAttestation](#createintermediateattestation)
      - [createLeafAttestation](#createleafattestation)
      - [createAttestationUnchecked](#createattestationunchecked)
      - [updateRootAttestation](#updaterootattestation)
      - [updateIntermediateAttestation](#updateintermediateattestation)
      - [updateLeafAttestation](#updateleafattestation)
      - [revokeRootAttestation](#revokerootattestation)
      - [revokeIntermediateAttestation](#revokeintermediateattestation)
      - [revokeLeafAttestation](#revokeleafattestation)
      - [revokeAttestationUnchecked](#revokeattestationunchecked)
    - [Data](#data)
      - [signData](#signdata)
      - [verifySignedData](#verifysigneddata)
    - [Entity](#entity)
      - [getEntity](#getentity)
    - [Error Handling](#error-handling)
  - [Module Instantiation](#module-instantiation)
  - [Licensing](#licensing)
    - [Dual-License](#dual-license)

</p>
</details>


## Installation

At the current state this library is published to the GitHub npm registry only.
To use it as a dependency, create an *.npmrc* file in the same directory as your *package.json* and add the following line 

````
@blobaa:registry=https://npm.pkg.github.com/blobaa
```` 

This tells npm to use the GitHub registry for scoped packages.
You can now install the npm package via

````
npm install @blobaa/attestation-protocol-ts@<release version>
````

More information can be found at the [npm package](https://github.com/blobaa/attestation-protocol-ts/packages/82302) description and [this medium post](https://medium.com/@crysfel/using-different-registries-in-yarn-and-npm-766541d6f851) about multiple registry usage.


## Development

You need to have [Node.js](https://nodejs.org/en/) installed.

To **initialize** the project just clone this repository and run
```
npm install
```

For **linting** run 
```
npm run lint
```

You can try to **autofix lint errors** with
```
npm run fix-lint
```

For **unit testing** run the following associated commands

browser:
```
npm run test-browser
```

node: 
```
npm run test-node
```

both: 
```
npm test
```


## General

This library uses the [ardor-ts](https://github.com/blobaa/ardor-ts) package to interact with the [Ardor](https://ardorplatform.org) Blockchain. At the current state there is no child chain configuration possible. It uses the default ardor-ts configuration and therefore the IGNIS child chain.

There are lots of tests in the test folder. Have a look if you need some additional examples of how to use the APIs.

This version implements the Attestation Protocol version 1.0.0


## APIs

The library consist of the following modules:

### Attestation

The Attestation module handles attestation tasks like creating, updating and revoking attestations. It provides the following APIs:

````typescript
- createRootAttestation(url: string, params: CreateRootAttestationParams): Promise<AttestationResponse>
- createIntermediateAttestation(url: string, params: CreateIntermediateAttestationParams): Promise<AttestationResponse>
- createLeafAttestation(url: string, params: CreateLeafAttestationParams): Promise<AttestationResponse>
- createAttestationUnchecked(url: string, params: CreateAttestationUncheckedParams): Promise<AttestationResponse>

- updateRootAttestation(url: string, params: UpdateRootAttestationParams): Promise<AttestationResponse>
- updateIntermediateAttestation(url: string, params: UpdateIntermediateAttestationParams): Promise<AttestationResponse>
- updateLeafAttestation(url: string, params: UpdateLeafAttestationParams): Promise<AttestationResponse>

- revokeRootAttestation(url: string, params: RevokeRootAttestationParams): Promise<AttestationResponse>
- revokeIntermediateAttestation(url: string, params: RevokeIntermediateAttestationParams): Promise<AttestationResponse>
- revokeLeafAttestation(url: string, params: RevokeLeafAttestationParams): Promise<AttestationResponse>
- revokeAttestationUnchecked(url: string, params: RevokeAttestationUncheckedParams): Promise<AttestationResponse>
````

Before requesting blockchain transactions, various conditions will be checked and an error will be thrown in case of an unmet condition. This is to protect a user against invalid transaction creation and therefore money lost in form of transaction fees.

Use the *createAttestationUnchecked* and *revokeAttestationUnchecked* APIs for bypassing these checks (which is of course not recommended).


#### createRootAttestation

This API lets you create self attestations and therefore root entities for trust chains.

````typescript
import { attestation, CreateRootAttestationParams } from '@blobaa/attestation-protocol-ts'


const createRootAttestationExample = async () => {

    /* set parameters */
    const params: CreateRootAttestationParams = {
        attestationContext: "exampleContext",
        payload: "exampleAccountPayload",       // [optional] payload data field (see Attestation Protocol)
        
        passphrase: "<some passphrase>",        // passphrase of account to be self attested
        fee: 0.1                                // [optional] fee in IGNIS.
                                                // If not set, automatic fee calculation will be used
    };
    
    try {

        /* create and emit request */
        const response = await attestation.createRootAttestation("https://testardor.jelurida.com", params);

        /* response implements the AttestationResponse interface */
        console.log(response.transactionId);

    } catch (e) { /* see error handling */ }
}

createRootAttestationExample();
````


#### createIntermediateAttestation

This API creates intermediate attestations based on a root or intermediate account. It creates an intermediate chain link in a trust chain.

````typescript
import { attestation, CreateIntermediateAttestationParams } from '@blobaa/attestation-protocol-ts'


const createIntermediateAttestationExample = async () => {

    /* set parameters */
    const params: CreateIntermediateAttestationParams = {
        intermediateAccount: "ARDOR-ACCO-UNTT-OBEA-TTEST",  // account to be attested
        attestationContext: "exampleContext",
        payload: "exampleAccountPayload",                   // [optional] payload data field (see Attestation Protocol)
        
        passphrase: "<some passphrase>",                    // passphrase of attestor account
        myAttestorAccount: "ARDOR-MYAT-TEST-ORAC-COUNT",    // [optional] account name of attestor accounts attestor.
                                                            // Required if attestor account is an intermediate entity
        fee: 0.1                                            // [optional] fee in IGNIS. 
                                                            // If not set, automatic fee calculation will be used
    };
    
    try {

        /* create and emit request */
        const response = await attestation.createIntermediateAttestation("https://testardor.jelurida.com", params);

        /* response implements the AttestationResponse interface */
        console.log(response.transactionId);

    } catch (e) { /* see error handling */ }
}

createIntermediateAttestationExample();
````


#### createLeafAttestation

This API creates leaf attestations based on a root or intermediate account. It creates the bottom end of a trust chain.

````typescript
import { attestation, CreateLeafAttestationParams } from '@blobaa/attestation-protocol-ts'


const createLeafAttestationExample = async () => {

    /* set parameters */
    const params: CreateLeafAttestationParams = {
        leafAccount: "ARDOR-ACCO-UNTT-OBEA-TTEST",          // account to be attested
        attestationContext: "exampleContext",
        payload: "exampleAccountPayload",                   // [optional] payload data field (see Attestation Protocol)
        
        passphrase: "<some passphrase>",                    // passphrase of attestor account
        myAttestorAccount: "ARDOR-MYAT-TEST-ORAC-COUNT",    // [optional] account name of attestor accounts attestor.
                                                            // Required if attestor account is an intermediate entity
        fee: 0.1                                            // [optional] fee in IGNIS.
                                                            // If not set, automatic fee calculation will be used
    };
    
    try {

        /* create and emit request */
        const response = await attestation.createLeafAttestation("https://testardor.jelurida.com", params);

        /* response implements the AttestationResponse interface */
        console.log(response.transactionId);

    } catch (e) { /* see error handling */ }
}

createLeafAttestationExample();
````


#### createAttestationUnchecked

This API lets you create attestations without checking conditions. Use it with caution as it may result in invalid trust chains.

````typescript
import { attestation, CreateAttestationUncheckedParams, EntityType } from '@blobaa/attestation-protocol-ts'


const createAttestationUncheckedExample = async () => {

    /* set parameters */
    const params: CreateAttestationUncheckedParams = {
        account: "ARDOR-ACCO-UNTT-OBEA-TTEST",  // account to be attested,
        entityType: EntityType.ROOT,            // entity type of account to be attested
        attestationContext: "exampleContext",
        payload: "exampleAccountPayload",       // [optional] payload data field (see Attestation Protocol)
        
        passphrase: "<some passphrase>",        // passphrase of attestor account
        fee: 0.1                                // [optional] fee in IGNIS.
                                                // If not set, automatic fee calculation will be used
    };
    
    try {

        /* create and emit request */
        const response = await attestation.createAttestationUnchecked("https://testardor.jelurida.com", params);

        /* response implements the AttestationResponse interface */
        console.log(response.transactionId);

    } catch (e) { /* see error handling */ }
}

createAttestationUncheckedExample();
````


#### updateRootAttestation

This API lets you update root entity accounts in two ways. You can either update the state and/or payload data fields or update the account, which is the implementation of moving to another account (see Attestation Protocol).

**Data Field Update**

````typescript
import { attestation, State, UpdateRootAttestationParams } from '@blobaa/attestation-protocol-ts'


const updateRootDataFieldsExample = async () => {

    /* set parameters */
    const params: UpdateRootAttestationParams = {
        attestationContext: "exampleContext",
        newPayload: "newExampleAccountPayload", // [optional] new payload
        newState: State.INACTIVE,               // [optional] new state

        passphrase: "<some passphrase>",        // passphrase of account to be updated
        fee: 0.1                                // [optional] fee in IGNIS.
                                                // If not set, automatic fee calculation will be used
    };
    
    try {

        /* create and emit request */
        const response = await attestation.updateRootAttestation("https://testardor.jelurida.com", params);

        /* response implements the AttestationResponse interface */
        console.log(response.transactionId);

    } catch (e) { /* see error handling */ }
}

updateRootDataFieldsExample();
````

**Account Update**

````typescript
import { attestation, UpdateRootAttestationParams } from '@blobaa/attestation-protocol-ts'


const updateRootAccountExample = async () => {

    /* set parameters */
    const params: UpdateRootAttestationParams = {
        attestationContext: "exampleContext",
        newRootAccount: "ARDOR-NEWA-CCOU-NTNA-MEXXX",   // new account

        passphrase: "<some passphrase>",                // passphrase of account to be updated
        fee: 0.1                                        // [optional] fee in IGNIS.
                                                        // If not set, automatic fee calculation will be used.
                                                        // CAUTION: this involves two transactions and the
                                                        // fee is set for each
    };
    
    try {

        /* create and emit request */
        const response = await attestation.updateRootAttestation("https://testardor.jelurida.com", params);

        /* response implements the AttestationResponse interface */
        console.log(response.transactionId);

    } catch (e) { /* see error handling */ }
}

updateRootAccountExample();
````


#### updateIntermediateAttestation

This API lets you update intermediate entity accounts in two ways. You can either update the state and/or payload data fields or update the account, which is the implementation of moving to another account (see Attestation Protocol).

**Data Field Update**

````typescript
import { attestation, State, UpdateIntermediateAttestationParams } from '@blobaa/attestation-protocol-ts'


const updateIntermediateDataFieldsExample = async () => {

    /* set parameters */
    const params: UpdateIntermediateAttestationParams = {
        intermediateAccount: "ARDOR-ACCO-UNTT-OBEU-PDATE",  // account to be updated
        attestationContext: "exampleContext",
        newPayload: "newExampleAccountPayload",             // [optional] new payload
        newState: State.INACTIVE,                           // [optional] new state
        
        passphrase: "<some passphrase>",                    // passphrase of attestor account
        myAttestorAccount: "ARDOR-MYAT-TEST-ORAC-COUNT",    // [optional] account name of attestor accounts attestor.
                                                            // Required if attestor account is an intermediate entity
        fee: 0.1                                            // [optional] fee in IGNIS.
                                                            // If not set, automatic fee calculation will be used.
    };
    
    try {

        /* create and emit request */
        const response = await attestation.updateIntermediateAttestation("https://testardor.jelurida.com", params);

        /* response implements the AttestationResponse interface */
        console.log(response.transactionId);

    } catch (e) { /* see error handling */ }
}

updateIntermediateDataFieldsExample();
````

**Account Update**

````typescript
import { attestation, UpdateIntermediateAttestationParams } from '@blobaa/attestation-protocol-ts'


const updateIntermediateAccountExample = async () => {

    /* set parameters */
    const params: UpdateIntermediateAttestationParams = {
        intermediateAccount: "ARDOR-ACCO-UNTT-OBEU-PDATE",      // account to be updated
        attestationContext: "exampleContext",
        newIntermediateAccount: "ARDOR-NEWA-CCOU-NTXX-XXXXX",   // new account
        
        passphrase: "<some passphrase>",                        // passphrase of attestor account
        myAttestorAccount: "ARDOR-MYAT-TEST-ORAC-COUNT",        // [optional] account name of attestor accounts attestor.
                                                                // Required if attestor account is an intermediate entity
        fee: 0.1                                                // [optional] fee in IGNIS.
                                                                // If not set, automatic fee calculation will be used.
                                                                // CAUTION: this involves two transactions and the
                                                                // fee is set for each
    };
    
    try {

        /* create and emit request */
        const response = await attestation.updateIntermediateAttestation("https://testardor.jelurida.com", params);

        /* response implements the AttestationResponse interface */
        console.log(response.transactionId);

    } catch (e) { /* see error handling */ }
}

updateIntermediateAccountExample();
````


#### updateLeafAttestation

This API lets you update leaf entity accounts in two ways. You can either update the state and/or payload data fields or update the account, which is the implementation of moving to another account (see Attestation Protocol).

**Data Field Update**

````typescript
import { attestation, State, UpdateLeafAttestationParams } from '@blobaa/attestation-protocol-ts'


const updateLeafDataFieldsExample = async () => {

    /* set parameters */
    const params: UpdateLeafAttestationParams = {
        leafAccount: "ARDOR-ACCO-UNTT-OBEU-PDATE",          // account to be updated
        attestationContext: "exampleContext",
        newPayload: "newExampleAccountPayload",             // [optional] new payload
        newState: State.INACTIVE,                           // [optional] new state
        
        passphrase: "<some passphrase>",                    // passphrase of attestor account
        myAttestorAccount: "ARDOR-MYAT-TEST-ORAC-COUNT",    // [optional] account name of attestor accounts attestor.
                                                            // Required if attestor account is an intermediate entity
        fee: 0.1                                            // [optional] fee in IGNIS.
                                                            // If not set, automatic fee calculation will be used.
    };
    
    try {

        /* create and emit request */
        const response = await attestation.updateLeafAttestation("https://testardor.jelurida.com", params);

        /* response implements the AttestationResponse interface */
        console.log(response.transactionId);

    } catch (e) { /* see error handling */ }
}

updateLeafDataFieldsExample();
````

**Account Update**

````typescript
import { attestation, UpdateLeafAttestationParams } from '@blobaa/attestation-protocol-ts'


const updateLeafAccountExample = async () => {

    /* set parameters */
    const params: UpdateLeafAttestationParams = {
        leafAccount: "ARDOR-ACCO-UNTT-OBEU-PDATE",          // account to be updated
        attestationContext: "exampleContext",
        newLeafAccount: "ARDOR-NEWA-CCOU-NTXX-XXXXX",       // new account
        
        passphrase: "<some passphrase>",                    // passphrase of attestor account
        myAttestorAccount: "ARDOR-MYAT-TEST-ORAC-COUNT",    // [optional] account name of attestor accounts attestor.
                                                            // Required if attestor account is an intermediate entity
        fee: 0.1                                            // [optional] fee in IGNIS.
                                                            // If not set, automatic fee calculation will be used.
                                                            // CAUTION: this involves two transactions and the
                                                            // fee is set for each
    };
    
    try {

        /* create and emit request */
        const response = await attestation.updateLeafAttestation("https://testardor.jelurida.com", params);

        /* response implements the AttestationResponse interface */
        console.log(response.transactionId);

    } catch (e) { /* see error handling */ }
}

updateLeafAccountExample();
````


#### revokeRootAttestation

This API revokes self set root attestations.

```typescript
import { attestation, RevokeRootAttestationParams } from '@blobaa/attestation-protocol-ts'


const revokeRootAttestationExample = async () => {

    /* set parameters */
    const params: RevokeRootAttestationParams = {
        attestationContext: "exampleContext",
        passphrase: "<some passphrase>",        // passphrase of account to be revoked
        fee: 0.1                                // [optional] fee in IGNIS.
                                                // If not set, automatic fee calculation will be used.
    };
    
    try {

        /* create and emit request */
        const response = await attestation.revokeRootAttestation("https://testardor.jelurida.com", params);

        /* response implements the AttestationResponse interface */
        console.log(response.transactionId);

    } catch (e) { /* see error handling */ }
}

revokeRootAttestationExample();
```


#### revokeIntermediateAttestation

This API revokes intermediate attestations in two ways. You can either self revoke an attestation set by another account to your account (an account from which you know the passphrase) or revoke an attestation created by you for another account.

```typescript
import { attestation, RevokeIntermediateAttestationParams } from '@blobaa/attestation-protocol-ts'


const revokeIntermediateAttestationExample = async () => {

    /* set parameters */
    const params: RevokeIntermediateAttestationParams = {
        intermediateAccount: "ARDOR-ACCO-UNTT-OBER-EVOKE",  // [optional] account to be revoked.
                                                            // Required if request is not a self revocation
        attestationContext: "exampleContext",
        passphrase: "<some passphrase>",                    // passphrase of revoking account
        fee: 0.1                                            // [optional] fee in IGNIS.
                                                            // If not set, automatic fee calculation will be used.
    };
    
    try {

        /* create and emit request */
        const response = await attestation.revokeIntermediateAttestation("https://testardor.jelurida.com", params);

        /* response implements the AttestationResponse interface */
        console.log(response.transactionId);

    } catch (e) { /* see error handling */ }
}

revokeIntermediateAttestationExample();
```


#### revokeLeafAttestation

This API revokes leaf attestations in two ways. You can either self revoke an attestation set by another account to your account (an account from which you know the passphrase) or revoke an attestation created by you for another account.

```typescript
import { attestation, RevokeLeafAttestationParams } from '@blobaa/attestation-protocol-ts'


const revokeLeafAttestationExample = async () => {

    /* set parameters */
    const params: RevokeLeafAttestationParams = {
        leafAccount: "ARDOR-ACCO-UNTT-OBER-EVOKE",  // [ optional ] account to be revoked.
                                                    // Required if request is not a self revocation
        attestationContext: "exampleContext",
        passphrase: "<some passphrase>",            // passphrase of revoking account
        fee: 0.1                                    // [optional] fee in IGNIS.
                                                    // If not set, automatic fee calculation will be used.
    };
    
    try {

        /* create and emit request */
        const response = await attestation.revokeLeafAttestation("https://testardor.jelurida.com", params);

        /* response implements the AttestationResponse interface */
        console.log(response.transactionId);

    } catch (e) { /* see error handling */ }
}

revokeLeafAttestationExample();
```


#### revokeAttestationUnchecked

This API lets you revoke attestations without checking conditions. Use it with caution as it may result in invalid trust chains.

```typescript
import { attestation, RevokeAttestationUncheckedParams } from '@blobaa/attestation-protocol-ts'


const revokeAttestationUncheckedExample = async () => {

    /* set parameters */
    const params: RevokeAttestationUncheckedParams = {
        account: "ARDOR-ACCO-UNTT-OBER-EVOKE",  // account to be revoked
        attestationContext: "exampleContext",
        passphrase: "<some passphrase>",        // passphrase of revoking account
        fee: 0.1                                // [optional] fee in IGNIS.
                                                // If not set, automatic fee calculation will be used.
    };
    
    try {

        /* create and emit request */
        const response = await attestation.revokeAttestationUnchecked("https://testardor.jelurida.com", params);

        /* response implements the AttestationResponse interface */
        console.log(response.transactionId);

    } catch (e) { /* see error handling */ }
}

revokeAttestationUncheckedExample();
```


### Data

The Data module handles the data signing and verification tasks. It provides the following APIs:

````typescript
- signData(params: SignDataParams, forTestnet?: boolean): SignedData // forTestnet defaults to false
- verifySignedData(url: string, params: VerifySignedDataParams, forTestnet?: boolean): Promise<VerifySignedDataResponse> // forTestnet defaults to false
````


#### signData

This API lets you create a signed data object.

````typescript
import { data, SignDataParams } from '@blobaa/attestation-protocol-ts'


const signDataExample = () => {

    /* set parameters */
    const params: SignDataParams = {
        attestationContext: "exampleContext",
        attestationPath: [                      // [optional] trust chain up to the root account.
            "ARDOR-INTE-RMED-IATE-ACCO1",       // Can be omitted if signed data creator is root account
            "ARDOR-INTE-RMED-IATE-ACCO2",
            "ARDOR-ROOT-ACCO-UNTX-XXXXX" 
        ], 
        payload: "exampleDataPayload",          // user data to be signed
        passphrase: "<some passphrase>"         // passphrase of signed data creator account
    };

    /* create signed data object */
    const signedData = data.signData(params, true);

    /* signed data object contains all necessary verification data */
    console.log(signedData.attestationContext);
    console.log(signedData.attestationPath);
    console.log(signedData.payload);
    console.log(signedData.creatorAccount);
    console.log(signedData.signature);
}

signDataExample();
````


#### verifySignedData

This API lets you verify the origin and integrity of a signed data object.

````typescript
import { data, VerifySignedDataParams, SignedDataCheckParams, EntityCheckParams } from '@blobaa/attestation-protocol-ts'


const verifySignedDataExample = async () => {

    /* [optional] create a user callback for custom signed data checking logic */
    const signedDataCheckCb = (params: SignedDataCheckParams): boolean => {
        
        /* params contains the signed data object and signature time */
        console.log(params.signedData);
        console.log(params.signatureTime);

        return true; // must return true to continue verification. False throws an verification error
    };

    /* [optional] create a user callback for custom entity checking logic */
    const entityCheckCb = (entity: EntityCheckParams): boolean => {
        
        /* entity parameter contains the account name and data fields */
        console.log(entity.account);
        console.log(entity.protocolVersion);
        console.log(entity.entityType);
        console.log(entity.state);
        console.log(entity.payload);

        return true; // must return true to continue verification. False throws an verification error
    };


    /* set parameters */
    const params: VerifySignedDataParams = {
        trustedRootAccount: "ARDOR-TRUS-TEDR-OOTA-CCOUN",
        signedData: signedDataObject,                       // signed data to be verified. Created with signData API
        signedDataCheckCallback: signedDataCheckCb,         // [optional] user callback called while signed data checking
        entityCheckCallback: entityCheckCb                  // [optional] user callback called every time an entity is checked
    };

    try {

        /* create and emit request. Throws an error in case of failing verification */
        const response = await data.verifySignedData("https://testardor.jelurida.com", params, true);

        /* response implements the VerifySignedDataResponse interface */
        console.log(response.activeRootAccount);
        console.log(response.verifiedTrustChain);

    } catch (e) { /* see error handling */ }
}

verifySignedDataExample();
````


### Entity

The Entity module provides the possibility to retrieve account information.

````typescript
- getEntity(url: string, params: GetEntityParams): Promise<GetEntityResponse>
````


#### getEntity

````typescript
import { entity, GetEntityParams } from '@blobaa/attestation-protocol-ts'


const getEntityExample = async () => {

    /* set parameters */
    const params: GetEntityParams = {
        account: "ARDOR-ACCO-UNTT-OBER-ETRIE",  // account to be retrieved
        attestationContext: "exampleContext",
        attestor: "ARDOR-ATTE-STOR-ACCO-UNTXX" // [optional] attestor account
    };
    
    try {

        /* create and emit request */
        const response = await entity.getEntity("https://testardor.jelurida.com", params);
        
        /* response implements the GetEntityResponse interface */
        console.log(response.account);
        console.log(response.attestationContext);
        console.log(response.entityType);
        console.log(response.payload);
        console.log(response.protocolVersion);
        console.log(response.redirectAccount);
        console.log(response.state);

    } catch (e) { /* see error handling */ }
}

getEntityExample();
````


### Error Handling

There is an unified error handling for all asynchronous APIs. Every API throws an error in case of any failures or unmet conditions. Every error implements the 'Error' interface of this library. The interface consist of two data fields. The *code* field contains a value of the 'ErrorCode' enum to indicate the error reason. The *description* field contains a human readable description of the cause of the thrown error.

````typescript
import { entity, Error, ErrorCode, GetEntityParams } from '@blobaa/attestation-protocol-ts'


const errorHandlingExample = async () => {

    const params: GetEntityParams = {
        account: "ARDOR-5TT2-VS3T-EUTS-7WDBA",
        attestationContext: "exampleContext",
    };
            
    try {

        /* create and emit request */
        await entity.getEntity("https://testardor42.jelurida.com", params); // throws an error because the subdomain is renamed to a non-existing record

    } catch (e) {
        
        /* all errors implement the library's Error interface */
        const error = e as Error;

        /* every error has an error code that corresponds to the ErrorCode enum */
        if(error.code === ErrorCode.CONNECTION_ERROR) {
             //  handle connection error here
        }

        console.log(error.code);
        console.log(error.description);
    }
}

errorHandlingExample();
````


## Module Instantiation

Each module is pre instantiated and importable via the lower case module name. If you need the class definition of a module, import it via the upper case name. For example:

````typescript
import { SignDataParams, data, Data } from '@blobaa/attestation-protocol-ts'


const params: SignDataParams = {
    attestationContext: "exampleContext",
    payload: "exampleDataPayload",
    passphrase: "<some passphrase>"
};


/* use the default instance */
const signedData = data.signData(params);
console.log(signedData);

/* use your own instance */
const myData = new Data();
const signedData2 = myData.signData(params);
console.log(signedData2);
````


## Licensing

### Dual-License

attestation-protocol-ts source code ("The Software") is licensed under **both** GNU Affero General Public License v3.0 or later **and** a proprietary license that can be arranged with me. In practical sense, this means:

- If you are developing Open Source Software (OSS) based on attestation-protocol-ts, chances are you will be able to use attestation-protocol-ts freely under AGPL. Please double check [here](https://www.gnu.org/licenses/agpl-3.0.en.html) for OSS license compatibility with AGPL.
- Alternatively, if you are unable to release your application as Open Source Software, you may arrange alternative licensing with me. Just send your inquiry to a_aldemir@hotmail.de to discuss this option.

____
Enjoy :)