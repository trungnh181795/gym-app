import { verificationService } from '../services/verification.service';

/**
 * Test utility to validate local JWT verification
 */
export async function testLocalVerification() {
  console.log('🧪 Testing local JWT verification...');

  try {
    // Initialize the verification service
    console.log('1. Initializing verification service...');
    await verificationService.initialize();
    console.log('   ✅ Verification service initialized');

    // Get DID document info
    const didDocument = verificationService.getDIDDocument();
    const issuerDid = verificationService.getIssuerDid();
    
    console.log('2. DID Document loaded:', {
      issuerDid,
      verificationMethods: didDocument?.verificationMethod?.length || 0
    });

    // Test with a sample JWT (this would normally come from copying a credential)
    // For testing, we'd need a real JWT from the system
    console.log('3. Ready to verify JWTs locally');
    console.log('   📋 Copy a JWT from the credentials page and test it in the Tools page');

    return {
      success: true,
      message: 'Local verification service is ready',
      details: {
        isInitialized: verificationService.isInitialized(),
        issuerDid,
        hasDidDocument: !!didDocument,
        verificationMethodsCount: didDocument?.verificationMethod?.length || 0
      }
    };

  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: null
    };
  }
}

export default testLocalVerification;