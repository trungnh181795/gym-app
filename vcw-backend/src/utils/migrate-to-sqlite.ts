import { getDataSource } from '../config/database.config';
import { 
  User, 
  Service, 
  Benefit, 
  Membership, 
  StoredCredential, 
  CredentialToken 
} from '../entities';
import path from 'path';
import fs from 'fs';

const STORAGE_DIR = path.join(__dirname, '../../storage');

async function loadJSONFile<T>(filename: string): Promise<T[]> {
  const filePath = path.join(STORAGE_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`File ${filename} not found, skipping...`);
    return [];
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);
  
  // Handle both array and object formats
  if (Array.isArray(data)) {
    return data;
  } else if (typeof data === 'object') {
    return Object.values(data);
  }
  
  return [];
}

async function migrateData() {
  console.log('Starting data migration from JSON to SQLite...');
  
  try {
    const dataSource = await getDataSource();
    
    // 1. Migrate Users
    console.log('\n1. Migrating users...');
    const usersData = await loadJSONFile<any>('users.json');
    const userRepo = dataSource.getRepository(User);
    
    let userCount = 0;
    for (const userData of usersData) {
      try {
        // Check if user already exists (by email since that's the unique constraint)
        const existing = await userRepo.findOne({ where: { email: userData.email } });
        if (existing) {
          continue; // Skip silently
        }
        
        const user = userRepo.create({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          password: userData.password,
          phone: userData.phone || undefined,
          status: userData.status || 'active',
          walletDid: userData.walletDid || undefined,
        });
        await userRepo.save(user);
        userCount++;
      } catch (error) {
        console.error(`  Error migrating user ${userData.email}:`, error.message);
      }
    }
    console.log(`✓ Migrated ${userCount} new users (${usersData.length} total in file)`);
    
    // 2. Migrate Services
    console.log('\n2. Migrating services...');
    const servicesData = await loadJSONFile<any>('services.json');
    const serviceRepo = dataSource.getRepository(Service);
    
    let serviceCount = 0;
    for (const serviceData of servicesData) {
      try {
        const existing = await serviceRepo.findOne({ where: { id: serviceData.id } });
        if (existing) {
          console.log(`  Skipping existing service: ${serviceData.name}`);
          continue;
        }
        
        const service = serviceRepo.create({
          id: serviceData.id,
          name: serviceData.name,
          description: serviceData.description || '',
          category: serviceData.category || 'general',
          metadata: serviceData.metadata ? JSON.stringify(serviceData.metadata) : undefined,
        });
        await serviceRepo.save(service);
        serviceCount++;
      } catch (error) {
        console.error(`  Error migrating service ${serviceData.name}:`, error.message);
      }
    }
    console.log(`✓ Migrated ${serviceCount} new services (${servicesData.length} total in file)`);
    
    // 3. Migrate Benefits
    console.log('\n3. Migrating benefits...');
    const benefitsData = await loadJSONFile<any>('benefits.json');
    const benefitRepo = dataSource.getRepository(Benefit);
    
    let benefitCount = 0;
    for (const benefitData of benefitsData) {
      try {
        const existing = await benefitRepo.findOne({ where: { id: benefitData.id } });
        if (existing) {
          continue; // Skip silently for benefits (too many to log)
        }
        
        const benefit = benefitRepo.create({
          id: benefitData.id,
          name: benefitData.name,
          description: benefitData.description || '',
          price: benefitData.price || 0,
          serviceIds: benefitData.serviceIds ? JSON.stringify(benefitData.serviceIds) : undefined,
          startDate: new Date(benefitData.startDate),
          endDate: new Date(benefitData.endDate),
          maxUsesPerMonth: benefitData.maxUsesPerMonth || undefined,
          requiresBooking: benefitData.requiresBooking || false,
          isShareable: benefitData.isShareable || false,
          sharedWithUserId: benefitData.sharedWithUserId || undefined,
        });
        await benefitRepo.save(benefit);
        benefitCount++;
      } catch (error) {
        console.error(`  Error migrating benefit ${benefitData.name}:`, error.message);
      }
    }
    console.log(`✓ Migrated ${benefitCount} new benefits (${benefitsData.length} total in file)`);
    
    // 4. Migrate Memberships
    console.log('\n4. Migrating memberships...');
    const membershipsData = await loadJSONFile<any>('memberships.json');
    const membershipRepo = dataSource.getRepository(Membership);
    
    for (const membershipData of membershipsData) {
      const membership = membershipRepo.create({
        id: membershipData.id,
        userId: membershipData.userId,
        name: membershipData.name,
        description: membershipData.description || '',
        status: membershipData.status || 'active',
        validFrom: new Date(membershipData.validFrom),
        validUntil: new Date(membershipData.validUntil),
        benefitIds: membershipData.benefitIds ? JSON.stringify(membershipData.benefitIds) : undefined,
      });
      await membershipRepo.save(membership);
    }
    console.log(`✓ Migrated ${membershipsData.length} memberships`);
    
    // 5. Migrate Credentials
    console.log('\n5. Migrating credentials...');
    const credentialsData = await loadJSONFile<any>('credentials.json');
    const credentialRepo = dataSource.getRepository(StoredCredential);
    
    for (const credentialData of credentialsData) {
      const credential = credentialRepo.create({
        id: credentialData.id,
        credential: JSON.stringify(credentialData.credential),
        jwt: credentialData.jwt,
        holderDid: credentialData.holderDid,
        benefitId: credentialData.benefitId || undefined,
        membershipId: credentialData.membershipId || undefined,
        status: credentialData.status || 'active',
        expireDate: credentialData.expireDate ? new Date(credentialData.expireDate) : undefined,
        metadata: credentialData.metadata ? JSON.stringify(credentialData.metadata) : undefined,
      });
      await credentialRepo.save(credential);
    }
    console.log(`✓ Migrated ${credentialsData.length} credentials`);
    
    console.log('\n✅ Data migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Verify the data in the SQLite database');
    console.log('2. Backup the JSON files');
    console.log('3. Update service classes to use TypeORM repositories');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default migrateData;
