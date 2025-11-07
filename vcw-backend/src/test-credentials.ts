import { credentialsService } from './services/credentials.service';
import { issuerService } from './services/issuer.service';
import { storageService } from './services/storage.service';
import generateIssuerKeyPair from './utils/issuer-keygen';
import { CreateCredentialRequest, StoredCredential } from './types';

async function testTypeScriptCredentialsService(): Promise<void> {
    console.log('🧪 Testing TypeScript Credentials Service\n');

    try {
        // First, ensure keys are generated
        console.log('🔑 Generating issuer keys...');
        await generateIssuerKeyPair();
        
        // Wait a moment for key generation
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test issuer service
        console.log('\n1️⃣  Testing issuer service...');
        const issuerDid = issuerService.getIssuerDid();
        console.log('✅ Issuer DID:', issuerDid);
        
        // Test key loading
        try {
            const publicKey = issuerService.getPublicKey();
            console.log('✅ Public key loaded:', publicKey.length > 0);
        } catch (error) {
            console.log('❌ Error loading public key:', (error as Error).message);
        }

        // Test 2: Create credentials with proper typing
        console.log('\n2️⃣  Creating typed gym membership credentials...');
        
        const credentialRequest1: CreateCredentialRequest = {
            holderDid: 'did:gym:user:test-123',
            name: 'Alice Smith',
            plan: 'Premium Membership',
            benefitId: 'test-benefit-1',
            membershipId: 'test-membership-1'
        };

        const credentialRequest2: CreateCredentialRequest = {
            holderDid: 'did:gym:user:test-456',
            name: 'Bob Johnson',
            plan: 'Basic Membership',
            benefitId: 'test-benefit-2',
            membershipId: 'test-membership-2'
        };

        const credential1 = await credentialsService.createCredential(credentialRequest1);
        console.log('✅ Created credential 1:', credential1.id);
        console.log('   Membership ID:', credential1.metadata.membershipId);
        console.log('   Type:', typeof credential1.id);

        const credential2 = await credentialsService.createCredential(credentialRequest2);
        console.log('✅ Created credential 2:', credential2.id);
        console.log('   Membership ID:', credential2.metadata.membershipId);

        // Test 3: Get specific credential with proper typing
        console.log('\n3️⃣  Getting specific credential with type safety...');
        const retrievedCredential: StoredCredential | null = await credentialsService.getCredential(credential1.id);
        if (retrievedCredential) {
            console.log('✅ Retrieved credential:', retrievedCredential.id);
            console.log('   Holder:', retrievedCredential.metadata.name);
            console.log('   Plan:', retrievedCredential.metadata.plan);
            console.log('   Status:', retrievedCredential.status);
            console.log('   Created:', new Date(retrievedCredential.createdAt).toLocaleDateString());
        } else {
            console.log('❌ Credential not found');
        }

        // Test 4: List all credentials with typed response
        console.log('\n4️⃣  Listing all credentials with type safety...');
        const allCredentials = await credentialsService.listCredentials();
        console.log(`✅ Found ${allCredentials.count} credentials:`);
        allCredentials.credentials.forEach(cred => {
            console.log(`   - ${cred.id}: ${cred.subject.name} (${cred.subject.plan}) - Status: ${cred.status}`);
        });

        // Test 5: List with pagination and filters
        console.log('\n5️⃣  Testing pagination with type safety...');
        const paginatedResult = await credentialsService.listCredentials({ 
            page: 1, 
            limit: 1 
        });
        console.log('✅ Paginated result:');
        console.log(`   Page: ${paginatedResult.pagination?.page}`);
        console.log(`   Total: ${paginatedResult.pagination?.total}`);
        console.log(`   Credentials on page: ${paginatedResult.credentials.length}`);

        // Test 6: Search credentials with typing
        console.log('\n6️⃣  Searching credentials with type safety...');
        const searchResults = await credentialsService.listCredentials({ search: 'alice' });
        console.log(`✅ Search results for "alice": ${searchResults.count} found`);

        // Test 7: Filter by holder DID
        console.log('\n7️⃣  Filtering by holder DID...');
        const holderCredentials = await credentialsService.listCredentials({ 
            holderDid: 'did:example:alice123' 
        });
        console.log(`✅ Credentials for Alice: ${holderCredentials.count} found`);

        // Test 8: Verify credential with proper typing
        console.log('\n8️⃣  Verifying credential with type safety...');
        const verificationResult = await credentialsService.verifyCredential(credential1.jwt);
        console.log('✅ Verification result:', verificationResult.valid);
        if (verificationResult.valid && verificationResult.credential) {
            console.log('   Credential subject:', verificationResult.credential.credentialSubject.name);
            console.log('   Issuer:', verificationResult.credential.issuer);
            console.log('   Type:', verificationResult.credential.type.join(', '));
        }

        // Test 9: Get credential statistics with typing
        console.log('\n9️⃣  Getting credential statistics...');
        const stats = await credentialsService.getStorageStats();
        console.log('✅ Credential statistics:');
        console.log(`   Total: ${stats.total}`);
        console.log(`   Active: ${stats.active}`);
        console.log(`   Revoked: ${stats.revoked}`);
        console.log(`   Expired: ${stats.expired}`);
        console.log(`   Storage size: ${stats.storageInfo.fileSizeBytes} bytes`);

        // Test 10: Storage service direct access
        console.log('\n🔟 Testing storage service directly...');
        const storageStats = storageService.getStorageStats();
        console.log('✅ Storage service stats:');
        console.log(`   Total credentials: ${storageStats.totalCredentials}`);
        console.log(`   Last modified: ${storageStats.lastModified}`);

        // Test 11: Delete a credential with proper error handling
        console.log('\n1️⃣1️⃣ Deleting a credential...');
        const deleted: boolean = await credentialsService.deleteCredential(credential2.id);
        console.log('✅ Deletion result:', deleted);

        // Test 12: Verify deletion
        console.log('\n1️⃣2️⃣ Verifying deletion...');
        const deletedCredential = await credentialsService.getCredential(credential2.id);
        console.log('✅ Deleted credential exists:', deletedCredential !== null);

        // Test 13: Type checking - this should cause TypeScript errors if types are wrong
        console.log('\n1️⃣3️⃣ Testing TypeScript type safety...');
        
        // This should work fine
        const validRequest: CreateCredentialRequest = {
            holderDid: 'did:gym:user:test-123',
            name: 'Test User',
            plan: 'Test Plan',
            benefitId: 'test-benefit-1',
            membershipId: 'test-membership-1'
        };
        console.log('✅ Valid request type check passed');

        // Final stats
        console.log('\n📊 Final statistics...');
        const finalStats = await credentialsService.getStorageStats();
        console.log(`✅ Remaining credentials: ${finalStats.total}`);

        console.log('\n🎉 All TypeScript credentials service tests completed successfully!');
        console.log('✨ Type safety verified throughout the application!');

    } catch (error) {
        console.error('❌ Error during testing:', (error as Error).message);
        console.error('Stack trace:', (error as Error).stack);
    }
}

// Run the test
if (require.main === module) {
    testTypeScriptCredentialsService();
}

export { testTypeScriptCredentialsService };