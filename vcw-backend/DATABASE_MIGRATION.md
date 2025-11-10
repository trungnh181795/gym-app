# Database Migration: JSON to SQLite

This document describes the migration from mixed JSON file storage to unified SQLite database with TypeORM.

## Architecture Change

### Before
- **SQLite**: Only Veramo crypto data (DIDs, keys, private keys)
- **JSON Files**: All application data (users, services, benefits, memberships, credentials, tokens)
- **Problem**: Mixed storage, inconsistent data access patterns, no transactions, no referential integrity

### After
- **Unified SQLite Database**: All data in single database
  - Veramo entities: DIDs, keys, private keys (encrypted)
  - Application entities: users, services, benefits, memberships, credentials, credential_tokens
- **Singleton Pattern**: Single DataSource instance shared across application
- **TypeORM**: ORM with repositories, query builders, migrations, relations

## Database Schema

### Application Tables

#### users
- `id` (varchar, PK)
- `name` (varchar)
- `email` (varchar, unique)
- `password` (varchar)
- `phone` (varchar, nullable)
- `status` (varchar: active|inactive|suspended)
- `walletDid` (varchar, nullable)
- `created_at`, `updated_at` (datetime)
- Relations: OneToMany → memberships

#### services
- `id` (varchar, PK)
- `name` (varchar)
- `description` (text)
- `category` (varchar)
- `metadata` (text, JSON string)
- `created_at`, `updated_at` (datetime)

#### benefits
- `id` (varchar, PK)
- `name` (varchar)
- `description` (text)
- `price` (decimal)
- `serviceIds` (text, JSON array string)
- `startDate`, `endDate` (datetime)
- `maxUsesPerMonth` (integer, nullable)
- `requiresBooking` (boolean)
- `isShareable` (boolean)
- `sharedWithUserId` (varchar, nullable)
- `created_at`, `updated_at` (datetime)

#### memberships
- `id` (varchar, PK)
- `userId` (varchar, FK → users)
- `name` (varchar)
- `description` (text)
- `status` (varchar: active|inactive|expired|suspended)
- `validFrom`, `validUntil` (datetime)
- `benefitIds` (text, JSON array string)
- `created_at`, `updated_at` (datetime)
- Relations: ManyToOne → user

#### credentials
- `id` (varchar, PK)
- `credential` (text, W3C VC JSON string)
- `jwt` (text)
- `holderDid` (varchar)
- `benefitId` (varchar, nullable)
- `membershipId` (varchar, nullable)
- `status` (varchar: active|revoked|expired)
- `expireDate` (datetime, nullable)
- `metadata` (text, JSON string, nullable)
- `created_at`, `updated_at` (datetime)

#### credential_tokens
- `id` (varchar, PK)
- `token` (varchar, unique)
- `credentialId` (varchar)
- `created_at`, `expiresAt` (datetime)
- `used` (boolean)

## Migration Steps

### 1. Create TypeORM Entities ✅

Created entity classes in `/vcw-backend/src/entities/`:
- User.entity.ts
- Service.entity.ts
- Benefit.entity.ts
- Membership.entity.ts
- StoredCredential.entity.ts
- CredentialToken.entity.ts

### 2. Update Database Config ✅

Created `/vcw-backend/src/config/database.config.ts`:
- Implemented singleton DataSource pattern with `getDataSource()`
- Combined Veramo entities + application entities
- Set `synchronize: true` for auto-schema creation in development
- Exported DB_ENCRYPTION_KEY and dbConnection

Updated `/vcw-backend/src/config/veramo.config.ts`:
- Imports from database.config.ts
- Re-exports getDataSource and dbConnection for backward compatibility

### 3. Create Migration Script ✅

Created `/vcw-backend/src/utils/migrate-to-sqlite.ts`:
- Reads all JSON files from storage/
- Maps data to entity structures
- Inserts into SQLite using TypeORM repositories
- Handles relations and data transformations

### 4. Refactor Services (In Progress)

Refactoring service classes to use TypeORM repositories:

**Completed**:
- ✅ user.service.ts → Uses User repository

**Remaining**:
- service.service.ts → Service repository
- benefit.service.ts → Benefit repository
- membership.service.ts → Membership repository
- storage.service.ts → StoredCredential repository

### 5. Run Migration
Execute migration to import JSON data:

```bash
cd vcw-backend
npx ts-node src/utils/migrate-to-sqlite.ts
```

Expected output:
```
Starting data migration from JSON to SQLite...

1. Migrating users...
✓ Migrated 8 users

2. Migrating services...
✓ Migrated X services

3. Migrating benefits...
✓ Migrated X benefits

4. Migrating memberships...
✓ Migrated X memberships

5. Migrating credentials...
✓ Migrated X credentials

✅ Data migration completed successfully!
```

### 6. Backup JSON Files
After successful migration:

```bash
cd vcw-backend/storage
mkdir json-backup
mv *.json json-backup/
```

Keep `veramo.sqlite` in storage/

### 7. Test Application
Test all endpoints:
- User management (CRUD)
- Service management
- Benefit management
- Membership management
- Credential issuance
- Credential verification
- Sharing functionality

## Code Changes

### Service Pattern

**Before (JSON-based)**:
```typescript
private readUsers(): User[] {
  const data = fs.readFileSync(this.usersFilePath, 'utf8');
  return JSON.parse(data);
}

private writeUsers(users: User[]): void {
  fs.writeFileSync(this.usersFilePath, JSON.stringify(users, null, 2));
}
```

**After (TypeORM)**:
```typescript
private async initialize(): Promise<void> {
  const dataSource = await getDataSource();
  this.userRepo = dataSource.getRepository(User);
}

public async getAllUsers(): Promise<User[]> {
  return await this.userRepo.find({ order: { createdAt: 'DESC' } });
}
```

### Singleton DataSource Access

```typescript
import { getDataSource } from '../config/veramo.config';

const dataSource = await getDataSource();
const userRepo = dataSource.getRepository(User);
```

## Benefits

1. **Atomic Transactions**: Database ensures consistency
2. **Referential Integrity**: Foreign keys maintain data relationships
3. **Better Performance**: Indexed queries, efficient joins
4. **Type Safety**: TypeORM entities provide compile-time checks
5. **Query Flexibility**: QueryBuilder for complex queries
6. **Single Source**: One database file, easier backups
7. **Relations**: Proper ORM relations (OneToMany, ManyToOne)

## Rollback Plan

If issues occur:

1. Stop the backend server
2. Delete `storage/veramo.sqlite` (backup first!)
3. Restore JSON files from `storage/json-backup/`
4. Revert code changes using git:
   ```bash
   git checkout HEAD~1 -- src/services/
   git checkout HEAD~1 -- src/config/veramo.config.ts
   ```

## Database Location

- Development: `/vcw-backend/storage/veramo.sqlite`
- Production: Configure via environment variable

## Next Steps

1. Complete refactoring remaining service classes
2. Run migration script
3. Test all functionality
4. Update API documentation if needed
5. Consider adding TypeORM migrations for production schema changes
