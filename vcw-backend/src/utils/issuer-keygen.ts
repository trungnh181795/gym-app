import { generateKeyPair, exportSPKI, exportPKCS8 } from 'jose';
import fs from 'fs';

async function generateIssuerKeyPair(): Promise<void> {
  try {
    // Check if keys already exist
    if (fs.existsSync('./config/issuer-public-key.pem') && fs.existsSync('./config/issuer-private-key.pem')) {
      console.log('Issuer key pair already exists.');
      return;
    }

    // Generate EdDSA key pair for signing
    const { publicKey, privateKey } = await generateKeyPair('EdDSA', { 
      crv: 'Ed25519',
      extractable: true 
    });

    // Export keys to PEM format
    const publicKeyPem = await exportSPKI(publicKey);
    const privateKeyPem = await exportPKCS8(privateKey);

    // Ensure config directory exists
    if (!fs.existsSync('./config')) {
      fs.mkdirSync('./config', { recursive: true });
    }

    // Save keys to files
    fs.writeFileSync('./config/issuer-public-key.pem', publicKeyPem);
    fs.writeFileSync('./config/issuer-private-key.pem', privateKeyPem);

    console.log('Issuer key pair generated and saved to files.');
  } catch (error) {
    console.error('Error generating issuer key pair:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  generateIssuerKeyPair().catch(console.error);
}

export default generateIssuerKeyPair;